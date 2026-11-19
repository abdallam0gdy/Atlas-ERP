const db = require('./db');

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const lidToPnCache = new Map(); // lid_jid -> pn_jid

function toEnglishDigits(str = '') {
  return String(str).replace(/[٠-٩]/g, (d) => ARABIC_DIGITS.indexOf(d));
}

/**
 * Loads all saved LID -> PN mappings into memory on startup
 */
async function loadLidMapIntoMemory() {
  try {
    const res = await db.query('SELECT lid_jid, pn_jid FROM whatsapp_lid_map');
    for (const row of res.rows) {
      if (row.lid_jid && row.pn_jid) {
        lidToPnCache.set(row.lid_jid, row.pn_jid);
      }
    }
  } catch (err) {
    console.warn('Could not load whatsapp_lid_map:', err.message);
  }
}

/**
 * Normalizes any Egyptian phone number, Group JID, or WhatsApp LID
 * Never turns an @lid into @s.whatsapp.net unless mapped!
 */
function normalizeEgyptPhone(rawInput = '') {
  const raw = toEnglishDigits(String(rawInput || '').trim());
  if (!raw) return null;

  // 1. Group JID
  if (raw.endsWith('@g.us')) {
    return {
      isGroup: true,
      isLid: false,
      jid: raw,
      localPhone: null,
      waNumber: raw.replace('@g.us', ''),
    };
  }

  const beforeAt = raw.split('@')[0].split(':')[0];
  let digits = beforeAt.replace(/\D/g, '');
  if (!digits) return null;

  // 2. Check if this is an @lid OR a 13+ digit LID number (not an Egyptian 201... number)
  const isExplicitLid = raw.endsWith('@lid');
  const isImplicitLidNumber =
    digits.length >= 13 && !digits.startsWith('201') && !digits.startsWith('00201');

  if (isExplicitLid || isImplicitLidNumber) {
    const lidJid = `${digits}@lid`;
    const mappedPnJid = lidToPnCache.get(lidJid);
    if (mappedPnJid) {
      return normalizeEgyptPhone(mappedPnJid);
    }
    return {
      isGroup: false,
      isLid: true,
      jid: lidJid,
      lidJid,
      localPhone: null, // Never display 15-digit LID as a phone number!
      waNumber: digits,
    };
  }

  // 3. Standard Egyptian / Phone JID
  if (digits.startsWith('0020')) {
    digits = digits.slice(2);
  }
  if (digits.startsWith('01') && digits.length === 11) {
    digits = '2' + digits;
  } else if (digits.startsWith('1') && digits.length === 10) {
    digits = '20' + digits;
  }

  const localPhone =
    digits.startsWith('201') && digits.length === 12 ? digits.slice(1) : digits;

  return {
    isGroup: false,
    isLid: false,
    jid: `${digits}@s.whatsapp.net`,
    localPhone,
    waNumber: digits,
  };
}

/**
 * Registers a mapping between a WhatsApp LID (e.g. 136996756410479@lid)
 * and a real Phone JID (e.g. 201224385098@s.whatsapp.net), and merges any split chats!
 */
async function registerLidMapping(rawLid, rawPn, pushName = null) {
  if (!rawLid || !rawPn) return null;

  const lidDigits = String(rawLid).split('@')[0].split(':')[0].replace(/\D/g, '');
  if (!lidDigits) return null;
  const lidJid = `${lidDigits}@lid`;

  const pnNorm = normalizeEgyptPhone(rawPn);
  if (!pnNorm || pnNorm.isLid || pnNorm.isGroup) return null;

  const pnJid = pnNorm.jid;
  const localPhone = pnNorm.localPhone;

  lidToPnCache.set(lidJid, pnJid);

  try {
    await db.query(
      `INSERT INTO whatsapp_lid_map (lid_jid, pn_jid, phone, contact_name, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (lid_jid) DO UPDATE SET
         pn_jid = EXCLUDED.pn_jid,
         phone = COALESCE(EXCLUDED.phone, whatsapp_lid_map.phone),
         contact_name = COALESCE(NULLIF(EXCLUDED.contact_name, ''), whatsapp_lid_map.contact_name),
         updated_at = NOW()`,
      [lidJid, pnJid, localPhone, pushName]
    );

    // Merge any split messages or chats that were saved under lidJid or bogus lidDigits@s.whatsapp.net
    const bogusPnJid = `${lidDigits}@s.whatsapp.net`;

    await db.query(
      `UPDATE whatsapp_messages_log
       SET chat_jid = $1,
           phone = COALESCE($2, phone)
       WHERE chat_jid IN ($3, $4)`,
      [pnJid, localPhone, lidJid, bogusPnJid]
    );

    const oldLidChat = await db.query(
      'SELECT * FROM whatsapp_chats WHERE jid IN ($1, $2) ORDER BY last_message_at DESC LIMIT 1',
      [lidJid, bogusPnJid]
    );

    if (oldLidChat.rows.length > 0) {
      const oldC = oldLidChat.rows[0];
      const student = await findStudentByPhone(localPhone);

      await db.query(
        `INSERT INTO whatsapp_chats (
           jid, lid_jid, phone, student_phone, parent_phone,
           contact_name, push_name, is_group,
           student_id, student_name, student_code, grade_name,
           consent_status, opted_in_at, unread_count,
           last_message_text, last_message_dir, last_message_by, last_message_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, false, $8, $9, $10, $11, 'OPTED_IN', NOW(), $12, $13, $14, $15, $16, NOW())
         ON CONFLICT (jid) DO UPDATE SET
           lid_jid = $2,
           phone = COALESCE($3, whatsapp_chats.phone),
           student_phone = COALESCE($4, whatsapp_chats.student_phone),
           parent_phone = COALESCE($5, whatsapp_chats.parent_phone),
           push_name = COALESCE(NULLIF($7, ''), whatsapp_chats.push_name),
           student_id = COALESCE(whatsapp_chats.student_id, $8),
           student_name = COALESCE(whatsapp_chats.student_name, $9),
           student_code = COALESCE(whatsapp_chats.student_code, $10),
           grade_name = COALESCE(whatsapp_chats.grade_name, $11),
           consent_status = CASE
             WHEN $17 = 'OPTED_IN' THEN 'OPTED_IN'
             ELSE whatsapp_chats.consent_status
           END,
           unread_count = whatsapp_chats.unread_count + $12,
           last_message_text = CASE
             WHEN $16 > whatsapp_chats.last_message_at THEN $13
             ELSE whatsapp_chats.last_message_text
           END,
           last_message_dir = CASE
             WHEN $16 > whatsapp_chats.last_message_at THEN $14
             ELSE whatsapp_chats.last_message_dir
           END,
           last_message_at = GREATEST(whatsapp_chats.last_message_at, $16),
           updated_at = NOW()`,
        [
          pnJid,
          lidJid,
          localPhone,
          student?.student_phone || null,
          student?.parent_phone || localPhone,
          student ? `${student.student_name}` : oldC.contact_name || pushName || localPhone,
          oldC.push_name || pushName || null,
          student?.student_id || oldC.student_id || null,
          student?.student_name || oldC.student_name || null,
          student?.student_code || oldC.student_code || null,
          student?.grade_name || oldC.grade_name || null,
          oldC.unread_count || 0,
          oldC.last_message_text,
          oldC.last_message_dir,
          oldC.last_message_by,
          oldC.last_message_at || new Date(),
          oldC.consent_status,
        ]
      );

      await db.query('DELETE FROM whatsapp_chats WHERE jid IN ($1, $2)', [
        lidJid,
        bogusPnJid,
      ]);
    }
  } catch (err) {
    console.warn('Error registering LID mapping:', err.message);
  }

  return pnJid;
}

/**
 * Resolves any incoming message key or JID to its canonical chat JID
 */
async function resolveCanonicalChatJid(rawRemoteJid, msgKey = {}, pushName = '') {
  if (!rawRemoteJid) return null;
  if (rawRemoteJid.endsWith('@g.us')) {
    return normalizeEgyptPhone(rawRemoteJid);
  }

  // Extract possible real Phone JID from Baileys message key
  const possiblePn =
    msgKey?.senderPn ||
    msgKey?.participantPn ||
    msgKey?.remoteJidAlt ||
    (!rawRemoteJid.endsWith('@lid') ? rawRemoteJid : null);

  const possibleLid =
    msgKey?.senderLid ||
    msgKey?.participantLid ||
    (rawRemoteJid.endsWith('@lid') ? rawRemoteJid : null);

  if (possibleLid && possiblePn && !String(possiblePn).endsWith('@lid')) {
    await registerLidMapping(possibleLid, possiblePn, pushName);
    return normalizeEgyptPhone(possiblePn);
  }

  const norm = normalizeEgyptPhone(rawRemoteJid);
  if (!norm) return null;

  // If it's still an unmapped LID, check database whatsapp_lid_map or match recent outgoing chat by pushName
  if (norm.isLid) {
    const dbMap = await db.query(
      'SELECT pn_jid FROM whatsapp_lid_map WHERE lid_jid = $1 LIMIT 1',
      [norm.jid]
    );
    if (dbMap.rows[0]?.pn_jid) {
      lidToPnCache.set(norm.jid, dbMap.rows[0].pn_jid);
      return normalizeEgyptPhone(dbMap.rows[0].pn_jid);
    }

    // Also check if a chat already has lid_jid = norm.jid
    const chatByLid = await db.query(
      "SELECT jid FROM whatsapp_chats WHERE lid_jid = $1 AND jid LIKE '%@s.whatsapp.net' LIMIT 1",
      [norm.jid]
    );
    if (chatByLid.rows[0]?.jid) {
      await registerLidMapping(norm.jid, chatByLid.rows[0].jid, pushName);
      return normalizeEgyptPhone(chatByLid.rows[0].jid);
    }

    // If pushName matches an active chat awaiting reply (INTRO_SENT_WAITING), link them!
    if (pushName && pushName.trim().length >= 2) {
      const matchChat = await db.query(
        `SELECT jid FROM whatsapp_chats
         WHERE is_group = false
           AND jid LIKE '%@s.whatsapp.net'
           AND (
             LOWER(COALESCE(push_name, '')) = LOWER($1)
             OR LOWER(COALESCE(contact_name, '')) = LOWER($1)
             OR LOWER(COALESCE(student_name, '')) LIKE '%' || LOWER($1) || '%'
           )
         ORDER BY last_message_at DESC
         LIMIT 1`,
        [pushName.trim()]
      );
      if (matchChat.rows[0]?.jid) {
        await registerLidMapping(norm.jid, matchChat.rows[0].jid, pushName);
        return normalizeEgyptPhone(matchChat.rows[0].jid);
      }
    }
  }

  return norm;
}

/**
 * Finds a student in the ERP database by student/parent phone number
 * Returns both student_phone and parent_phone so the UI always displays them!
 */
async function findStudentByPhone(localPhone) {
  if (!localPhone || localPhone.length < 10) return null;
  const clean = localPhone.replace(/\D/g, '');
  if (clean.length > 12 && !clean.startsWith('201')) return null; // Ignore LID numbers
  const short11 = clean.startsWith('201') ? clean.slice(1) : clean;

  const res = await db.query(
    `SELECT s.id AS student_id,
            COALESCE(s.full_name_ar, s.full_name) AS student_name,
            s.student_code,
            NULLIF(trim(COALESCE(s.phone, '')), '') AS student_phone,
            COALESCE(
              NULLIF(trim(COALESCE(s.father_phone, '')), ''),
              NULLIF(trim(COALESCE(s.parent_phone, '')), ''),
              NULLIF(trim(COALESCE(s.mother_phone, '')), ''),
              NULLIF(trim(COALESCE(s.phone, '')), '')
            ) AS parent_phone,
            g.name_ar AS grade_name
     FROM students s
     LEFT JOIN academic_grades g ON s.grade_id = g.id
     WHERE s.is_active = true
       AND (
         regexp_replace(COALESCE(s.father_phone, ''), '\\D', '', 'g') LIKE '%' || $1
         OR regexp_replace(COALESCE(s.parent_phone, ''), '\\D', '', 'g') LIKE '%' || $1
         OR regexp_replace(COALESCE(s.mother_phone, ''), '\\D', '', 'g') LIKE '%' || $1
         OR regexp_replace(COALESCE(s.phone, ''), '\\D', '', 'g') LIKE '%' || $1
       )
     ORDER BY (s.student_code > 1003) DESC, s.student_code ASC
     LIMIT 1`,
    [short11]
  );

  return res.rows[0] || null;
}

/**
 * Syncs all ERP students and their phone numbers into whatsapp_chats
 * so every existing chat shows student_phone, parent_phone, student_code & grade,
 * and staff can search/chat with any student or parent just like WhatsApp Web!
 */
async function syncErpStudentsToChats() {
  const studentsRes = await db.query(`
    SELECT s.id AS student_id,
           COALESCE(s.full_name_ar, s.full_name) AS student_name,
           s.student_code,
           NULLIF(trim(COALESCE(s.phone, '')), '') AS student_phone,
           COALESCE(
             NULLIF(trim(COALESCE(s.father_phone, '')), ''),
             NULLIF(trim(COALESCE(s.parent_phone, '')), ''),
             NULLIF(trim(COALESCE(s.mother_phone, '')), ''),
             NULLIF(trim(COALESCE(s.phone, '')), '')
           ) AS parent_phone,
           g.name_ar AS grade_name
    FROM students s
    LEFT JOIN academic_grades g ON s.grade_id = g.id
    WHERE s.is_active = true
    ORDER BY s.student_code ASC
  `);

  let syncedCount = 0;
  for (const st of studentsRes.rows) {
    const primaryPhone = st.parent_phone || st.student_phone;
    if (!primaryPhone) continue;

    const norm = normalizeEgyptPhone(primaryPhone);
    if (!norm || norm.isLid || norm.isGroup || !norm.localPhone || norm.localPhone.length < 10) {
      continue;
    }

    await db.query(
      `INSERT INTO whatsapp_chats (
         jid, phone, student_phone, parent_phone,
         contact_name, is_group,
         student_id, student_name, student_code, grade_name,
         consent_status, last_message_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, false, $6, $7, $8, $9, 'NEW', NOW() - INTERVAL '30 days', NOW())
       ON CONFLICT (jid) DO UPDATE SET
         phone = COALESCE(whatsapp_chats.phone, EXCLUDED.phone),
         student_phone = COALESCE(EXCLUDED.student_phone, whatsapp_chats.student_phone),
         parent_phone = COALESCE(EXCLUDED.parent_phone, whatsapp_chats.parent_phone),
         student_id = COALESCE(EXCLUDED.student_id, whatsapp_chats.student_id),
         student_name = COALESCE(EXCLUDED.student_name, whatsapp_chats.student_name),
         student_code = COALESCE(EXCLUDED.student_code, whatsapp_chats.student_code),
         grade_name = COALESCE(EXCLUDED.grade_name, whatsapp_chats.grade_name),
         contact_name = CASE
           WHEN whatsapp_chats.contact_name IS NULL
             OR whatsapp_chats.contact_name LIKE '%طالب اختبار%'
             OR whatsapp_chats.contact_name ~ '^[0-9]+$'
           THEN EXCLUDED.contact_name
           ELSE whatsapp_chats.contact_name
         END`,
      [
        norm.jid,
        norm.localPhone,
        st.student_phone || norm.localPhone,
        st.parent_phone || norm.localPhone,
        `${st.student_name}`,
        st.student_id,
        st.student_name,
        st.student_code,
        st.grade_name,
      ]
    );
    syncedCount++;
  }

  return syncedCount;
}

/**
 * Checks whether we are allowed to send a message to a contact.
 * Note: Manual Staff Replies from the Live Chat Window (isManualStaffReply === true)
 * are ALWAYS allowed without blocking the staff member!
 */
async function checkOutgoingConsent({
  jid,
  category = 'CHAT_REPLY',
  isManualStaffReply = false,
  forceBypass = false,
}) {
  if (!jid || jid.endsWith('@g.us')) {
    return { allowed: true, reason: 'group_chat' };
  }

  const settingsRes = await db.query('SELECT * FROM whatsapp_settings WHERE id = 1');
  const settings = settingsRes.rows[0] || {};

  if (settings.is_paused && !forceBypass && !isManualStaffReply) {
    return {
      allowed: false,
      reason: 'paused',
      message: 'إرسال الواتساب التلقائي متوقف مؤقتاً (زر الإيقاف الطارئ مفعّل من الإعدادات)',
    };
  }

  // Human staff members replying directly in the Live Chat window are NEVER blocked!
  if (isManualStaffReply || forceBypass) {
    return { allowed: true, reason: 'manual_staff_reply' };
  }

  if (!settings.strict_opt_in_only) {
    return { allowed: true, reason: 'strict_opt_in_disabled' };
  }

  const chatRes = await db.query('SELECT * FROM whatsapp_chats WHERE jid = $1', [jid]);
  const chat = chatRes.rows[0];

  const status = chat?.consent_status || 'NEW';
  const introCount = chat?.intro_sent_count || 0;

  if (status === 'OPTED_OUT') {
    return {
      allowed: false,
      reason: 'opted_out',
      message: 'ولي الأمر طلب إيقاف الرسائل التلقائية سابقاً (OPTED_OUT)',
    };
  }

  if (status === 'OPTED_IN') {
    return { allowed: true, reason: 'opted_in' };
  }

  if (status === 'INTRO_SENT_WAITING' || introCount >= 1) {
    return {
      allowed: false,
      reason: 'awaiting_first_reply',
      message:
        'تم إرسال الرسالة التلقائية الأولى سابقاً ولم يرد المستلم بعد — متوقف تلقائياً لمنع الإزعاج.',
    };
  }

  if (settings.allow_single_intro_message || category === 'INTRO_HANDSHAKE') {
    return {
      allowed: true,
      reason: 'first_single_message_allowed',
      markAsIntroSent: true,
    };
  }

  return {
    allowed: false,
    reason: 'must_message_us_first',
    message: 'الرقم لم يراسل الأكاديمية من قبل.',
  };
}

/**
 * Called whenever a contact sends ANY incoming message to the academy's WhatsApp
 */
async function markContactOptedInByIncomingMessage({
  jid,
  lidJid = null,
  localPhone = null,
  pushName = '',
  messageText = '',
  messageTimestamp = null,
}) {
  if (!jid || jid.endsWith('@g.us')) return;

  const norm = normalizeEgyptPhone(jid);
  const resolvedPhone = localPhone || norm?.localPhone || null;
  let matchedStudent = resolvedPhone ? await findStudentByPhone(resolvedPhone) : null;

  // Also check if message text contains student code like "#1004" or "كود 1004"
  if (!matchedStudent && messageText) {
    const codeMatch = toEnglishDigits(messageText).match(/(?:#|كود\s*)(\d{4})/);
    if (codeMatch) {
      const stRes = await db.query(
        `SELECT s.id AS student_id,
                COALESCE(s.full_name_ar, s.full_name) AS student_name,
                s.student_code,
                NULLIF(trim(COALESCE(s.phone, '')), '') AS student_phone,
                COALESCE(
                  NULLIF(trim(COALESCE(s.father_phone, '')), ''),
                  NULLIF(trim(COALESCE(s.parent_phone, '')), ''),
                  NULLIF(trim(COALESCE(s.mother_phone, '')), '')
                ) AS parent_phone,
                g.name_ar AS grade_name
         FROM students s
         LEFT JOIN academic_grades g ON s.grade_id = g.id
         WHERE s.student_code = $1
         LIMIT 1`,
        [parseInt(codeMatch[1], 10)]
      );
      if (stRes.rows[0]) matchedStudent = stRes.rows[0];
    }
  }

  const trimmedText = (messageText || '').trim();
  const isOptOutCommand = /^(ايقاف|إيقاف|الغاء|إلغاء|stop)$/i.test(trimmedText);
  const newConsent = isOptOutCommand ? 'OPTED_OUT' : 'OPTED_IN';
  const msgDate = messageTimestamp ? new Date(messageTimestamp) : new Date();

  const displayContactName = matchedStudent
    ? matchedStudent.student_name
    : pushName || resolvedPhone || 'جهة اتصال واتساب';

  await db.query(
    `INSERT INTO whatsapp_chats (
       jid, lid_jid, phone, student_phone, parent_phone,
       contact_name, push_name, is_group,
       student_id, student_name, student_code, grade_name,
       consent_status, opted_in_at, unread_count,
       last_message_text, last_message_dir, last_message_by, last_message_at, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, false, $8, $9, $10, $11, $12, NOW(), 1, $13, 'incoming', $7, $14, NOW())
     ON CONFLICT (jid) DO UPDATE SET
       lid_jid = COALESCE(EXCLUDED.lid_jid, whatsapp_chats.lid_jid),
       phone = COALESCE(EXCLUDED.phone, whatsapp_chats.phone),
       student_phone = COALESCE(EXCLUDED.student_phone, whatsapp_chats.student_phone),
       parent_phone = COALESCE(EXCLUDED.parent_phone, whatsapp_chats.parent_phone),
       push_name = COALESCE(NULLIF(EXCLUDED.push_name, ''), whatsapp_chats.push_name),
       contact_name = COALESCE(EXCLUDED.student_name, NULLIF(EXCLUDED.push_name, ''), whatsapp_chats.contact_name),
       student_id = COALESCE(EXCLUDED.student_id, whatsapp_chats.student_id),
       student_name = COALESCE(EXCLUDED.student_name, whatsapp_chats.student_name),
       student_code = COALESCE(EXCLUDED.student_code, whatsapp_chats.student_code),
       grade_name = COALESCE(EXCLUDED.grade_name, whatsapp_chats.grade_name),
       consent_status = $12,
       opted_in_at = COALESCE(whatsapp_chats.opted_in_at, NOW()),
       unread_count = whatsapp_chats.unread_count + 1,
       last_message_text = $13,
       last_message_dir = 'incoming',
       last_message_by = COALESCE(NULLIF($7, ''), whatsapp_chats.push_name, 'ولي الأمر'),
       last_message_at = GREATEST(whatsapp_chats.last_message_at, $14),
       updated_at = NOW()`,
    [
      norm.jid,
      lidJid || (norm.isLid ? norm.jid : null),
      resolvedPhone,
      matchedStudent?.student_phone || null,
      matchedStudent?.parent_phone || resolvedPhone,
      displayContactName,
      pushName || resolvedPhone || 'عميل',
      matchedStudent?.student_id || null,
      matchedStudent?.student_name || null,
      matchedStudent?.student_code || null,
      matchedStudent?.grade_name || null,
      newConsent,
      trimmedText,
      msgDate,
    ]
  );
}

module.exports = {
  toEnglishDigits,
  loadLidMapIntoMemory,
  normalizeEgyptPhone,
  registerLidMapping,
  resolveCanonicalChatJid,
  findStudentByPhone,
  syncErpStudentsToChats,
  checkOutgoingConsent,
  markContactOptedInByIncomingMessage,
};
