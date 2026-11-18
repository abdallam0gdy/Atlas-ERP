const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const db = require('../config/db');

// Strict rate limit for public student card lookup (anti-scraping)
const publicLookupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 35,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'LOOKUP_RATE_LIMITED',
    message: 'تم تجاوز عدد محاولات الاستعلام المسموحة — يرجى المحاولة بعد 15 دقيقة',
  },
});

let schemaChecked = false;
async function ensureStudentCardColumns() {
  if (schemaChecked) return;
  try {
    await db.query(`
      ALTER TABLE students
        ADD COLUMN IF NOT EXISTS national_id VARCHAR(20),
        ADD COLUMN IF NOT EXISTS school_name VARCHAR(150);
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_students_national_id
        ON students (national_id)
        WHERE national_id IS NOT NULL;
    `);
    schemaChecked = true;
  } catch (err) {
    console.warn('Public lookup schema check warning:', err.message);
  }
}

function normalizeNationalId(input) {
  if (!input) return '';
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(input)
    .replace(/[٠-٩]/g, (ch) => String(arabicNumerals.indexOf(ch)))
    .replace(/\D/g, '')
    .trim();
}

function mapEducationTypeLabel(raw) {
  const val = String(raw || '').toUpperCase();
  if (val === 'LANGUAGES' || raw === 'لغات') return 'لغات';
  if (val === 'AZHAR' || raw === 'أزهر') return 'أزهر';
  return 'عام';
}

/**
 * POST /api/public/student-lookup
 * Public (NO login required) lookup of student smart ID card by 14-digit National ID.
 * Returns ONLY safe card details (never returns phone numbers, address, or internal notes).
 */
router.post('/student-lookup', publicLookupLimiter, async (req, res, next) => {
  try {
    const cleanNid = normalizeNationalId(req.body?.national_id);
    if (cleanNid.length !== 14) {
      return res.status(400).json({
        success: false,
        found: false,
        reason: 'invalid_national_id',
        message: 'يرجى إدخال رقم قومي مصري صحيح مكون من 14 رقماً',
      });
    }

    await ensureStudentCardColumns();

    const studentRes = await db.query(
      `SELECT
         s.id,
         s.full_name,
         s.full_name_ar,
         s.photo_url,
         s.student_code,
         s.barcode_id,
         s.education_type,
         s.enrollment_type,
         s.school_name,
         s.gender,
         s.date_of_birth,
         s.is_active,
         s.created_at,
         g.name_ar AS grade_name
       FROM students s
       LEFT JOIN academic_grades g ON s.grade_id = g.id
       WHERE regexp_replace(COALESCE(s.national_id, ''), '[^0-9]', '', 'g') = $1
       ORDER BY s.is_active DESC, s.created_at ASC
       LIMIT 1`,
      [cleanNid]
    );

    if (studentRes.rows.length === 0) {
      return res.json({
        success: true,
        found: false,
        reason: 'not_found',
      });
    }

    const student = studentRes.rows[0];

    // Fetch active enrolled groups & schedule (safe public info only)
    const groupsRes = await db.query(
      `SELECT
         gr.id AS group_id,
         COALESCE(gr.name_ar, gr.name) AS group_name,
         gr.schedule,
         sub.name_ar AS subject_name,
         sub.color AS subject_color,
         COALESCE(t.aka, t.full_name_ar, t.full_name) AS teacher_name,
         cr.name AS classroom_name
       FROM group_enrollments ge
       JOIN groups gr ON ge.group_id = gr.id
       LEFT JOIN subjects sub ON gr.subject_id = sub.id
       LEFT JOIN teachers t ON gr.teacher_id = t.id
       LEFT JOIN classrooms cr ON gr.classroom_id = cr.id
       WHERE ge.student_id = $1
         AND ge.is_active = true
         AND gr.status = 'active'
       ORDER BY sub.name_ar ASC, gr.name ASC`,
      [student.id]
    );

    return res.json({
      success: true,
      found: true,
      source: 'local',
      student: {
        full_name: student.full_name_ar || student.full_name,
        photo_url: student.photo_url || null,
        academic_grade: student.grade_name || 'غير محدد',
        education_type: mapEducationTypeLabel(student.education_type),
        enrollment_type: student.enrollment_type || 'PACKAGE',
        school_name: student.school_name || null,
        gender: student.gender || 'male',
        birth_date: student.date_of_birth || null,
        status: student.is_active ? 'approved' : 'inactive',
        synced_to_local_server: true,
        student_code: student.student_code,
        barcode_id: student.barcode_id,
        groups: groupsRes.rows.map((g) => ({
          group_id: g.group_id,
          group_name: g.group_name,
          subject_name: g.subject_name,
          subject_color: g.subject_color,
          teacher_name: g.teacher_name,
          classroom_name: g.classroom_name,
          schedule: Array.isArray(g.schedule) ? g.schedule : [],
        })),
        registered_at: student.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

