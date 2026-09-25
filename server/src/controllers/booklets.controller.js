const db = require('../config/db');
const { NotFoundError, ValidationError } = require('../utils/errors');

/**
 * GET /api/booklets
 * List all booklets & books with teacher, subject, grade, and linked groups
 */
const listBooklets = async (req, res, next) => {
  try {
    const { search, teacher_id, subject_id, grade_id } = req.query;

    let whereClause = "WHERE i.category IN ('booklet', 'book') AND i.is_active = true";
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (i.name ILIKE $${params.length} OR i.barcode ILIKE $${params.length})`;
    }
    if (teacher_id) {
      params.push(teacher_id);
      whereClause += ` AND i.teacher_id = $${params.length}`;
    }
    if (subject_id) {
      params.push(subject_id);
      whereClause += ` AND i.subject_id = $${params.length}`;
    }
    if (grade_id) {
      params.push(grade_id);
      whereClause += ` AND i.grade_id = $${params.length}`;
    }

    const queryText = `
      SELECT 
        i.*,
        t.full_name as teacher_name,
        s.name_ar as subject_name,
        s.color as subject_color,
        g.name_ar as grade_name,
        COALESCE((
          SELECT json_agg(json_build_object('id', gr.id, 'name_ar', gr.name_ar, 'name', gr.name))
          FROM booklet_groups bg
          JOIN groups gr ON gr.id = bg.group_id
          WHERE bg.item_id = i.id
        ), '[]'::json) as linked_groups,
        COALESCE((
          SELECT SUM(quantity) 
          FROM booklet_reservations br 
          WHERE br.item_id = i.id AND br.delivery_status = 'reserved'
        ), 0) as reserved_count,
        COALESCE((
          SELECT SUM(quantity) 
          FROM booklet_reservations br 
          WHERE br.item_id = i.id AND br.delivery_status = 'delivered'
        ), 0) as delivered_count
      FROM inventory_items i
      LEFT JOIN teachers t ON i.teacher_id = t.id
      LEFT JOIN subjects s ON i.subject_id = s.id
      LEFT JOIN academic_grades g ON i.grade_id = g.id
      ${whereClause}
      ORDER BY i.created_at DESC
    `;

    const result = await db.query(queryText, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/booklets
 * Create booklet with teacher and linked available groups
 */
const createBooklet = async (req, res, next) => {
  const client = await db.getClient();
  try {
    const {
      name,
      category = 'booklet',
      barcode,
      teacher_id,
      subject_id,
      grade_id,
      cost_price = 0,
      selling_price = 0,
      current_stock = 0,
      min_stock_alert = 5,
      group_ids = [],
    } = req.body;

    if (!name?.trim()) {
      throw new ValidationError('اسم الملزمة أو الكتاب مطلوب');
    }

    await client.query('BEGIN');

    // Generate barcode if not provided
    const finalBarcode = barcode?.trim() || `BK-${Math.floor(100000 + Math.random() * 900000)}`;

    const insertItemRes = await client.query(
      `INSERT INTO inventory_items (
        name, category, barcode, teacher_id, subject_id, grade_id,
        cost_price, selling_price, current_stock, min_stock_alert
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        name.trim(), category, finalBarcode, teacher_id || null, subject_id || null,
        grade_id || null, cost_price, selling_price, current_stock, min_stock_alert
      ]
    );
    const item = insertItemRes.rows[0];

    // Link groups
    if (Array.isArray(group_ids) && group_ids.length > 0) {
      for (const gid of group_ids) {
        if (gid) {
          await client.query(
            `INSERT INTO booklet_groups (item_id, group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [item.id, gid]
          );
        }
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'تمت إضافة الملزمة بنجاح',
      data: item,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * PUT /api/booklets/:id
 * Update booklet and its linked groups
 */
const updateBooklet = async (req, res, next) => {
  const client = await db.getClient();
  try {
    const { id } = req.params;
    const {
      name,
      category,
      barcode,
      teacher_id,
      subject_id,
      grade_id,
      cost_price,
      selling_price,
      current_stock,
      min_stock_alert,
      group_ids,
    } = req.body;

    await client.query('BEGIN');

    const check = await client.query('SELECT id FROM inventory_items WHERE id = $1', [id]);
    if (check.rows.length === 0) throw new NotFoundError('الملزمة');

    const updateRes = await client.query(
      `UPDATE inventory_items SET
        name = COALESCE($1, name),
        category = COALESCE($2, category),
        barcode = COALESCE($3, barcode),
        teacher_id = $4,
        subject_id = $5,
        grade_id = $6,
        cost_price = COALESCE($7, cost_price),
        selling_price = COALESCE($8, selling_price),
        current_stock = COALESCE($9, current_stock),
        min_stock_alert = COALESCE($10, min_stock_alert),
        updated_at = NOW()
       WHERE id = $11
       RETURNING *`,
      [
        name, category, barcode, teacher_id || null, subject_id || null,
        grade_id || null, cost_price, selling_price, current_stock, min_stock_alert, id
      ]
    );

    // Re-link groups if provided
    if (Array.isArray(group_ids)) {
      await client.query('DELETE FROM booklet_groups WHERE item_id = $1', [id]);
      for (const gid of group_ids) {
        if (gid) {
          await client.query(
            `INSERT INTO booklet_groups (item_id, group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [id, gid]
          );
        }
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'تم تحديث الملزمة بنجاح',
      data: updateRes.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * GET /api/booklets/reservations
 * List student booklet reservations
 */
const listReservations = async (req, res, next) => {
  try {
    const { search, delivery_status, item_id, teacher_id, group_id } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (
        s.full_name ILIKE $${params.length} OR 
        s.barcode_id ILIKE $${params.length} OR 
        CAST(s.student_code AS TEXT) ILIKE $${params.length} OR 
        s.phone ILIKE $${params.length} OR 
        s.parent_phone ILIKE $${params.length} OR
        br.reservation_number ILIKE $${params.length}
      )`;
    }

    if (delivery_status && delivery_status !== 'all') {
      params.push(delivery_status);
      whereClause += ` AND br.delivery_status = $${params.length}`;
    }

    if (item_id) {
      params.push(item_id);
      whereClause += ` AND br.item_id = $${params.length}`;
    }

    if (teacher_id) {
      params.push(teacher_id);
      whereClause += ` AND i.teacher_id = $${params.length}`;
    }

    if (group_id) {
      params.push(group_id);
      whereClause += ` AND br.group_id = $${params.length}`;
    }

    const queryText = `
      SELECT 
        br.*,
        s.full_name as student_name,
        s.barcode_id as student_barcode,
        s.student_code,
        s.phone as student_phone,
        s.parent_phone,
        i.name as item_name,
        i.category as item_category,
        i.current_stock as item_stock,
        t.full_name as teacher_name,
        gr.name_ar as group_name
      FROM booklet_reservations br
      JOIN students s ON s.id = br.student_id
      JOIN inventory_items i ON i.id = br.item_id
      LEFT JOIN teachers t ON t.id = i.teacher_id
      LEFT JOIN groups gr ON gr.id = br.group_id
      ${whereClause}
      ORDER BY br.reserved_at DESC
    `;

    const result = await db.query(queryText, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/booklets/reservations
 * Create reservation for a student
 */
const createReservation = async (req, res, next) => {
  const client = await db.getClient();
  try {
    const {
      student_id,
      item_id,
      group_id,
      quantity = 1,
      paid_amount = 0,
      notes = '',
    } = req.body;

    if (!student_id) throw new ValidationError('يرجى اختيار الطالب من قاعدة البيانات');
    if (!item_id) throw new ValidationError('يرجى اختيار الملزمة');

    await client.query('BEGIN');

    // Get item info
    const itemRes = await client.query('SELECT * FROM inventory_items WHERE id = $1', [item_id]);
    if (itemRes.rows.length === 0) throw new NotFoundError('الملزمة');
    const item = itemRes.rows[0];

    // Get student info
    const studentRes = await client.query('SELECT * FROM students WHERE id = $1', [student_id]);
    if (studentRes.rows.length === 0) throw new NotFoundError('الطالب');
    const student = studentRes.rows[0];

    // Next seq for reservation number
    const seqRes = await client.query("SELECT nextval('booklet_reservation_seq') as seq");
    const resNumber = `BK-${seqRes.rows[0].seq}`;

    const qty = parseInt(quantity, 10) || 1;
    const unitPrice = parseFloat(item.selling_price) || 0;
    const totalPrice = unitPrice * qty;
    const paid = Math.min(totalPrice, Math.max(0, parseFloat(paid_amount) || 0));

    let paymentStatus = 'unpaid';
    if (paid >= totalPrice) {
      paymentStatus = 'paid';
    } else if (paid > 0) {
      paymentStatus = 'partial';
    }

    const insertRes = await client.query(
      `INSERT INTO booklet_reservations (
        reservation_number, student_id, item_id, group_id, quantity,
        unit_price, total_price, paid_amount, payment_status, delivery_status,
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'reserved', $10)
      RETURNING *`,
      [
        resNumber, student_id, item_id, group_id || null, qty,
        unitPrice, totalPrice, paid, paymentStatus, notes
      ]
    );

    // If money collected, log to treasury under booklet sales
    if (paid > 0) {
      await client.query(
        `INSERT INTO treasury_transactions (
          transaction_type, amount, reference_id, notes, recorded_by
        ) VALUES ('booklet_reservation_deposit', $1, $2, $3, $4)`,
        [
          paid,
          insertRes.rows[0].id,
          `عربون/حجز ملزمة: ${item.name} للطالب ${student.full_name} (#${student.student_code})`,
          req.user.id
        ]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: `تم حجز الملزمة بنجاح برقم: ${resNumber}`,
      data: insertRes.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * PUT /api/booklets/reservations/:id/deliver
 * Hand over booklet to student & collect remaining payment
 */
const deliverReservation = async (req, res, next) => {
  const client = await db.getClient();
  try {
    const { id } = req.params;
    const rawCollect = req.body.collect_amount !== undefined ? req.body.collect_amount : req.body.collected_remaining;
    const collectedNow = Math.max(0, parseFloat(rawCollect) || 0);

    await client.query('BEGIN');

    const resCheck = await client.query(
      `SELECT br.*, i.name as item_name, i.current_stock, s.full_name as student_name, s.student_code
       FROM booklet_reservations br
       JOIN inventory_items i ON i.id = br.item_id
       JOIN students s ON s.id = br.student_id
       WHERE br.id = $1`,
      [id]
    );
    if (resCheck.rows.length === 0) throw new NotFoundError('الحجز');
    const reservation = resCheck.rows[0];

    if (reservation.delivery_status === 'delivered') {
      return res.status(400).json({ success: false, message: 'تم تسليم هذه الملزمة مسبقاً' });
    }

    const totalPrice = parseFloat(reservation.total_price);
    const prevPaid = parseFloat(reservation.paid_amount || 0);
    const maxPayable = Math.max(0, totalPrice - prevPaid);

    if (collectedNow > maxPayable + 0.001) {
      return res.status(400).json({
        success: false,
        message: `المبلغ المدخل (${collectedNow} ج.م) أكبر من المبلغ المتبقي على الحجز (${maxPayable} ج.م)`,
      });
    }

    const newPaid = prevPaid + collectedNow;
    let newPaymentStatus = reservation.payment_status;
    if (newPaid >= totalPrice) {
      newPaymentStatus = 'paid';
    } else if (newPaid > 0) {
      newPaymentStatus = 'partial';
    }

    // Update reservation
    const updateRes = await client.query(
      `UPDATE booklet_reservations SET
        delivery_status = 'delivered',
        delivered_at = NOW(),
        paid_amount = $1,
        payment_status = $2,
        updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [newPaid, newPaymentStatus, id]
    );

    // Decrement stock from inventory
    await client.query(
      `UPDATE inventory_items 
       SET current_stock = GREATEST(0, current_stock - $1), updated_at = NOW() 
       WHERE id = $2`,
      [reservation.quantity, reservation.item_id]
    );

    // If money collected now, log transaction
    if (collectedNow > 0) {
      await client.query(
        `INSERT INTO treasury_transactions (
          transaction_type, amount, reference_id, notes, recorded_by
        ) VALUES ('booklet_delivery_payment', $1, $2, $3, $4)`,
        [
          collectedNow,
          id,
          `تحصيل باقي تسليم ملزمة: ${reservation.item_name} للطالب ${reservation.student_name} (#${reservation.student_code})`,
          req.user.id
        ]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `تم تسليم الملزمة بنجاح للطالب: ${reservation.student_name}`,
      data: updateRes.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * DELETE /api/booklets/reservations/:id/cancel
 * Cancel a booklet reservation
 */
const cancelReservation = async (req, res, next) => {
  const client = await db.getClient();
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    const resCheck = await client.query(
      `SELECT br.*, i.name as item_name, s.full_name as student_name, s.student_code
       FROM booklet_reservations br
       JOIN inventory_items i ON i.id = br.item_id
       JOIN students s ON s.id = br.student_id
       WHERE br.id = $1 AND br.delivery_status = 'reserved'`,
      [id]
    );

    if (resCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'لا يمكن إلغاء حجز مسلم أو غير موجود' });
    }

    const reservation = resCheck.rows[0];

    await client.query(
      `UPDATE booklet_reservations 
       SET delivery_status = 'cancelled', updated_at = NOW() 
       WHERE id = $1`,
      [id]
    );

    const paidDeposit = parseFloat(reservation.paid_amount) || 0;
    if (paidDeposit > 0) {
      await client.query(
        `INSERT INTO treasury_transactions (
          transaction_type, amount, reference_id, notes, recorded_by
        ) VALUES ('cash_out', $1, $2, $3, $4)`,
        [
          -paidDeposit,
          id,
          `استرداد عربون حجز ملزمة ملغي: ${reservation.item_name} للطالب ${reservation.student_name} (#${reservation.student_code})`,
          req.user.id
        ]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: paidDeposit > 0
        ? `تم إلغاء الحجز واسترداد العربون (${paidDeposit} ج.م) بنجاح`
        : 'تم إلغاء الحجز بنجاح',
      data: { refundedAmount: paidDeposit },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * GET /api/booklets/treasury-stats
 * Booklets Desk Financial & Stock Summary
 */
const getBookletsTreasuryStats = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Total collected today from booklets
    const todayRes = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as today_cash
       FROM treasury_transactions
       WHERE transaction_type IN ('booklet_reservation_deposit', 'booklet_delivery_payment', 'pos_sale')
         AND DATE(created_at) = $1`,
      [today]
    );

    // Total collected this month from booklets
    const monthRes = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as month_cash
       FROM treasury_transactions
       WHERE transaction_type IN ('booklet_reservation_deposit', 'booklet_delivery_payment', 'pos_sale')
         AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)`
    );

    // Counts of reserved vs delivered
    const countsRes = await db.query(
      `SELECT 
        COUNT(*) FILTER (WHERE delivery_status = 'reserved') as pending_count,
        COALESCE(SUM(total_price - paid_amount) FILTER (WHERE delivery_status = 'reserved'), 0) as pending_due_amount,
        COUNT(*) FILTER (WHERE delivery_status = 'delivered') as delivered_count,
        COALESCE(SUM(paid_amount), 0) as total_paid_all_time
       FROM booklet_reservations`
    );

    // Total stock in store
    const stockRes = await db.query(
      `SELECT 
        COUNT(*) as total_items,
        COALESCE(SUM(current_stock), 0) as total_units_in_stock,
        COALESCE(SUM(current_stock * selling_price), 0) as stock_retail_valuation
       FROM inventory_items 
       WHERE category IN ('booklet', 'book') AND is_active = true`
    );

    const todayCashVal = parseFloat(todayRes.rows[0]?.today_cash || 0);
    const monthCashVal = parseFloat(monthRes.rows[0]?.month_cash || 0);
    const pendingCountVal = parseInt(countsRes.rows[0]?.pending_count || 0, 10);
    const pendingDueVal = parseFloat(countsRes.rows[0]?.pending_due_amount || 0);
    const deliveredCountVal = parseInt(countsRes.rows[0]?.delivered_count || 0, 10);

    res.json({
      success: true,
      data: {
        todayCash: todayCashVal,
        todayCollected: todayCashVal,
        monthCash: monthCashVal,
        monthCollected: monthCashVal,
        pendingReservations: pendingCountVal,
        pendingReservationsCount: pendingCountVal,
        pendingDueAmount: pendingDueVal,
        pendingReceivables: pendingDueVal,
        deliveredReservations: deliveredCountVal,
        deliveredReservationsCount: deliveredCountVal,
        totalItemsCount: parseInt(stockRes.rows[0]?.total_items || 0, 10),
        totalUnitsInStock: parseInt(stockRes.rows[0]?.total_units_in_stock || 0, 10),
        stockValuation: parseFloat(stockRes.rows[0]?.stock_retail_valuation || 0),
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listBooklets,
  createBooklet,
  updateBooklet,
  listReservations,
  createReservation,
  deliverReservation,
  cancelReservation,
  getBookletsTreasuryStats,
};
