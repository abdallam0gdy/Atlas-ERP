const db = require('../config/db');
const { NotFoundError } = require('../utils/errors');

/**
 * GET /api/teachers
 * List all teachers
 */
const listTeachers = async (req, res, next) => {
  try {
    const { search, is_active, subject_id, revenue_split_type } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (t.full_name ILIKE $${paramIndex} OR t.phone ILIKE $${paramIndex} OR t.specialization ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (is_active !== null && is_active !== undefined && is_active !== '') {
      whereClause += ` AND t.is_active = $${paramIndex}`;
      params.push(is_active);
      paramIndex++;
    }

    if (subject_id) {
      whereClause += ` AND (t.subject_id = $${paramIndex} OR $${paramIndex}::uuid = ANY(COALESCE(t.subject_ids, '{}')) OR EXISTS (SELECT 1 FROM groups g WHERE g.teacher_id = t.id AND g.subject_id = $${paramIndex}))`;
      params.push(subject_id);
      paramIndex++;
    }

    if (revenue_split_type) {
      whereClause += ` AND t.revenue_split_type = $${paramIndex}`;
      params.push(revenue_split_type);
      paramIndex++;
    }

    const result = await db.query(
      `SELECT t.*,
              COALESCE(
                (
                  SELECT json_agg(json_build_object('id', s.id, 'name_ar', s.name_ar, 'name_en', s.name_en, 'color', s.color))
                  FROM (
                    SELECT DISTINCT s.id, s.name_ar, s.name_en, s.color
                    FROM subjects s
                    WHERE s.id = t.subject_id
                       OR s.id = ANY(COALESCE(t.subject_ids, '{}'))
                       OR s.id IN (SELECT g.subject_id FROM groups g WHERE g.teacher_id = t.id AND g.subject_id IS NOT NULL)
                    ORDER BY s.name_ar ASC
                  ) s
                ),
                '[]'::json
              ) as subjects,
              (SELECT COUNT(*) FROM groups g WHERE g.teacher_id = t.id AND g.status = 'active') as active_groups,
              (SELECT COUNT(DISTINCT ge.student_id) FROM group_enrollments ge 
               JOIN groups g ON ge.group_id = g.id 
               WHERE g.teacher_id = t.id AND ge.is_active = true) as total_students
       FROM teachers t
       ${whereClause}
       ORDER BY t.full_name ASC`,
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
 * GET /api/teachers/:id
 */
const getTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT t.*,
              COALESCE(
                (
                  SELECT json_agg(json_build_object('id', s.id, 'name_ar', s.name_ar, 'name_en', s.name_en, 'color', s.color))
                  FROM (
                    SELECT DISTINCT s.id, s.name_ar, s.name_en, s.color
                    FROM subjects s
                    WHERE s.id = t.subject_id
                       OR s.id = ANY(COALESCE(t.subject_ids, '{}'))
                       OR s.id IN (SELECT g.subject_id FROM groups g WHERE g.teacher_id = t.id AND g.subject_id IS NOT NULL)
                    ORDER BY s.name_ar ASC
                  ) s
                ),
                '[]'::json
              ) as subjects
       FROM teachers t
       WHERE t.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('المدرس');
    }

    // Fetch teacher's groups
    const groups = await db.query(
      `SELECT g.*, s.name_ar as subject_name, s.color as subject_color,
              ag.name_ar as grade_name, cr.name as classroom_name,
              (SELECT COUNT(*) FROM group_enrollments ge WHERE ge.group_id = g.id AND ge.is_active = true) as student_count
       FROM groups g
       LEFT JOIN subjects s ON g.subject_id = s.id
       LEFT JOIN academic_grades ag ON g.grade_id = ag.id
       LEFT JOIN classrooms cr ON g.classroom_id = cr.id
       WHERE g.teacher_id = $1
       ORDER BY g.status ASC, g.name ASC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        teacher: result.rows[0],
        groups: groups.rows,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/teachers
 */
const createTeacher = async (req, res, next) => {
  try {
    const data = req.body;

    const subjectIds = Array.isArray(data.subject_ids)
      ? data.subject_ids
      : (data.subject_id ? [data.subject_id] : []);
    const primarySubjectId = data.subject_id || (subjectIds.length > 0 ? subjectIds[0] : null);

    const result = await db.query(
      `INSERT INTO teachers (full_name, full_name_ar, aka, phone, email, gender, national_id, date_of_birth,
                              specialization, subject_id, subject_ids,
                              revenue_split_percent, revenue_split_type, fixed_rate_per_student,
                              bio, social_links, secretary_name, secretary_phone, photo_url, logo_url, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
       RETURNING *`,
      [
        data.full_name,
        data.full_name_ar || null,
        data.aka || null,
        data.phone,
        data.email || null,
        data.gender || 'male',
        data.national_id || null,
        data.date_of_birth ? data.date_of_birth : null,
        data.specialization || null,
        primarySubjectId,
        subjectIds,
        data.revenue_split_percent || 0,
        data.revenue_split_type || 'percentage',
        data.fixed_rate_per_student || 0,
        data.bio || null,
        data.social_links ? (typeof data.social_links === 'string' ? data.social_links : JSON.stringify(data.social_links)) : '{}',
        data.secretary_name || null,
        data.secretary_phone || null,
        data.photo_url || null,
        data.logo_url || null,
        data.notes || null,
      ]
    );

    await db.query(
      `INSERT INTO audit_log (user_id, action, entity_type, entity_id, new_data)
       VALUES ($1, 'CREATE', 'teacher', $2, $3)`,
      [req.user.id, result.rows[0].id, JSON.stringify(result.rows[0])]
    );

    res.status(201).json({
      success: true,
      message: 'تم إضافة المدرس بنجاح',
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/teachers/:id
 */
const updateTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const oldResult = await db.query('SELECT * FROM teachers WHERE id = $1', [id]);
    if (oldResult.rows.length === 0) {
      throw new NotFoundError('المدرس');
    }

    if (data.subject_ids && !data.subject_id && data.subject_ids.length > 0) {
      data.subject_id = data.subject_ids[0];
    } else if (data.subject_id && !data.subject_ids) {
      data.subject_ids = [data.subject_id];
    }

    const fields = [];
    const values = [];
    let paramIndex = 1;

    const updatableFields = [
      'full_name', 'full_name_ar', 'aka', 'phone', 'email', 'gender', 'national_id', 'date_of_birth',
      'specialization', 'subject_id', 'subject_ids',
      'revenue_split_percent', 'revenue_split_type', 'fixed_rate_per_student',
      'bio', 'social_links', 'secretary_name', 'secretary_phone', 'photo_url', 'logo_url',
      'is_active', 'notes',
    ];

    for (const field of updatableFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = $${paramIndex}`);
        let val;
        if (field === 'subject_id' && !data[field]) {
          val = null;
        } else if (field === 'date_of_birth' && (!data[field] || data[field] === '')) {
          val = null;
        } else if (field === 'social_links') {
          val = typeof data[field] === 'string' ? data[field] : JSON.stringify(data[field] || {});
        } else if (['photo_url', 'logo_url', 'bio', 'national_id', 'aka', 'notes', 'secretary_name', 'secretary_phone', 'phone', 'email', 'specialization'].includes(field) && data[field] === '') {
          val = null;
        } else {
          val = data[field];
        }
        values.push(val);
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'لا توجد بيانات للتحديث' });
    }

    values.push(id);
    const result = await db.query(
      `UPDATE teachers SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    res.json({
      success: true,
      message: 'تم تحديث بيانات المدرس بنجاح',
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/teachers/bulk-import
 */
const bulkImportTeachers = async (req, res, next) => {
  const client = await db.getClient();
  try {
    const { teachers: rawTeachers } = req.body;
    if (!Array.isArray(rawTeachers) || rawTeachers.length === 0) {
      return res.status(400).json({ success: false, message: 'قائمة المدرسين فارغة أو غير صحيحة' });
    }

    if (rawTeachers.length > 200) {
      return res.status(400).json({ success: false, message: 'الحد الأقصى هو 200 مدرس في المرة الواحدة' });
    }

    // Fetch subjects for resolution
    const subjectsRes = await client.query('SELECT id, name_ar FROM subjects');
    const subjectsMap = new Map();
    subjectsRes.rows.forEach((s) => {
      subjectsMap.set(s.id, s);
      subjectsMap.set(s.name_ar.trim().toLowerCase(), s);
    });

    await client.query('BEGIN');

    const imported = [];
    const errors = [];

    for (let i = 0; i < rawTeachers.length; i++) {
      const t = rawTeachers[i];
      const rowIndex = i + 1;

      const fullName = (t.full_name || t.name || t['اسم المدرس'] || '').trim();
      if (!fullName) {
        errors.push(`صف ${rowIndex}: اسم المدرس مطلوب`);
        continue;
      }

      const phone = (t.phone || t['رقم الموبايل'] || t['الهاتف'] || '').toString().trim() || null;
      const specialization = (t.specialization || t['التخصص'] || t['المادة'] || '').toString().trim() || null;

      // Subject match if available
      let subjectId = null;
      if (specialization) {
        const specLower = specialization.toLowerCase();
        for (const [name, sub] of subjectsMap.entries()) {
          if (specLower.includes(name) || name.includes(specLower)) {
            subjectId = sub.id;
            break;
          }
        }
      }

      // Financial split
      const splitTypeRaw = (t.revenue_split_type || t['نظام المحاسبة'] || '').toString().trim().toLowerCase();
      const isFixed = splitTypeRaw.includes('ثابت') || splitTypeRaw === 'fixed';
      const revenueSplitType = isFixed ? 'fixed' : 'percentage';

      let revenueSplitPercent = 40;
      let fixedRatePerStudent = 0;

      if (isFixed) {
        fixedRatePerStudent = parseFloat(t.fixed_rate_per_student || t['أجر ثابت'] || t['القيمة'] || 0) || 0;
      } else {
        revenueSplitPercent = parseFloat(t.revenue_split_percent || t['النسبة'] || t['القيمة'] || 40) || 40;
      }

      const notes = (t.notes || t['ملاحظات'] || '').toString().trim() || null;

      const subjectIds = subjectId ? [subjectId] : [];

      const insertRes = await client.query(
        `INSERT INTO teachers (
          full_name, full_name_ar, phone, specialization, subject_id, subject_ids,
          revenue_split_percent, revenue_split_type, fixed_rate_per_student, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, full_name`,
        [
          fullName, fullName, phone, specialization, subjectId, subjectIds,
          revenueSplitPercent, revenueSplitType, fixedRatePerStudent, notes
        ]
      );

      imported.push(insertRes.rows[0]);
    }

    if (imported.length > 0) {
      await client.query(
        `INSERT INTO audit_log (user_id, action, entity_type, entity_id, new_data)
         VALUES ($1, 'BULK_IMPORT', 'teacher', NULL, $2)`,
        [req.user.id, JSON.stringify({ count: imported.length })]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: `تم بنجاح استيراد ${imported.length} مدرس`,
      data: {
        imported_count: imported.length,
        skipped_count: errors.length,
        errors,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

module.exports = { listTeachers, getTeacher, createTeacher, updateTeacher, bulkImportTeachers };

