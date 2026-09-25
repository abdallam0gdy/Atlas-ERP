const db = require('../config/db');
const { NotFoundError } = require('../utils/errors');

/**
 * GET /api/master/grades
 */
const listGrades = async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT * FROM academic_grades WHERE is_active = true ORDER BY grade_order ASC'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/master/subjects
 */
const listSubjects = async (req, res, next) => {
  try {
    const { education_type } = req.query;
    let queryText = `
      SELECT s.*, 
        (SELECT COUNT(*) FROM groups g WHERE g.subject_id = s.id AND g.status = 'active') AS groups_count
      FROM subjects s
      WHERE s.is_active = true
    `;
    const params = [];

    if (education_type) {
      params.push(education_type);
      queryText += ` AND (s.education_type = $1 OR s.education_type = 'both')`;
    }

    queryText += ' ORDER BY s.name_ar ASC';

    const result = await db.query(queryText, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/master/subjects
 */
const createSubject = async (req, res, next) => {
  try {
    const { name_ar, name_en, code, color, education_type } = req.body;
    if (!name_ar) {
      return res.status(400).json({ success: false, message: 'اسم المادة مطلوب' });
    }

    const autoCode = code || ('SUB-' + Math.floor(100 + Math.random() * 900));

    const result = await db.query(
      `INSERT INTO subjects (name_ar, name_en, code, color, education_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        name_ar,
        name_en || null,
        autoCode.toUpperCase(),
        color || '#0C3C82',
        education_type || 'general',
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'تمت إضافة المادة بنجاح' });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/master/subjects/:id
 */
const updateSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name_ar, name_en, code, color, education_type, is_active } = req.body;

    const check = await db.query('SELECT * FROM subjects WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      throw new NotFoundError('المادة غير موجودة');
    }

    const result = await db.query(
      `UPDATE subjects
       SET name_ar = COALESCE($1, name_ar),
           name_en = COALESCE($2, name_en),
           code = COALESCE($3, code),
           color = COALESCE($4, color),
           education_type = COALESCE($5, education_type),
           is_active = COALESCE($6, is_active),
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [name_ar, name_en, code, color, education_type, is_active, id]
    );

    res.json({ success: true, data: result.rows[0], message: 'تم تحديث المادة بنجاح' });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/master/subjects/:id
 */
const deleteSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Check if any groups use it
    const groupsCheck = await db.query('SELECT COUNT(*) as count FROM groups WHERE subject_id = $1', [id]);
    if (parseInt(groupsCheck.rows[0].count, 10) > 0) {
      // Soft delete
      await db.query('UPDATE subjects SET is_active = false, updated_at = NOW() WHERE id = $1', [id]);
      return res.json({ success: true, message: 'تم تعطيل المادة لارتباطها بمجموعات دراسية' });
    }

    await db.query('DELETE FROM subjects WHERE id = $1', [id]);
    res.json({ success: true, message: 'تم حذف المادة بنجاح' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/master/classrooms
 */
const listClassrooms = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT * FROM classrooms WHERE is_active = true 
       ORDER BY CAST(SUBSTRING(name FROM '([0-9]+)') AS INTEGER) ASC NULLS LAST, name_ar ASC`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/master/student-statuses
 */
const listStudentStatuses = async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT * FROM student_statuses WHERE is_active = true ORDER BY name_ar ASC'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/master/roles
 */
const listRoles = async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT id, name, label_ar, label_en, description FROM roles ORDER BY name ASC'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/master/dashboard-stats
 * Quick summary stats for dashboard
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [students, teachers, groups, todayAttendance] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM students WHERE is_active = true'),
      db.query('SELECT COUNT(*) as count FROM teachers WHERE is_active = true'),
      db.query("SELECT COUNT(*) as count FROM groups WHERE status = 'active'"),
      db.query('SELECT COUNT(*) as count FROM attendance_logs WHERE session_date = $1', [today]),
    ]);

    res.json({
      success: true,
      data: {
        totalStudents: parseInt(students.rows[0].count, 10),
        totalTeachers: parseInt(teachers.rows[0].count, 10),
        activeGroups: parseInt(groups.rows[0].count, 10),
        todayAttendance: parseInt(todayAttendance.rows[0].count, 10),
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listGrades, listSubjects, createSubject, updateSubject, deleteSubject,
  listClassrooms, listStudentStatuses, listRoles, getDashboardStats,
};
