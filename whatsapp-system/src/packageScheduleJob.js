const db = require('./db');
const { getAndRenderTemplate } = require('./templateEngine');

const DAY_NAMES_AR = {
  saturday: 'السبت',
  sunday: 'الأحد',
  monday: 'الاثنين',
  tuesday: 'الثلاثاء',
  wednesday: 'الأربعاء',
  thursday: 'الخميس',
  friday: 'الجمعة',
};

const JS_DAY_TO_KEY = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

const NUMBER_EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

/**
 * Normalizes Arabic text for fuzzy matching of WhatsApp group names
 * (e.g. "اكاديميه اطلس" === "أكاديمية أطلس")
 */
function normalizeArabicName(str = '') {
  return String(str || '')
    .trim()
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove tashkeel
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/**
 * Converts "16:30" (24h) to "04:30 م" (Arabic 12h)
 */
function formatTime12Ar(time24 = '') {
  if (!time24 || !time24.includes(':')) return time24;
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  if (Number.isNaN(h)) return time24;
  const period = h >= 12 ? 'م' : 'ص';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${mStr.slice(0, 2)} ${period}`;
}

/**
 * Resolves target date ('today' | 'tomorrow' | 'YYYY-MM-DD') in Cairo timezone
 */
function resolveTargetDateInfo(targetOption = 'today') {
  const now = new Date();
  // Get Cairo local date parts
  const cairoNowStr = now.toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' }); // YYYY-MM-DD
  const baseDate = new Date(`${cairoNowStr}T12:00:00Z`);

  if (targetOption === 'tomorrow') {
    baseDate.setUTCDate(baseDate.getUTCDate() + 1);
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(targetOption)) {
    const custom = new Date(`${targetOption}T12:00:00Z`);
    if (!Number.isNaN(custom.getTime())) {
      baseDate.setTime(custom.getTime());
    }
  }

  const isoDate = baseDate.toISOString().slice(0, 10);
  const dayKey = JS_DAY_TO_KEY[baseDate.getUTCDay()];
  const dayNameAr = DAY_NAMES_AR[dayKey] || dayKey;
  const formattedDateAr = baseDate.toLocaleDateString('ar-EG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return {
    isoDate,
    dayKey,
    dayNameAr,
    formattedDateAr,
  };
}

/**
 * Auto-matches live WhatsApp groups from Baileys with the 10 official Atlas groups
 */
async function autoMatchOfficialGroups(participatingGroups = []) {
  const configsRes = await db.query(
    'SELECT * FROM whatsapp_groups_config ORDER BY display_order ASC'
  );
  const configs = configsRes.rows;

  const liveNormalized = participatingGroups.map((g) => ({
    ...g,
    normSubject: normalizeArabicName(g.subject || g.name || ''),
  }));

  let matchedCount = 0;

  for (const cfg of configs) {
    const normOfficial = normalizeArabicName(cfg.official_name);
    // Exact normalized match first, then substring match
    let found = liveNormalized.find((lg) => lg.normSubject === normOfficial);

    if (!found) {
      // Strip year suffix 2026/2027 for flexible match if needed
      const coreOfficial = normOfficial.replace(/202\d(\/202\d)?/g, '').trim();
      found = liveNormalized.find((lg) => {
        const coreLive = lg.normSubject.replace(/202\d(\/202\d)?/g, '').trim();
        return coreLive === coreOfficial;
      });
    }

    if (found) {
      await db.query(
        `UPDATE whatsapp_groups_config
         SET wa_group_jid = $1, wa_group_matched_name = $2
         WHERE id = $3`,
        [found.id, found.subject || found.name, cfg.id]
      );
      matchedCount++;
    }
  }

  return {
    totalConfigured: configs.length,
    matchedCount,
  };
}

/**
 * Builds the daily package schedule preview for all 10 configured groups (or a specific one)
 */
async function buildAllGroupsSchedulePreviews(targetOption = 'today', specificConfigId = null) {
  const dateInfo = resolveTargetDateInfo(targetOption);

  let cfgQuery = `
    SELECT c.*, ag.name_ar AS grade_name
    FROM whatsapp_groups_config c
    LEFT JOIN academic_grades ag ON c.grade_id = ag.id OR c.grade_order = ag.grade_order
  `;
  const cfgParams = [];
  if (specificConfigId) {
    cfgQuery += ' WHERE c.id = $1';
    cfgParams.push(specificConfigId);
  }
  cfgQuery += ' ORDER BY c.display_order ASC';

  const configsRes = await db.query(cfgQuery, cfgParams);

  // Fetch all active Package groups across grades
  const pkgGroupsRes = await db.query(`
    SELECT g.id,
           COALESCE(g.name_ar, g.name) AS group_name,
           g.grade_id,
           ag.grade_order,
           ag.name_ar AS grade_name,
           g.schedule,
           s.name_ar AS subject_name,
           COALESCE(t.full_name_ar, t.full_name) AS teacher_name,
           COALESCE(cr.name_ar, cr.name) AS classroom_name
    FROM groups g
    JOIN academic_grades ag ON g.grade_id = ag.id
    LEFT JOIN subjects s ON g.subject_id = s.id
    LEFT JOIN teachers t ON g.teacher_id = t.id
    LEFT JOIN classrooms cr ON g.classroom_id = cr.id
    WHERE g.status = 'active'
      AND EXISTS (SELECT 1 FROM package_groups pg WHERE pg.group_id = g.id)
    ORDER BY ag.grade_order ASC, s.name_ar ASC
  `);

  // Check cancelled sessions on that date
  let cancelledMap = new Map();
  try {
    const cancelRes = await db.query(
      `SELECT group_id, reason FROM cancelled_sessions WHERE session_date = $1`,
      [dateInfo.isoDate]
    );
    for (const row of cancelRes.rows) {
      cancelledMap.set(row.group_id, row.reason || 'اعتذار المدرس');
    }
  } catch {
    // ignore if cancelled_sessions column differs
  }

  const allPackageGroups = pkgGroupsRes.rows;
  const previews = [];

  for (const cfg of configsRes.rows) {
    const selectedIds = Array.isArray(cfg.selected_group_ids) ? cfg.selected_group_ids : [];

    // Filter package groups belonging to this WhatsApp group's grade (and optional selected_group_ids)
    const matchingGroups = allPackageGroups.filter((pg) => {
      const sameGrade = pg.grade_id === cfg.grade_id || pg.grade_order === cfg.grade_order;
      if (!sameGrade) return false;
      if (selectedIds.length > 0) {
        return selectedIds.includes(pg.id);
      }
      return true;
    });

    // Extract slots for dateInfo.dayKey
    const daySessions = [];
    for (const grp of matchingGroups) {
      let sched = [];
      try {
        sched = Array.isArray(grp.schedule)
          ? grp.schedule
          : typeof grp.schedule === 'string'
          ? JSON.parse(grp.schedule)
          : [];
      } catch {
        sched = [];
      }

      for (const slot of sched) {
        if ((slot.day || '').toLowerCase() === dateInfo.dayKey) {
          daySessions.push({
            group_id: grp.id,
            group_name: grp.group_name,
            subject_name: grp.subject_name || grp.group_name,
            teacher_name: grp.teacher_name || 'غير محدد',
            classroom_name: grp.classroom_name || 'القاعة الرئيسية',
            start_time: slot.start_time || '00:00',
            end_time: slot.end_time || '00:00',
            is_cancelled: cancelledMap.has(grp.id),
            cancel_reason: cancelledMap.get(grp.id) || null,
          });
        }
      }
    }

    // Sort chronologically by start_time
    daySessions.sort((a, b) => a.start_time.localeCompare(b.start_time));

    let scheduleListText = '';
    const hasSessions = daySessions.length > 0;
    if (!hasSessions) {
      scheduleListText = '🌴 *لا توجد حصص باكدج مقررة في هذا اليوم (عطلة).*';
    } else {
      scheduleListText = daySessions
        .map((sess, idx) => {
          const numIcon = NUMBER_EMOJIS[idx] || `${idx + 1}.`;
          const timeRange = `من ${formatTime12Ar(sess.start_time)} إلى ${formatTime12Ar(sess.end_time)}`;
          if (sess.is_cancelled) {
            return `${numIcon} ~*${sess.subject_name}* — ${sess.teacher_name}~\n   ❌ *ملغاة اليوم* (${sess.cancel_reason})`;
          }
          // لا نرسل القاعة في الجدول بناءً على طلب الإدارة
          return `${numIcon} *${sess.subject_name}* — ${sess.teacher_name}\n   ⏰ ${timeRange}`;
        })
        .join('\n\n');
    }

    const rendered = await getAndRenderTemplate('daily_package_schedule', {
      grade_name: cfg.grade_name || cfg.official_name,
      section_label: cfg.section_label || 'الكل',
      group_name: cfg.official_name,
      day_name: dateInfo.dayNameAr,
      date: dateInfo.formattedDateAr,
      schedule_list: scheduleListText,
    });

    previews.push({
      config_id: cfg.id,
      display_order: cfg.display_order,
      official_name: cfg.official_name,
      wa_group_jid: cfg.wa_group_jid,
      wa_group_matched_name: cfg.wa_group_matched_name,
      test_group_jid: cfg.test_group_jid,
      test_group_name: cfg.test_group_name,
      grade_id: cfg.grade_id,
      grade_order: cfg.grade_order,
      grade_name: cfg.grade_name,
      section_label: cfg.section_label,
      selected_group_ids: selectedIds,
      is_active: cfg.is_active,
      last_sent_at: cfg.last_sent_at,
      date_info: dateInfo,
      sessions_count: daySessions.length,
      has_sessions: hasSessions,
      sessions: daySessions,
      message_preview: rendered.text,
      template_is_approved: rendered.isApproved,
    });
  }

  return {
    date_info: dateInfo,
    groups: previews,
  };
}

module.exports = {
  normalizeArabicName,
  formatTime12Ar,
  resolveTargetDateInfo,
  autoMatchOfficialGroups,
  buildAllGroupsSchedulePreviews,
};

