const db = require('../config/db');

/**
 * Attendance Service — The Smart Gate Engine
 * 
 * Core responsibilities:
 * 1. Look up student by barcode (zero-latency)
 * 2. Detect all scheduled sessions for today
 * 3. Auto-detect multi-session scenarios (back-to-back classes)
 * 4. Deduct from package balance or flag for pay-per-session
 * 5. Prevent duplicate scans
 */
class AttendanceService {
  /**
   * Process a barcode scan at the gate
   * @param {string} barcodeId - The scanned barcode value
   * @param {string} scannedByUserId - UUID of the scanning user
   * @returns {Object} Scan result with student info, sessions, and billing status
   */
  static async processScan(barcodeId, scannedByUserId) {
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // 1. Find student by barcode, center student code, or phone — MUST be instant
      const cleanInput = String(barcodeId).trim();
      const asInt = parseInt(cleanInput, 10);
      const isPureInt = !isNaN(asInt) && /^\d+$/.test(cleanInput);

      const studentResult = await client.query(
        `SELECT s.id, s.barcode_id, s.student_code, s.full_name, s.full_name_ar, s.phone,
                s.billing_model, s.photo_url, s.is_active,
                ag.name_ar as grade_name, ag.grade_order,
                ss.name_ar as status_name, ss.discount_percent
         FROM students s
         LEFT JOIN academic_grades ag ON s.grade_id = ag.id
         LEFT JOIN student_statuses ss ON s.status_id = ss.id
         WHERE s.barcode_id = $1
            OR ($2::INTEGER IS NOT NULL AND s.student_code = $2)
            OR s.barcode_id ILIKE $3
            OR s.phone = $1
            OR s.id::text = $1`,
        [cleanInput, isPureInt ? asInt : null, `%-${cleanInput}`]
      );

      if (studentResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return {
          success: false,
          type: 'NOT_FOUND',
          message: `الكود أو الباركود (${cleanInput}) غير مسجل — لا يوجد طالب مرتبط بهذا الرقم`,
        };
      }

      const student = studentResult.rows[0];

      if (!student.is_active) {
        await client.query('ROLLBACK');
        return {
          success: false,
          type: 'INACTIVE',
          message: `الطالب ${student.full_name} غير نشط — الرجاء مراجعة الإدارة`,
          student: {
            id: student.id,
            fullName: student.full_name,
            gradeName: student.grade_name,
          },
        };
      }

      // 2. Get today's day of week and find scheduled groups
      const today = new Date();
      const todayDate = today.toLocaleDateString('en-CA');
      const currentTime = today.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const todayDay = days[today.getDay()];

      // Find all active groups this student is enrolled in that have a session today
      const groupsResult = await client.query(
        `SELECT g.id as group_id, g.name as group_name, g.name_ar as group_name_ar,
                g.schedule, g.price_per_month, g.price_per_session,
                sub.name_ar as subject_name, sub.color as subject_color,
                t.full_name as teacher_name,
                cr.name as classroom_name
         FROM group_enrollments ge
         JOIN groups g ON ge.group_id = g.id
         LEFT JOIN subjects sub ON g.subject_id = sub.id
         LEFT JOIN teachers t ON g.teacher_id = t.id
         LEFT JOIN classrooms cr ON g.classroom_id = cr.id
         WHERE ge.student_id = $1 AND ge.is_active = true AND g.status = 'active'`,
        [student.id]
      );

      // Filter groups that have a session TODAY based on schedule JSON
      const todaysSessions = [];
      for (const group of groupsResult.rows) {
        const schedule = group.schedule || [];
        const todaySlots = schedule.filter((slot) => slot.day === todayDay);

        for (const slot of todaySlots) {
          todaysSessions.push({
            ...group,
            startTime: slot.start_time,
            endTime: slot.end_time,
          });
        }
      }

      if (todaysSessions.length === 0) {
        await client.query('ROLLBACK');
        return {
          success: false,
          type: 'NO_SESSION',
          message: `${student.full_name} ليس لديه حصص مجدولة اليوم`,
          student: {
            id: student.id,
            fullName: student.full_name,
            gradeName: student.grade_name,
            photoUrl: student.photo_url,
          },
        };
      }

      // 3. Check for already-scanned or pre-recorded sessions today (e.g. absences)
      const existingScans = await client.query(
        `SELECT id, group_id, status, payment_status, subscription_id
         FROM attendance_logs
         WHERE student_id = $1 AND session_date = $2`,
        [student.id, todayDate]
      );
      const existingScanMap = new Map();
      existingScans.rows.forEach((r) => existingScanMap.set(r.group_id, r));

      // 4. Process check-in for sessions
      const checkedInSessions = [];
      let hadConvertedAbsence = false;

      for (const session of todaysSessions) {
        const existing = existingScanMap.get(session.group_id);

        if (existing) {
          if (existing.status === 'present' || existing.status === 'late') {
            // Already checked in as present
            continue;
          } else if (existing.status === 'absent') {
            // Student was marked absent (deducted earlier), but now attends at gate!
            // Update to present without double-deduction from subscription
            await client.query(
              `UPDATE attendance_logs
               SET status = 'present',
                   scan_timestamp = NOW(),
                   scanned_by_user_id = COALESCE($1, scanned_by_user_id),
                   notes = COALESCE(notes, '') || ' [حضر متأخراً - تم تأكيد الحضور الفعلي بالبوابة]'
               WHERE id = $2`,
              [scannedByUserId, existing.id]
            );

            hadConvertedAbsence = true;
            checkedInSessions.push({
              attendanceId: existing.id,
              groupName: session.group_name_ar || session.group_name,
              subjectName: session.subject_name,
              subjectColor: session.subject_color,
              teacherName: session.teacher_name,
              classroomName: session.classroom_name,
              startTime: session.startTime,
              endTime: session.endTime,
              paymentStatus: existing.payment_status,
              pricePerSession: session.price_per_session,
              wasLateArrival: true,
            });
            continue;
          }
        }

        // New unrecorded session check-in
        let paymentStatus = 'pending';
        let subscriptionId = null;

        // Check active subscription with remaining sessions for this group or package
        const subResult = await client.query(
          `SELECT id, remaining_sessions, total_sessions, used_sessions
           FROM student_subscriptions
           WHERE student_id = $1 AND status = 'active'
             AND (group_id = $2 OR group_id IS NULL)
             AND remaining_sessions > 0
           ORDER BY (group_id IS NOT NULL) DESC, expires_at NULLS LAST, created_at DESC
           LIMIT 1
           FOR UPDATE`,
          [student.id, session.group_id]
        );

        if (subResult.rows.length > 0) {
          const sub = subResult.rows[0];
          subscriptionId = sub.id;

          const nextUsed = sub.used_sessions + 1;
          const nextStatus = sub.total_sessions <= nextUsed ? 'expired' : 'active';

          // Deduct one session
          await client.query(
            `UPDATE student_subscriptions
             SET used_sessions = $1,
                 status = $2,
                 updated_at = NOW()
             WHERE id = $3`,
            [nextUsed, nextStatus, sub.id]
          );

          paymentStatus = 'paid';
        } else {
          // No active subscription with remaining sessions — needs payment
          paymentStatus = 'pending';
        }

        // Apply discount if student has a special 100% status
        if (student.discount_percent === 100) {
          paymentStatus = 'free';
        }

        // Record attendance
        const attendanceResult = await client.query(
          `INSERT INTO attendance_logs 
           (student_id, group_id, session_date, status, billing_type, payment_status, subscription_id, scanned_by_user_id)
           VALUES ($1, $2, $3, 'present', $4, $5, $6, $7)
           ON CONFLICT (student_id, group_id, session_date) DO UPDATE
             SET status = 'present', scan_timestamp = NOW()
           RETURNING *`,
          [student.id, session.group_id, todayDate, student.billing_model, paymentStatus, subscriptionId, scannedByUserId]
        );

        if (attendanceResult.rows.length > 0) {
          checkedInSessions.push({
            attendanceId: attendanceResult.rows[0].id,
            groupName: session.group_name_ar || session.group_name,
            subjectName: session.subject_name,
            subjectColor: session.subject_color,
            teacherName: session.teacher_name,
            classroomName: session.classroom_name,
            startTime: session.startTime,
            endTime: session.endTime,
            paymentStatus,
            pricePerSession: session.price_per_session,
          });
        }
      }

      if (checkedInSessions.length === 0) {
        await client.query('ROLLBACK');
        return {
          success: true,
          type: 'ALREADY_SCANNED',
          message: `${student.full_name} تم تسجيل حضوره لجميع حصص اليوم بالفعل`,
          student: {
            id: student.id,
            fullName: student.full_name,
            gradeName: student.grade_name,
            photoUrl: student.photo_url,
          },
          sessions: todaysSessions.map((s) => ({
            groupName: s.group_name_ar || s.group_name,
            subjectName: s.subject_name,
            startTime: s.startTime,
            endTime: s.endTime,
            status: 'already_scanned',
          })),
        };
      }

      await client.query('COMMIT');

      // 5. Build response
      const hasPaymentPending = checkedInSessions.some((s) => s.paymentStatus === 'pending');
      const isMultiSession = checkedInSessions.length > 1;

      let msg = '';
      if (hadConvertedAbsence) {
        msg = `✅ ${student.full_name} — تم تأكيد الحضور (تم إلغاء الغياب واعتماد الحضور)`;
      } else if (isMultiSession) {
        msg = hasPaymentPending
          ? `⚠️ ${student.full_name} — تم تسجيل ${checkedInSessions.length} حصص (يرجى التوجه للخزينة لسداد المستحقات)`
          : `✅ ${student.full_name} — تم تسجيل ${checkedInSessions.length} حصص`;
      } else {
        msg = hasPaymentPending
          ? `⚠️ ${student.full_name} — تم تسجيل الحضور (يرجى التوجه للخزينة لتجديد الاشتراك)`
          : `✅ ${student.full_name} — تم تسجيل الحضور`;
      }

      return {
        success: true,
        type: hasPaymentPending ? 'NEEDS_PAYMENT' : 'CHECKED_IN',
        message: msg,
        student: {
          id: student.id,
          fullName: student.full_name,
          fullNameAr: student.full_name_ar,
          gradeName: student.grade_name,
          photoUrl: student.photo_url,
          billingModel: student.billing_model,
          statusName: student.status_name,
          discountPercent: student.discount_percent,
        },
        sessions: checkedInSessions,
        isMultiSession,
        needsPayment: hasPaymentPending,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Get today's attendance summary with present, absent, and payment metrics
   */
  static async getTodaySummary() {
    const today = new Date().toLocaleDateString('en-CA');

    const result = await db.query(
      `SELECT al.id, al.session_date, al.scan_timestamp, al.status, al.payment_status,
              al.billing_type, al.notes, al.subscription_id,
              s.full_name as student_name, s.barcode_id, s.photo_url, s.phone as student_phone,
              g.name as group_name, g.name_ar as group_name_ar,
              sub.name_ar as subject_name, sub.color as subject_color,
              t.full_name as teacher_name,
              u.full_name as scanned_by_name
       FROM attendance_logs al
       JOIN students s ON al.student_id = s.id
       JOIN groups g ON al.group_id = g.id
       LEFT JOIN subjects sub ON g.subject_id = sub.id
       LEFT JOIN teachers t ON g.teacher_id = t.id
       LEFT JOIN users u ON al.scanned_by_user_id = u.id
       WHERE al.session_date = $1
       ORDER BY al.scan_timestamp DESC`,
      [today]
    );

    // Summary stats
    const stats = await db.query(
      `SELECT 
         COUNT(*) as total_scans,
         COUNT(DISTINCT student_id) as unique_students,
         COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
         COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count,
         COUNT(CASE WHEN status = 'excused' THEN 1 END) as excused_count,
         COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_count,
         COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_count,
         COUNT(CASE WHEN payment_status = 'free' THEN 1 END) as free_count
       FROM attendance_logs
       WHERE session_date = $1`,
      [today]
    );

    return {
      logs: result.rows,
      stats: stats.rows[0],
    };
  }

  /**
   * Process absences for sessions whose scheduled time has passed
   * Automatically counts against the student and deducts 1 session from their active subscription.
   * 
   * @param {Object} options
   * @param {string} [options.targetDate] - 'YYYY-MM-DD', defaults to today
   * @param {string} [options.groupId] - Optional specific group UUID
   * @returns {Object} Summary of processed absences
   */
  static async processAbsencesForPassedSessions(options = {}) {
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA');
    const currentTimeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

    const targetDate = options.targetDate || todayStr;
    const isPast = targetDate < todayStr;

    // Safety: don't process future dates
    if (targetDate > todayStr) {
      return {
        success: false,
        message: 'لا يمكن معالجة غياب لتاريخ مستقبلي',
        processedCount: 0,
        deductedCount: 0,
        pendingCount: 0,
        freeCount: 0,
        details: []
      };
    }

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDayIndex = new Date(targetDate + 'T12:00:00').getDay();
    const targetDayName = days[targetDayIndex];

    let groupQuery = `
      SELECT g.id as group_id, g.name as group_name, g.name_ar as group_name_ar,
             g.schedule, g.price_per_month, g.price_per_session,
             sub.name_ar as subject_name,
             t.full_name as teacher_name
      FROM groups g
      LEFT JOIN subjects sub ON g.subject_id = sub.id
      LEFT JOIN teachers t ON g.teacher_id = t.id
      WHERE g.status = 'active'
    `;
    const params = [];
    if (options.groupId) {
      params.push(options.groupId);
      groupQuery += ` AND g.id = $1`;
    }

    const groupsResult = await db.query(groupQuery, params);

    const processedDetails = [];
    let deductedCount = 0;
    let pendingCount = 0;
    let freeCount = 0;

    for (const group of groupsResult.rows) {
      const schedule = group.schedule || [];
      const daySlots = schedule.filter((s) => s.day === targetDayName);

      if (daySlots.length === 0) continue;

      // Filter to slots that have ended/passed
      const passedSlots = daySlots.filter((slot) => {
        if (isPast) return true;
        if (slot.end_time) {
          return slot.end_time <= currentTimeStr;
        }
        if (slot.start_time) {
          return slot.start_time <= currentTimeStr;
        }
        return false;
      });

      if (passedSlots.length === 0) continue;

      // Find all active students enrolled in this group who don't have an attendance log for targetDate
      const enrolledStudentsRes = await db.query(
        `SELECT s.id as student_id, s.full_name, s.full_name_ar, s.student_code, s.barcode_id,
                s.billing_model, COALESCE(ss.discount_percent, 0) as discount_percent,
                ge.id as enrollment_id, ge.enrolled_at
         FROM group_enrollments ge
         JOIN students s ON ge.student_id = s.id
         LEFT JOIN student_statuses ss ON s.status_id = ss.id
         WHERE ge.group_id = $1
           AND ge.is_active = true
           AND s.is_active = true
           AND (ge.enrolled_at::date <= $2::date OR ge.enrolled_at IS NULL)
           AND NOT EXISTS (
             SELECT 1 FROM attendance_logs al
             WHERE al.student_id = s.id
               AND al.group_id = $1
               AND al.session_date = $2
           )`,
        [group.group_id, targetDate]
      );

      for (const student of enrolledStudentsRes.rows) {
        const client = await db.getClient();
        try {
          await client.query('BEGIN');

          // Idempotency check with lock
          const existingCheck = await client.query(
            `SELECT id FROM attendance_logs
             WHERE student_id = $1 AND group_id = $2 AND session_date = $3`,
            [student.student_id, group.group_id, targetDate]
          );

          if (existingCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            continue;
          }

          // Check for active subscription with remaining sessions
          const subResult = await client.query(
            `SELECT id, remaining_sessions, total_sessions, used_sessions
             FROM student_subscriptions
             WHERE student_id = $1 AND status = 'active'
               AND (group_id = $2 OR group_id IS NULL)
               AND remaining_sessions > 0
             ORDER BY (group_id IS NOT NULL) DESC, expires_at NULLS LAST, created_at DESC
             LIMIT 1
             FOR UPDATE`,
            [student.student_id, group.group_id]
          );

          let paymentStatus = 'pending';
          let subscriptionId = null;
          let noteText = '';

          if (student.discount_percent === 100) {
            paymentStatus = 'free';
            noteText = 'غياب عن موعد الحصة المجدولة (منحة كاملة 100%)';
            freeCount++;
          } else if (subResult.rows.length > 0) {
            const sub = subResult.rows[0];
            subscriptionId = sub.id;

            // Deduct exactly 1 session
            const nextUsed = sub.used_sessions + 1;
            const nextStatus = sub.total_sessions <= nextUsed ? 'expired' : 'active';

            await client.query(
              `UPDATE student_subscriptions
               SET used_sessions = $1,
                   status = $2,
                   updated_at = NOW()
               WHERE id = $3`,
              [nextUsed, nextStatus, sub.id]
            );

            paymentStatus = 'paid';
            noteText = 'غياب عن موعد الحصة المجدولة (تم احتساب الحصة وخصمها من الرصيد)';
            deductedCount++;
          } else {
            paymentStatus = 'pending';
            noteText = 'غياب عن موعد الحصة المجدولة (لا يوجد رصيد حصص كافي - مستحق للدفع)';
            pendingCount++;
          }

          const insertLogRes = await client.query(
            `INSERT INTO attendance_logs
             (student_id, group_id, session_date, scan_timestamp, status, billing_type, payment_status, subscription_id, notes)
             VALUES ($1, $2, $3, NOW(), 'absent', $4, $5, $6, $7)
             RETURNING *`,
            [
              student.student_id,
              group.group_id,
              targetDate,
              student.billing_model,
              paymentStatus,
              subscriptionId,
              noteText,
            ]
          );

          await client.query('COMMIT');

          processedDetails.push({
            logId: insertLogRes.rows[0].id,
            studentId: student.student_id,
            studentName: student.full_name,
            groupId: group.group_id,
            groupName: group.group_name_ar || group.group_name,
            paymentStatus,
            deducted: !!subscriptionId,
            remainingSessionsAfter: subResult.rows.length > 0 ? (subResult.rows[0].total_sessions - (subResult.rows[0].used_sessions + 1)) : 0
          });
        } catch (subErr) {
          await client.query('ROLLBACK');
          console.error(`Error processing absence for student ${student.student_id} in group ${group.group_id}:`, subErr);
        } finally {
          client.release();
        }
      }
    }

    return {
      success: true,
      targetDate,
      processedCount: processedDetails.length,
      deductedCount,
      pendingCount,
      freeCount,
      details: processedDetails,
    };
  }

  /**
   * Excuse an absent attendance record and restore the deducted session
   * @param {string} attendanceLogId
   * @param {string} excusedByUserId
   * @param {string} reason
   */
  static async excuseAbsence(attendanceLogId, excusedByUserId, reason = 'عذر مقبول') {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const logRes = await client.query(
        `SELECT al.*, s.full_name as student_name, g.name_ar as group_name_ar
         FROM attendance_logs al
         JOIN students s ON al.student_id = s.id
         JOIN groups g ON al.group_id = g.id
         WHERE al.id = $1
         FOR UPDATE`,
        [attendanceLogId]
      );

      if (logRes.rows.length === 0) {
        throw new Error('سجل الحضور غير موجود');
      }

      const log = logRes.rows[0];

      if (log.status === 'excused') {
        throw new Error('تم قبول عذر هذا الغياب مسبقاً');
      }

      if (log.status !== 'absent') {
        throw new Error('لا يمكن تسجيل عذر لحصة مسجلة كحضور أو لم تكن غياباً');
      }

      // If a subscription session was deducted, restore it
      let refundedSession = false;
      if (log.subscription_id) {
        await client.query(
          `UPDATE student_subscriptions
           SET used_sessions = GREATEST(0, used_sessions - 1),
               status = 'active',
               updated_at = NOW()
           WHERE id = $1`,
          [log.subscription_id]
        );
        refundedSession = true;
      }

      const reasonNote = `[عذر مقبول: ${reason || 'تم اعتماد العذر من الإدارة'}${refundedSession ? ' — تم استرداد الحصة للرصيد' : ''}]`;
      const updatedNotes = log.notes ? `${log.notes} | ${reasonNote}` : reasonNote;

      const updateRes = await client.query(
        `UPDATE attendance_logs
         SET status = 'excused',
             notes = $1,
             scanned_by_user_id = COALESCE($2, scanned_by_user_id)
         WHERE id = $3
         RETURNING *`,
        [updatedNotes, excusedByUserId || null, attendanceLogId]
      );

      await client.query('COMMIT');

      return {
        success: true,
        message: refundedSession
          ? `تم قبول عذر الطالب ${log.student_name} بنجاح واسترداد الحصة المخصومة إلى رصيده`
          : `تم قبول عذر الطالب ${log.student_name} بنجاح`,
        refundedSession,
        log: updateRes.rows[0],
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Look up a student by center code, barcode, or phone without recording attendance
   * @param {string|number} identifier
   * @returns {Object} Student preview with today's scheduled sessions and attendance status
   */
  static async lookupStudent(identifier) {
    const cleanInput = String(identifier || '').trim();
    if (!cleanInput) {
      return { success: false, message: 'يرجى إدخال رقم أو باركود الطالب' };
    }

    const asInt = parseInt(cleanInput, 10);
    const isPureInt = !isNaN(asInt) && /^\d+$/.test(cleanInput);

    const studentResult = await db.query(
      `SELECT s.id, s.barcode_id, s.student_code, s.full_name, s.full_name_ar, s.phone,
              s.billing_model, s.photo_url, s.is_active,
              ag.name_ar as grade_name, ag.grade_order,
              ss.name_ar as status_name, ss.discount_percent
       FROM students s
       LEFT JOIN academic_grades ag ON s.grade_id = ag.id
       LEFT JOIN student_statuses ss ON s.status_id = ss.id
       WHERE s.barcode_id = $1
          OR ($2::INTEGER IS NOT NULL AND s.student_code = $2)
          OR s.barcode_id ILIKE $3
          OR s.phone = $1
          OR s.id::text = $1`,
      [cleanInput, isPureInt ? asInt : null, `%-${cleanInput}`]
    );

    if (studentResult.rows.length === 0) {
      return {
        success: false,
        type: 'NOT_FOUND',
        message: `لم يتم العثور على طالب بالكود: ${cleanInput}`,
      };
    }

    const student = studentResult.rows[0];

    if (!student.is_active) {
      return {
        success: false,
        type: 'INACTIVE',
        message: `الطالب ${student.full_name} غير نشط — الرجاء مراجعة الإدارة`,
        student: {
          id: student.id,
          fullName: student.full_name,
          studentCode: student.student_code,
          gradeName: student.grade_name,
        },
      };
    }

    // Get today's scheduled groups
    const today = new Date();
    const todayDate = today.toLocaleDateString('en-CA');
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayDay = days[today.getDay()];

    const groupsResult = await db.query(
      `SELECT g.id as group_id, g.name as group_name, g.name_ar as group_name_ar,
              g.schedule, g.price_per_month, g.price_per_session,
              sub.name_ar as subject_name, sub.color as subject_color,
              t.full_name as teacher_name,
              cr.name as classroom_name
       FROM group_enrollments ge
       JOIN groups g ON ge.group_id = g.id
       LEFT JOIN subjects sub ON g.subject_id = sub.id
       LEFT JOIN teachers t ON g.teacher_id = t.id
       LEFT JOIN classrooms cr ON g.classroom_id = cr.id
       WHERE ge.student_id = $1 AND ge.is_active = true AND g.status = 'active'`,
      [student.id]
    );

    const todaysSessions = [];
    for (const group of groupsResult.rows) {
      const schedule = group.schedule || [];
      const todaySlots = schedule.filter((slot) => slot.day === todayDay);

      for (const slot of todaySlots) {
        todaysSessions.push({
          groupId: group.group_id,
          groupName: group.group_name_ar || group.group_name,
          subjectName: group.subject_name,
          subjectColor: group.subject_color,
          teacherName: group.teacher_name,
          classroomName: group.classroom_name,
          startTime: slot.start_time,
          endTime: slot.end_time,
          pricePerSession: group.price_per_session,
        });
      }
    }

    // Check existing attendance for today
    const existingScans = await db.query(
      `SELECT group_id, status FROM attendance_logs
       WHERE student_id = $1 AND session_date = $2`,
      [student.id, todayDate]
    );
    const scanStatusMap = new Map();
    existingScans.rows.forEach((r) => scanStatusMap.set(r.group_id, r.status));

    const markedSessions = todaysSessions.map((s) => {
      const status = scanStatusMap.get(s.groupId);
      return {
        ...s,
        status: status || null,
        isAttended: status === 'present' || status === 'late',
        isAbsent: status === 'absent',
        isExcused: status === 'excused',
      };
    });

    const allAttended = markedSessions.length > 0 && markedSessions.every((s) => s.isAttended);

    return {
      success: true,
      student: {
        id: student.id,
        fullName: student.full_name,
        fullNameAr: student.full_name_ar,
        studentCode: student.student_code,
        barcodeId: student.barcode_id,
        phone: student.phone,
        gradeName: student.grade_name,
        photoUrl: student.photo_url,
        billingModel: student.billing_model,
        statusName: student.status_name,
        discountPercent: student.discount_percent,
      },
      sessions: markedSessions,
      allAttended,
      noSessions: markedSessions.length === 0,
      message: allAttended
        ? 'تم تسجيل الحضور لجميع حصص اليوم مسبقاً'
        : markedSessions.length === 0
          ? 'لا توجد حصص مجدولة لهذا الطالب اليوم'
          : `جاهز لتسجيل الحضور (${markedSessions.filter((s) => !s.isAttended).length} حصة متبقية)`,
    };
  }
}

module.exports = AttendanceService;
