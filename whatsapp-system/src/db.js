require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME || 'atlas_erp_local',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
  max: 15,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('❌ [WhatsApp DB] Pool Error:', err.message);
});

const OFFICIAL_GROUPS = [
  {
    order: 1,
    name: 'أكاديمية أطلس الصف الرابع الابتدائي 2026',
    grade_order: 4,
    section_label: 'الكل',
  },
  {
    order: 2,
    name: 'أكاديمية أطلس الصف الأول الاعدادي بنات 2026/2027',
    grade_order: 7,
    section_label: 'بنات',
  },
  {
    order: 3,
    name: 'أكاديمية أطلس الصف الخامس الابتدائي 2026',
    grade_order: 5,
    section_label: 'الكل',
  },
  {
    order: 4,
    name: 'أكاديمية أطلس الصف الأول الاعدادي 2026',
    grade_order: 7,
    section_label: 'بنين / عام',
  },
  {
    order: 5,
    name: 'أكاديمية أطلس الصف السادس الابتدائي 2026',
    grade_order: 6,
    section_label: 'الكل',
  },
  {
    order: 6,
    name: 'اكاديمية اطلس الصف الثالث الاعدادي بنات 2026',
    grade_order: 9,
    section_label: 'بنات',
  },
  {
    order: 7,
    name: 'اكاديميه اطلس الصف الثالث الاعدادي 2026',
    grade_order: 9,
    section_label: 'بنين / عام',
  },
  {
    order: 8,
    name: 'اكاديميه اطلس الصف الاول ثانوي ولاد 2026',
    grade_order: 10,
    section_label: 'ولاد',
  },
  {
    order: 9,
    name: 'اكاديميه أطلس الصف الاول ثانوي بنات2026',
    grade_order: 10,
    section_label: 'بنات',
  },
  {
    order: 10,
    name: 'أكاديمية أطلس الصف الثاني الاعدادي 2026',
    grade_order: 8,
    section_label: 'الكل',
  },
  {
    order: 11,
    name: 'اكاديميه اطلس الصف الثاني الثانوي بنين 2026',
    grade_order: 11,
    section_label: 'بنين',
  },
  {
    order: 12,
    name: 'اكاديمية اطلس الصف الثاني الثانوي بنات2026',
    grade_order: 11,
    section_label: 'بنات',
  },
];

const DEFAULT_TEMPLATES = [
  {
    key: 'daily_package_schedule',
    title_ar: '📅 قالب جدول مواعيد الباكدج اليومي للجروبات',
    description_ar: 'يُرسل يومياً على جروبات المراحل الرسمية (أو جروبات الاختبار) بمواعيد حصص الباكدج.',
    body_template: `📢 *جدول مواعيد حصص الباكدج — {grade_name}* ({section_label})
🗓️ *اليوم:* {day_name} الموافق {date}
━━━━━━━━━━━━━━━━━━━━
{schedule_list}
━━━━━━━━━━━━━━━━━━━━
⚠️ *تنبيه هام:* يرجى إحضار الكارنيه الذكي أو كود الطالب لتسجيل الحضور على البوابة.
📞 شؤون الطلاب: {center_phone}
✨ *أكاديمية أطلس التعليمية* ✨`,
    variables_list: [
      '{grade_name}',
      '{section_label}',
      '{day_name}',
      '{date}',
      '{schedule_list}',
      '{center_phone}',
      '{group_name}',
    ],
  },
  {
    key: 'first_handshake_intro',
    title_ar: '👋 الرسالة التعريفية الأولى لولي الأمر (تُرسل مرة واحدة فقط)',
    description_ar: 'تُرسل مرة واحدة فقط لولي الأمر الجديد؛ وإذا لم يرد عليها لا يرسل له السيستم أي رسائل أخرى تلقائياً منعاً للإزعاج.',
    body_template: `مرحباً بحضرتك من *أكاديمية أطلس التعليمية* 👋✨

تم تسجيل رقم حضرتك كولي أمر للطالب: *{student_name}*
🪪 كود الطالب الرسمي: *#{student_code}*
🎓 المرحلة: *{grade_name}*

💡 لتأكيد رغبتك في استلام إشعارات الحضور والغياب والدرجات ومواعيد الحصص على الواتساب، يرجى *الرد على هذه الرسالة بكلمة (تفعيل) أو (تمام)*.
*(في حال عدم الرد لن نقوم بإزعاج حضرتك بأي رسائل تلقائية أخرى).*

📞 للاستفسار: {center_phone}`,
    variables_list: ['{student_name}', '{student_code}', '{grade_name}', '{center_phone}'],
  },
  {
    key: 'absence_notice',
    title_ar: '🚨 إشعار غياب طالب عن الحصة',
    description_ar: 'يُرسل لولي الأمر المفعّل عند تسجيل غياب الطالب عن حصته.',
    body_template: `تنبيه من *أكاديمية أطلس التعليمية* 📋

نحيط سيادتكم علماً بتسجيل *غياب* الطالب: *{student_name}* (كود #{student_code})
📚 المادة: *{subject_name}* — *{teacher_name}*
🗓️ اليوم: {day_name} ({date}) — الساعة {time}

يرجى المتابعة، وفي حال وجود عذر يرجى التواصل مع شؤون الطلاب: {center_phone}`,
    variables_list: [
      '{student_name}',
      '{student_code}',
      '{subject_name}',
      '{teacher_name}',
      '{day_name}',
      '{date}',
      '{time}',
      '{center_phone}',
    ],
  },
  {
    key: 'session_cancelled',
    title_ar: '❌ إشعار إلغاء أو تأجيل حصة',
    description_ar: 'يُرسل عند اعتذار المدرس أو إلغاء الحصة لإبلاغ الطلاب وأولياء الأمور.',
    body_template: `⚠️ *تنويه هام — إلغاء حصة اليوم*
طلاب وأولياء أمور *{grade_name}* الكرام،

نود إبلاغكم بإلغاء حصة مادة *{subject_name}* مع *{teacher_name}*
المقررة يوم {day_name} ({date}) الساعة {time}.
📌 السبب: {reason}

سيتم إبلاغكم بموعد التعويض قريباً.
📞 شؤون الطلاب: {center_phone}`,
    variables_list: [
      '{grade_name}',
      '{subject_name}',
      '{teacher_name}',
      '{day_name}',
      '{date}',
      '{time}',
      '{reason}',
      '{center_phone}',
    ],
  },
  {
    key: 'exam_grade_notice',
    title_ar: '🏆 إشعار درجة امتحان أو شهادة تقييم',
    description_ar: 'يُرسل لولي الأمر بدرجة الطالب في الامتحان أو التقييم الشهري.',
    body_template: `📊 *تقرير درجات الطالب — أكاديمية أطلس* 🌟

👤 اسم الطالب: *{student_name}* (كود #{student_code})
📚 المادة / التقييم: *{subject_name}* ({exam_title})
🎯 الدرجة: *{score} من {max_score}*
🏅 التقدير: *{grade_badge}*

نتمنى لبطلنا دوام التفوق والنجاح! 🎓
📞 شؤون الطلاب: {center_phone}`,
    variables_list: [
      '{student_name}',
      '{student_code}',
      '{subject_name}',
      '{exam_title}',
      '{score}',
      '{max_score}',
      '{grade_badge}',
      '{center_phone}',
    ],
  },
];

async function initWhatsAppDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Settings Table (Single row ID = 1, daily_limit = 0 means unlimited!)
    await client.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_settings (
        id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
        is_enabled BOOLEAN DEFAULT true,
        is_paused BOOLEAN DEFAULT false,
        auto_send_daily_schedule BOOLEAN DEFAULT false,
        daily_schedule_send_time VARCHAR(10) DEFAULT '20:00',
        daily_schedule_target VARCHAR(20) DEFAULT 'tomorrow',
        schedule_send_mode VARCHAR(20) DEFAULT 'test',
        test_partner_phone VARCHAR(30) DEFAULT '01224385098',
        last_auto_schedule_run_date VARCHAR(20),
        strict_opt_in_only BOOLEAN DEFAULT true,
        allow_single_intro_message BOOLEAN DEFAULT true,
        min_delay_seconds INTEGER DEFAULT 8,
        max_delay_seconds INTEGER DEFAULT 18,
        group_delay_seconds INTEGER DEFAULT 5,
        batch_size INTEGER DEFAULT 25,
        batch_cooldown_seconds INTEGER DEFAULT 120,
        daily_limit INTEGER DEFAULT 0,
        sent_today_count INTEGER DEFAULT 0,
        sent_today_date DATE DEFAULT CURRENT_DATE,
        quiet_hours_enabled BOOLEAN DEFAULT true,
        quiet_hours_start VARCHAR(10) DEFAULT '23:00',
        quiet_hours_end VARCHAR(10) DEFAULT '07:30',
        center_whatsapp_phone VARCHAR(30) DEFAULT '201288817183',
        center_support_phone VARCHAR(30) DEFAULT '01288817183',
        updated_by_name VARCHAR(150),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      ALTER TABLE whatsapp_settings
        ADD COLUMN IF NOT EXISTS schedule_send_mode VARCHAR(20) DEFAULT 'test',
        ADD COLUMN IF NOT EXISTS test_partner_phone VARCHAR(30) DEFAULT '01224385098';
    `);

    await client.query(`
      INSERT INTO whatsapp_settings (id, daily_limit, schedule_send_mode, test_partner_phone)
      VALUES (1, 0, 'test', '01224385098')
      ON CONFLICT (id) DO UPDATE SET
        daily_limit = 0,
        test_partner_phone = COALESCE(whatsapp_settings.test_partner_phone, '01224385098');
    `);

    // 2. LID to Phone JID Persistent Map Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_lid_map (
        lid_jid VARCHAR(120) PRIMARY KEY,
        pn_jid VARCHAR(120) NOT NULL,
        phone VARCHAR(40),
        contact_name VARCHAR(250),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_wa_lid_map_pn ON whatsapp_lid_map(pn_jid);
    `);

    // Seed Abdalla's known LID mapping (136996756410479@lid <-> 201224385098@s.whatsapp.net)
    await client.query(`
      INSERT INTO whatsapp_lid_map (lid_jid, pn_jid, phone, contact_name, updated_at)
      VALUES ('136996756410479@lid', '201224385098@s.whatsapp.net', '01224385098', 'Abdalla', NOW())
      ON CONFLICT (lid_jid) DO UPDATE SET
        pn_jid = EXCLUDED.pn_jid,
        phone = EXCLUDED.phone,
        updated_at = NOW();
    `);

    // 3. Official Groups Config Table (with Test Group support!)
    await client.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_groups_config (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        display_order INTEGER DEFAULT 1,
        official_name VARCHAR(250) NOT NULL,
        wa_group_jid VARCHAR(120),
        wa_group_matched_name VARCHAR(250),
        test_group_jid VARCHAR(120),
        test_group_name VARCHAR(250),
        grade_order INTEGER,
        grade_id UUID,
        section_label VARCHAR(100) DEFAULT 'الكل',
        selected_group_ids JSONB DEFAULT '[]'::jsonb,
        is_active BOOLEAN DEFAULT true,
        last_sent_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      ALTER TABLE whatsapp_groups_config
        ADD COLUMN IF NOT EXISTS test_group_jid VARCHAR(120),
        ADD COLUMN IF NOT EXISTS test_group_name VARCHAR(250);
    `);

    // Ensure all 12 official groups exist
    const gradesRes = await client.query('SELECT id, grade_order FROM academic_grades');
    const gradeMap = new Map(gradesRes.rows.map((r) => [r.grade_order, r.id]));

    for (const g of OFFICIAL_GROUPS) {
      const exists = await client.query(
        'SELECT id FROM whatsapp_groups_config WHERE display_order = $1 OR official_name = $2 LIMIT 1',
        [g.order, g.name]
      );
      if (exists.rows.length === 0) {
        const gradeId = gradeMap.get(g.grade_order) || null;
        await client.query(
          `INSERT INTO whatsapp_groups_config (display_order, official_name, grade_order, grade_id, section_label, is_active)
           VALUES ($1, $2, $3, $4, $5, true)`,
          [g.order, g.name, g.grade_order, gradeId, g.section_label]
        );
      }
    }

    // 4. WhatsApp Chats & Contact Consent Table (with student_phone & parent_phone & lid_jid)
    await client.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_chats (
        jid VARCHAR(120) PRIMARY KEY,
        lid_jid VARCHAR(120),
        phone VARCHAR(40),
        student_phone VARCHAR(40),
        parent_phone VARCHAR(40),
        contact_name VARCHAR(250),
        push_name VARCHAR(250),
        is_group BOOLEAN DEFAULT false,
        student_id UUID,
        student_name VARCHAR(250),
        student_code INTEGER,
        grade_name VARCHAR(150),
        consent_status VARCHAR(30) DEFAULT 'NEW',
        intro_sent_count INTEGER DEFAULT 0,
        intro_sent_at TIMESTAMPTZ,
        opted_in_at TIMESTAMPTZ,
        unread_count INTEGER DEFAULT 0,
        last_message_text TEXT,
        last_message_dir VARCHAR(15),
        last_message_by VARCHAR(150),
        last_message_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      ALTER TABLE whatsapp_chats
        ADD COLUMN IF NOT EXISTS lid_jid VARCHAR(120),
        ADD COLUMN IF NOT EXISTS student_phone VARCHAR(40),
        ADD COLUMN IF NOT EXISTS parent_phone VARCHAR(40);
    `);

    // 5. WhatsApp Messages & Staff Audit Log Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_messages_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        wa_message_id VARCHAR(150),
        chat_jid VARCHAR(120) NOT NULL,
        phone VARCHAR(40),
        recipient_name VARCHAR(250),
        direction VARCHAR(15) NOT NULL,
        category VARCHAR(40) DEFAULT 'CHAT_REPLY',
        message_text TEXT NOT NULL,
        status VARCHAR(30) DEFAULT 'sent',
        error_message TEXT,
        student_id UUID,
        group_id UUID,
        sent_by_user_id UUID,
        sent_by_user_name VARCHAR(150),
        sent_by_user_role VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_wa_messages_chat_jid ON whatsapp_messages_log(chat_jid, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_wa_messages_staff ON whatsapp_messages_log(sent_by_user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_wa_chats_last_msg ON whatsapp_chats(last_message_at DESC);
    `);

    // 6. Clean up & Merge any split LID chats into their Canonical Phone JID chats
    // Merge 136996756410479@lid and 136996756410479@s.whatsapp.net into 201224385098@s.whatsapp.net
    await client.query(`
      UPDATE whatsapp_messages_log
      SET chat_jid = '201224385098@s.whatsapp.net',
          phone = '01224385098',
          recipient_name = 'Abdalla (01224385098)'
      WHERE chat_jid IN ('136996756410479@lid', '136996756410479@s.whatsapp.net');

      DELETE FROM whatsapp_messages_log
      WHERE status IN ('blocked_consent', 'failed')
        AND chat_jid = '201224385098@s.whatsapp.net';

      DELETE FROM whatsapp_chats
      WHERE jid IN ('136996756410479@lid', '136996756410479@s.whatsapp.net');

      UPDATE whatsapp_chats
      SET lid_jid = '136996756410479@lid',
          phone = '01224385098',
          push_name = COALESCE(NULLIF(push_name, ''), 'Abdalla'),
          consent_status = 'OPTED_IN',
          opted_in_at = COALESCE(opted_in_at, NOW())
      WHERE jid = '201224385098@s.whatsapp.net';

      -- For any remaining @lid chat whose phone column was set to the raw 15-digit LID number, clear the bogus phone display
      UPDATE whatsapp_chats
      SET phone = NULL
      WHERE jid LIKE '%@lid' AND length(COALESCE(phone, '')) >= 13;
    `);

    // 7. WhatsApp Templates Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_templates (
        key VARCHAR(60) PRIMARY KEY,
        title_ar VARCHAR(200) NOT NULL,
        description_ar TEXT,
        body_template TEXT NOT NULL,
        variables_list JSONB DEFAULT '[]'::jsonb,
        is_approved BOOLEAN DEFAULT false,
        is_enabled BOOLEAN DEFAULT false,
        updated_by_name VARCHAR(150),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    for (const tpl of DEFAULT_TEMPLATES) {
      await client.query(
        `INSERT INTO whatsapp_templates (key, title_ar, description_ar, body_template, variables_list, is_approved, is_enabled)
         VALUES ($1, $2, $3, $4, $5, false, false)
         ON CONFLICT (key) DO NOTHING`,
        [tpl.key, tpl.title_ar, tpl.description_ar, tpl.body_template, JSON.stringify(tpl.variables_list)]
      );
    }

    await client.query('COMMIT');
    console.log('✅ [WhatsApp DB] Schema, LID Mappings & 12 Official Groups initialized.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ [WhatsApp DB] Initialization failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  initWhatsAppDatabase,
};
