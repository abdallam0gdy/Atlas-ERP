const db = require('../config/db');
const { NotFoundError, BadRequestError } = require('../utils/errors');

/**
 * GET /api/subscriptions/student-account/:studentId
 * Get comprehensive student account, enrolled groups, remaining sessions, and debt
 */
const getStudentAccount = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    // 1. Fetch student info
    const studentRes = await db.query(
      `SELECT s.*, 
              ag.name_ar as grade_name, ag.grade_order,
              ss.name_ar as status_name, ss.discount_percent
       FROM students s
       LEFT JOIN academic_grades ag ON s.grade_id = ag.id
       LEFT JOIN student_statuses ss ON s.status_id = ss.id
       WHERE s.id::text = $1 OR CAST(s.student_code AS TEXT) = $1 OR s.barcode_id = $1`,
      [studentId]
    );

    if (studentRes.rows.length === 0) {
      throw new NotFoundError('الطالب غير موجود');
    }

    const student = studentRes.rows[0];
    const currentMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

    // 2. Fetch all groups the student is enrolled in, with active subscription details
    const groupsRes = await db.query(
      `SELECT 
         ge.id as enrollment_id,
         ge.enrolled_at,
         ge.is_active as enrollment_active,
         ge.enrollment_type,
         COALESCE(ge.discount_type, s_sub.discount_type, 'FIXED') as discount_type,
         COALESCE(ge.discount_value, s_sub.discount_value, 0.00) as discount_value,
         g.id as group_id,
         g.name as group_name,
         g.name_ar as group_name_ar,
         g.schedule,
         g.price_per_month,
         g.price_per_session,
         sub.id as subject_id,
         sub.name_ar as subject_name,
         sub.color as subject_color,
         t.id as teacher_id,
         t.full_name as teacher_name,
         cr.name as classroom_name,
          -- Subscription aggregations / latest active
          COALESCE(s_sub.id, NULL) as subscription_id,
          COALESCE(s_sub.total_sessions, 0) as total_sessions,
          COALESCE(s_sub.used_sessions, 0) as used_sessions,
          COALESCE((
            SELECT SUM(ss_rem.remaining_sessions)
            FROM student_subscriptions ss_rem
            WHERE ss_rem.student_id = $1 AND ss_rem.group_id = g.id AND ss_rem.status = 'active'
          ), s_sub.remaining_sessions, 0) as remaining_sessions,
          COALESCE((
            SELECT SUM(ss_paid.amount_paid)
            FROM student_subscriptions ss_paid
            WHERE ss_paid.student_id = $1 AND ss_paid.group_id = g.id
          ), s_sub.amount_paid, 0) as amount_paid,
          COALESCE((
            SELECT SUM(ss_due.amount_due)
            FROM student_subscriptions ss_due
            WHERE ss_due.student_id = $1 AND ss_due.group_id = g.id
          ), s_sub.amount_due, 0) as amount_due,
          COALESCE(s_sub.billing_month, $2) as billing_month,
          COALESCE(s_sub.status, 'active') as subscription_status,
         -- Count total attendance in this group
         (SELECT COUNT(*) FROM attendance_logs al WHERE al.student_id = $1 AND al.group_id = g.id) as total_attendance_count
       FROM group_enrollments ge
       JOIN groups g ON ge.group_id = g.id
       LEFT JOIN subjects sub ON g.subject_id = sub.id
       LEFT JOIN teachers t ON g.teacher_id = t.id
       LEFT JOIN classrooms cr ON g.classroom_id = cr.id
       LEFT JOIN LATERAL (
         SELECT ss.*
         FROM student_subscriptions ss
         WHERE ss.student_id = $1 AND ss.group_id = g.id
         ORDER BY ss.created_at DESC
         LIMIT 1
       ) s_sub ON true
       WHERE ge.student_id = $1
       ORDER BY ge.is_active DESC, g.name ASC`,
      [student.id, currentMonth]
    );

    // 3. Fetch recent payments / transactions for this student
    const historyRes = await db.query(
      `SELECT ss.*, g.name as group_name, g.name_ar as group_name_ar,
              sub.name_ar as subject_name, t.full_name as teacher_name
       FROM student_subscriptions ss
       LEFT JOIN groups g ON ss.group_id = g.id
       LEFT JOIN subjects sub ON g.subject_id = sub.id
       LEFT JOIN teachers t ON g.teacher_id = t.id
       WHERE ss.student_id = $1
       ORDER BY ss.created_at DESC
       LIMIT 10`,
      [student.id]
    );

    // 4. Calculate overall financial totals for student
    let totalPaid = 0;
    let totalDue = 0;
    let totalRemainingSessions = 0;

    groupsRes.rows.forEach(grp => {
      totalPaid += parseFloat(grp.amount_paid || 0);
      totalDue += parseFloat(grp.amount_due || 0);
      totalRemainingSessions += parseInt(grp.remaining_sessions || 0, 10);
    });

    res.json({
      success: true,
      data: {
        student,
        groups: groupsRes.rows,
        history: historyRes.rows,
        summary: {
          totalGroups: groupsRes.rows.length,
          totalRemainingSessions,
          totalPaid,
          totalDue,
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/subscriptions/renew
 * Renew subscription / credit sessions to student for a group
 */
const renewSubscription = async (req, res, next) => {
  const client = await db.getClient();
  try {
    const {
      student_id,
      group_id,
      sessions_count, // e.g., 1, 2, 3, 4, 8
      amount_paid,
      total_charge,   // total required price
      billing_month,
      enrollment_type, // 'PACKAGE' or 'PRIVATE'
      discount_type,   // 'FIXED' or 'PERCENT'
      discount_value,  // numeric value of discount
      notes
    } = req.body;
    const userId = req.user.id;
    const finalEnrollmentType = enrollment_type === 'PRIVATE' ? 'PRIVATE' : 'PACKAGE';
    const finalDiscountType = discount_type === 'PERCENT' ? 'PERCENT' : 'FIXED';
    const finalDiscountValue = Math.max(0, parseFloat(discount_value) || 0);

    if (!student_id || !group_id) {
      throw new BadRequestError('الطالب والمجموعة مطلوبان لتسجيل الاشتراك');
    }

    const sessionsToAdd = parseInt(sessions_count, 10);
    if (isNaN(sessionsToAdd) || sessionsToAdd <= 0) {
      throw new BadRequestError('عدد الحصص المضافة يجب أن يكون أكبر من الصفر');
    }

    const paidNum = parseFloat(amount_paid) || 0;
    const chargeNum = parseFloat(total_charge) || 0;
    if (paidNum < 0 || chargeNum < 0) {
      throw new BadRequestError('المبالغ المالية يجب أن تكون أكبر من أو تساوي الصفر');
    }
    const month = billing_month || new Date().toISOString().slice(0, 7);

    await client.query('BEGIN');

    // Ensure student is enrolled in group with correct enrollment_type and persistent discount
    const enrollCheck = await client.query(
      `SELECT id, is_active, enrollment_type, discount_type, discount_value FROM group_enrollments WHERE student_id = $1 AND group_id = $2`,
      [student_id, group_id]
    );
    if (enrollCheck.rows.length === 0) {
      await client.query(
        `INSERT INTO group_enrollments (student_id, group_id, enrollment_type, discount_type, discount_value, is_active) VALUES ($1, $2, $3, $4, $5, true)`,
        [student_id, group_id, finalEnrollmentType, finalDiscountType, finalDiscountValue]
      );
    } else {
      await client.query(
        `UPDATE group_enrollments SET is_active = true, enrollment_type = $1, discount_type = $2, discount_value = $3, updated_at = NOW() WHERE id = $4`,
        [finalEnrollmentType, finalDiscountType, finalDiscountValue, enrollCheck.rows[0].id]
      );
    }

    // Get group info for description
    const grpRes = await client.query(`SELECT name, name_ar, price_per_session, price_per_month FROM groups WHERE id = $1`, [group_id]);
    const groupName = grpRes.rows[0]?.name_ar || grpRes.rows[0]?.name || 'المجموعة';

    // Check for existing active subscription in the same billing month
    const subCheck = await client.query(
      `SELECT * FROM student_subscriptions 
       WHERE student_id = $1 AND group_id = $2 AND billing_month = $3
       ORDER BY created_at DESC LIMIT 1`,
      [student_id, group_id, month]
    );

    let subscriptionId;
    let finalTotalSessions = sessionsToAdd;
    let finalUsedSessions = 0;
    let finalAmountPaid = paidNum;
    let finalAmountDue = 0;

    if (subCheck.rows.length > 0) {
      // Add sessions & amounts to existing record
      const existing = subCheck.rows[0];
      const existingDebt = Math.max(0, parseFloat(existing.amount_due || 0));
      const totalLiability = chargeNum + existingDebt;

      if (paidNum > totalLiability) {
        throw new BadRequestError(`المبلغ المدفوع (${paidNum} ج.م) أكبر من إجمالي المطلوب (${totalLiability} ج.م: ${chargeNum} ج.م للحصص + ${existingDebt} ج.م مديونية سابقة)`);
      }

      finalTotalSessions = existing.total_sessions + sessionsToAdd;
      finalUsedSessions = existing.used_sessions;
      finalAmountPaid = parseFloat(existing.amount_paid || 0) + paidNum;
      finalAmountDue = Math.max(0, totalLiability - paidNum);
      subscriptionId = existing.id;

      await client.query(
        `UPDATE student_subscriptions
         SET total_sessions = $1,
             amount_paid = $2,
             amount_due = $3,
             enrollment_type = $4,
             discount_type = $5,
             discount_value = $6,
             status = 'active',
             notes = COALESCE($7, notes),
             updated_at = NOW()
         WHERE id = $8`,
        [finalTotalSessions, finalAmountPaid, finalAmountDue, finalEnrollmentType, finalDiscountType, finalDiscountValue, notes, subscriptionId]
      );
    } else {
      // Check if student has previous debt in this group
      const prevDebtRes = await client.query(
        `SELECT id, amount_due, amount_paid FROM student_subscriptions
         WHERE student_id = $1 AND group_id = $2 AND amount_due > 0
         ORDER BY created_at DESC LIMIT 1`,
        [student_id, group_id]
      );
      const prevDebt = prevDebtRes.rows.length > 0 ? parseFloat(prevDebtRes.rows[0].amount_due || 0) : 0;
      const totalLiability = chargeNum + prevDebt;

      if (paidNum > totalLiability) {
        throw new BadRequestError(`المبلغ المدفوع (${paidNum} ج.م) أكبر من إجمالي المطلوب (${totalLiability} ج.م: ${chargeNum} ج.م للحصص${prevDebt > 0 ? ` + ${prevDebt} ج.م مديونية سابقة` : ''})`);
      }

      // If paidNum > chargeNum and there is previous debt, pay down the previous debt
      if (paidNum > chargeNum && prevDebt > 0) {
        const debtPaid = Math.min(prevDebt, paidNum - chargeNum);
        await client.query(
          `UPDATE student_subscriptions
           SET amount_due = amount_due - $1,
               amount_paid = amount_paid + $1,
               updated_at = NOW()
           WHERE id = $2`,
          [debtPaid, prevDebtRes.rows[0].id]
        );
      }

      const dueNum = Math.max(0, chargeNum - Math.min(chargeNum, paidNum));
      finalAmountDue = dueNum;
      finalAmountPaid = Math.min(chargeNum, paidNum);

      // Create new subscription record
      const newSub = await client.query(
        `INSERT INTO student_subscriptions
         (student_id, group_id, total_sessions, used_sessions, amount_paid, amount_due, billing_month, enrollment_type, discount_type, discount_value, status, notes)
         VALUES ($1, $2, $3, 0, $4, $5, $6, $7, $8, $9, 'active', $10)
         RETURNING id`,
        [student_id, group_id, sessionsToAdd, finalAmountPaid, dueNum, month, finalEnrollmentType, finalDiscountType, finalDiscountValue, notes]
      );
      subscriptionId = newSub.rows[0].id;
    }

    // If money was paid, record directly into treasury_transactions
    if (paidNum > 0) {
      await client.query(
        `INSERT INTO treasury_transactions 
         (transaction_type, amount, reference_id, notes, recorded_by)
         VALUES ('subscription_fee', $1, $2, $3, $4)`,
        [
          paidNum,
          subscriptionId,
          notes || `تحصيل ${sessionsToAdd} حصص (${paidNum} ج.م) - مجموعة ${groupName} - شهر ${month}`,
          userId
        ]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: `تم شحن ${sessionsToAdd} حصص بنجاح (رصيد الحصص المتبقي: ${finalTotalSessions - finalUsedSessions})`,
      data: {
        subscriptionId,
        sessionsAdded: sessionsToAdd,
        totalSessions: finalTotalSessions,
        remainingSessions: finalTotalSessions - finalUsedSessions,
        amountPaid: paidNum,
        amountDue: finalAmountDue,
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * POST /api/subscriptions/enroll
 * Enroll student into a group directly
 */
const enrollStudentInGroup = async (req, res, next) => {
  try {
    const { student_id, group_id, enrollment_type } = req.body;
    if (!student_id || !group_id) {
      throw new BadRequestError('معرف الطالب والمجموعة مطلوبان');
    }
    const finalEnrollmentType = enrollment_type === 'PRIVATE' ? 'PRIVATE' : 'PACKAGE';

    const check = await db.query(
      `SELECT id, is_active, enrollment_type FROM group_enrollments WHERE student_id = $1 AND group_id = $2`,
      [student_id, group_id]
    );

    if (check.rows.length > 0) {
      if (!check.rows[0].is_active) {
        await db.query(`UPDATE group_enrollments SET is_active = true, enrollment_type = $1 WHERE id = $2`, [finalEnrollmentType, check.rows[0].id]);
        return res.json({ success: true, message: 'تم إعادة تفعيل قيد الطالب في المجموعة' });
      }
      // If already active, update enrollment_type if changed
      if (check.rows[0].enrollment_type !== finalEnrollmentType) {
        await db.query(`UPDATE group_enrollments SET enrollment_type = $1 WHERE id = $2`, [finalEnrollmentType, check.rows[0].id]);
        return res.json({ success: true, message: 'تم تحديث نوع قيد الطالب في المجموعة بنجاح' });
      }
      return res.status(400).json({ success: false, message: 'الطالب مسجل بالفعل في هذه المجموعة' });
    }

    await db.query(
      `INSERT INTO group_enrollments (student_id, group_id, enrollment_type, is_active) VALUES ($1, $2, $3, true)`,
      [student_id, group_id, finalEnrollmentType]
    );

    res.status(201).json({ success: true, message: 'تم قيد الطالب في المجموعة بنجاح' });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/subscriptions/enroll/:enrollmentId
 * Unenroll student from group
 */
const unenrollStudent = async (req, res, next) => {
  try {
    const { enrollmentId } = req.params;
    await db.query('UPDATE group_enrollments SET is_active = false WHERE id = $1', [enrollmentId]);
    res.json({ success: true, message: 'تم إيقاف قيد الطالب في المجموعة' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/subscriptions/debts
 * List all students with overdue subscription payments / remaining debt
 */
const getDebtsList = async (req, res, next) => {
  try {
    const { grade_id, group_id, search } = req.query;
    const currentMonth = new Date().toISOString().slice(0, 7);

    let queryText = `
      SELECT 
        s.id AS student_id,
        s.student_code,
        s.barcode_id,
        s.full_name AS student_name,
        s.phone AS student_phone,
        s.parent_phone,
        g.id AS group_id,
        g.name AS group_name,
        g.name_ar AS group_name_ar,
        g.price_per_month,
        g.price_per_session,
        sub.name_ar AS subject_name,
        sub.color AS subject_color,
        t.full_name AS teacher_name,
        gr.name_ar AS grade_name,
        COALESCE(ss.total_sessions, 0) AS total_sessions,
        COALESCE(ss.used_sessions, 0) AS used_sessions,
        COALESCE(ss.remaining_sessions, 0) AS remaining_sessions,
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
      LEFT JOIN LATERAL (
        SELECT * FROM student_subscriptions ss2
        WHERE ss2.student_id = s.id AND ss2.group_id = g.id
        ORDER BY ss2.created_at DESC
        LIMIT 1
      ) ss ON true
      WHERE ge.is_active = true
        AND (ss.id IS NULL OR ss.amount_due > 0 OR ss.remaining_sessions <= 0)
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
      queryText += ` AND (s.full_name ILIKE $${params.length} OR s.phone ILIKE $${params.length} OR s.parent_phone ILIKE $${params.length} OR CAST(s.student_code AS TEXT) ILIKE $${params.length} OR s.barcode_id ILIKE $${params.length})`;
    }

    queryText += ` ORDER BY amount_due DESC, s.full_name ASC`;

    const result = await db.query(queryText, params);

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
 * POST /api/subscriptions/pay-debt
 * Pay an existing debt without adding new sessions (FIFO multi-subscription settlement)
 */
const payDebt = async (req, res, next) => {
  const client = await db.getClient();
  try {
    const { student_id, group_id, amount_paid, notes } = req.body;
    const userId = req.user.id;

    if (!student_id || !group_id) {
      throw new BadRequestError('الطالب والمجموعة مطلوبان');
    }
    const paidNum = parseFloat(amount_paid) || 0;
    if (paidNum <= 0) {
      throw new BadRequestError('المبلغ المسدد يجب أن يكون أكبر من الصفر');
    }

    await client.query('BEGIN');

    // Find all subscriptions with debt for this group, sorted from oldest to newest (FIFO)
    const debtSubsRes = await client.query(
      `SELECT * FROM student_subscriptions
       WHERE student_id = $1 AND group_id = $2 AND amount_due > 0
       ORDER BY created_at ASC`,
      [student_id, group_id]
    );

    // Get group info for descriptions
    const grpRes = await client.query(`SELECT name, name_ar, price_per_month, price_per_session FROM groups WHERE id = $1`, [group_id]);
    const groupRow = grpRes.rows[0] || {};
    const groupName = groupRow.name_ar || groupRow.name || 'المجموعة';

    let lastSubId = null;
    let newPaidTotal = 0;
    let remainingDueTotal = 0;

    if (debtSubsRes.rows.length === 0) {
      // Check if student is enrolled in the group
      const enrollCheck = await client.query(
        `SELECT id, is_active FROM group_enrollments WHERE student_id = $1 AND group_id = $2`,
        [student_id, group_id]
      );

      if (enrollCheck.rows.length === 0) {
        throw new BadRequestError('لا توجد مديونية مسجلة والطالب غير مسجل في هذه المجموعة');
      }

      const fullPrice = parseFloat(groupRow.price_per_month || 0);
      if (paidNum > fullPrice && fullPrice > 0) {
        throw new BadRequestError(`المبلغ المدفوع (${paidNum} ج.م) أكبر من قيمة الاشتراك الشهري المطلوب (${fullPrice} ج.م)`);
      }

      const dueNum = Math.max(0, fullPrice - paidNum);
      const defaultSessions = 4;
      const month = new Date().toISOString().slice(0, 7);

      const newSub = await client.query(
        `INSERT INTO student_subscriptions
         (student_id, group_id, total_sessions, used_sessions, amount_paid, amount_due, billing_month, status, notes)
         VALUES ($1, $2, $3, 0, $4, $5, $6, 'active', $7)
         RETURNING id`,
        [student_id, group_id, defaultSessions, paidNum, dueNum, month, notes || 'سداد اشتراك شهري']
      );

      lastSubId = newSub.rows[0].id;
      newPaidTotal = paidNum;
      remainingDueTotal = dueNum;
    } else {
      const totalDebt = debtSubsRes.rows.reduce((sum, r) => sum + parseFloat(r.amount_due || 0), 0);

      if (paidNum > totalDebt + 0.001) {
        throw new BadRequestError(`المبلغ المدفوع (${paidNum} ج.م) أكبر من إجمالي المديونية المستحقة (${totalDebt} ج.م)`);
      }

      let remainingToPay = paidNum;

      for (const sub of debtSubsRes.rows) {
        if (remainingToPay <= 0) break;
        const curDue = parseFloat(sub.amount_due || 0);
        const payForThis = Math.min(curDue, remainingToPay);
        const updatedDue = Math.max(0, curDue - payForThis);
        const updatedPaid = parseFloat(sub.amount_paid || 0) + payForThis;

        await client.query(
          `UPDATE student_subscriptions
           SET amount_paid = $1,
               amount_due = $2,
               notes = COALESCE($3, notes),
               updated_at = NOW()
           WHERE id = $4`,
          [updatedPaid, updatedDue, notes || sub.notes, sub.id]
        );

        remainingToPay -= payForThis;
        lastSubId = sub.id;
      }

      newPaidTotal = paidNum;
      remainingDueTotal = Math.max(0, totalDebt - paidNum);
    }

    // Record into treasury_transactions
    await client.query(
      `INSERT INTO treasury_transactions
       (transaction_type, amount, reference_id, notes, recorded_by)
       VALUES ('subscription_fee', $1, $2, $3, $4)`,
      [
        paidNum,
        lastSubId,
        notes || `سداد مديونية اشتراك: ${paidNum} ج.م - مجموعة ${groupName} (المتبقي كدين: ${remainingDueTotal} ج.م)`,
        userId
      ]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `تم سداد مبلغ ${paidNum} ج.م من المديونية بنجاح (المتبقي كدين: ${remainingDueTotal} ج.م)`,
      data: {
        subscriptionId: lastSubId,
        amountPaid: paidNum,
        totalPaid: newPaidTotal,
        remainingDue: remainingDueTotal,
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * POST /api/subscriptions/refund-clearance
 * Liquidate student sessions, refund remaining balance after deducting all debts, and optionally drop from group
 */
const refundClearance = async (req, res, next) => {
  const client = await db.getClient();
  try {
    const { student_id, group_id, refund_amount, drop_group, notes } = req.body;
    const userId = req.user.id;

    if (!student_id || !group_id) {
      throw new BadRequestError('الطالب والمجموعة مطلوبان للتصفية');
    }

    const refundNum = parseFloat(refund_amount) || 0;
    if (refundNum < 0) {
      throw new BadRequestError('مبلغ الاسترداد لا يمكن أن يكون سالباً');
    }

    await client.query('BEGIN');

    // 1. Get student and group info
    const studentRes = await client.query('SELECT full_name, full_name_ar, student_code FROM students WHERE id = $1', [student_id]);
    const studentName = studentRes.rows[0]?.full_name_ar || studentRes.rows[0]?.full_name || 'الطالب';

    const groupRes = await client.query('SELECT name, name_ar, price_per_session, price_per_month FROM groups WHERE id = $1', [group_id]);
    const groupRow = groupRes.rows[0] || {};
    const groupName = groupRow.name_ar || groupRow.name || 'المجموعة';

    const pricePerSession = parseFloat(groupRow.price_per_session) || 
                            (parseFloat(groupRow.price_per_month) ? Math.round(parseFloat(groupRow.price_per_month) / 4) : 0);

    // Fetch student's persistent discount in this group
    const enrollRes = await client.query(
      `SELECT discount_type, discount_value FROM group_enrollments WHERE student_id = $1 AND group_id = $2`,
      [student_id, group_id]
    );

    // 2. Fetch all active or unpaid subscriptions for this group
    const allSubsRes = await client.query(
      `SELECT * FROM student_subscriptions
       WHERE student_id = $1 AND group_id = $2
       ORDER BY created_at DESC`,
      [student_id, group_id]
    );

    if (allSubsRes.rows.length === 0) {
      throw new BadRequestError('لا يوجد اشتراك مسجل لهذا الطالب في هذه المجموعة لتصفيته');
    }

    const dType = enrollRes.rows[0]?.discount_type || allSubsRes.rows[0]?.discount_type || 'FIXED';
    const dVal = parseFloat(enrollRes.rows[0]?.discount_value ?? allSubsRes.rows[0]?.discount_value ?? 0);

    let sessionDiscount = 0;
    if (dType === 'PERCENT' && dVal > 0) {
      sessionDiscount = (pricePerSession * Math.min(100, dVal)) / 100;
    } else if (dType === 'FIXED' && dVal > 0) {
      sessionDiscount = dVal / 4;
    }
    const effectivePricePerSession = Math.max(0, pricePerSession - sessionDiscount);

    // Calculate total remaining sessions across active subscriptions
    let totalClearedSessions = 0;
    let totalCurrentDebt = 0;

    allSubsRes.rows.forEach(sub => {
      if (sub.status === 'active') {
        totalClearedSessions += Math.max(0, parseInt(sub.remaining_sessions, 10) || 0);
      }
      totalCurrentDebt += Math.max(0, parseFloat(sub.amount_due || 0));
    });

    if (totalClearedSessions === 0 && totalCurrentDebt === 0) {
      throw new BadRequestError('لا توجد حصص متبقية أو مديونية مستحقة لتصفية الحساب في هذه المجموعة');
    }

    const grossSessionsValue = Math.max(0, Math.round(totalClearedSessions * effectivePricePerSession));
    const maxAllowedRefund = Math.max(0, grossSessionsValue - totalCurrentDebt);

    if (refundNum > maxAllowedRefund + 0.001) {
      throw new BadRequestError(
        `مبلغ الاسترداد (${refundNum} ج.م) يتجاوز صافي المستحق للطالب (${maxAllowedRefund} ج.م) بعد خصم المديونية (${totalCurrentDebt} ج.م) من قيمة الحصص المتبقية بسعر الخصم الفعلي (${grossSessionsValue} ج.م)`
      );
    }

    // Remaining debt after gross sessions deduction
    let remainingDebtAfterClearance = Math.max(0, totalCurrentDebt - grossSessionsValue);

    // Expire active subscriptions and reset total_sessions = used_sessions
    for (let i = 0; i < allSubsRes.rows.length; i++) {
      const sub = allSubsRes.rows[i];
      // On the latest subscription, set the remaining debt (if any), otherwise zero out debts
      const subDebt = (i === 0) ? remainingDebtAfterClearance : 0;
      await client.query(
        `UPDATE student_subscriptions
         SET total_sessions = used_sessions,
             amount_due = $1,
             status = 'expired',
             notes = COALESCE($2, notes),
             updated_at = NOW()
         WHERE id = $3`,
        [
          subDebt,
          `تصفية حساب: رصيد ${totalClearedSessions} حصص (بقيمة ${grossSessionsValue} ج.م)، خصم مديونية ${totalCurrentDebt} ج.م، صافي مسترد ${refundNum} ج.م. ${notes || ''}`.trim(),
          sub.id
        ]
      );
    }

    // 3. If drop_group is requested, deactivate enrollment
    if (drop_group) {
      await client.query(
        `UPDATE group_enrollments SET is_active = false, updated_at = NOW() WHERE student_id = $1 AND group_id = $2`,
        [student_id, group_id]
      );
    }

    // 4. Record cash outflow in treasury_transactions ONLY if refund > 0
    if (refundNum > 0) {
      await client.query(
        `INSERT INTO treasury_transactions
         (transaction_type, amount, notes, recorded_by)
         VALUES ('cash_out', $1, $2, $3)`,
        [
          -Math.abs(refundNum),
          `تصفية حساب الطالب ${studentName} واسترداد ${totalClearedSessions} حصص متبقية (صافي بعد خصم المديونية: ${refundNum} ج.م) من مجموعة ${groupName}`,
          userId
        ]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `تمت تصفية الحساب بنجاح (استرداد صافي ${refundNum} ج.م بعد خصم مديونية ${totalCurrentDebt} ج.م من قيمة ${totalClearedSessions} حصص)${drop_group ? ' وتم إيقاف قيد الطالب في المجموعة' : ''}`,
      data: {
        clearedSessions: totalClearedSessions,
        grossSessionsValue,
        currentDebt: totalCurrentDebt,
        refundAmount: refundNum,
        remainingDebtAfterClearance,
        groupDropped: Boolean(drop_group)
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

module.exports = {
  getStudentAccount,
  renewSubscription,
  enrollStudentInGroup,
  unenrollStudent,
  getDebtsList,
  payDebt,
  refundClearance,
};
