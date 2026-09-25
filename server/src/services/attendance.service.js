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
      const todayDate = today.toISOString().split('T')[0];
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const todayDay = days[today.getDay()];
      const currentTime = today.toTimeString().slice(0, 5); // "HH:MM"

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

      // 3. Check for already-scanned sessions today
      const existingScans = await client.query(
        `SELECT group_id FROM attendance_logs
         WHERE student_id = $1 AND session_date = $2`,
        [student.id, todayDate]
      );
      const scannedGroupIds = new Set(existingScans.rows.map((r) => r.group_id));

      // Filter out already-scanned sessions
      const pendingSessions = todaysSessions.filter(
        (s) => !scannedGroupIds.has(s.group_id)
      );

      if (pendingSessions.length === 0) {
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

      // 4. Process check-in for all pending sessions (Multi-Session Auto-Detection)
      const checkedInSessions = [];

      for (const session of pendingSessions) {
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
           LIMIT 1`,
          [student.id, session.group_id]
        );

        if (subResult.rows.length > 0) {
          const sub = subResult.rows[0];
          subscriptionId = sub.id;

          // Deduct one session
          await client.query(
            'UPDATE student_subscriptions SET used_sessions = used_sessions + 1 WHERE id = $1',
            [sub.id]
          );

          paymentStatus = 'paid';
        } else {
          // No active subscription with remaining sessions — needs payment
          paymentStatus = 'pending';
        }

        // Apply discount if student has a special status
        if (student.discount_percent === 100) {
          paymentStatus = 'free';
        }

        // Record attendance
        const attendanceResult = await client.query(
          `INSERT INTO attendance_logs 
           (student_id, group_id, session_date, status, billing_type, payment_status, subscription_id, scanned_by_user_id)
           VALUES ($1, $2, $3, 'present', $4, $5, $6, $7)
           ON CONFLICT (student_id, group_id, session_date) DO NOTHING
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

      await client.query('COMMIT');

      // 5. Build response
      const hasPaymentPending = checkedInSessions.some((s) => s.paymentStatus === 'pending');
      const isMultiSession = checkedInSessions.length > 1;

      return {
        success: true,
        type: hasPaymentPending ? 'NEEDS_PAYMENT' : 'CHECKED_IN',
        message: isMultiSession
          ? (hasPaymentPending
              ? `⚠️ ${student.full_name} — تم تسجيل ${checkedInSessions.length} حصص (يرجى التوجه للخزينة لسداد المستحقات)`
              : `✅ ${student.full_name} — تم تسجيل ${checkedInSessions.length} حصص`)
          : (hasPaymentPending
              ? `⚠️ ${student.full_name} — تم تسجيل الحضور (يرجى التوجه للخزينة لتجديد الاشتراك)`
              : `✅ ${student.full_name} — تم تسجيل الحضور`),
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
   * Get today's attendance summary
   */
  static async getTodaySummary() {
    const today = new Date().toISOString().split('T')[0];

    const result = await db.query(
      `SELECT al.id, al.session_date, al.scan_timestamp, al.status, al.payment_status,
              al.billing_type,
              s.full_name as student_name, s.barcode_id, s.photo_url,
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
    const todayDate = today.toISOString().split('T')[0];
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
      `SELECT group_id FROM attendance_logs
       WHERE student_id = $1 AND session_date = $2`,
      [student.id, todayDate]
    );
    const scannedGroupIds = new Set(existingScans.rows.map((r) => r.group_id));

    const markedSessions = todaysSessions.map((s) => ({
      ...s,
      isAttended: scannedGroupIds.has(s.groupId),
    }));

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
