const db = require('../config/db');
const { NotFoundError, ConflictError } = require('../utils/errors');

/**
 * GET /api/students
 * List students with pagination, search, and filtering
 */
const listStudents = async (req, res, next) => {
  try {
    const pageNum = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limitNum = Math.min(500, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;
    const { search, sort_by, sort_order, grade_id, is_active } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (s.full_name ILIKE $${paramIndex} OR s.barcode_id ILIKE $${paramIndex} OR CAST(s.student_code AS TEXT) ILIKE $${paramIndex} OR s.phone ILIKE $${paramIndex} OR s.parent_phone ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (grade_id) {
      whereClause += ` AND s.grade_id = $${paramIndex}`;
      params.push(grade_id);
      paramIndex++;
    }

    if (is_active !== null && is_active !== undefined) {
      whereClause += ` AND s.is_active = $${paramIndex}`;
      params.push(is_active);
      paramIndex++;
    }

    if (req.query.education_type) {
      whereClause += ` AND s.education_type = $${paramIndex}`;
      params.push(req.query.education_type);
      paramIndex++;
    }

    if (req.query.enrollment_type) {
      whereClause += ` AND s.enrollment_type = $${paramIndex}`;
      params.push(req.query.enrollment_type);
      paramIndex++;
    }

    // Whitelist sort columns to prevent SQL injection
    const allowedSorts = ['created_at', 'full_name', 'barcode_id', 'student_code', 'grade_id'];
    const safeSort = allowedSorts.includes(sort_by) ? sort_by : 'created_at';
    const safeOrder = sort_order === 'asc' ? 'ASC' : 'DESC';

    // Count total
    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM students s ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);

    // Fetch paginated results
    const dataResult = await db.query(
      `SELECT s.id, s.barcode_id, s.student_code, s.full_name, s.full_name_ar, s.phone, s.parent_phone, s.parent_name,
              s.father_phone, s.mother_phone, s.gender, s.national_id, s.date_of_birth, s.notes,
              s.billing_model, s.education_type, s.enrollment_type, s.is_active, s.photo_url, s.address, s.created_at,
              g.name_ar as grade_name, g.grade_order,
              ss.name_ar as status_name, ss.discount_percent,
              (SELECT COUNT(*) FROM group_enrollments ge WHERE ge.student_id = s.id AND ge.is_active = true) as group_count
       FROM students s
       LEFT JOIN academic_grades g ON s.grade_id = g.id
       LEFT JOIN student_statuses ss ON s.status_id = ss.id
       ${whereClause}
       ORDER BY s.${safeSort} ${safeOrder}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limitNum, offset]
    );

    res.json({
      success: true,
      data: {
        students: dataResult.rows,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/students/:id
 * Get student details with enrollments and subscriptions
 */
const getStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const studentResult = await db.query(
      `SELECT s.*, 
              g.name_ar as grade_name, g.name_en as grade_name_en, g.grade_order,
              ss.name_ar as status_name, ss.discount_percent
       FROM students s
       LEFT JOIN academic_grades g ON s.grade_id = g.id
       LEFT JOIN student_statuses ss ON s.status_id = ss.id
       WHERE s.id = $1`,
      [id]
    );

    if (studentResult.rows.length === 0) {
      throw new NotFoundError('الطالب');
    }

    // Fetch enrolled groups
    const enrollments = await db.query(
      `SELECT ge.id, ge.enrolled_at, ge.is_active,
              gr.id as group_id, gr.name as group_name, gr.name_ar as group_name_ar,
              gr.schedule, gr.price_per_month, gr.price_per_session,
              t.full_name as teacher_name,
              sub.name_ar as subject_name, sub.color as subject_color,
              cr.name as classroom_name
       FROM group_enrollments ge
       JOIN groups gr ON ge.group_id = gr.id
       LEFT JOIN teachers t ON gr.teacher_id = t.id
       LEFT JOIN subjects sub ON gr.subject_id = sub.id
       LEFT JOIN classrooms cr ON gr.classroom_id = cr.id
       WHERE ge.student_id = $1
       ORDER BY ge.is_active DESC, ge.enrolled_at DESC`,
      [id]
    );

    // Fetch active subscriptions
    const subscriptions = await db.query(
      `SELECT ss.*, gr.name as group_name, gr.name_ar as group_name_ar
       FROM student_subscriptions ss
       LEFT JOIN groups gr ON ss.group_id = gr.id
       WHERE ss.student_id = $1
       ORDER BY ss.status ASC, ss.billing_month DESC`,
      [id]
    );

    // Fetch attendance history (last 30 sessions)
    const attendance = await db.query(
      `SELECT al.*, gr.name as group_name, gr.name_ar as group_name_ar,
              sub.name_ar as subject_name, sub.color as subject_color,
              t.full_name as teacher_name
       FROM attendance_logs al
       JOIN groups gr ON al.group_id = gr.id
       LEFT JOIN subjects sub ON gr.subject_id = sub.id
       LEFT JOIN teachers t ON gr.teacher_id = t.id
       WHERE al.student_id = $1
       ORDER BY al.session_date DESC, al.scan_timestamp DESC
       LIMIT 30`,
      [id]
    );

    res.json({
      success: true,
      data: {
        student: studentResult.rows[0],
        enrollments: enrollments.rows,
        subscriptions: subscriptions.rows,
        attendance: attendance.rows,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/students
 * Create a new student with auto-generated barcode and group enrollments
 */
const createStudent = async (req, res, next) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const data = req.body;

    const gradeResult = await client.query(
      'SELECT grade_order FROM academic_grades WHERE id = $1',
      [data.grade_id]
    );
    if (gradeResult.rows.length === 0) {
      throw new NotFoundError('المرحلة الدراسية');
    }

    const gradeOrder = gradeResult.rows[0].grade_order;
    const gradeStr = String(gradeOrder).padStart(2, '0');

    // Get next center-wide student_code from sequence
    const codeResult = await client.query("SELECT nextval('student_code_seq') as code");
    const studentCode = parseInt(codeResult.rows[0].code, 10);
    const barcodeId = `ATL-G${gradeStr}-${studentCode}`;

    // Check barcode uniqueness
    const existingBarcode = await client.query(
      'SELECT id FROM students WHERE barcode_id = $1 OR student_code = $2',
      [barcodeId, studentCode]
    );
    if (existingBarcode.rows.length > 0) {
      throw new ConflictError(`الباركود أو كود الطالب (${barcodeId}) مستخدم بالفعل`);
    }

    const parentPhone = data.parent_phone || data.father_phone || data.mother_phone || data.phone || null;
    const parentName = data.parent_name || 'ولي أمر الطالب';

    const result = await client.query(
      `INSERT INTO students (barcode_id, student_code, full_name, full_name_ar, phone, parent_phone, parent_name,
                              father_phone, mother_phone, gender, national_id, date_of_birth,
                              grade_id, status_id, billing_model, education_type, enrollment_type, photo_url, address, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
       RETURNING *`,
      [
        barcodeId, studentCode, data.full_name, data.full_name_ar || null,
        data.phone, parentPhone, parentName,
        data.father_phone || null, data.mother_phone || null,
        data.gender || 'male', data.national_id || null,
        data.date_of_birth ? data.date_of_birth : null,
        data.grade_id, data.status_id || null, data.billing_model || 'PACKAGE_BUNDLE',
        data.education_type || 'PUBLIC', data.enrollment_type || 'PACKAGE',
        data.photo_url || null, data.address || null, data.notes || null,
      ]
    );

    const studentId = result.rows[0].id;

    // Enroll in selected groups if provided
    if (Array.isArray(data.group_ids) && data.group_ids.length > 0) {
      for (const groupId of data.group_ids) {
        await client.query(
          `INSERT INTO group_enrollments (student_id, group_id, is_active)
           VALUES ($1, $2, true)
           ON CONFLICT (student_id, group_id) DO UPDATE SET is_active = true`,
          [studentId, groupId]
        );
      }
    }

    // Audit log
    await client.query(
      `INSERT INTO audit_log (user_id, action, entity_type, entity_id, new_data)
       VALUES ($1, 'CREATE', 'student', $2, $3)`,
      [req.user.id, studentId, JSON.stringify(result.rows[0])]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: `تم إضافة الطالب بنجاح — كود السنتر: #${studentCode}`,
      data: result.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * PUT /api/students/:id
 * Update student details and group enrollments
 */
const updateStudent = async (req, res, next) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const data = req.body;

    const oldResult = await client.query('SELECT * FROM students WHERE id = $1', [id]);
    if (oldResult.rows.length === 0) {
      throw new NotFoundError('الطالب');
    }

    const fields = [];
    const values = [];
    let paramIndex = 1;

    const updatableFields = [
      'full_name', 'full_name_ar', 'phone', 'parent_phone', 'parent_name',
      'father_phone', 'mother_phone', 'gender', 'national_id', 'date_of_birth',
      'grade_id', 'status_id', 'billing_model', 'education_type', 'enrollment_type', 'photo_url', 'address', 'notes', 'is_active',
    ];

    for (const field of updatableFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = $${paramIndex}`);
        let val = data[field];
        if (
          ['status_id', 'grade_id', 'date_of_birth', 'national_id', 'father_phone', 'mother_phone', 'parent_phone', 'parent_name', 'photo_url', 'address', 'notes'].includes(field) &&
          (val === '' || val === undefined)
        ) {
          val = null;
        }
        values.push(val);
        paramIndex++;
      }
    }

    // If grade changed, update standard barcode_id to match new grade order
    if (data.grade_id && data.grade_id !== oldResult.rows[0].grade_id) {
      const gradeRes = await client.query('SELECT grade_order FROM academic_grades WHERE id = $1', [data.grade_id]);
      if (gradeRes.rows.length > 0) {
        const gradeOrder = gradeRes.rows[0].grade_order;
        const gradeStr = String(gradeOrder).padStart(2, '0');
        const studentCode = oldResult.rows[0].student_code;
        const currentBarcode = oldResult.rows[0].barcode_id;

        // If current barcode follows standard ATL-G pattern, update it to match new grade
        if (!currentBarcode || /^ATL-G\d{2}-\d+$/.test(currentBarcode)) {
          const newBarcodeId = `ATL-G${gradeStr}-${studentCode}`;
          fields.push(`barcode_id = $${paramIndex}`);
          values.push(newBarcodeId);
          paramIndex++;
        }
      }
    }

    let updatedStudent = oldResult.rows[0];
    if (fields.length > 0) {
      values.push(id);
      const result = await client.query(
        `UPDATE students SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      );
      updatedStudent = result.rows[0];
    }

    // Update group enrollments if group_ids provided
    if (Array.isArray(data.group_ids)) {
      const validGroupIds = data.group_ids.filter(Boolean);
      await client.query(
        `UPDATE group_enrollments SET is_active = false 
         WHERE student_id = $1 AND NOT (group_id = ANY($2::uuid[]))`,
        [id, validGroupIds]
      );
      for (const gid of validGroupIds) {
        await client.query(
          `INSERT INTO group_enrollments (student_id, group_id, is_active)
           VALUES ($1, $2, true)
           ON CONFLICT (student_id, group_id) DO UPDATE SET is_active = true`,
          [id, gid]
        );
      }
    }

    await client.query(
      `INSERT INTO audit_log (user_id, action, entity_type, entity_id, old_data, new_data)
       VALUES ($1, 'UPDATE', 'student', $2, $3, $4)`,
      [req.user.id, id, JSON.stringify(oldResult.rows[0]), JSON.stringify(updatedStudent)]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'تم تحديث بيانات الطالب بنجاح',
      data: updatedStudent,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * POST /api/students/bulk-import
 * Import a batch of students from CSV / Excel
 */
const bulkImportStudents = async (req, res, next) => {
  const client = await db.getClient();
  try {
    const { students: rawStudents } = req.body;
    if (!Array.isArray(rawStudents) || rawStudents.length === 0) {
      return res.status(400).json({ success: false, message: 'قائمة الطلاب فارغة أو غير صحيحة' });
    }

    if (rawStudents.length > 500) {
      return res.status(400).json({ success: false, message: 'الحد الأقصى للاستيراد دفعة واحدة هو 500 طالب' });
    }

    // Fetch all grades for name/id resolution
    const gradesRes = await client.query('SELECT id, name_ar, grade_order FROM academic_grades');
    const gradesMap = new Map();
    gradesRes.rows.forEach((g) => {
      gradesMap.set(g.id, g);
      gradesMap.set(g.name_ar.trim().toLowerCase(), g);
    });

    await client.query('BEGIN');

    const imported = [];
    const errors = [];

    for (let i = 0; i < rawStudents.length; i++) {
      const s = rawStudents[i];
      const rowIndex = i + 1;

      const fullName = (s.full_name || s.name || s['اسم الطالب'] || '').trim();
      if (!fullName) {
        errors.push(`صف ${rowIndex}: اسم الطالب مطلوب`);
        continue;
      }

      // Resolve grade
      const gradeInput = (s.grade_id || s.grade_name || s['المرحلة'] || s['المرحلة الدراسية'] || '').trim().toLowerCase();
      let matchedGrade = gradesMap.get(gradeInput);
      if (!matchedGrade) {
        for (const [key, g] of gradesMap.entries()) {
          if (gradeInput && key.includes(gradeInput)) {
            matchedGrade = g;
            break;
          }
        }
      }

      if (!matchedGrade) {
        matchedGrade = gradesRes.rows[0];
      }

      const phone = (s.phone || s['رقم الطالب'] || s['الموبايل'] || '').toString().trim() || '01000000000';
      const parentPhone = (s.parent_phone || s['رقم ولي الأمر'] || '').toString().trim() || phone;
      const parentName = (s.parent_name || s['اسم ولي الأمر'] || 'ولي أمر الطالب').toString().trim();
      const notes = (s.notes || s['ملاحظات'] || '').toString().trim() || null;

      const educationTypeInput = (s.education_type || s['نوع التعليم'] || '').toString().trim();
      const educationType = educationTypeInput.includes('لغات') || educationTypeInput.toUpperCase() === 'LANGUAGES' ? 'LANGUAGES' : 'PUBLIC';

      const enrollmentTypeInput = (s.enrollment_type || s['نظام الطالب'] || '').toString().trim();
      const enrollmentType = enrollmentTypeInput.includes('برايفت') || enrollmentTypeInput.toUpperCase() === 'PRIVATE' ? 'PRIVATE' : 'PACKAGE';

      const gradeStr = String(matchedGrade.grade_order).padStart(2, '0');
      const codeResult = await client.query("SELECT nextval('student_code_seq') as code");
      const studentCode = parseInt(codeResult.rows[0].code, 10);
      const barcodeId = `ATL-G${gradeStr}-${studentCode}`;

      const insertRes = await client.query(
        `INSERT INTO students (barcode_id, student_code, full_name, full_name_ar, phone, parent_phone, parent_name,
                                grade_id, status_id, billing_model, education_type, enrollment_type, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NULL, 'PACKAGE_BUNDLE', $9, $10, $11)
         RETURNING id, student_code, barcode_id, full_name`,
        [
          barcodeId, studentCode, fullName, fullName, phone, parentPhone, parentName,
          matchedGrade.id, educationType, enrollmentType, notes,
        ]
      );

      imported.push(insertRes.rows[0]);
    }

    if (imported.length > 0) {
      await client.query(
        `INSERT INTO audit_log (user_id, action, entity_type, entity_id, new_data)
         VALUES ($1, 'BULK_IMPORT', 'student', NULL, $2)`,
        [req.user.id, JSON.stringify({ count: imported.length })]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: `تم استيراد ${imported.length} طالب بنجاح${errors.length > 0 ? ` (مع ${errors.length} خطأ)` : ''}`,
      data: {
        importedCount: imported.length,
        errors,
        students: imported,
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
 * GET /api/students/export-all
 * Full export of all students for backup
 */
const exportAllStudents = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT s.id, s.barcode_id, s.student_code, s.full_name, s.full_name_ar,
              s.phone, s.parent_phone, s.parent_name, s.education_type, s.enrollment_type,
              s.is_active, s.notes, s.created_at,
              g.name_ar as grade_name,
              (SELECT COUNT(*) FROM group_enrollments ge WHERE ge.student_id = s.id AND ge.is_active = true) as group_count
       FROM students s
       LEFT JOIN academic_grades g ON s.grade_id = g.id
       ORDER BY s.student_code ASC`
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/students/:id
 * Permanently delete student and associated cascade records (with audit log)
 */
const deleteStudent = async (req, res, next) => {
  const client = await db.getClient();
  try {
    const { id } = req.params;

    // Check student existence
    const studentCheck = await client.query(
      `SELECT s.id, s.full_name, s.student_code, s.barcode_id, g.name_ar as grade_name
       FROM students s
       LEFT JOIN academic_grades g ON s.grade_id = g.id
       WHERE s.id = $1`,
      [id]
    );

    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'الطالب غير موجود أو تم حذفه مسبقاً' });
    }

    const student = studentCheck.rows[0];

    await client.query('BEGIN');

    // 1. Delete attendance logs for this student (avoids NO ACTION constraint failure)
    await client.query('DELETE FROM attendance_logs WHERE student_id = $1', [id]);

    // 2. Unassign barcode items assigned to this student (avoids NO ACTION constraint failure)
    await client.query(
      `UPDATE barcode_items 
       SET assigned_to = NULL, status = 'unassigned', assigned_at = NULL 
       WHERE assigned_to = $1`,
      [id]
    );

    // 3. Delete booklet reservations for this student (avoids RESTRICT constraint failure)
    await client.query('DELETE FROM booklet_reservations WHERE student_id = $1', [id]);

    // 4. Delete the student record itself (cascades to enrollments, subscriptions, package enrollments, etc.)
    await client.query('DELETE FROM students WHERE id = $1', [id]);

    // 5. Write audit log
    await client.query(
      `INSERT INTO audit_log (user_id, action, entity_type, entity_id, old_data)
       VALUES ($1, 'DELETE', 'student', $2, $3)`,
      [req.user.id, id, JSON.stringify(student)]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `تم حذف الطالب (${student.full_name}) نهائياً من المنظومة بنجاح`,
      data: { id, student_code: student.student_code, full_name: student.full_name },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * GET /api/students/online-secret
 * Returns the background secret key for authenticated admin users to access Supabase RPCs automatically
 */
const getOnlineSecretKey = async (req, res) => {
  res.json({
    success: true,
    data: {
      pin: process.env.ONLINE_ADMIN_PIN || 'Abd#01224385098',
    },
  });
};

/**
 * POST /api/students/sync-online
 * Sync & code online-registered students into the local ERP database,
 * deduplicating by national_id / name+father_phone and returning assigned student_code & barcode_id.
 */
const syncOnlineStudents = async (req, res, next) => {
  const client = await db.getClient();
  try {
    const { students: rawStudents } = req.body;
    if (!Array.isArray(rawStudents) || rawStudents.length === 0) {
      return res.status(400).json({ success: false, message: 'قائمة الطلاب المراد تكويدهم فارغة' });
    }

    // Ensure all profile columns exist on students table
    await client.query(`
      ALTER TABLE students
        ADD COLUMN IF NOT EXISTS father_phone VARCHAR(20),
        ADD COLUMN IF NOT EXISTS mother_phone VARCHAR(20),
        ADD COLUMN IF NOT EXISTS gender VARCHAR(10) DEFAULT 'male',
        ADD COLUMN IF NOT EXISTS national_id VARCHAR(20),
        ADD COLUMN IF NOT EXISTS date_of_birth DATE,
        ADD COLUMN IF NOT EXISTS school_name VARCHAR(150);
    `);

    // 1. Deduplicate incoming online students batch
    // Keep the most complete/preferred record per national_id (or per normalized full_name + father_phone)
    const uniqueMap = new Map();
    const duplicateOnlineIds = [];

    const scoreRecord = (rec) => {
      let score = 0;
      if (rec.synced_to_local_server) score += 100;
      if (rec.assigned_student_code) score += 80;
      if (rec.status === 'approved') score += 40;
      if (rec.photo_url) score += 20;
      if (rec.national_id && String(rec.national_id).replace(/\D/g, '').length === 14) score += 15;
      if (rec.mother_phone) score += 5;
      if (rec.school_name) score += 5;
      return score;
    };

    for (const item of rawStudents) {
      if (!item || !item.full_name) continue;
      const cleanNid = String(item.national_id || '').replace(/\D/g, '');
      const normName = String(item.full_name || '').trim().replace(/\s+/g, ' ');
      const cleanFather = String(item.father_phone || '').replace(/\D/g, '');

      const dedupKey = cleanNid.length === 14
        ? `NID:${cleanNid}`
        : `NAME_FATHER:${normName}|${cleanFather}`;

      if (!uniqueMap.has(dedupKey)) {
        uniqueMap.set(dedupKey, { primary: item, allIds: [item.id] });
      } else {
        const entry = uniqueMap.get(dedupKey);
        entry.allIds.push(item.id);
        if (scoreRecord(item) > scoreRecord(entry.primary)) {
          duplicateOnlineIds.push(entry.primary.id);
          entry.primary = item;
        } else {
          duplicateOnlineIds.push(item.id);
        }
      }
    }

    // Fetch all grades for name/id resolution
    const gradesRes = await client.query('SELECT id, name_ar, grade_order FROM academic_grades ORDER BY grade_order ASC');
    const gradesMap = new Map();
    gradesRes.rows.forEach((g) => {
      gradesMap.set(g.id, g);
      gradesMap.set(g.name_ar.trim().toLowerCase(), g);
    });

    await client.query('BEGIN');

    const synced = [];
    let newCount = 0;
    let existingCount = 0;

    for (const [, { primary: s }] of uniqueMap.entries()) {
      const fullName = String(s.full_name || '').trim().replace(/\s+/g, ' ');
      const cleanNid = String(s.national_id || '').replace(/\D/g, '') || null;
      const rawPhone = String(s.phone || '').trim();
      const hasValidStudentPhone = rawPhone && !rawPhone.includes('لا يوجد') && rawPhone.replace(/\D/g, '').length >= 10;
      const cleanFather = String(s.father_phone || '').replace(/\D/g, '') || null;
      const cleanMother = String(s.mother_phone || '').replace(/\D/g, '') || null;
      const studentPhone = hasValidStudentPhone ? rawPhone.replace(/\D/g, '') : (cleanFather || '01000000000');
      const parentPhone = cleanFather || cleanMother || studentPhone;
      const parentName = s.parent_job ? `ولي الأمر (${s.parent_job.trim()})` : 'ولي أمر الطالب';
      const gender = s.gender === 'female' ? 'female' : 'male';
      const birthDate = s.birth_date || null;
      const schoolName = s.school_name ? String(s.school_name).trim().slice(0, 150) : null;
      const photoUrl = s.photo_url || null;
      const address = s.address ? String(s.address).trim() : null;

      // Build comprehensive notes
      const noteParts = [];
      if (s.notes) noteParts.push(String(s.notes).trim());
      if (s.education_type === 'أزهر' && (!s.notes || !s.notes.includes('أزهر'))) {
        noteParts.push('[تعليم أزهري]');
      }
      const finalNotes = noteParts.length > 0 ? noteParts.join(' | ') : null;

      // Resolve academic grade
      const gradeInput = String(s.academic_grade || '').trim().toLowerCase();
      let matchedGrade = gradesMap.get(gradeInput);
      if (!matchedGrade) {
        for (const [key, g] of gradesMap.entries()) {
          if (typeof key === 'string' && gradeInput && (key.includes(gradeInput) || gradeInput.includes(key))) {
            matchedGrade = g;
            break;
          }
        }
      }
      if (!matchedGrade) {
        matchedGrade = gradesRes.rows[0];
      }

      const eduInput = String(s.education_type || '').trim();
      const educationType = eduInput.includes('لغات') || eduInput.toUpperCase() === 'LANGUAGES' ? 'LANGUAGES' : 'PUBLIC';

      // Check if student already exists in local DB (by national_id first, then by exact full_name + father_phone)
      let existingRes = { rows: [] };
      if (cleanNid && cleanNid.length === 14) {
        existingRes = await client.query(
          `SELECT id, student_code, barcode_id, full_name
           FROM students
           WHERE national_id = $1
           ORDER BY created_at ASC
           LIMIT 1`,
          [cleanNid]
        );
      }

      if (existingRes.rows.length === 0 && fullName && cleanFather) {
        existingRes = await client.query(
          `SELECT id, student_code, barcode_id, full_name
           FROM students
           WHERE TRIM(full_name) = $1
             AND (father_phone = $2 OR parent_phone = $2)
           ORDER BY created_at ASC
           LIMIT 1`,
          [fullName, cleanFather]
        );
      }

      if (existingRes.rows.length > 0) {
        const existingStudent = existingRes.rows[0];
        // Update existing student record with any new/complete fields from the online form
        await client.query(
          `UPDATE students
           SET full_name_ar = COALESCE(full_name_ar, $1),
               phone = COALESCE(NULLIF(phone, '01000000000'), $2),
               parent_phone = COALESCE(parent_phone, $3),
               parent_name = COALESCE(parent_name, $4),
               father_phone = COALESCE(father_phone, $5),
               mother_phone = COALESCE(mother_phone, $6),
               gender = COALESCE(gender, $7),
               national_id = COALESCE(national_id, $8),
               date_of_birth = COALESCE(date_of_birth, $9),
               school_name = COALESCE(school_name, $10),
               photo_url = COALESCE(photo_url, $11),
               address = COALESCE(address, $12),
               notes = COALESCE(notes, $13)
           WHERE id = $14`,
          [
            fullName, studentPhone, parentPhone, parentName,
            cleanFather, cleanMother, gender, cleanNid,
            birthDate, schoolName, photoUrl, address, finalNotes,
            existingStudent.id,
          ]
        );

        existingCount++;
        synced.push({
          online_id: s.id,
          local_id: existingStudent.id,
          student_code: existingStudent.student_code,
          barcode_id: existingStudent.barcode_id,
          full_name: existingStudent.full_name,
          national_id: cleanNid,
          already_existed: true,
        });
      } else {
        // Generate new student_code and barcode_id
        const gradeStr = String(matchedGrade.grade_order).padStart(2, '0');
        const codeResult = await client.query("SELECT nextval('student_code_seq') as code");
        const studentCode = parseInt(codeResult.rows[0].code, 10);
        const barcodeId = `ATL-G${gradeStr}-${studentCode}`;

        const insertRes = await client.query(
          `INSERT INTO students (
             barcode_id, student_code, full_name, full_name_ar, phone, parent_phone, parent_name,
             father_phone, mother_phone, gender, national_id, date_of_birth,
             grade_id, status_id, billing_model, education_type, enrollment_type,
             school_name, photo_url, address, notes
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NULL, 'PACKAGE_BUNDLE', $14, 'PACKAGE', $15, $16, $17, $18)
           RETURNING id, student_code, barcode_id, full_name`,
          [
            barcodeId, studentCode, fullName, fullName, studentPhone, parentPhone, parentName,
            cleanFather, cleanMother, gender, cleanNid, birthDate,
            matchedGrade.id, educationType,
            schoolName, photoUrl, address, finalNotes,
          ]
        );

        const created = insertRes.rows[0];
        newCount++;
        synced.push({
          online_id: s.id,
          local_id: created.id,
          student_code: created.student_code,
          barcode_id: created.barcode_id,
          full_name: created.full_name,
          national_id: cleanNid,
          already_existed: false,
        });
      }
    }

    if (synced.length > 0) {
      await client.query(
        `INSERT INTO audit_log (user_id, action, entity_type, entity_id, new_data)
         VALUES ($1, 'SYNC_ONLINE', 'student', NULL, $2)`,
        [
          req.user.id,
          JSON.stringify({
            totalSynced: synced.length,
            newCount,
            existingCount,
            duplicatesDetected: duplicateOnlineIds.length,
          }),
        ]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: `تم تكويد ونقل ${synced.length} طالب للسيستم بنجاح (${newCount} كود جديد${existingCount > 0 ? `، وربط ${existingCount} مسجل مسبقاً` : ''}${duplicateOnlineIds.length > 0 ? `، وتصفية ${duplicateOnlineIds.length} استمارة مكررة` : ''})`,
      data: {
        synced,
        duplicate_online_ids: duplicateOnlineIds,
        newCount,
        existingCount,
        duplicatesRemovedCount: duplicateOnlineIds.length,
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
  listStudents,
  getStudent,
  createStudent,
  updateStudent,
  bulkImportStudents,
  exportAllStudents,
  deleteStudent,
  getOnlineSecretKey,
  syncOnlineStudents,
};

