const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/db');

async function importScheduleFromDataTxt() {
  const client = await pool.connect();
  try {
    console.log('🚀 Starting import from data.txt...');
    await client.query('BEGIN');

    // 1. Locate and read data.txt
    const dataTxtPath = path.resolve(__dirname, '../../data.txt');
    if (!fs.existsSync(dataTxtPath)) {
      throw new Error(`File not found: ${dataTxtPath}`);
    }
    const rawContent = fs.readFileSync(dataTxtPath, 'utf8');
    const lines = rawContent.split('\n');

    // 2. Fetch grades map
    const gradesRes = await client.query('SELECT id, name_ar, grade_order FROM academic_grades');
    const gradeMap = new Map();
    gradesRes.rows.forEach(g => {
      gradeMap.set(g.name_ar.trim(), g.id);
      if (g.grade_order === 4) gradeMap.set('الصف الرابع الابتدائي', g.id);
      if (g.grade_order === 5) gradeMap.set('الصف الخامس الابتدائي', g.id);
      if (g.grade_order === 6) gradeMap.set('الصف السادس الابتدائي', g.id);
      if (g.grade_order === 7) gradeMap.set('الصف الأول الإعدادي', g.id);
      if (g.grade_order === 8) gradeMap.set('الصف الثاني الإعدادي', g.id);
      if (g.grade_order === 9) gradeMap.set('الصف الثالث الإعدادي', g.id);
      if (g.grade_order === 10) gradeMap.set('الصف الأول الثانوي', g.id);
    });

    // 3. Fetch packages map: key = `${grade_id}_${education_type}`
    const pkgRes = await client.query('SELECT id, grade_id, education_type, name FROM grade_packages');
    const pkgMap = new Map();
    pkgRes.rows.forEach(p => {
      pkgMap.set(`${p.grade_id}_${p.education_type}`, p);
    });

    // 4. Ensure all subjects exist
    const requiredSubjects = [
      { code: 'ARA', name_ar: 'اللغة العربية', color: '#16a34a' },
      { code: 'ENG', name_ar: 'اللغة الإنجليزية', color: '#2563eb' },
      { code: 'MTH', name_ar: 'الرياضيات', color: '#d97706' },
      { code: 'SCI', name_ar: 'العلوم', color: '#0891b2' },
      { code: 'SOC', name_ar: 'الدراسات الاجتماعية', color: '#ca8a04' },
      { code: 'ICT', name_ar: 'تكنولوجيا المعلومات والاتصالات ICT', color: '#7c3aed' },
      { code: 'MATH-EN', name_ar: 'Math (الرياضيات لغات)', color: '#ea580c' },
      { code: 'SCI-EN', name_ar: 'Science (العلوم لغات)', color: '#0284c7' },
      { code: 'FRN', name_ar: 'اللغة الفرنسية', color: '#9333ea' },
      { code: 'SHAR', name_ar: 'العلوم الشرعية والأزهرية', color: '#059669' },
      { code: 'PHIL', name_ar: 'الفلسفة والمنطق', color: '#4f46e5' },
      { code: 'PROG', name_ar: 'البرمجة وعلوم الحاسب', color: '#0d9488' },
      { code: 'INT-SCI', name_ar: 'العلوم المتكاملة (Integrated Science)', color: '#0284c7' },
      { code: 'ITA', name_ar: 'اللغة الإيطالية', color: '#e11d48' },
      { code: 'HIST', name_ar: 'التاريخ', color: '#b45309' },
    ];

    for (const sub of requiredSubjects) {
      await client.query(
        `INSERT INTO subjects (code, name_ar, color)
         VALUES ($1, $2, $3)
         ON CONFLICT (code) DO UPDATE SET name_ar = EXCLUDED.name_ar, color = EXCLUDED.color`,
        [sub.code, sub.name_ar, sub.color]
      );
    }

    const currentSubjectsRes = await client.query('SELECT id, code, name_ar FROM subjects');
    const subjectMap = new Map();
    currentSubjectsRes.rows.forEach(s => {
      subjectMap.set(s.name_ar.trim(), s.id);
      subjectMap.set(s.code.trim(), s.id);
    });

    const getSubjectId = (name) => {
      const n = name.trim();
      if (n.includes('عرب') || n === 'عربي') return subjectMap.get('ARA') || subjectMap.get('اللغة العربية');
      if (n.includes('إنجليز') || n.includes('English')) return subjectMap.get('ENG') || subjectMap.get('اللغة الإنجليزية');
      if (n === 'Math') return subjectMap.get('MATH-EN');
      if (n.includes('رياض')) return subjectMap.get('MTH') || subjectMap.get('الرياضيات');
      if (n === 'Science') return subjectMap.get('SCI-EN');
      if (n.includes('علوم متكاملة') || n.includes('Integrated Science')) return subjectMap.get('INT-SCI');
      if (n.includes('علوم')) return subjectMap.get('SCI') || subjectMap.get('العلوم');
      if (n.includes('دراسات')) return subjectMap.get('SOC') || subjectMap.get('الدراسات الاجتماعية');
      if (n === 'ICT' || n.includes('تكنولوجيا')) return subjectMap.get('ICT') || subjectMap.get('تكنولوجيا المعلومات والاتصالات ICT');
      if (n.includes('فرنس') || n.includes('فرنساوي')) return subjectMap.get('FRN') || subjectMap.get('اللغة الفرنسية');
      if (n.includes('شرع') || n.includes('أزهر')) return subjectMap.get('SHAR');
      if (n.includes('فلسف')) return subjectMap.get('PHIL');
      if (n.includes('برمج')) return subjectMap.get('PROG');
      if (n.includes('إيطال')) return subjectMap.get('ITA');
      if (n.includes('تاريخ')) return subjectMap.get('HIST');
      return subjectMap.get('ARA');
    };

    // 5. Classrooms
    const roomsRes = await client.query('SELECT id, name FROM classrooms ORDER BY name');
    const classroomIds = roomsRes.rows.map(r => r.id);

    // 6. Teacher Cache & Normalizer
    let phoneCounter = 1000;
    const teacherCache = new Map(); // key = normalized name
    const existingTeachers = await client.query('SELECT id, full_name FROM teachers');

    const normalizeTeacherKey = (str) => {
      return str.replace(/[\/\s]/g, '').toLowerCase();
    };

    const standardizeTeacherName = (raw) => {
      let clean = raw.trim();
      // Replace "أ / مروان" with "أ/ مروان", "ميس / دنيا" with "ميس/ دنيا", etc.
      clean = clean.replace(/([أ|ميس|مستر|مسيو])\s*\/\s*/g, '$1/ ');
      clean = clean.replace(/\s+/g, ' ').trim();
      return clean;
    };

    existingTeachers.rows.forEach(t => {
      teacherCache.set(normalizeTeacherKey(t.full_name), t.id);
      teacherCache.set(t.full_name.trim(), t.id);
    });

    const getOrCreateTeacher = async (rawName) => {
      const cleanName = standardizeTeacherName(rawName);
      const key = normalizeTeacherKey(cleanName);
      if (teacherCache.has(key)) return teacherCache.get(key);
      if (teacherCache.has(cleanName)) return teacherCache.get(cleanName);

      phoneCounter++;
      const mockPhone = `01050${phoneCounter.toString().padStart(6, '0')}`;
      const res = await client.query(
        `INSERT INTO teachers (full_name, phone, aka, is_active, notes)
         VALUES ($1, $2, $1, true, 'تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt')
         RETURNING id`,
        [cleanName, mockPhone]
      );
      const newId = res.rows[0].id;
      teacherCache.set(key, newId);
      teacherCache.set(cleanName, newId);
      return newId;
    };

    // 7. Day & Time parse helpers
    const parseDay = (d) => {
      const s = d.replace(/\*/g, '').trim();
      if (s.includes('سبت')) return 'saturday';
      if (s.includes('أحد')) return 'sunday';
      if (s.includes('اثنين') || s.includes('إثنين')) return 'monday';
      if (s.includes('ثلاثاء')) return 'tuesday';
      if (s.includes('أربعاء')) return 'wednesday';
      if (s.includes('خميس')) return 'thursday';
      if (s.includes('جمعة')) return 'friday';
      return 'saturday';
    };

    const convertTo24h = (time) => {
      const t = time.replace(/[مظعص]/g, '').trim();
      const isPM = time.includes('م') || time.includes('ظ') || time.includes('ع');
      const isAM = time.includes('ص');
      const parts = t.split(':').map(p => p.trim());
      let hours = parseInt(parts[0], 10) || 12;
      const mins = parts[1] ? parts[1].padStart(2, '0') : '00';
      if (isPM && hours < 12) hours += 12;
      if (isAM && hours === 12) hours = 0;
      return `${hours.toString().padStart(2, '0')}:${mins}`;
    };

    const parseTimes = (tStr) => {
      const clean = tStr.trim();
      if (clean.includes('-')) {
        const parts = clean.split('-').map(p => p.trim());
        const start = convertTo24h(parts[0]);
        const end = convertTo24h(parts[1]);
        return { start_time: start, end_time: end };
      }
      const start = convertTo24h(clean);
      const [h, m] = start.split(':').map(Number);
      const endH = (h + 1 + Math.floor((m + 30) / 60)) % 24;
      const endM = (m + 30) % 60;
      const end = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
      return { start_time: start, end_time: end };
    };

    // 8. Parse rows from data.txt
    let currentGrade = null;
    const scheduleItems = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line.includes('الصف الرابع')) currentGrade = 'الصف الرابع الابتدائي';
      else if (line.includes('الصف الخامس')) currentGrade = 'الصف الخامس الابتدائي';
      else if (line.includes('الصف السادس')) currentGrade = 'الصف السادس الابتدائي';
      else if (line.includes('الصف الأول الإعدادي')) currentGrade = 'الصف الأول الإعدادي';
      else if (line.includes('الصف الثاني الإعدادي')) currentGrade = 'الصف الثاني الإعدادي';
      else if (line.includes('الصف الثالث الإعدادي')) currentGrade = 'الصف الثالث الإعدادي';
      else if (line.includes('الصف الأول الثانوي')) currentGrade = 'الصف الأول الثانوي';

      if (!line.startsWith('|')) continue;
      const cols = line.split('|').map(c => c.trim()).filter(Boolean);
      if (cols.length < 4) continue;
      if (cols[0].includes('اليوم') || cols[0].includes(':-')) continue;

      const day = cols[0].replace(/\*/g, '').trim();
      const time = cols[1].trim();
      const subject = cols[2].trim();
      const teacher = cols[3].trim();
      const notes = cols[4] ? cols[4].trim() : '';

      if (teacher === '—' || teacher.includes('إجازة')) continue;

      scheduleItems.push({
        grade: currentGrade,
        day,
        time,
        subject,
        teacher,
        notes
      });
    }

    console.log(`Parsed ${scheduleItems.length} schedule rows from data.txt.`);

    // 9. Process and Upsert each group
    let createdGroupsCount = 0;
    let updatedGroupsCount = 0;
    let linkedPackageGroupsCount = 0;

    for (let i = 0; i < scheduleItems.length; i++) {
      const item = scheduleItems[i];
      const gradeId = gradeMap.get(item.grade);
      if (!gradeId) {
        console.warn(`⚠️ Grade not found for: ${item.grade}`);
        continue;
      }

      const subjectId = getSubjectId(item.subject);
      const teacherId = await getOrCreateTeacher(item.teacher);
      const dayEn = parseDay(item.day);
      const { start_time, end_time } = parseTimes(item.time);
      const classroomId = classroomIds[i % classroomIds.length] || null;

      const cleanTeacherName = standardizeTeacherName(item.teacher);
      const groupName = `${item.subject} (${item.day} ${item.time}) - ${cleanTeacherName}`;

      const scheduleJson = JSON.stringify([
        {
          day: dayEn,
          start_time,
          end_time,
        }
      ]);

      // Check if group already exists (by grade, subject, teacher, and schedule)
      const existingGrp = await client.query(
        `SELECT id FROM groups
         WHERE grade_id = $1 AND subject_id = $2 AND teacher_id = $3
           AND (name = $4 OR schedule::text LIKE $5)`,
        [gradeId, subjectId, teacherId, groupName, `%"day":"${dayEn}"%`]
      );

      let groupId;
      if (existingGrp.rows.length > 0) {
        groupId = existingGrp.rows[0].id;
        await client.query(
          `UPDATE groups
           SET name = $1, name_ar = $1, schedule = $2::jsonb, classroom_id = COALESCE(classroom_id, $3),
               is_in_package = true, is_private = false, status = 'active'
           WHERE id = $4`,
          [groupName, scheduleJson, classroomId, groupId]
        );
        updatedGroupsCount++;
      } else {
        const insertGrpRes = await client.query(
          `INSERT INTO groups (
            grade_id, subject_id, teacher_id, classroom_id,
            name, name_ar, schedule, max_students,
            price_per_month, price_per_session, status,
            is_in_package, is_private
          ) VALUES ($1, $2, $3, $4, $5, $5, $6::jsonb, 40, 120.00, 35.00, 'active', true, false)
          RETURNING id`,
          [gradeId, subjectId, teacherId, classroomId, groupName, scheduleJson]
        );
        groupId = insertGrpRes.rows[0].id;
        createdGroupsCount++;
      }

      // Link to appropriate Packages:
      const pkgPublic = pkgMap.get(`${gradeId}_PUBLIC`);
      const pkgLang = pkgMap.get(`${gradeId}_LANGUAGES`);

      const targetPkgs = [];
      const notes = item.notes || '';
      const subj = item.subject || '';

      if (notes.includes('لغات') || notes.includes('English') || subj === 'Science' || subj === 'Math' || subj === 'Integrated Science') {
        if (pkgLang) targetPkgs.push(pkgLang.id);
        // Shared language subjects (like English) also fit public
        if (pkgPublic && (subj.includes('إنجليز') || subj.includes('English') || subj.includes('ICT'))) {
          targetPkgs.push(pkgPublic.id);
        }
      } else if (notes.includes('عربي') || subj === 'علوم' || subj === 'رياضيات') {
        if (pkgPublic) targetPkgs.push(pkgPublic.id);
      } else {
        // Shared or general subjects (like Arabic, Social Studies, History, Philosophy)
        if (pkgPublic) targetPkgs.push(pkgPublic.id);
        if (pkgLang && !['علوم', 'رياضيات'].includes(subj)) {
          targetPkgs.push(pkgLang.id);
        }
      }

      for (const pId of targetPkgs) {
        const linkRes = await client.query(
          `INSERT INTO package_groups (package_id, group_id)
           VALUES ($1, $2)
           ON CONFLICT (package_id, group_id) DO NOTHING
           RETURNING id`,
          [pId, groupId]
        );
        if (linkRes.rows.length > 0) {
          linkedPackageGroupsCount++;
        }
      }
    }

    // 10. Clean up old combined-teacher groups that have NO enrollments
    const cleanCombinedRes = await client.query(
      `SELECT g.id
       FROM groups g
       JOIN teachers t ON g.teacher_id = t.id
       LEFT JOIN group_enrollments ge ON g.id = ge.group_id
       WHERE (t.full_name LIKE '%&%' OR t.full_name LIKE '%،%')
       GROUP BY g.id
       HAVING COUNT(ge.id) = 0`
    );

    const oldCombinedIds = cleanCombinedRes.rows.map(r => r.id);
    if (oldCombinedIds.length > 0) {
      await client.query(
        `DELETE FROM package_groups WHERE group_id = ANY($1::uuid[])`,
        [oldCombinedIds]
      );
      await client.query(
        `UPDATE groups SET status = 'archived', is_in_package = false WHERE id = ANY($1::uuid[])`,
        [oldCombinedIds]
      );
      console.log(`🧹 Cleaned up and archived ${oldCombinedIds.length} old combined-teacher groups.`);
    }

    await client.query('COMMIT');
    console.log(`✅ SUCCESS! Created: ${createdGroupsCount}, Updated: ${updatedGroupsCount} groups.`);
    console.log(`✅ Total distinct teachers: ${teacherCache.size}`);
    console.log(`✅ Linked: ${linkedPackageGroupsCount} new package-group associations.`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error during import:', err);
    throw err;
  } finally {
    client.release();
  }
}

importScheduleFromDataTxt()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
