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
         COALESCE(g.sessions_per_month, 4) as sessions_per_month,
         sub.id as subject_id,
         sub.name_ar as subject_name,
         sub.color as subject_color,
         t.id as teacher_id,
         t.full_name as teacher_name,
         cr.name as classroom_name,
          -- Subscription aggregations / latest active
          COALESCE(s_sub.id, NULL) as subscription_id,
          COALESCE((
            SELECT SUM(ss_tot.total_sessions)
            FROM student_subscriptions ss_tot
            WHERE ss_tot.student_id = $1 AND ss_tot.group_id = g.id AND ss_tot.status = 'active'
          ), s_sub.total_sessions, 0) as total_sessions,
          COALESCE((
            SELECT SUM(ss_used.used_sessions)
            FROM student_subscriptions ss_used
            WHERE ss_used.student_id = $1 AND ss_used.group_id = g.id AND ss_used.status = 'active'
          ), s_sub.used_sessions, 0) as used_sessions,
          COALESCE((
            SELECT SUM(ss_rem.remaining_sessions)
            FROM student_subscriptions ss_rem
            WHERE ss_rem.student_id = $1 AND ss_rem.group_id = g.id AND ss_rem.status = 'active'
          ), s_sub.remaining_sessions, 0) as remaining_sessions,
          COALESCE((
            SELECT SUM(ss_paid.amount_paid)
            FROM student_subscriptions ss_paid
            WHERE ss_paid.student_id = $1 AND ss_paid.group_id = g.id AND ss_paid.status = 'active'
          ), s_sub.amount_paid, 0) as active_amount_paid,
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
          s_sub.starts_at,
          s_sub.expires_at,
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
       WHERE ge.student_id = $1 AND ge.is_active = true
      ORDER BY g.name ASC`,
      [student.id, currentMonth]
    );

    // 2.1 Fetch active package enrollments for student
    const pkgEnrollmentsRes = await db.query(
      `SELECT spe.*, gp.name as package_name, gp.package_price, gp.single_subject_price,
              gp.grade_id, ag.name_ar as grade_name
       FROM student_package_enrollments spe
       JOIN grade_packages gp ON spe.package_id = gp.id
       JOIN academic_grades ag ON gp.grade_id = ag.id
       WHERE spe.student_id = $1 AND (spe.status = 'active' OR spe.status IS NULL)
       ORDER BY spe.enrolled_at DESC`,
      [student.id]
    );

    const todayIso = new Date().toISOString().slice(0, 10);

    const packageEnrollments = pkgEnrollmentsRes.rows.map(spe => {
      const groupIds = spe.selected_group_ids || [];
      const packageGroups = groupsRes.rows.filter(g => groupIds.includes(g.group_id));

      let totalSessions = 0;
      let usedSessions = 0;
      let remainingSessions = 0;
      let totalAmountDue = 0;
      let totalAmountPaid = 0;

      packageGroups.forEach(g => {
        totalSessions += parseInt(g.total_sessions || 0, 10);
        usedSessions += parseInt(g.used_sessions || 0, 10);
        remainingSessions += Math.max(0, parseInt(g.remaining_sessions || 0, 10));
        totalAmountDue += parseFloat(g.amount_due || 0);
        totalAmountPaid += parseFloat(g.active_amount_paid !== undefined ? g.active_amount_paid : g.amount_paid || 0);
      });

      totalAmountDue = Math.round(totalAmountDue * 100) / 100;
      totalAmountPaid = Math.round(totalAmountPaid * 100) / 100;

      const netPrice = parseFloat(spe.total_price || 0);
      const spePaid = parseFloat(spe.amount_paid || 0);
      if (spePaid > 0) {
        totalAmountPaid = spePaid;
      } else if (totalAmountDue <= 0.01 && totalAmountPaid > 0) {
        totalAmountPaid = netPrice;
      }
      if (parseFloat(spe.amount_due || 0) > 0 && totalAmountDue === 0) {
        totalAmountDue = parseFloat(spe.amount_due);
      }

      // Day-based package duration calculations (شهر كامل 30 يوم أو عدد أيام مخصص مثل 10 أو 15 يوم)
      const durationDays = Math.max(1, parseInt(spe.duration_days, 10) || 30);
      const startDateStr = spe.start_date
        ? new Date(spe.start_date).toISOString().slice(0, 10)
        : new Date(spe.enrolled_at || Date.now()).toISOString().slice(0, 10);
      let endDateStr = spe.end_date
        ? new Date(spe.end_date).toISOString().slice(0, 10)
        : null;
      if (!endDateStr) {
        const sObj = new Date(startDateStr + 'T12:00:00Z');
        sObj.setUTCDate(sObj.getUTCDate() + Math.max(0, durationDays - 1));
        endDateStr = sObj.toISOString().slice(0, 10);
      }

      const startMs = new Date(startDateStr + 'T00:00:00Z').getTime();
      const todayMs = new Date(todayIso + 'T00:00:00Z').getTime();
      const rawElapsedDays = Math.floor((todayMs - startMs) / (1000 * 60 * 60 * 24));
      // If student hasn't attended any session and enrolled today, elapsed days is 0
      const usedDays = usedSessions === 0 && rawElapsedDays <= 0
        ? 0
        : Math.min(durationDays, Math.max(0, rawElapsedDays));
      const remainingDays = Math.max(0, durationDays - usedDays);

      const dailyRate = durationDays > 0 ? (netPrice / durationDays) : 0;
      const effectiveSessionPrice = totalSessions > 0 ? (netPrice / totalSessions) : 0;

      // Consumed value by days (or 0 if 0 days & 0 sessions used)
      const consumedValueByDays = Math.round(usedDays * dailyRate);
      const remainingValue = Math.max(0, Math.round(netPrice - consumedValueByDays));
      // Refundable amount is strictly capped at totalAmountPaid (student never gets back more than paid!)
      const refundableAmount = Math.max(
        0,
        Math.min(totalAmountPaid, Math.round(totalAmountPaid - consumedValueByDays))
      );

      return {
        ...spe,
        start_date: startDateStr,
        end_date: endDateStr,
        duration_days: durationDays,
        used_days: usedDays,
        remaining_days: remainingDays,
        daily_rate: dailyRate.toFixed(2),
        groups: packageGroups,
        total_sessions: totalSessions,
        used_sessions: usedSessions,
        remaining_sessions: remainingSessions,
        total_amount_due: totalAmountDue,
        total_amount_paid: totalAmountPaid,
        effective_session_price: effectiveSessionPrice.toFixed(2),
        remaining_value: remainingValue,
        refundable_amount: refundableAmount,
      };
    });

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

    totalPaid = Math.round(totalPaid * 100) / 100;
    totalDue = Math.round(totalDue * 100) / 100;

    res.json({
      success: true,
      data: {
        student,
        packageEnrollments,
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

    // Business rule: Disallow renewing a single subject if enrolled as PACKAGE
    if (
      finalEnrollmentType === 'PACKAGE' ||
      (enrollCheck.rows.length > 0 && enrollCheck.rows[0].enrollment_type === 'PACKAGE')
    ) {
      throw new BadRequestError('لا يمكن تجديد مادة منفردة تابعة للباكدج. يجب تصفية الباكدج بالكامل أولاً ثم إعادة الاشتراك في الباكدج من جديد.');
    }

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
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const {
      student_id,
      group_id,
      enrollment_type = 'PRIVATE',
      discount_type = 'FIXED',
      discount_value = 0,
      sessions_count = 0,
      amount_paid = 0,
      billing_month,
      notes,
    } = req.body;

    if (!student_id || !group_id) {
      throw new BadRequestError('معرف الطالب والمجموعة مطلوبان');
    }
    const finalEnrollmentType = enrollment_type === 'PACKAGE' ? 'PACKAGE' : 'PRIVATE';
    const discType = discount_type === 'PERCENT' ? 'PERCENT' : 'FIXED';
    const discVal = Math.max(0, parseFloat(discount_value) || 0);

    // Fetch group details for pricing
    const groupRes = await client.query('SELECT * FROM groups WHERE id = $1', [group_id]);
    if (groupRes.rows.length === 0) {
      throw new NotFoundError('المجموعة غير موجودة');
    }
    const group = groupRes.rows[0];

    const studentRes = await client.query('SELECT full_name, student_code FROM students WHERE id = $1', [student_id]);
    const student = studentRes.rows[0];

    const check = await client.query(
      `SELECT id, is_active, enrollment_type FROM group_enrollments WHERE student_id = $1 AND group_id = $2`,
      [student_id, group_id]
    );

    let enrollmentId;
    if (check.rows.length > 0) {
      enrollmentId = check.rows[0].id;
      if (!check.rows[0].is_active) {
        await client.query(
          `UPDATE group_enrollments 
           SET is_active = true, enrollment_type = $1, discount_type = $2, discount_value = $3 
           WHERE id = $4`,
          [finalEnrollmentType, discType, discVal, enrollmentId]
        );
      } else {
        await client.query(
          `UPDATE group_enrollments 
           SET enrollment_type = $1, discount_type = $2, discount_value = $3 
           WHERE id = $4`,
          [finalEnrollmentType, discType, discVal, enrollmentId]
        );
      }
    } else {
      const ins = await client.query(
        `INSERT INTO group_enrollments (student_id, group_id, enrollment_type, is_active, discount_type, discount_value) 
         VALUES ($1, $2, $3, true, $4, $5)
         RETURNING id`,
        [student_id, group_id, finalEnrollmentType, discType, discVal]
      );
      enrollmentId = ins.rows[0].id;
    }

    // If initial sessions are requested, create subscription
    const sessionsNum = parseInt(sessions_count, 10) || 0;
    if (sessionsNum > 0) {
      const grossCharge = parseFloat(group.price_per_month) || 0;
      const discountAmount = discType === 'PERCENT'
        ? Math.min(grossCharge, Math.round((grossCharge * discVal) / 100))
        : Math.min(grossCharge, discVal);
      const netCharge = Math.max(0, grossCharge - discountAmount);
      const paidNum = Math.min(netCharge, Math.max(0, parseFloat(amount_paid) || 0));
      const dueNum = Math.max(0, netCharge - paidNum);
      const month = billing_month || new Date().toISOString().slice(0, 7);

      const subRes = await client.query(
        `INSERT INTO student_subscriptions (
          student_id, group_id, total_sessions, used_sessions,
          amount_paid, amount_due, status, billing_month, enrollment_type,
          discount_type, discount_value, notes
        ) VALUES ($1, $2, $3, 0, $4, $5, 'active', $6, $7, $8, $9, $10)
        RETURNING id`,
        [
          student_id,
          group_id,
          sessionsNum,
          paidNum,
          dueNum,
          month,
          finalEnrollmentType,
          discType,
          discVal,
          notes || `قيد وشحن مبدئي - مجموعة: ${group.name}`,
        ]
      );

      if (paidNum > 0) {
        await client.query(
          `INSERT INTO treasury_transactions 
           (transaction_type, amount, reference_id, notes, recorded_by)
           VALUES ('subscription_fee', $1, $2, $3, $4)`,
          [
            paidNum,
            subRes.rows[0].id,
            `تحصيل اشتراك مجموعة خاصة (${paidNum} ج.م) - الطالب: ${student?.full_name || student_id}`,
            req.user.id,
          ]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, message: 'تم قيد الطالب في المجموعة وتحديث الحساب بنجاح' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
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
    const grpRes = await client.query(`SELECT name, name_ar, price_per_month, price_per_session, COALESCE(sessions_per_month, 4) as sessions_per_month FROM groups WHERE id = $1`, [group_id]);
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
      const defaultSessions = Math.max(1, parseInt(groupRow.sessions_per_month, 10) || 4);
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

    const groupRes = await client.query(
      'SELECT name, name_ar, price_per_session, price_per_month, COALESCE(sessions_per_month, 4) as sessions_per_month FROM groups WHERE id = $1',
      [group_id]
    );
    const groupRow = groupRes.rows[0] || {};
    const groupName = groupRow.name_ar || groupRow.name || 'المجموعة';
    const groupSessionsPerMonth = Math.max(1, parseInt(groupRow.sessions_per_month, 10) || 4);

    // 2. Fetch student's persistent discount & all subscriptions for this group FIRST
    const enrollRes = await client.query(
      `SELECT discount_type, discount_value FROM group_enrollments WHERE student_id = $1 AND group_id = $2`,
      [student_id, group_id]
    );

    const allSubsRes = await client.query(
      `SELECT * FROM student_subscriptions
       WHERE student_id = $1 AND group_id = $2
       ORDER BY created_at DESC`,
      [student_id, group_id]
    );

    if (allSubsRes.rows.length === 0) {
      throw new BadRequestError('لا يوجد اشتراك مسجل لهذا الطالب في هذه المجموعة لتصفيته');
    }

    // Aggregate active subscriptions & total debt
    let totalActiveSessions = 0;
    let totalUsedSessions = 0;
    let totalClearedSessions = 0;
    let totalActivePaid = 0;
    let totalCurrentDebt = 0;

    allSubsRes.rows.forEach(sub => {
      if (sub.status === 'active') {
        totalActiveSessions += Math.max(0, parseInt(sub.total_sessions, 10) || 0);
        totalUsedSessions += Math.max(0, parseInt(sub.used_sessions, 10) || 0);
        totalClearedSessions += Math.max(0, parseInt(sub.remaining_sessions, 10) || 0);
        totalActivePaid += Math.max(0, parseFloat(sub.amount_paid || 0));
      }
      totalCurrentDebt += Math.max(0, parseFloat(sub.amount_due || 0));
    });

    if (totalClearedSessions === 0 && totalCurrentDebt === 0) {
      throw new BadRequestError('لا توجد حصص متبقية أو مديونية مستحقة لتصفية الحساب في هذه المجموعة');
    }

    const totalAgreedPrice = totalActivePaid + totalCurrentDebt;

    // Exact session rate without premature rounding (so 310 / 4 = 77.5, never 78 * 4 = 312!)
    let exactSessionRate = 0;
    if (totalActiveSessions > 0 && totalAgreedPrice > 0) {
      exactSessionRate = totalAgreedPrice / totalActiveSessions;
    } else {
      const baseSessionRate =
        parseFloat(groupRow.price_per_session) > 0
          ? parseFloat(groupRow.price_per_session)
          : parseFloat(groupRow.price_per_month) > 0
          ? parseFloat(groupRow.price_per_month) / groupSessionsPerMonth
          : 0;
      const dType = enrollRes.rows[0]?.discount_type || allSubsRes.rows[0]?.discount_type || 'FIXED';
      const dVal = parseFloat(enrollRes.rows[0]?.discount_value ?? allSubsRes.rows[0]?.discount_value ?? 0);
      let sessionDiscount = 0;
      if (dType === 'PERCENT' && dVal > 0) {
        sessionDiscount = (baseSessionRate * Math.min(100, dVal)) / 100;
      } else if (dType === 'FIXED' && dVal > 0) {
        sessionDiscount = dVal / groupSessionsPerMonth;
      }
      exactSessionRate = Math.max(0, baseSessionRate - sessionDiscount);
    }

    const consumedValue = Math.round(totalUsedSessions * exactSessionRate);
    const grossSessionsValue =
      totalUsedSessions === 0 && totalAgreedPrice > 0
        ? Math.round(totalAgreedPrice)
        : Math.max(0, Math.round(totalClearedSessions * exactSessionRate));

    // Hard accounting rule: Refund can NEVER exceed what the student actually paid (totalActivePaid)!
    const maxAllowedRefund = Math.max(
      0,
      Math.min(totalActivePaid, Math.round(totalActivePaid - consumedValue))
    );

    if (refundNum > maxAllowedRefund + 0.01) {
      throw new BadRequestError(
        `مبلغ الاسترداد (${refundNum} ج.م) يتجاوز صافي المستحق للطالب (${maxAllowedRefund} ج.م) — إجمالي ما دفعه الطالب فعلياً هو ${totalActivePaid} ج.م والمستهلك ${totalUsedSessions} حصة (${consumedValue} ج.م)`
      );
    }

    // Remaining debt if student consumed more than they paid
    let remainingDebtAfterClearance = Math.max(0, consumedValue - totalActivePaid);

    // Expire active subscriptions, reset total_sessions = used_sessions, and deduct refunded cash from amount_paid
    let remainingRefundToDeduct = refundNum;
    for (let i = 0; i < allSubsRes.rows.length; i++) {
      const sub = allSubsRes.rows[i];
      const subDebt = i === 0 ? remainingDebtAfterClearance : 0;
      const curPaid = Math.max(0, parseFloat(sub.amount_paid || 0));
      const deductFromThis = sub.status === 'active' ? Math.min(curPaid, remainingRefundToDeduct) : 0;
      remainingRefundToDeduct = Math.max(0, remainingRefundToDeduct - deductFromThis);
      const updatedPaid = Math.max(0, curPaid - deductFromThis);

      await client.query(
        `UPDATE student_subscriptions
         SET total_sessions = used_sessions,
             amount_paid = $1,
             amount_due = $2,
             status = 'expired',
             notes = COALESCE($3, notes),
             updated_at = NOW()
         WHERE id = $4`,
        [
          updatedPaid,
          subDebt,
          `تصفية حساب: رصيد ${totalClearedSessions} حصص متبقية، المستهلك ${totalUsedSessions} حصص (${consumedValue} ج.م)، صافي مسترد ${refundNum} ج.م. ${notes || ''}`.trim(),
          sub.id,
        ]
      );
    }

    // 3. Drop/unenroll student from group by default so they never stay with 0 sessions
    const shouldDrop = drop_group !== false;
    if (shouldDrop) {
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
      message: `تمت تصفية الحساب بنجاح وإلغاء قيد الطالب من المجموعة (استرداد صافي ${refundNum} ج.م بعد خصم مديونية ${totalCurrentDebt} ج.م من قيمة ${totalClearedSessions} حصص)`,
      data: {
        clearedSessions: totalClearedSessions,
        grossSessionsValue,
        currentDebt: totalCurrentDebt,
        refundAmount: refundNum,
        remainingDebtAfterClearance,
        groupDropped: true
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
 * POST /api/subscriptions/clear-package
 * Clear student's entire package enrollment, refund remaining days/balance at package rate,
 * unenroll student from all groups in package, and record treasury refund.
 */
const clearPackageEnrollment = async (req, res, next) => {
  const client = await db.getClient();
  try {
    const { package_enrollment_id, notes, refund_amount, drop_groups } = req.body;
    const userId = req.user.id;

    if (!package_enrollment_id) {
      throw new BadRequestError('معرف قيد الباكدج مطلوب');
    }

    await client.query('BEGIN');

    // 1. Fetch package enrollment
    const pkgEnrollRes = await client.query(
      `SELECT spe.*, s.full_name as student_name, s.student_code, gp.name as package_name
       FROM student_package_enrollments spe
       JOIN students s ON spe.student_id = s.id
       JOIN grade_packages gp ON spe.package_id = gp.id
       WHERE spe.id = $1`,
      [package_enrollment_id]
    );

    if (pkgEnrollRes.rows.length === 0) {
      throw new NotFoundError('قيد الباكدج غير موجود');
    }

    const pkgEnroll = pkgEnrollRes.rows[0];
    const groupIds = pkgEnroll.selected_group_ids || [];

    // 2. Fetch active subscriptions for these groups
    const subsRes = await client.query(
      `SELECT ss.*, g.name as group_name
       FROM student_subscriptions ss
       JOIN groups g ON ss.group_id = g.id
       WHERE ss.student_id = $1 AND ss.group_id = ANY($2::uuid[])`,
      [pkgEnroll.student_id, groupIds]
    );

    let totalSessions = 0;
    let usedSessions = 0;
    let remainingSessions = 0;
    let totalDebt = 0;
    let totalSubsPaid = 0;

    subsRes.rows.forEach(sub => {
      if (sub.status === 'active') {
        totalSessions += parseInt(sub.total_sessions || 0, 10);
        usedSessions += parseInt(sub.used_sessions || 0, 10);
        remainingSessions += Math.max(0, parseInt(sub.remaining_sessions || 0, 10));
        totalSubsPaid += Math.max(0, parseFloat(sub.amount_paid || 0));
      }
      totalDebt += Math.max(0, parseFloat(sub.amount_due || 0));
    });

    const netPrice = parseFloat(pkgEnroll.total_price || 0);
    const actualCashPaid =
      parseFloat(pkgEnroll.amount_paid || 0) > 0
        ? parseFloat(pkgEnroll.amount_paid)
        : totalSubsPaid > 0
        ? totalSubsPaid
        : Math.max(0, netPrice - totalDebt);

    // Day-based calculation
    const durationDays = Math.max(1, parseInt(pkgEnroll.duration_days, 10) || 30);
    const todayIso = new Date().toISOString().slice(0, 10);
    const startDateStr = pkgEnroll.start_date
      ? new Date(pkgEnroll.start_date).toISOString().slice(0, 10)
      : new Date(pkgEnroll.enrolled_at || Date.now()).toISOString().slice(0, 10);
    const startMs = new Date(startDateStr + 'T00:00:00Z').getTime();
    const todayMs = new Date(todayIso + 'T00:00:00Z').getTime();
    const rawElapsedDays = Math.floor((todayMs - startMs) / (1000 * 60 * 60 * 24));
    const usedDays =
      usedSessions === 0 && rawElapsedDays <= 0
        ? 0
        : Math.min(durationDays, Math.max(0, rawElapsedDays));
    const remainingDays = Math.max(0, durationDays - usedDays);
    const dailyRate = durationDays > 0 ? netPrice / durationDays : 0;

    // Hard cap: Refund can NEVER exceed actualCashPaid (what the student actually paid!)
    const maxRefund = Math.max(0, Math.round(actualCashPaid));

    const actualRefund =
      refund_amount !== undefined && refund_amount !== null && refund_amount !== ''
        ? Math.min(maxRefund, Math.max(0, parseFloat(refund_amount) || 0))
        : Math.max(0, Math.min(maxRefund, Math.round(actualCashPaid - usedDays * dailyRate)));

    // 3. Deactivate group_enrollments if requested (default true)
    const shouldDropGroups = drop_groups !== false;
    if (shouldDropGroups) {
      await client.query(
        `UPDATE group_enrollments 
         SET is_active = false, updated_at = NOW() 
         WHERE student_id = $1 AND group_id = ANY($2::uuid[])`,
        [pkgEnroll.student_id, groupIds]
      );
    }

    // 4. Clear/expire active subscriptions for these groups and deduct refunded amount proportionally
    let remainingRefundCents = Math.round(actualRefund * 100);
    const activeSubs = subsRes.rows.filter(s => s.status === 'active');
    for (let i = 0; i < activeSubs.length; i++) {
      const sub = activeSubs[i];
      const curPaidCents = Math.round(Math.max(0, parseFloat(sub.amount_paid || 0)) * 100);
      const countLeft = activeSubs.length - i;
      const deductCents = Math.min(
        curPaidCents,
        i === activeSubs.length - 1
          ? remainingRefundCents
          : Math.round(remainingRefundCents / countLeft)
      );
      remainingRefundCents = Math.max(0, remainingRefundCents - deductCents);
      const newSubPaid = ((curPaidCents - deductCents) / 100).toFixed(2);

      await client.query(
        `UPDATE student_subscriptions
         SET total_sessions = used_sessions,
             amount_paid = $1,
             amount_due = 0,
             status = 'expired',
             notes = COALESCE($2, notes),
             updated_at = NOW()
         WHERE id = $3`,
        [
          newSubPaid,
          `تمت تصفية الباكدج بالكامل (المدة المتبقية: ${remainingDays} يوم من ${durationDays} يوم — المسترد: ${actualRefund} ج.م). ${notes || ''}`.trim(),
          sub.id,
        ]
      );
    }

    // Also expire any non-active/unpaid records in those groups
    await client.query(
      `UPDATE student_subscriptions 
       SET total_sessions = used_sessions,
           status = 'expired',
           amount_due = 0,
           updated_at = NOW()
       WHERE student_id = $1 AND group_id = ANY($2::uuid[]) AND status != 'expired'`,
      [pkgEnroll.student_id, groupIds]
    );

    // 5. Update package enrollment status to 'cleared' and adjust amount_paid
    const updatedPkgPaid = Math.max(0, actualCashPaid - actualRefund);
    await client.query(
      `UPDATE student_package_enrollments 
       SET status = 'cleared',
           amount_paid = $2,
           amount_due = 0,
           notes = COALESCE(notes || ' - ', '') || 'تمت تصفية الباكدج بتاريخ ' || NOW()::date || ' (المسترد: ' || $3 || ' ج.م)'
       WHERE id = $1`,
      [package_enrollment_id, updatedPkgPaid, actualRefund]
    );

    // 6. Record treasury outflow if refund > 0
    if (actualRefund > 0) {
      await client.query(
        `INSERT INTO treasury_transactions
         (transaction_type, amount, reference_id, notes, recorded_by)
         VALUES ('cash_out', $1, $2, $3, $4)`,
        [
          -Math.abs(actualRefund),
          package_enrollment_id,
          `استرداد تصفية باكدج (${actualRefund} ج.م) - الطالب: ${pkgEnroll.student_name} (#${pkgEnroll.student_code}) - متبقي ${remainingDays} يوم من ${durationDays} يوم`,
          userId,
        ]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `تمت تصفية الباكدج بنجاح وإلغاء قيد الطالب من ${groupIds.length} مجموعة واسترداد ${actualRefund} ج.م`,
      data: {
        package_enrollment_id,
        clearedGroupsCount: groupIds.length,
        durationDays,
        usedDays,
        remainingDays,
        dailyRate: dailyRate.toFixed(2),
        totalSessions,
        usedSessions,
        remainingSessions,
        totalDebt,
        refundAmount: actualRefund,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * POST /api/subscriptions/renew-package
 * Recharge / Renew an existing package enrollment by full month (30 days: day 1 to 30)
 * or by any custom number of days (e.g. 10 days, 15 days) or pay off package debt.
 */
const renewPackageEnrollment = async (req, res, next) => {
  const client = await db.getClient();
  try {
    const {
      package_enrollment_id,
      duration_days = 30,
      start_date,
      end_date,
      total_charge,
      discount_type = 'FIXED',
      discount_value = 0,
      amount_paid = 0,
      billing_month,
      pay_debt_only = false,
      notes,
    } = req.body;
    const userId = req.user.id;

    if (!package_enrollment_id) {
      throw new BadRequestError('معرف قيد الباكدج مطلوب');
    }

    await client.query('BEGIN');

    const pkgEnrollRes = await client.query(
      `SELECT spe.*, s.full_name as student_name, s.student_code,
              gp.name as package_name, gp.package_price, gp.single_subject_price
       FROM student_package_enrollments spe
       JOIN students s ON spe.student_id = s.id
       JOIN grade_packages gp ON spe.package_id = gp.id
       WHERE spe.id = $1`,
      [package_enrollment_id]
    );

    if (pkgEnrollRes.rows.length === 0) {
      throw new NotFoundError('قيد الباكدج غير موجود');
    }

    const spe = pkgEnrollRes.rows[0];
    const groupIds = spe.selected_group_ids || [];

    // Fetch groups in package to know sessions_per_month
    const groupsRes = await client.query(
      `SELECT id, name, COALESCE(sessions_per_month, 4) as sessions_per_month
       FROM groups
       WHERE id = ANY($1::uuid[])`,
      [groupIds]
    );
    const groupMap = new Map(groupsRes.rows.map(g => [g.id, g]));

    // Fetch existing active subscriptions for these groups
    const subsRes = await client.query(
      `SELECT * FROM student_subscriptions
       WHERE student_id = $1 AND group_id = ANY($2::uuid[]) AND status = 'active'
       ORDER BY created_at DESC`,
      [spe.student_id, groupIds]
    );

    let existingDebt = 0;
    subsRes.rows.forEach(s => {
      existingDebt += Math.max(0, parseFloat(s.amount_due || 0));
    });
    if (existingDebt === 0 && parseFloat(spe.amount_due || 0) > 0) {
      existingDebt = parseFloat(spe.amount_due);
    }
    existingDebt = Math.round(existingDebt * 100) / 100;

    // Mode A: Pay existing package debt only without adding new days
    if (pay_debt_only) {
      const paidNum = Math.max(0, parseFloat(amount_paid) || 0);
      if (paidNum <= 0) {
        throw new BadRequestError('يرجى إدخال مبلغ أكبر من الصفر لسداد مديونية الباكدج');
      }
      if (paidNum > existingDebt + 0.01) {
        throw new BadRequestError(`المبلغ المدفوع (${paidNum} ج.م) أكبر من مديونية الباكدج المستحقة (${existingDebt} ج.م)`);
      }

      let remToPayCents = Math.round(paidNum * 100);
      const debtSubs = subsRes.rows.filter(s => parseFloat(s.amount_due || 0) > 0);
      for (let i = 0; i < debtSubs.length; i++) {
        if (remToPayCents <= 0) break;
        const sub = debtSubs[i];
        const subDueCents = Math.round(parseFloat(sub.amount_due || 0) * 100);
        const payCents = Math.min(subDueCents, remToPayCents);
        remToPayCents -= payCents;

        await client.query(
          `UPDATE student_subscriptions
           SET amount_paid = amount_paid + $1,
               amount_due = GREATEST(0, amount_due - $1),
               updated_at = NOW()
           WHERE id = $2`,
          [(payCents / 100).toFixed(2), sub.id]
        );
      }

      const newPkgDue = Math.max(0, existingDebt - paidNum);
      await client.query(
        `UPDATE student_package_enrollments
         SET amount_paid = COALESCE(amount_paid, 0) + $1,
             amount_due = $2
         WHERE id = $3`,
        [paidNum, newPkgDue, package_enrollment_id]
      );

      await client.query(
        `INSERT INTO treasury_transactions
         (transaction_type, amount, reference_id, notes, recorded_by)
         VALUES ('subscription_fee', $1, $2, $3, $4)`,
        [
          paidNum,
          package_enrollment_id,
          notes || `سداد مديونية باكدج (${paidNum} ج.م) - الطالب: ${spe.student_name} (#${spe.student_code}) - المتبقي: ${newPkgDue} ج.م`,
          userId,
        ]
      );

      await client.query('COMMIT');
      return res.json({
        success: true,
        message: `تم سداد ${paidNum} ج.م من مديونية الباكدج بنجاح (المتبقي: ${newPkgDue} ج.م)`,
        data: { package_enrollment_id, amountPaid: paidNum, remainingDebt: newPkgDue },
      });
    }

    // Mode B: Recharge / Renew Package for duration_days (e.g. 30 days full month, 15 days, 10 days)
    const daysToAdd = Math.max(1, parseInt(duration_days, 10) || 30);
    const todayStr = new Date().toISOString().slice(0, 10);
    const resolvedStartDate = start_date || todayStr;
    let resolvedEndDate = end_date;
    if (!resolvedEndDate) {
      const sObj = new Date(resolvedStartDate + 'T12:00:00Z');
      sObj.setUTCDate(sObj.getUTCDate() + Math.max(0, daysToAdd - 1));
      resolvedEndDate = sObj.toISOString().slice(0, 10);
    }

    const monthlyBase = parseFloat(spe.package_price || spe.total_price || 0);
    const grossCharge =
      total_charge !== undefined && total_charge !== null && total_charge !== ''
        ? Math.max(0, parseFloat(total_charge) || 0)
        : daysToAdd === 30
        ? monthlyBase
        : Math.round((monthlyBase / 30) * daysToAdd);

    const discType = discount_type === 'PERCENT' ? 'PERCENT' : 'FIXED';
    const discVal = Math.max(0, parseFloat(discount_value) || 0);
    const discountAmount =
      discType === 'PERCENT'
        ? Math.min(grossCharge, Math.round((grossCharge * discVal) / 100))
        : Math.min(grossCharge, discVal);
    const netCharge = Math.max(0, grossCharge - discountAmount);
    const totalLiability = netCharge + existingDebt;

    const paidNum = Math.max(0, parseFloat(amount_paid) || 0);
    if (paidNum > totalLiability + 0.01) {
      throw new BadRequestError(
        `المبلغ المدفوع (${paidNum} ج.م) أكبر من إجمالي المطلوب (${totalLiability} ج.م)`
      );
    }

    const newDueTotal = Math.max(0, totalLiability - paidNum);
    const monthStr = billing_month || resolvedStartDate.slice(0, 7);
    const durationLabel = daysToAdd === 30 ? 'شهر كامل (30 يوم)' : `${daysToAdd} يوم`;

    // Update student_package_enrollments with new period and amounts
    await client.query(
      `UPDATE student_package_enrollments
       SET start_date = $1,
           end_date = $2,
           duration_days = $3,
           gross_price = $4,
           discount_type = $5,
           discount_value = $6,
           total_price = $7,
           amount_paid = $8,
           amount_due = $9,
           billing_month = $10,
           status = 'active',
           notes = COALESCE($11, notes)
       WHERE id = $12`,
      [
        resolvedStartDate,
        resolvedEndDate,
        daysToAdd,
        grossCharge,
        discType,
        discVal,
        netCharge,
        Math.min(netCharge, paidNum),
        newDueTotal,
        monthStr,
        notes || `تجديد وشحن باكدج (${durationLabel}: من ${resolvedStartDate} إلى ${resolvedEndDate}) - الصافي: ${netCharge} ج.م`,
        package_enrollment_id,
      ]
    );

    // Expire old group subscriptions and create/update active subscriptions for the new period
    await client.query(
      `UPDATE student_subscriptions
       SET total_sessions = used_sessions,
           amount_due = 0,
           status = 'expired',
           updated_at = NOW()
       WHERE student_id = $1 AND group_id = ANY($2::uuid[]) AND status = 'active'`,
      [spe.student_id, groupIds]
    );

    let remainingPaidCents = Math.round(Math.min(netCharge, paidNum) * 100);
    let remainingDueCents = Math.round(newDueTotal * 100);

    for (let i = 0; i < groupIds.length; i++) {
      const groupId = groupIds[i];
      const grpInfo = groupMap.get(groupId);
      const grpSessionsPerMonth = Math.max(1, parseInt(grpInfo?.sessions_per_month, 10) || 4);
      const groupSessionsForDuration = Math.max(
        1,
        Math.ceil((grpSessionsPerMonth * daysToAdd) / 30)
      );

      const countLeft = groupIds.length - i;
      const groupPaidCents = Math.round(remainingPaidCents / countLeft);
      const groupDueCents = Math.round(remainingDueCents / countLeft);
      remainingPaidCents -= groupPaidCents;
      remainingDueCents -= groupDueCents;

      await client.query(
        `INSERT INTO student_subscriptions (
          student_id, group_id, total_sessions, used_sessions,
          amount_paid, amount_due, status, billing_month, enrollment_type,
          discount_type, discount_value, starts_at, expires_at, notes
        ) VALUES ($1, $2, $3, 0, $4, $5, 'active', $6, 'PACKAGE', $7, $8, $9, $10, $11)`,
        [
          spe.student_id,
          groupId,
          groupSessionsForDuration,
          (groupPaidCents / 100).toFixed(2),
          (groupDueCents / 100).toFixed(2),
          monthStr,
          discType,
          discVal,
          resolvedStartDate,
          resolvedEndDate,
          `تجديد باكدج (${durationLabel}: ${resolvedStartDate} إلى ${resolvedEndDate}) - ${spe.package_name}`,
        ]
      );
    }

    if (paidNum > 0) {
      await client.query(
        `INSERT INTO treasury_transactions
         (transaction_type, amount, reference_id, notes, recorded_by)
         VALUES ('subscription_fee', $1, $2, $3, $4)`,
        [
          paidNum,
          package_enrollment_id,
          notes || `تحصيل تجديد باكدج (${durationLabel}: ${paidNum} ج.م) - الطالب: ${spe.student_name} (#${spe.student_code})`,
          userId,
        ]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `تم شحن وتجديد الباكدج لمدة (${durationLabel}: من ${resolvedStartDate} إلى ${resolvedEndDate}) بنجاح!`,
      data: {
        package_enrollment_id,
        duration_days: daysToAdd,
        start_date: resolvedStartDate,
        end_date: resolvedEndDate,
        net_charge: netCharge,
        amount_paid: paidNum,
        amount_due: newDueTotal,
      },
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
  clearPackageEnrollment,
  renewPackageEnrollment,
};
