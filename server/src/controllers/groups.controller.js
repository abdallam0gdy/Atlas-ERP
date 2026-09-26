const db = require('../config/db');
const { NotFoundError, ValidationError } = require('../utils/errors');

const dayNamesArabic = {
  saturday: 'السبت',
  sunday: 'الأحد',
  monday: 'الاثنين',
  tuesday: 'الثلاثاء',
  wednesday: 'الأربعاء',
  thursday: 'الخميس',
  friday: 'الجمعة',
};

async function verifyNoClassroomConflict(classroomId, newSchedule, excludeGroupId = null) {
  if (!classroomId || !Array.isArray(newSchedule) || newSchedule.length === 0) return;

  const result = await db.query(
    `SELECT g.id, g.name_ar, g.name, g.schedule, cr.name_ar as classroom_name
     FROM groups g
     JOIN classrooms cr ON g.classroom_id = cr.id
     WHERE g.classroom_id = $1 AND g.status = 'active' AND ($2::uuid IS NULL OR g.id != $2)`,
    [classroomId, excludeGroupId]
  );

  for (const existingGroup of result.rows) {
    let exSchedule = [];
    try {
      exSchedule = Array.isArray(existingGroup.schedule)
        ? existingGroup.schedule
        : (typeof existingGroup.schedule === 'string' ? JSON.parse(existingGroup.schedule) : []);
    } catch {
      exSchedule = [];
    }

    for (const newSlot of newSchedule) {
      if (!newSlot.day || !newSlot.start_time || !newSlot.end_time) continue;

      for (const exSlot of exSchedule) {
        if (!exSlot.day || !exSlot.start_time || !exSlot.end_time) continue;

        if (newSlot.day.toLowerCase() === exSlot.day.toLowerCase()) {
          // Check overlap: (start1 < end2) && (end1 > start2)
          if (newSlot.start_time < exSlot.end_time && newSlot.end_time > exSlot.start_time) {
            const dayAr = dayNamesArabic[newSlot.day.toLowerCase()] || newSlot.day;
            const roomName = existingGroup.classroom_name || 'القاعة';
            const groupName = existingGroup.name_ar || existingGroup.name;
            throw new ValidationError(
              `تعارض في جدول ${roomName}: القاعة محجوزة بالفعل لمجموعة "${groupName}" يوم ${dayAr} من ${exSlot.start_time} إلى ${exSlot.end_time}`
            );
          }
        }
      }
    }
  }
}

/**
 * GET /api/groups
 */
const listGroups = async (req, res, next) => {
  try {
    const { search, grade_id, teacher_id, status, is_private } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (g.name ILIKE $${paramIndex} OR g.name_ar ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (grade_id) {
      whereClause += ` AND g.grade_id = $${paramIndex}`;
      params.push(grade_id);
      paramIndex++;
    }
    if (teacher_id) {
      whereClause += ` AND g.teacher_id = $${paramIndex}`;
      params.push(teacher_id);
      paramIndex++;
    }
    if (status) {
      whereClause += ` AND g.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    if (is_private === 'true') {
      whereClause += ` AND NOT EXISTS (SELECT 1 FROM package_groups pg WHERE pg.group_id = g.id)`;
    } else if (is_private === 'false') {
      whereClause += ` AND EXISTS (SELECT 1 FROM package_groups pg WHERE pg.group_id = g.id)`;
    }

    const result = await db.query(
      `SELECT g.*,
              t.full_name as teacher_name,
              s.name_ar as subject_name, s.color as subject_color,
              ag.name_ar as grade_name, ag.grade_order,
              cr.name as classroom_name, cr.capacity as classroom_capacity,
              (SELECT COUNT(*) FROM group_enrollments ge WHERE ge.group_id = g.id AND ge.is_active = true) as student_count,
              (EXISTS (SELECT 1 FROM package_groups pg WHERE pg.group_id = g.id)) as is_in_package,
              (NOT EXISTS (SELECT 1 FROM package_groups pg WHERE pg.group_id = g.id)) as is_private
       FROM groups g
       LEFT JOIN teachers t ON g.teacher_id = t.id
       LEFT JOIN subjects s ON g.subject_id = s.id
       LEFT JOIN academic_grades ag ON g.grade_id = ag.id
       LEFT JOIN classrooms cr ON g.classroom_id = cr.id
       ${whereClause}
       ORDER BY ag.grade_order ASC, g.name ASC`,
      params
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
 * GET /api/groups/:id
 */
const getGroup = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT g.*,
              t.full_name as teacher_name, t.phone as teacher_phone,
              s.name_ar as subject_name, s.color as subject_color,
              ag.name_ar as grade_name,
              cr.name as classroom_name
       FROM groups g
       LEFT JOIN teachers t ON g.teacher_id = t.id
       LEFT JOIN subjects s ON g.subject_id = s.id
       LEFT JOIN academic_grades ag ON g.grade_id = ag.id
       LEFT JOIN classrooms cr ON g.classroom_id = cr.id
       WHERE g.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('المجموعة');
    }

    // Fetch enrolled students
    const students = await db.query(
      `SELECT s.id, s.barcode_id, s.full_name, s.phone, s.billing_model, s.enrollment_type,
              ge.enrolled_at, ge.is_active as enrollment_active
       FROM group_enrollments ge
       JOIN students s ON ge.student_id = s.id
       WHERE ge.group_id = $1
       ORDER BY ge.is_active DESC, s.full_name ASC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        group: result.rows[0],
        students: students.rows,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/groups
 */
const createGroup = async (req, res, next) => {
  try {
    const data = req.body;

    // Check classroom schedule conflict
    if (data.classroom_id && data.schedule) {
      await verifyNoClassroomConflict(data.classroom_id, data.schedule);
    }

    const pkgTeacher = data.package_teacher_ratio !== undefined ? parseFloat(data.package_teacher_ratio) : 0.00;
    const pkgCenter = data.package_center_ratio !== undefined ? parseFloat(data.package_center_ratio) : 100.00;
    const privTeacher = data.private_teacher_ratio !== undefined ? parseFloat(data.private_teacher_ratio) : 75.00;
    const privCenter = data.private_center_ratio !== undefined ? parseFloat(data.private_center_ratio) : 25.00;

    const result = await db.query(
      `INSERT INTO groups (name, name_ar, teacher_id, subject_id, grade_id, classroom_id,
                           schedule, price_per_month, price_per_session, max_students,
                           package_teacher_ratio, package_center_ratio, private_teacher_ratio, private_center_ratio)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        data.name, data.name_ar, data.teacher_id || null, data.subject_id || null, data.grade_id || null,
        data.classroom_id || null, JSON.stringify(data.schedule || []), data.price_per_month || 0,
        data.price_per_session || 0, data.max_students || 9999,
        pkgTeacher, pkgCenter, privTeacher, privCenter,
      ]
    );

    await db.query(
      `INSERT INTO audit_log (user_id, action, entity_type, entity_id, new_data)
       VALUES ($1, 'CREATE', 'group', $2, $3)`,
      [req.user.id, result.rows[0].id, JSON.stringify(result.rows[0])]
    );

    res.status(201).json({
      success: true,
      message: 'تم إنشاء المجموعة بنجاح',
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/groups/:id/enroll
 * Enroll a student in a group
 */
const enrollStudent = async (req, res, next) => {
  try {
    throw new ValidationError('يتم تسجيل وقيد الطلاب في المجموعات وتحديد باقات الحصص حصرياً من خلال شاشة اشتراكات الطلاب والحصص لضمان التوثيق المالي');
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/groups/:id
 */
const updateGroup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const oldResult = await db.query('SELECT * FROM groups WHERE id = $1', [id]);
    if (oldResult.rows.length === 0) {
      throw new NotFoundError('المجموعة');
    }
    const currentGroup = oldResult.rows[0];

    // Check classroom schedule conflict if classroom or schedule is changing
    const targetClassroomId = data.classroom_id !== undefined ? data.classroom_id : currentGroup.classroom_id;
    let targetSchedule = data.schedule !== undefined ? data.schedule : currentGroup.schedule;
    if (typeof targetSchedule === 'string') {
      try { targetSchedule = JSON.parse(targetSchedule); } catch { targetSchedule = []; }
    }

    if (targetClassroomId && targetSchedule) {
      await verifyNoClassroomConflict(targetClassroomId, targetSchedule, id);
    }

    const fields = [];
    const values = [];
    let paramIndex = 1;

    const updatableFields = [
      'name', 'name_ar', 'teacher_id', 'subject_id', 'grade_id',
      'classroom_id', 'price_per_month', 'price_per_session',
      'max_students', 'status',
      'package_teacher_ratio', 'package_center_ratio',
      'private_teacher_ratio', 'private_center_ratio',
    ];

    const uuidFields = ['classroom_id', 'subject_id', 'grade_id', 'teacher_id'];
    for (const field of updatableFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = $${paramIndex}`);
        const val = (uuidFields.includes(field) && !data[field]) ? null : data[field];
        values.push(val);
        paramIndex++;
      }
    }

    // Handle schedule separately since it needs JSON.stringify
    if (data.schedule !== undefined) {
      fields.push(`schedule = $${paramIndex}`);
      values.push(JSON.stringify(data.schedule));
      paramIndex++;
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'لا توجد بيانات للتحديث' });
    }

    values.push(id);
    const result = await db.query(
      `UPDATE groups SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    res.json({
      success: true,
      message: 'تم تحديث بيانات المجموعة بنجاح',
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { listGroups, getGroup, createGroup, updateGroup, enrollStudent };
