const express = require('express');
const router = express.Router();
const db = require('./db');
const {
  startWhatsAppClient,
  logoutWhatsAppClient,
  getConnectionState,
  syncWhatsAppGroups,
  createTestGroupWithPartner,
  sendWhatsAppMessage,
  sendDailyPackageSchedules,
} = require('./whatsappClient');
const {
  registerLidMapping,
  syncErpStudentsToChats,
} = require('./optInGuard');
const { buildAllGroupsSchedulePreviews } = require('./packageScheduleJob');
const { getAndRenderTemplate } = require('./templateEngine');

function getStaffUserFromReq(req) {
  if (req.body?.staffUser && req.body.staffUser.name) {
    return req.body.staffUser;
  }
  const headerId = req.headers['x-staff-user-id'] || null;
  const headerName = req.headers['x-staff-user-name']
    ? decodeURIComponent(req.headers['x-staff-user-name'])
    : null;
  const headerRole = req.headers['x-staff-user-role']
    ? decodeURIComponent(req.headers['x-staff-user-role'])
    : null;

  return {
    id: headerId || null,
    name: headerName || 'موظف النظام',
    role: headerRole || 'STAFF',
  };
}

// ============================================================
// 1. STATUS & CONNECTION
// ============================================================
router.get('/status', async (req, res) => {
  try {
    const conn = getConnectionState();
    const settingsRes = await db.query('SELECT * FROM whatsapp_settings WHERE id = 1');
    const statsRes = await db.query(`
      SELECT
        (SELECT COUNT(*)::int FROM whatsapp_chats WHERE last_message_text IS NOT NULL) AS total_chats,
        (SELECT COUNT(*)::int FROM whatsapp_chats) AS total_directory,
        (SELECT COALESCE(SUM(unread_count), 0)::int FROM whatsapp_chats) AS unread_messages,
        (SELECT COUNT(*)::int FROM whatsapp_chats WHERE consent_status = 'OPTED_IN' AND is_group = false) AS opted_in_contacts,
        (SELECT COUNT(*)::int FROM whatsapp_messages_log WHERE direction = 'outgoing' AND created_at >= CURRENT_DATE) AS sent_today,
        (SELECT COUNT(*)::int FROM whatsapp_messages_log) AS total_logs
    `);

    res.json({
      success: true,
      data: {
        connection: conn,
        settings: settingsRes.rows[0] || {},
        stats: statsRes.rows[0] || {},
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/connection/reconnect', async (req, res) => {
  try {
    await startWhatsAppClient(true);
    res.json({
      success: true,
      message: 'جاري تحديث الاتصال...',
      data: getConnectionState(),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/connection/logout', async (req, res) => {
  try {
    await logoutWhatsAppClient();
    res.json({
      success: true,
      message: 'تم تسجيل الخروج ومسح الجلسة بنجاح.',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// 2. LIVE MULTI-AGENT CHATS & WHATSAPP WEB DIRECTORY
// ============================================================
router.get('/chats', async (req, res) => {
  try {
    const { search = '', filter = 'active' } = req.query;
    const params = [];
    let where = 'WHERE 1=1';

    if (search.trim()) {
      params.push(`%${search.trim()}%`);
      where += ` AND (
        contact_name ILIKE $${params.length}
        OR push_name ILIKE $${params.length}
        OR phone ILIKE $${params.length}
        OR student_phone ILIKE $${params.length}
        OR parent_phone ILIKE $${params.length}
        OR student_name ILIKE $${params.length}
        OR CAST(student_code AS TEXT) ILIKE $${params.length}
        OR grade_name ILIKE $${params.length}
      )`;
    } else {
      if (filter === 'active') {
        where += ' AND last_message_text IS NOT NULL AND is_group = false';
      } else if (filter === 'unread') {
        where += ' AND unread_count > 0';
      } else if (filter === 'students') {
        where += ' AND student_id IS NOT NULL AND is_group = false';
      } else if (filter === 'groups') {
        where += ' AND is_group = true';
      } else if (filter === 'opted_in') {
        where += " AND consent_status = 'OPTED_IN' AND is_group = false";
      }
    }

    const orderBy =
      filter === 'students' && !search.trim()
        ? 'ORDER BY (last_message_text IS NOT NULL) DESC, student_code ASC'
        : 'ORDER BY (last_message_text IS NOT NULL) DESC, last_message_at DESC';

    const chatsRes = await db.query(
      `SELECT * FROM whatsapp_chats
       ${where}
       ${orderBy}
       LIMIT 350`,
      params
    );

    res.json({
      success: true,
      data: chatsRes.rows,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/chats/sync-all', async (req, res) => {
  try {
    const studentsSynced = await syncErpStudentsToChats();
    let groupsSynced = 0;
    try {
      const gRes = await syncWhatsAppGroups();
      groupsSynced = gRes.liveGroupsCount || 0;
    } catch {
      // ignore if disconnected
    }

    res.json({
      success: true,
      message: `تمت مزامنة ${studentsSynced} طالب وولي أمر، و ${groupsSynced} جروب واتساب في قائمة الدردشات بنجاح!`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/chats/link-lid', async (req, res) => {
  try {
    const { lidJid, phone } = req.body;
    if (!lidJid || !phone) {
      return res.status(400).json({ success: false, message: 'معرف المحادثة ورقم الهاتف مطلوبان' });
    }
    const mergedJid = await registerLidMapping(lidJid, phone);
    if (!mergedJid) {
      return res.status(400).json({ success: false, message: 'تأكد من صحة رقم الهاتف (01xxxxxxxxx)' });
    }
    res.json({
      success: true,
      message: 'تم ربط المحادثة برقم الهاتف ودمج جميع الرسائل في شات واحد بنجاح!',
      data: { canonicalJid: mergedJid },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/chats/:jid/messages', async (req, res) => {
  try {
    const jid = decodeURIComponent(req.params.jid);

    await db.query('UPDATE whatsapp_chats SET unread_count = 0 WHERE jid = $1', [jid]);

    const chatRes = await db.query('SELECT * FROM whatsapp_chats WHERE jid = $1', [jid]);
    const chat = chatRes.rows[0] || { jid };

    // Fetch messages for both canonical jid and its mapped lid_jid if any
    const jidsToQuery = [jid];
    if (chat.lid_jid && !jidsToQuery.includes(chat.lid_jid)) {
      jidsToQuery.push(chat.lid_jid);
    }

    const msgsRes = await db.query(
      `SELECT * FROM whatsapp_messages_log
       WHERE chat_jid = ANY($1::text[])
       ORDER BY created_at ASC
       LIMIT 400`,
      [jidsToQuery]
    );

    res.json({
      success: true,
      data: {
        chat,
        messages: msgsRes.rows,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/chats/send', async (req, res) => {
  try {
    const staffUser = getStaffUserFromReq(req);
    const {
      targetPhoneOrJid,
      messageText,
      category = 'CHAT_REPLY',
      studentId = null,
      recipientName = null,
    } = req.body;

    if (!targetPhoneOrJid || !messageText || !String(messageText).trim()) {
      return res.status(400).json({
        success: false,
        message: 'رقم المستلم ونص الرسالة مطلوبان',
      });
    }

    const result = await sendWhatsAppMessage({
      targetPhoneOrJid,
      messageText: String(messageText).trim(),
      category,
      isManualStaffReply: true,
      forceBypassConsent: true,
      staffUser,
      studentId,
      recipientName,
    });

    res.json({
      success: true,
      message: `تم إرسال الرسالة بنجاح (مسجلة باسم: ${staffUser.name})`,
      data: result,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/chats/send-student-intro', async (req, res) => {
  try {
    const staffUser = getStaffUserFromReq(req);
    const { studentId } = req.body;
    if (!studentId) {
      return res.status(400).json({ success: false, message: 'معرف الطالب مطلوب' });
    }

    const stRes = await db.query(
      `SELECT s.*, g.name_ar AS grade_name
       FROM students s
       LEFT JOIN academic_grades g ON s.grade_id = g.id
       WHERE s.id = $1`,
      [studentId]
    );
    const student = stRes.rows[0];
    if (!student) {
      return res.status(404).json({ success: false, message: 'الطالب غير موجود' });
    }

    const targetPhone =
      student.father_phone || student.parent_phone || student.mother_phone || student.phone;
    if (!targetPhone) {
      return res.status(400).json({ success: false, message: 'لا يوجد رقم هاتف مسجل لولي أمر هذا الطالب' });
    }

    const rendered = await getAndRenderTemplate('first_handshake_intro', {
      student_name: student.full_name_ar || student.full_name,
      student_code: student.student_code,
      grade_name: student.grade_name || 'غير محدد',
    });

    const result = await sendWhatsAppMessage({
      targetPhoneOrJid: targetPhone,
      messageText: rendered.text,
      category: 'INTRO_HANDSHAKE',
      isManualStaffReply: false,
      staffUser,
      studentId: student.id,
      recipientName: student.full_name_ar || student.full_name,
    });

    if (result.blockedByConsent) {
      return res.status(403).json({
        success: false,
        blockedByConsent: true,
        message: result.message,
      });
    }

    res.json({
      success: true,
      message: 'تم إرسال الرسالة التعريفية الوحيدة لولي الأمر بنجاح',
      data: result,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// 3. STAFF AUDIT LOG
// ============================================================
router.get('/audit-logs', async (req, res) => {
  try {
    const {
      staffName = '',
      category = '',
      direction = '',
      status = '',
      search = '',
      limit = 150,
    } = req.query;

    const params = [];
    let where = 'WHERE 1=1';

    if (staffName.trim()) {
      params.push(staffName.trim());
      where += ` AND sent_by_user_name = $${params.length}`;
    }
    if (category.trim()) {
      params.push(category.trim());
      where += ` AND category = $${params.length}`;
    }
    if (direction.trim()) {
      params.push(direction.trim());
      where += ` AND direction = $${params.length}`;
    }
    if (status.trim()) {
      params.push(status.trim());
      where += ` AND status = $${params.length}`;
    }
    if (search.trim()) {
      params.push(`%${search.trim()}%`);
      where += ` AND (
        recipient_name ILIKE $${params.length}
        OR phone ILIKE $${params.length}
        OR message_text ILIKE $${params.length}
        OR sent_by_user_name ILIKE $${params.length}
      )`;
    }

    params.push(Math.min(500, parseInt(limit, 10) || 150));

    const logsRes = await db.query(
      `SELECT * FROM whatsapp_messages_log
       ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length}`,
      params
    );

    const staffStatsRes = await db.query(`
      SELECT
        COALESCE(sent_by_user_name, 'غير محدد') AS staff_name,
        COALESCE(sent_by_user_role, '') AS staff_role,
        COUNT(*)::int AS total_sent,
        COUNT(*) FILTER (WHERE category = 'CHAT_REPLY')::int AS direct_replies,
        MAX(created_at) AS last_activity_at
      FROM whatsapp_messages_log
      WHERE direction = 'outgoing'
      GROUP BY COALESCE(sent_by_user_name, 'غير محدد'), COALESCE(sent_by_user_role, '')
      ORDER BY total_sent DESC
    `);

    res.json({
      success: true,
      data: {
        logs: logsRes.rows,
        staffSummary: staffStatsRes.rows,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// 4. OFFICIAL 12 GROUPS, TEST GROUPS WITH ABDALLA & DAILY SCHEDULE
// ============================================================
router.get('/groups-config', async (req, res) => {
  try {
    const configsRes = await db.query(`
      SELECT c.*, ag.name_ar AS grade_name
      FROM whatsapp_groups_config c
      LEFT JOIN academic_grades ag ON c.grade_id = ag.id OR c.grade_order = ag.grade_order
      ORDER BY c.display_order ASC
    `);

    const pkgGroupsRes = await db.query(`
      SELECT g.id,
             COALESCE(g.name_ar, g.name) AS group_name,
             g.grade_id,
             ag.grade_order,
             ag.name_ar AS grade_name,
             s.name_ar AS subject_name,
             COALESCE(t.full_name_ar, t.full_name) AS teacher_name,
             g.schedule
      FROM groups g
      JOIN academic_grades ag ON g.grade_id = ag.id
      LEFT JOIN subjects s ON g.subject_id = s.id
      LEFT JOIN teachers t ON g.teacher_id = t.id
      WHERE g.status = 'active'
        AND EXISTS (SELECT 1 FROM package_groups pg WHERE pg.group_id = g.id)
      ORDER BY ag.grade_order ASC, s.name_ar ASC
    `);

    const conn = getConnectionState();

    res.json({
      success: true,
      data: {
        configs: configsRes.rows,
        availablePackageGroups: pkgGroupsRes.rows,
        liveWhatsAppGroups: conn.liveGroups || [],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/groups-config/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      official_name,
      wa_group_jid,
      wa_group_matched_name,
      test_group_jid,
      test_group_name,
      section_label,
      selected_group_ids,
      is_active,
    } = req.body;

    const result = await db.query(
      `UPDATE whatsapp_groups_config
       SET official_name = COALESCE($1, official_name),
           wa_group_jid = CASE WHEN $2::boolean THEN $3 ELSE wa_group_jid END,
           wa_group_matched_name = CASE WHEN $2::boolean THEN $4 ELSE wa_group_matched_name END,
           test_group_jid = CASE WHEN $5::boolean THEN $6 ELSE test_group_jid END,
           test_group_name = CASE WHEN $5::boolean THEN $7 ELSE test_group_name END,
           section_label = COALESCE($8, section_label),
           selected_group_ids = COALESCE($9::jsonb, selected_group_ids),
           is_active = COALESCE($10, is_active)
       WHERE id = $11
       RETURNING *`,
      [
        official_name || null,
        wa_group_jid !== undefined,
        wa_group_jid || null,
        wa_group_matched_name || null,
        test_group_jid !== undefined,
        test_group_jid || null,
        test_group_name || null,
        section_label || null,
        Array.isArray(selected_group_ids) ? JSON.stringify(selected_group_ids) : null,
        typeof is_active === 'boolean' ? is_active : null,
        id,
      ]
    );

    res.json({
      success: true,
      message: 'تم حفظ إعدادات الجروب بنجاح',
      data: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/groups-config/sync-live', async (req, res) => {
  try {
    const syncRes = await syncWhatsAppGroups();
    res.json({
      success: true,
      message: `تم جلب ${syncRes.liveGroupsCount} جروب من الواتساب ومطابقة ${syncRes.matchedCount} جروب رسمي تلقائياً!`,
      data: syncRes,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/groups-config/create-test-group', async (req, res) => {
  try {
    const {
      partnerPhone = '01224385098',
      mode = 'unified',
      configId = null,
    } = req.body;

    const created = await createTestGroupWithPartner({
      partnerPhone,
      mode,
      specificConfigId: configId,
    });

    res.json({
      success: true,
      message:
        mode === 'single'
          ? `تم إنشاء جروب الاختبار (${created.test_group_name}) مع ${partnerPhone} بنجاح!`
          : `تم إنشاء جروب الاختبار المشترك مع عبد الله (${partnerPhone}) وربطه بجميع المراحل الـ ${created.linkedCount} لتجربة الإرسال بأمان!`,
      data: created,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.get('/schedules/preview', async (req, res) => {
  try {
    const { target = 'today', configId = null } = req.query;
    const data = await buildAllGroupsSchedulePreviews(target, configId || null);
    res.json({
      success: true,
      data,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/schedules/send', async (req, res) => {
  try {
    const staffUser = getStaffUserFromReq(req);
    const { target = 'today', configId = null, sendMode = null } = req.body;

    const sendRes = await sendDailyPackageSchedules({
      targetOption: target,
      specificConfigId: configId || null,
      sendMode,
      staffUser,
      isAutoCron: false,
    });

    const modeAr =
      sendRes.mode === 'test'
        ? 'جروب الاختبار (مع عبد الله)'
        : 'جروبات أولياء الأمور الرسمية';
    const skippedNote =
      sendRes.skippedCount > 0
        ? ` (تم تخطي ${sendRes.skippedCount} جروب لعدم وجود حصص مقررة اليوم)`
        : '';
    res.json({
      success: true,
      message: `تم إرسال جدول الباكدج إلى ${sendRes.sentCount} جروب في [${modeAr}] بنجاح!${skippedNote}`,
      data: sendRes,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ============================================================
// 5. TEMPLATES & SETTINGS
// ============================================================
router.get('/templates', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM whatsapp_templates ORDER BY key ASC');
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/templates/:key', async (req, res) => {
  try {
    const staffUser = getStaffUserFromReq(req);
    const { key } = req.params;
    const { title_ar, body_template, is_approved, is_enabled } = req.body;

    const result = await db.query(
      `UPDATE whatsapp_templates
       SET title_ar = COALESCE($1, title_ar),
           body_template = COALESCE($2, body_template),
           is_approved = COALESCE($3, is_approved),
           is_enabled = COALESCE($4, is_enabled),
           updated_by_name = $5,
           updated_at = NOW()
       WHERE key = $6
       RETURNING *`,
      [
        title_ar || null,
        body_template || null,
        typeof is_approved === 'boolean' ? is_approved : null,
        typeof is_enabled === 'boolean' ? is_enabled : null,
        staffUser.name,
        key,
      ]
    );

    res.json({
      success: true,
      message: 'تم حفظ وتحديث القالب بنجاح',
      data: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/settings', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM whatsapp_settings WHERE id = 1');
    res.json({
      success: true,
      data: result.rows[0] || {},
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const staffUser = getStaffUserFromReq(req);
    const {
      is_enabled,
      is_paused,
      auto_send_daily_schedule,
      daily_schedule_send_time,
      daily_schedule_target,
      schedule_send_mode,
      test_partner_phone,
      strict_opt_in_only,
      allow_single_intro_message,
      min_delay_seconds,
      max_delay_seconds,
      group_delay_seconds,
      batch_size,
      batch_cooldown_seconds,
      daily_limit,
      quiet_hours_enabled,
      quiet_hours_start,
      quiet_hours_end,
      center_whatsapp_phone,
      center_support_phone,
    } = req.body;

    const result = await db.query(
      `UPDATE whatsapp_settings
       SET is_enabled = COALESCE($1, is_enabled),
           is_paused = COALESCE($2, is_paused),
           auto_send_daily_schedule = COALESCE($3, auto_send_daily_schedule),
           daily_schedule_send_time = COALESCE($4, daily_schedule_send_time),
           daily_schedule_target = COALESCE($5, daily_schedule_target),
           schedule_send_mode = COALESCE($6, schedule_send_mode),
           test_partner_phone = COALESCE($7, test_partner_phone),
           strict_opt_in_only = COALESCE($8, strict_opt_in_only),
           allow_single_intro_message = COALESCE($9, allow_single_intro_message),
           min_delay_seconds = COALESCE($10, min_delay_seconds),
           max_delay_seconds = COALESCE($11, max_delay_seconds),
           group_delay_seconds = COALESCE($12, group_delay_seconds),
           batch_size = COALESCE($13, batch_size),
           batch_cooldown_seconds = COALESCE($14, batch_cooldown_seconds),
           daily_limit = COALESCE($15, daily_limit),
           quiet_hours_enabled = COALESCE($16, quiet_hours_enabled),
           quiet_hours_start = COALESCE($17, quiet_hours_start),
           quiet_hours_end = COALESCE($18, quiet_hours_end),
           center_whatsapp_phone = COALESCE($19, center_whatsapp_phone),
           center_support_phone = COALESCE($20, center_support_phone),
           updated_by_name = $21,
           updated_at = NOW()
       WHERE id = 1
       RETURNING *`,
      [
        typeof is_enabled === 'boolean' ? is_enabled : null,
        typeof is_paused === 'boolean' ? is_paused : null,
        typeof auto_send_daily_schedule === 'boolean' ? auto_send_daily_schedule : null,
        daily_schedule_send_time || null,
        daily_schedule_target || null,
        schedule_send_mode || null,
        test_partner_phone || null,
        typeof strict_opt_in_only === 'boolean' ? strict_opt_in_only : null,
        typeof allow_single_intro_message === 'boolean' ? allow_single_intro_message : null,
        min_delay_seconds !== undefined ? Number(min_delay_seconds) : null,
        max_delay_seconds !== undefined ? Number(max_delay_seconds) : null,
        group_delay_seconds !== undefined ? Number(group_delay_seconds) : null,
        batch_size !== undefined ? Number(batch_size) : null,
        batch_cooldown_seconds !== undefined ? Number(batch_cooldown_seconds) : null,
        daily_limit !== undefined ? Number(daily_limit) : null,
        typeof quiet_hours_enabled === 'boolean' ? quiet_hours_enabled : null,
        quiet_hours_start || null,
        quiet_hours_end || null,
        center_whatsapp_phone || null,
        center_support_phone || null,
        staffUser.name,
      ]
    );

    res.json({
      success: true,
      message: 'تم حفظ الإعدادات بنجاح',
      data: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
