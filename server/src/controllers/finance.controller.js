const db = require('../config/db');
const { NotFoundError, BadRequestError } = require('../utils/errors');

/**
 * GET /api/finance/debts
 * Debts Engine: Real-time report of students with overdue subscriptions
 */
const getDebtsReport = async (req, res, next) => {
  try {
    const { grade_id, group_id, search } = req.query;
    const currentMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

    let queryText = `
      SELECT 
        s.id AS student_id,
        s.student_code,
        s.full_name AS student_name,
        s.phone AS student_phone,
        s.parent_phone,
        g.id AS group_id,
        g.name AS group_name,
        g.price_per_month,
        sub.name_ar AS subject_name,
        t.full_name AS teacher_name,
        gr.name_ar AS grade_name,
        COALESCE(ss.amount_paid, 0) AS amount_paid,
        COALESCE(ss.amount_due, g.price_per_month) AS amount_due,
        COALESCE(ss.billing_month, $1) AS billing_month,
        COALESCE(ss.status, 'active') AS subscription_status,
        ss.id AS subscription_id
      FROM group_enrollments ge
      JOIN students s ON s.id = ge.student_id AND s.is_active = true
      JOIN groups g ON g.id = ge.group_id AND g.status = 'active'
      LEFT JOIN subjects sub ON sub.id = g.subject_id
      LEFT JOIN teachers t ON t.id = g.teacher_id
      LEFT JOIN academic_grades gr ON gr.id = s.grade_id
      LEFT JOIN student_subscriptions ss 
        ON ss.student_id = s.id 
        AND ss.group_id = g.id 
        AND ss.billing_month = $1
      WHERE ge.is_active = true
        AND (ss.id IS NULL OR ss.amount_due > 0)
    `;

    const params = [currentMonth];

    if (grade_id) {
      params.push(grade_id);
      queryText += ` AND s.grade_id = $${params.length}`;
    }

    if (group_id) {
      params.push(group_id);
      queryText += ` AND g.id = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      queryText += ` AND (s.full_name ILIKE $${params.length} OR s.phone ILIKE $${params.length} OR s.parent_phone ILIKE $${params.length} OR CAST(s.student_code AS TEXT) ILIKE $${params.length})`;
    }

    queryText += ` ORDER BY amount_due DESC, s.full_name ASC`;

    const result = await db.query(queryText, params);

    // Calculate total debts
    const totalDebt = result.rows.reduce((sum, r) => sum + parseFloat(r.amount_due || 0), 0);

    res.json({
      success: true,
      data: {
        currentMonth,
        totalDebtors: result.rows.length,
        totalDebt,
        debts: result.rows,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/finance/settle-debt
 * Quick settlement of a student subscription debt
 */
const settleDebt = async (req, res, next) => {
  const client = await db.getClient();
  try {
    const { student_id, group_id, billing_month, notes } = req.body;
    const rawPaid = req.body.amount_paid !== undefined ? req.body.amount_paid : req.body.amount;
    const amount_paid = parseFloat(rawPaid);
    const userId = req.user.id;

    if (!student_id || !group_id || !amount_paid || amount_paid <= 0) {
      throw new BadRequestError('بيانات السداد غير مكتملة أو المبلغ غير صالح');
    }

    await client.query('BEGIN');

    // Get group info
    const groupRes = await client.query('SELECT price_per_month, name FROM groups WHERE id = $1', [group_id]);
    if (groupRes.rows.length === 0) {
      throw new NotFoundError('المجموعة غير موجودة');
    }
    const group = groupRes.rows[0];
    const month = billing_month || new Date().toISOString().slice(0, 7);

    // Check existing subscription
    const subRes = await client.query(
      'SELECT * FROM student_subscriptions WHERE student_id = $1 AND group_id = $2 AND billing_month = $3',
      [student_id, group_id, month]
    );

    let subscriptionId;
    let newPaid = amount_paid;
    let newDue = 0;

    if (subRes.rows.length > 0) {
      const existing = subRes.rows[0];
      const existingDue = parseFloat(existing.amount_due !== null && existing.amount_due !== undefined ? existing.amount_due : Math.max(0, parseFloat(group.price_per_month) - parseFloat(existing.amount_paid || 0)));

      if (amount_paid > existingDue + 0.001) {
        throw new BadRequestError(`المبلغ المطلوب سداده هو ${existingDue} ج.م فقط، لا يمكن سداد أكثر من المديونية.`);
      }

      newPaid = parseFloat(existing.amount_paid || 0) + amount_paid;
      newDue = Math.max(0, existingDue - amount_paid);
      subscriptionId = existing.id;

      await client.query(
        `UPDATE student_subscriptions 
         SET amount_paid = $1, amount_due = $2, notes = COALESCE($3, notes), status = 'active', updated_at = NOW()
         WHERE id = $4`,
        [newPaid, newDue, notes, subscriptionId]
      );
    } else {
      const fullPrice = parseFloat(group.price_per_month || 0);
      if (amount_paid > fullPrice + 0.001) {
        throw new BadRequestError(`قيمة الاشتراك الشهري هي ${fullPrice} ج.م، لا يمكن سداد مبلغ أكبر منها.`);
      }
      newDue = Math.max(0, fullPrice - amount_paid);
      const defaultSessions = parseInt(req.body.sessions_count, 10) || 4;

      const insertSub = await client.query(
        `INSERT INTO student_subscriptions 
         (student_id, group_id, total_sessions, used_sessions, amount_paid, amount_due, billing_month, status, notes)
         VALUES ($1, $2, $3, 0, $4, $5, $6, 'active', $7)
         RETURNING id`,
        [student_id, group_id, defaultSessions, newPaid, newDue, month, notes]
      );
      subscriptionId = insertSub.rows[0].id;
    }

    // Record into treasury_transactions
    await client.query(
      `INSERT INTO treasury_transactions 
       (transaction_type, amount, reference_id, notes, recorded_by)
       VALUES ('subscription_fee', $1, $2, $3, $4)`,
      [
        amount_paid,
        subscriptionId,
        notes || `تحصيل سداد مديونية اشتراك شهر ${month} - مجموعة ${group.name}`,
        userId,
      ]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'تم سداد الاشتراك وإيداعه في الخزينة بنجاح',
      data: { subscriptionId, amountPaid: amount_paid, remainingDue: newDue },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * GET /api/finance/treasury-stats
 * Comprehensive Center Manager View:
 * Total cash, full breakdown of revenues, expenses, teacher shares, and center net profit
 */
const getTreasuryStats = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().toISOString().slice(0, 7);

    // 1. Current Live Drawer Balance (sum of all transactions)
    const balanceRes = await db.query(
      'SELECT COALESCE(SUM(amount), 0) as balance FROM treasury_transactions'
    );
    const currentCash = parseFloat(balanceRes.rows[0].balance);

    // 2. Today's Inflows & Outflows
    const todayRes = await db.query(
      `SELECT 
         COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as today_inflows,
         COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as today_outflows,
         COALESCE(SUM(CASE WHEN transaction_type = 'subscription_fee' AND amount > 0 THEN amount ELSE 0 END), 0) as today_subscriptions,
         COALESCE(SUM(CASE WHEN transaction_type = 'pos_sale' AND amount > 0 THEN amount ELSE 0 END), 0) as today_pos_sales,
         COALESCE(SUM(CASE WHEN transaction_type = 'manual_deposit' AND amount > 0 THEN amount ELSE 0 END), 0) as today_deposits,
         COALESCE(SUM(CASE WHEN transaction_type = 'cash_in' AND amount > 0 THEN amount ELSE 0 END), 0) as today_cash_in,
         COALESCE(SUM(CASE WHEN transaction_type = 'cash_out' THEN ABS(amount) ELSE 0 END), 0) as today_cash_out,
         COALESCE(SUM(CASE WHEN transaction_type = 'expense' THEN ABS(amount) ELSE 0 END), 0) as today_expenses
       FROM treasury_transactions
       WHERE DATE(created_at) = $1`,
      [today]
    );

    // 3. Month's Total Revenue and Expenses
    const monthRes = await db.query(
      `SELECT 
         COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as month_inflows,
         COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as month_outflows,
         COALESCE(SUM(CASE WHEN transaction_type = 'subscription_fee' THEN amount ELSE 0 END), 0) as month_subscriptions,
         COALESCE(SUM(CASE WHEN transaction_type = 'pos_sale' THEN amount ELSE 0 END), 0) as month_pos_sales,
         COALESCE(SUM(CASE WHEN transaction_type = 'cash_in' THEN amount ELSE 0 END), 0) as month_cash_in,
         COALESCE(SUM(CASE WHEN transaction_type = 'cash_out' THEN ABS(amount) ELSE 0 END), 0) as month_cash_out,
         COALESCE(SUM(CASE WHEN transaction_type = 'expense' THEN ABS(amount) ELSE 0 END), 0) as month_expenses
       FROM treasury_transactions
       WHERE TO_CHAR(created_at, 'YYYY-MM') = $1`,
      [currentMonth]
    );

    // 4. POS Profit Calculation for Current Month (Selling Price - Cost Price)
    const posProfitRes = await db.query(
      `SELECT 
         COALESCE(SUM(psi.total_price), 0) as total_sales,
         COALESCE(SUM(psi.unit_cost * psi.quantity), 0) as total_cost,
         COALESCE(SUM(psi.total_price - (psi.unit_cost * psi.quantity)), 0) as gross_profit
       FROM pos_sale_items psi
       JOIN pos_sales ps ON ps.id = psi.sale_id
       WHERE TO_CHAR(ps.created_at, 'YYYY-MM') = $1`,
      [currentMonth]
    );

    // 5. Teachers Breakdown (تفاصيل مستحقات المدرسين وحصة السنتر)
    // Query each teacher's active groups, attendance, collections, and financial config
    const teachersRes = await db.query(`
      SELECT 
        t.id as teacher_id,
        t.full_name as teacher_name,
        t.phone,
        sub.name_ar as subject_name,
        COALESCE(t.revenue_split_type, 'percentage') as revenue_split_type,
        COALESCE(t.revenue_split_percent, 80.00) as revenue_split_percent,
        COALESCE(t.fixed_rate_per_student, 0.00) as fixed_rate_per_student,
        COUNT(DISTINCT g.id) as groups_count,
        COUNT(DISTINCT ge.student_id) as enrolled_students,
        COALESCE(SUM(ss.amount_paid), 0) as total_collected
      FROM teachers t
      LEFT JOIN groups g ON g.teacher_id = t.id AND g.status = 'active'
      LEFT JOIN subjects sub ON sub.id = g.subject_id
      LEFT JOIN group_enrollments ge ON ge.group_id = g.id AND ge.is_active = true
      LEFT JOIN student_subscriptions ss 
        ON ss.group_id = g.id AND ss.billing_month = $1
      WHERE t.is_active = true
      GROUP BY t.id, t.full_name, t.phone, sub.name_ar, t.revenue_split_type, t.revenue_split_percent, t.fixed_rate_per_student
      ORDER BY total_collected DESC, t.full_name ASC
    `, [currentMonth]);

    let totalTeacherDues = 0;
    let totalCenterFromSubscriptions = 0;

    const teacherBreakdowns = teachersRes.rows.map(row => {
      const collected = parseFloat(row.total_collected || 0);
      let teacherShare = 0;
      let centerShare = 0;

      if (row.revenue_split_type === 'percentage' || !row.revenue_split_type) {
        const percent = parseFloat(row.revenue_split_percent || 80);
        teacherShare = (collected * percent) / 100;
        centerShare = collected - teacherShare;
      } else {
        // fixed rate per student
        const fixedRate = parseFloat(row.fixed_rate_per_student || 0);
        teacherShare = parseInt(row.enrolled_students || 0) * fixedRate;
        centerShare = Math.max(0, collected - teacherShare);
      }

      totalTeacherDues += teacherShare;
      totalCenterFromSubscriptions += centerShare;

      return {
        teacherId: row.teacher_id,
        teacherName: row.teacher_name,
        phone: row.phone,
        subjectName: row.subject_name || '—',
        financialModel: row.revenue_split_type === 'percentage' ? 'PERCENTAGE' : 'FIXED',
        financialValue: row.revenue_split_type === 'percentage' 
          ? parseFloat(row.revenue_split_percent || 80) 
          : parseFloat(row.fixed_rate_per_student || 0),
        groupsCount: parseInt(row.groups_count, 10),
        enrolledStudents: parseInt(row.enrolled_students, 10),
        totalCollected: collected,
        teacherShare,
        centerShare,
      };
    });

    const monthSubscriptions = parseFloat(monthRes.rows[0].month_subscriptions || 0);
    const monthExpenses = parseFloat(monthRes.rows[0].month_expenses || 0);
    const posGrossProfit = parseFloat(posProfitRes.rows[0].gross_profit || 0);

    // Center Net Profit: Center's clean share from subscriptions (expenses paid separately as requested)
    const centerNetProfit = totalCenterFromSubscriptions;

    res.json({
      success: true,
      data: {
        currentCash,
        today: {
          inflows: parseFloat(todayRes.rows[0].today_inflows),
          outflows: parseFloat(todayRes.rows[0].today_outflows),
          subscriptions: parseFloat(todayRes.rows[0].today_subscriptions),
          posSales: parseFloat(todayRes.rows[0].today_pos_sales),
          deposits: parseFloat(todayRes.rows[0].today_deposits),
          cashIn: parseFloat(todayRes.rows[0].today_cash_in),
          cashOut: parseFloat(todayRes.rows[0].today_cash_out),
          expenses: parseFloat(todayRes.rows[0].today_expenses),
          netToday: parseFloat(todayRes.rows[0].today_inflows) - parseFloat(todayRes.rows[0].today_outflows),
        },
        month: {
          inflows: parseFloat(monthRes.rows[0].month_inflows),
          outflows: parseFloat(monthRes.rows[0].month_outflows),
          subscriptions: monthSubscriptions,
          posSales: parseFloat(monthRes.rows[0].month_pos_sales),
          posProfit: posGrossProfit,
          expenses: monthExpenses,
          totalTeacherDues,
          centerShareFromSubscriptions: totalCenterFromSubscriptions,
          centerNetProfit,
        },
        teachers: teacherBreakdowns,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/finance/transactions
 * List all treasury transactions
 */
const listTransactions = async (req, res, next) => {
  try {
    const pageNum = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 30));
    const offset = (pageNum - 1) * limitNum;
    const { type, from_date, to_date } = req.query;

    let queryText = `
      SELECT 
        tt.*,
        u.full_name as recorder_name
      FROM treasury_transactions tt
      LEFT JOIN users u ON u.id = tt.recorded_by
      WHERE 1=1
    `;
    const params = [];

    if (type) {
      params.push(type);
      queryText += ` AND tt.transaction_type = $${params.length}`;
    }

    if (from_date) {
      params.push(from_date);
      queryText += ` AND DATE(tt.created_at) >= $${params.length}`;
    }

    if (to_date) {
      params.push(to_date);
      queryText += ` AND DATE(tt.created_at) <= $${params.length}`;
    }

    queryText += ` ORDER BY tt.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limitNum, offset);

    const result = await db.query(queryText, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/finance/expenses
 * Add operational expense
 */
const addExpense = async (req, res, next) => {
  const client = await db.getClient();
  try {
    const { expense_category, amount, recipient_name, notes } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0 || !notes) {
      throw new BadRequestError('المبلغ وبيان الصرف مطلوبان');
    }

    await client.query('BEGIN');

    const voucherNo = 'VOU-' + Date.now().toString().slice(-6);

    const expenseRes = await client.query(
      `INSERT INTO expenses (expense_category, amount, recipient_name, notes, voucher_no, recorded_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [expense_category || 'other', amount, recipient_name || null, notes, voucherNo, userId]
    );

    const expense = expenseRes.rows[0];

    // Log negative amount to treasury_transactions
    await client.query(
      `INSERT INTO treasury_transactions (transaction_type, amount, reference_id, notes, recorded_by)
       VALUES ('expense', $1, $2, $3, $4)`,
      [-Math.abs(parseFloat(amount)), expense.id, `مصروف: ${notes} (إذن #${voucherNo})`, userId]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'تم تسجيل المصروف وصرفه من الخزينة بنجاح',
      data: expense,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * POST /api/finance/deposits
 * Add cash float / manual deposit into drawer
 */
const addDeposit = async (req, res, next) => {
  try {
    const { amount, notes, transaction_type } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      throw new BadRequestError('مبلغ الإيداع مطلوب');
    }

    const type = transaction_type || 'manual_deposit';

    const result = await db.query(
      `INSERT INTO treasury_transactions (transaction_type, amount, notes, recorded_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [type, parseFloat(amount), notes || 'إيداع نقدية / عهدة إضافية', userId]
    );

    res.status(201).json({
      success: true,
      message: 'تم إيداع المبلغ بالخزينة بنجاح',
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/finance/settlements
 * End of Day Settlement / Shift Closing
 */
const closeSettlement = async (req, res, next) => {
  try {
    const { actual_cash, notes } = req.body;
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    if (actual_cash === undefined || actual_cash === null || isNaN(actual_cash)) {
      throw new BadRequestError('يرجى إدخال المبلغ الفعلي المعدود في الدرج');
    }

    // Compute expected cash for today
    const statsRes = await db.query(
      `SELECT 
         COALESCE(SUM(CASE WHEN transaction_type = 'subscription_fee' THEN amount ELSE 0 END), 0) as subscriptions,
         COALESCE(SUM(CASE WHEN transaction_type IN ('pos_sale', 'booklet_delivery_payment') THEN amount ELSE 0 END), 0) as pos_sales,
         COALESCE(SUM(CASE WHEN transaction_type IN ('manual_deposit', 'cash_in', 'booklet_reservation_deposit') THEN amount ELSE 0 END), 0) as deposits,
         COALESCE(SUM(CASE WHEN transaction_type IN ('expense', 'cash_out') THEN ABS(amount) ELSE 0 END), 0) as expenses
       FROM treasury_transactions
       WHERE DATE(created_at) = $1`,
      [today]
    );

    const s = statsRes.rows[0];
    const totalSubs = parseFloat(s.subscriptions);
    const totalPos = parseFloat(s.pos_sales);
    const totalDep = parseFloat(s.deposits);
    const totalExp = parseFloat(s.expenses);

    // Current total expected cash in drawer
    const totalBalanceRes = await db.query('SELECT COALESCE(SUM(amount), 0) as balance FROM treasury_transactions');
    const expectedCash = parseFloat(totalBalanceRes.rows[0].balance);
    const actualCash = parseFloat(actual_cash);
    const difference = actualCash - expectedCash;

    const result = await db.query(
      `INSERT INTO daily_settlements 
       (settlement_date, user_id, opening_balance, total_subscriptions, total_pos_sales, total_deposits, total_expenses, expected_cash, actual_cash, difference, notes)
       VALUES ($1, $2, 0, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [today, userId, totalSubs, totalPos, totalDep, totalExp, expectedCash, actualCash, difference, notes || null]
    );

    res.status(201).json({
      success: true,
      message: 'تم إقفال اليومية وتقفيل الوردية بنجاح',
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/finance/settlements
 * List recent daily settlements
 */
const listSettlements = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT ds.*, u.full_name as user_name
      FROM daily_settlements ds
      JOIN users u ON u.id = ds.user_id
      ORDER BY ds.closed_at DESC
      LIMIT 20
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/finance/petty-cash
 * Handle cash in and out of reception drawer (فلوس داخلة وخارجة بالدرج)
 */
const addPettyCashMovement = async (req, res, next) => {
  try {
    const { type = 'in', amount, reason, person_name } = req.body;
    const userId = req.user.id;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'المبلغ مطلوب ويجب أن يكون أكبر من الصفر' });
    }
    if (!reason?.trim()) {
      return res.status(400).json({ success: false, message: 'سبب حركة النقدية مطلوب (مثلاً: تصوير ورق، شراء حاجة)' });
    }

    const isCashIn = type === 'in';
    const signedAmount = isCashIn ? Math.abs(parseFloat(amount)) : -Math.abs(parseFloat(amount));
    const txType = isCashIn ? 'cash_in' : 'cash_out';
    const fullNote = `${isCashIn ? 'إيداع/دخول نقدية للدرج' : 'سحب/خروج نقدية من الدرج'}: ${reason.trim()}${person_name ? ` (${person_name.trim()})` : ''}`;

    const result = await db.query(
      `INSERT INTO treasury_transactions (transaction_type, amount, notes, recorded_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [txType, signedAmount, fullNote, userId]
    );

    res.status(201).json({
      success: true,
      message: `تم تسجيل ${isCashIn ? 'دخول' : 'خروج'} النقدية بنجاح (${signedAmount > 0 ? '+' : ''}${signedAmount} ج.م)`,
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDebtsReport,
  settleDebt,
  getTreasuryStats,
  listTransactions,
  addExpense,
  addDeposit,
  addPettyCashMovement,
  closeSettlement,
  listSettlements,
};
