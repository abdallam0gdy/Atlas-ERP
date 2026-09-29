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
 * List all classrooms with assigned group counts
 */
const listClassrooms = async (req, res, next) => {
  try {
    const showAll = req.query.all === 'true';
    const result = await db.query(
      `SELECT c.*, 
              COUNT(g.id) FILTER (WHERE g.status = 'active') as active_groups_count,
              COUNT(g.id) as total_groups_count
       FROM classrooms c
       LEFT JOIN groups g ON g.classroom_id = c.id
       ${showAll ? '' : 'WHERE c.is_active = true'}
       GROUP BY c.id
       ORDER BY CAST(SUBSTRING(c.name FROM '([0-9]+)') AS INTEGER) ASC NULLS LAST, c.name_ar ASC`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/master/classrooms
 * Create a new classroom
 */
const createClassroom = async (req, res, next) => {
  try {
    const { name, name_ar, capacity, floor } = req.body;
    if (!name && !name_ar) {
      return res.status(400).json({ success: false, message: 'اسم القاعة مطلوب' });
    }

    const roomName = (name || name_ar || '').trim();
    const roomNameAr = (name_ar || name || '').trim();
    const roomCap = parseInt(capacity, 10) || 9999;
    const roomFloor = floor !== undefined ? parseInt(floor, 10) : null;

    // Check duplicate name
    const existing = await db.query(
      'SELECT id FROM classrooms WHERE name ILIKE $1 OR name_ar ILIKE $2',
      [roomName, roomNameAr]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'اسم القاعة مسجل مسبقاً' });
    }

    const result = await db.query(
      `INSERT INTO classrooms (name, name_ar, capacity, floor, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING *`,
      [roomName, roomNameAr, roomCap, roomFloor]
    );

    res.status(201).json({
      success: true,
      message: 'تم إضافة القاعة بنجاح',
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/master/classrooms/:id
 * Update classroom details
 */
const updateClassroom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, name_ar, capacity, floor, is_active } = req.body;

    const currentRes = await db.query('SELECT * FROM classrooms WHERE id = $1', [id]);
    if (currentRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'القاعة غير موجودة' });
    }

    const current = currentRes.rows[0];
    const newName = name !== undefined ? name.trim() : current.name;
    const newNameAr = name_ar !== undefined ? name_ar.trim() : current.name_ar;
    const newCap = capacity !== undefined ? (parseInt(capacity, 10) || 9999) : current.capacity;
    const newFloor = floor !== undefined ? parseInt(floor, 10) : current.floor;
    const newIsActive = is_active !== undefined ? Boolean(is_active) : current.is_active;

    // Check duplicate name on other rooms
    if (name || name_ar) {
      const dup = await db.query(
        'SELECT id FROM classrooms WHERE (name ILIKE $1 OR name_ar ILIKE $2) AND id != $3',
        [newName, newNameAr, id]
      );
      if (dup.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'اسم القاعة مستخدم بالفعل لقاعة أخرى' });
      }
    }

    const result = await db.query(
      `UPDATE classrooms
       SET name = $1, name_ar = $2, capacity = $3, floor = $4, is_active = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [newName, newNameAr, newCap, newFloor, newIsActive, id]
    );

    res.json({
      success: true,
      message: 'تم تحديث بيانات القاعة بنجاح',
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/master/classrooms/:id
 * Delete or deactivate classroom with assigned groups safety check
 */
const deleteClassroom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { force, reassign_to_id } = req.body || {};

    const roomRes = await db.query('SELECT * FROM classrooms WHERE id = $1', [id]);
    if (roomRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'القاعة غير موجودة' });
    }
    const room = roomRes.rows[0];

    // Check active groups assigned to this room
    const groupsRes = await db.query(
      `SELECT g.id, g.name, g.name_ar, g.status, sub.name_ar as subject_name, t.full_name as teacher_name
       FROM groups g
       LEFT JOIN subjects sub ON g.subject_id = sub.id
       LEFT JOIN teachers t ON g.teacher_id = t.id
       WHERE g.classroom_id = $1`,
      [id]
    );

    const activeGroups = groupsRes.rows.filter((g) => g.status === 'active');

    // If reassign_to_id provided, reassign groups first
    if (reassign_to_id) {
      const targetRoom = await db.query('SELECT id, name_ar FROM classrooms WHERE id = $1 AND is_active = true', [reassign_to_id]);
      if (targetRoom.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'القاعة البديلة المحددة غير موجودة أو غير نشطة' });
      }

      await db.query('UPDATE groups SET classroom_id = $1, updated_at = NOW() WHERE classroom_id = $2', [reassign_to_id, id]);
    } else if (activeGroups.length > 0) {
      // Forbid deletion if active groups are assigned and no reassignment target is provided
      const groupNames = activeGroups.map((g) => g.name_ar || g.name).slice(0, 5).join('، ');
      const extraCount = activeGroups.length > 5 ? ` و ${activeGroups.length - 5} مجموعات أخرى` : '';

      return res.status(400).json({
        success: false,
        code: 'ROOM_HAS_ACTIVE_GROUPS',
        message: `⚠️ لا يمكن حذف (${room.name_ar || room.name}) لوجود ${activeGroups.length} مجموعات دراسية نشطة مسكنة بها: [${groupNames}${extraCount}]. يرجى نقل المجموعات لقاعة بديلة قبل الحذف.`,
        activeGroupsCount: activeGroups.length,
        assignedGroups: activeGroups.map((g) => ({
          id: g.id,
          name: g.name_ar || g.name,
          subjectName: g.subject_name,
          teacherName: g.teacher_name,
        })),
      });
    }

    // Attempt hard delete if no constraints, otherwise soft-delete (is_active = false)
    try {
      await db.query('DELETE FROM classrooms WHERE id = $1', [id]);
      return res.json({
        success: true,
        message: `تم حذف (${room.name_ar || room.name}) بنجاح`,
      });
    } catch (delErr) {
      // If foreign key constraint prevents hard delete, soft delete
      await db.query('UPDATE classrooms SET is_active = false, updated_at = NOW() WHERE id = $1', [id]);
      return res.json({
        success: true,
        message: `تم إلغاء تفعيل (${room.name_ar || room.name}) بنجاح لوجود سجلات تاريخية سابقة مرتبطة بها`,
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/master/settings
 * Retrieve all system settings
 */
const getSettings = async (req, res, next) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM system_settings';
    const params = [];
    if (category) {
      query += ' WHERE category = $1';
      params.push(category);
    }
    query += ' ORDER BY category, key';

    const result = await db.query(query, params);

    // Also build a convenient key-value map
    const map = {};
    result.rows.forEach((r) => {
      map[r.key] = r.value;
    });

    res.json({
      success: true,
      data: result.rows,
      settings: map,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/master/settings
 * Update system settings
 */
const updateSettings = async (req, res, next) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, message: 'بيانات الإعدادات غير صالحة' });
    }

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const updatedKeys = [];
      for (const [key, val] of Object.entries(settings)) {
        const strVal = String(val !== undefined && val !== null ? val : '').trim();

        // Validation for numerical settings
        if ([
          'attendance_early_allowance_minutes',
          'attendance_late_allowance_minutes',
          'multi_session_gap_minutes',
          'session_duration_minutes',
        ].includes(key)) {
          const num = parseInt(strVal, 10);
          if (isNaN(num) || num < 0 || num > 300) {
            await client.query('ROLLBACK');
            return res.status(400).json({
              success: false,
              message: `القيمة المدخلة للإعداد (${key}) غير صالحة. يجب أن تكون رقماً بين 0 و 300 دقيقة.`,
            });
          }
        }

        await client.query(
          `INSERT INTO system_settings (key, value, value_type, category, updated_at)
           VALUES ($1, $2, 'number', 'attendance', NOW())
           ON CONFLICT (key) DO UPDATE
             SET value = EXCLUDED.value, updated_at = NOW()`,
          [key, strVal]
        );
        updatedKeys.push(key);
      }

      await client.query('COMMIT');

      // Fetch fresh settings
      const freshRes = await db.query('SELECT key, value FROM system_settings');
      const freshMap = {};
      freshRes.rows.forEach((r) => { freshMap[r.key] = r.value; });

      res.json({
        success: true,
        message: 'تم حفظ وتحديث إعدادات النظام بنجاح',
        updatedKeys,
        settings: freshMap,
      });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
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
  listClassrooms, createClassroom, updateClassroom, deleteClassroom,
  getSettings, updateSettings,
  listStudentStatuses, listRoles, getDashboardStats,
};

