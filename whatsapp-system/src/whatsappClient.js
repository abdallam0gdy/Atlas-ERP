const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const pino = require('pino');
const db = require('./db');
const {
  loadLidMapIntoMemory,
  normalizeEgyptPhone,
  registerLidMapping,
  resolveCanonicalChatJid,
  findStudentByPhone,
  syncErpStudentsToChats,
  checkOutgoingConsent,
  markContactOptedInByIncomingMessage,
} = require('./optInGuard');
const {
  autoMatchOfficialGroups,
  buildAllGroupsSchedulePreviews,
} = require('./packageScheduleJob');

const AUTH_FOLDER = path.join(__dirname, '../auth_session');

let sock = null;
let isStarting = false;
let connectionState = {
  status: 'disconnected', // 'disconnected' | 'connecting' | 'qr_ready' | 'connected'
  qrString: null,
  qrDataUrl: null,
  connectedPhone: null,
  connectedName: null,
  lastConnectedAt: null,
  lastError: null,
};

let liveGroupsCache = [];
let lastGroupSyncAt = 0;
let reconnectTimer = null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractMessageText(msg) {
  if (!msg || !msg.message) return '';
  const m = msg.message;
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.documentMessage?.caption ||
    m.buttonsResponseMessage?.selectedDisplayText ||
    m.listResponseMessage?.title ||
    m.templateButtonReplyMessage?.selectedDisplayText ||
    (m.imageMessage ? '📷 [صورة]' : '') ||
    (m.audioMessage ? '🎤 [رسالة صوتية]' : '') ||
    (m.documentMessage ? `📄 [ملف: ${m.documentMessage.fileName || 'مستند'}]` : '') ||
    (m.stickerMessage ? '🏷️ [ملصق]' : '') ||
    ''
  ).trim();
}

/**
 * Safely tears down any existing socket instance to prevent 440 Conflict loops
 */
function destroyCurrentSocket() {
  clearTimeout(reconnectTimer);
  reconnectTimer = null;
  if (sock) {
    try {
      sock.ev.removeAllListeners();
      sock.ws?.close();
      sock.end(undefined);
    } catch {
      // ignore teardown errors
    }
    sock = null;
  }
}

/**
 * Processes a single incoming or historical message and logs it under its canonical JID
 */
async function processIncomingOrSyncedMessage(msg, isHistorySync = false) {
  try {
    const rawRemoteJid = msg.key?.remoteJid;
    if (!rawRemoteJid || rawRemoteJid === 'status@broadcast' || rawRemoteJid.endsWith('@newsletter')) {
      return;
    }

    const text = extractMessageText(msg);
    if (!text) return;

    const fromMe = Boolean(msg.key?.fromMe);
    const waMsgId = msg.key?.id || null;

    if (waMsgId) {
      const exists = await db.query(
        'SELECT id FROM whatsapp_messages_log WHERE wa_message_id = $1 LIMIT 1',
        [waMsgId]
      );
      if (exists.rows.length > 0) return;
    }

    // Resolve canonical JID (maps @lid -> @s.whatsapp.net whenever possible!)
    const resolved = await resolveCanonicalChatJid(rawRemoteJid, msg.key, msg.pushName || '');
    if (!resolved) return;

    const canonicalJid = resolved.jid;
    const isGroup = resolved.isGroup;
    const localPhone = resolved.localPhone; // null for unmapped @lid or @g.us

    const msgTsSeconds = Number(msg.messageTimestamp || 0);
    const msgDate =
      msgTsSeconds > 1000000000
        ? new Date(msgTsSeconds * 1000)
        : new Date();

    if (!fromMe) {
      if (!isGroup) {
        await markContactOptedInByIncomingMessage({
          jid: canonicalJid,
          lidJid: rawRemoteJid.endsWith('@lid') ? rawRemoteJid : null,
          localPhone,
          pushName: msg.pushName || '',
          messageText: text,
          messageTimestamp: msgDate,
        });
      } else {
        const grpObj = liveGroupsCache.find((g) => g.id === canonicalJid);
        const grpName = grpObj?.subject || canonicalJid;
        await db.query(
          `INSERT INTO whatsapp_chats (
             jid, contact_name, is_group, consent_status, unread_count,
             last_message_text, last_message_dir, last_message_by, last_message_at, updated_at
           ) VALUES ($1, $2, true, 'OPTED_IN', $3, $4, 'incoming', $5, $6, NOW())
           ON CONFLICT (jid) DO UPDATE SET
             contact_name = CASE
               WHEN whatsapp_chats.contact_name LIKE '%@g.us' THEN EXCLUDED.contact_name
               ELSE COALESCE(whatsapp_chats.contact_name, EXCLUDED.contact_name)
             END,
             unread_count = whatsapp_chats.unread_count + $3,
             last_message_text = CASE
               WHEN $6 >= whatsapp_chats.last_message_at THEN $4
               ELSE whatsapp_chats.last_message_text
             END,
             last_message_dir = CASE
               WHEN $6 >= whatsapp_chats.last_message_at THEN 'incoming'
               ELSE whatsapp_chats.last_message_dir
             END,
             last_message_by = CASE
               WHEN $6 >= whatsapp_chats.last_message_at THEN $5
               ELSE whatsapp_chats.last_message_by
             END,
             last_message_at = GREATEST(whatsapp_chats.last_message_at, $6),
             updated_at = NOW()`,
          [
            canonicalJid,
            grpName,
            isHistorySync ? 0 : 1,
            text,
            msg.pushName || 'عضو بالجروب',
            msgDate,
          ]
        );
      }

      const chatInfo = await db.query('SELECT * FROM whatsapp_chats WHERE jid = $1', [canonicalJid]);
      const c = chatInfo.rows[0];

      await db.query(
        `INSERT INTO whatsapp_messages_log (
           wa_message_id, chat_jid, phone, recipient_name,
           direction, category, message_text, status, student_id, created_at
         ) VALUES ($1, $2, $3, $4, 'incoming', 'INCOMING_CHAT', $5, 'received', $6, $7)`,
        [
          waMsgId,
          canonicalJid,
          c?.phone || localPhone || null,
          c?.contact_name || msg.pushName || localPhone || 'عميل واتساب',
          text,
          c?.student_id || null,
          msgDate,
        ]
      );
    } else {
      // Sent from the physical WhatsApp phone app or synced history
      const student = localPhone ? await findStudentByPhone(localPhone) : null;
      const grpObj = isGroup ? liveGroupsCache.find((g) => g.id === canonicalJid) : null;
      const displayName = isGroup
        ? grpObj?.subject || canonicalJid
        : student
        ? student.student_name
        : localPhone || 'جهة اتصال واتساب';

      await db.query(
        `INSERT INTO whatsapp_chats (
           jid, phone, student_phone, parent_phone,
           contact_name, is_group,
           student_id, student_name, student_code, grade_name,
           consent_status, unread_count,
           last_message_text, last_message_dir, last_message_by, last_message_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'OPTED_IN', 0, $11, 'outgoing', 'من هاتف الواتساب', $12, NOW())
         ON CONFLICT (jid) DO UPDATE SET
           phone = COALESCE(EXCLUDED.phone, whatsapp_chats.phone),
           student_phone = COALESCE(EXCLUDED.student_phone, whatsapp_chats.student_phone),
           parent_phone = COALESCE(EXCLUDED.parent_phone, whatsapp_chats.parent_phone),
           student_id = COALESCE(EXCLUDED.student_id, whatsapp_chats.student_id),
           student_name = COALESCE(EXCLUDED.student_name, whatsapp_chats.student_name),
           student_code = COALESCE(EXCLUDED.student_code, whatsapp_chats.student_code),
           grade_name = COALESCE(EXCLUDED.grade_name, whatsapp_chats.grade_name),
           last_message_text = CASE
             WHEN $12 >= whatsapp_chats.last_message_at THEN $11
             ELSE whatsapp_chats.last_message_text
           END,
           last_message_dir = CASE
             WHEN $12 >= whatsapp_chats.last_message_at THEN 'outgoing'
             ELSE whatsapp_chats.last_message_dir
           END,
           last_message_by = CASE
             WHEN $12 >= whatsapp_chats.last_message_at THEN 'من هاتف الواتساب'
             ELSE whatsapp_chats.last_message_by
           END,
           last_message_at = GREATEST(whatsapp_chats.last_message_at, $12),
           updated_at = NOW()`,
        [
          canonicalJid,
          localPhone,
          student?.student_phone || null,
          student?.parent_phone || localPhone,
          displayName,
          isGroup,
          student?.student_id || null,
          student?.student_name || null,
          student?.student_code || null,
          student?.grade_name || null,
          text,
          msgDate,
        ]
      );

      await db.query(
        `INSERT INTO whatsapp_messages_log (
           wa_message_id, chat_jid, phone, recipient_name,
           direction, category, message_text, status,
           student_id, sent_by_user_name, sent_by_user_role, created_at
         ) VALUES ($1, $2, $3, $4, 'outgoing', 'PHONE_DIRECT', $5, 'sent', $6, 'من هاتف الواتساب مباشرة', 'PHONE_APP', $7)`,
        [
          waMsgId,
          canonicalJid,
          localPhone,
          displayName,
          text,
          student?.student_id || null,
          msgDate,
        ]
      );
    }
  } catch (err) {
    console.error('Error processing message:', err.message);
  }
}

/**
 * Starts or restarts the Baileys WhatsApp connection (Singleton protected + Full History Sync)
 */
async function startWhatsAppClient(forceRestart = false) {
  if (isStarting) return;
  if (!forceRestart && sock && connectionState.status === 'connected') return;

  isStarting = true;
  try {
    await loadLidMapIntoMemory();
    await syncErpStudentsToChats().catch(() => {});

    destroyCurrentSocket();

    const baileys = await import('@whiskeysockets/baileys');
    const makeWASocket = baileys.default?.default || baileys.default || baileys.makeWASocket;
    const {
      useMultiFileAuthState,
      DisconnectReason,
      fetchLatestBaileysVersion,
    } = baileys;

    if (!fs.existsSync(AUTH_FOLDER)) {
      fs.mkdirSync(AUTH_FOLDER, { recursive: true });
    }

    connectionState.status = 'connecting';
    connectionState.lastError = null;

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
    let version = [2, 3000, 1015901307];
    try {
      const latest = await fetchLatestBaileysVersion();
      if (latest?.version) version = latest.version;
    } catch {
      // use fallback version
    }

    const currentSock = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: 'silent' }),
      browser: ['Atlas ERP Web', 'Chrome', '122.0.0'],
      syncFullHistory: true, // Load old & new chats just like WhatsApp Web!
      markOnlineOnConnect: false,
      shouldIgnoreJid: (jid) => jid === 'status@broadcast' || jid?.endsWith('@newsletter'),
    });

    sock = currentSock;

    currentSock.ev.on('creds.update', saveCreds);

    // 1. Listen to Full History Sync (Old Chats, Contacts, LID Mappings & Messages)
    currentSock.ev.on('messaging-history.set', async ({ chats = [], contacts = [], messages = [] }) => {
      if (sock !== currentSock) return;
      console.log(
        `📚 [WhatsApp History Sync] جاري استيراد السجل: ${chats.length} محادثة، ${contacts.length} جهة اتصال، ${messages.length} رسالة...`
      );

      for (const c of contacts) {
        const pn = c.id?.endsWith('@s.whatsapp.net') ? c.id : c.jid;
        const lid = c.lid || (c.id?.endsWith('@lid') ? c.id : null);
        if (lid && pn) {
          await registerLidMapping(lid, pn, c.name || c.notify || null);
        }
      }

      for (const chat of chats) {
        const pn = chat.pnJid || (chat.id?.endsWith('@s.whatsapp.net') ? chat.id : null);
        const lid = chat.lidJid || (chat.id?.endsWith('@lid') ? chat.id : null);
        if (lid && pn) {
          await registerLidMapping(lid, pn, chat.name || null);
        }
      }

      for (const m of messages) {
        await processIncomingOrSyncedMessage(m, true);
      }
    });

    // 2. Listen to Contacts Upsert / Update (Resolves @lid to real phone number!)
    const handleContactsList = async (contacts = []) => {
      for (const c of contacts) {
        const pn = c.id?.endsWith('@s.whatsapp.net') ? c.id : c.jid;
        const lid = c.lid || (c.id?.endsWith('@lid') ? c.id : null);
        const name = c.name || c.notify || c.verifiedName || null;
        if (lid && pn) {
          await registerLidMapping(lid, pn, name);
        } else if (pn && name) {
          const norm = normalizeEgyptPhone(pn);
          if (norm && !norm.isGroup) {
            await db.query(
              `UPDATE whatsapp_chats
               SET push_name = COALESCE(NULLIF($1, ''), push_name),
                   contact_name = COALESCE(student_name, NULLIF($1, ''), contact_name)
               WHERE jid = $2`,
              [name, norm.jid]
            );
          }
        }
      }
    };

    currentSock.ev.on('contacts.upsert', handleContactsList);
    currentSock.ev.on('contacts.update', handleContactsList);

    // 3. Listen to Chats Upsert / Update
    const handleChatsList = async (chats = []) => {
      for (const ch of chats) {
        const pn = ch.pnJid || (ch.id?.endsWith('@s.whatsapp.net') ? ch.id : null);
        const lid = ch.lidJid || (ch.id?.endsWith('@lid') ? ch.id : null);
        if (lid && pn) {
          await registerLidMapping(lid, pn, ch.name || null);
        }
      }
    };

    currentSock.ev.on('chats.upsert', handleChatsList);
    currentSock.ev.on('chats.update', handleChatsList);

    // 4. Listen to Group Updates
    currentSock.ev.on('groups.upsert', async (newGroups) => {
      if (Array.isArray(newGroups) && newGroups.length > 0) {
        for (const g of newGroups) {
          if (!liveGroupsCache.find((x) => x.id === g.id)) {
            liveGroupsCache.push({
              id: g.id,
              subject: g.subject || '',
              participantsCount: Array.isArray(g.participants) ? g.participants.length : 0,
            });
          }
        }
        await autoMatchOfficialGroups(liveGroupsCache).catch(() => {});
      }
    });

    // 5. Connection State Lifecycle
    currentSock.ev.on('connection.update', async (update) => {
      if (sock !== currentSock) return;

      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        connectionState.status = 'qr_ready';
        connectionState.qrString = qr;
        try {
          connectionState.qrDataUrl = await QRCode.toDataURL(qr, {
            width: 320,
            margin: 2,
            color: { dark: '#0C3C82', light: '#FFFFFF' },
          });
        } catch (err) {
          console.error('QR generation error:', err.message);
        }
        console.log('📱 [WhatsApp] QR Code جاهز للمسح من لوحة التحكم.');
      }

      if (connection === 'open') {
        const me = currentSock?.user || {};
        const cleanPhone = (me.id || '').split(':')[0].split('@')[0];
        const meLid = (me.lid || '').split(':')[0].split('@')[0];
        if (meLid && cleanPhone) {
          await registerLidMapping(`${meLid}@lid`, `${cleanPhone}@s.whatsapp.net`, me.name || 'الأكاديمية');
        }

        connectionState.status = 'connected';
        connectionState.qrString = null;
        connectionState.qrDataUrl = null;
        connectionState.connectedPhone = cleanPhone;
        connectionState.connectedName = me.name || 'أكاديمية أطلس التعليمية';
        connectionState.lastConnectedAt = new Date().toISOString();
        connectionState.lastError = null;

        console.log(`✅ [WhatsApp] متصل بنجاح! الرقم: ${cleanPhone} (${connectionState.connectedName})`);

        if (liveGroupsCache.length === 0 && Date.now() - lastGroupSyncAt > 180000) {
          setTimeout(() => {
            if (connectionState.status === 'connected') {
              syncWhatsAppGroups().catch((e) =>
                console.warn('ℹ️ [WhatsApp] تخطي المزامنة التلقائية للجروبات:', e.message)
              );
            }
          }, 4000);
        }
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut;

        connectionState.status = 'disconnected';
        connectionState.qrString = null;
        connectionState.qrDataUrl = null;
        connectionState.lastError = lastDisconnect?.error?.message || 'انقطع الاتصال';

        console.log(`⚠️ [WhatsApp] انقطع الاتصال (Code: ${statusCode}). إعادة الاتصال: ${!isLoggedOut}`);

        if (isLoggedOut) {
          destroyCurrentSocket();
          try {
            fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
          } catch {
            // ignore
          }
          clearTimeout(reconnectTimer);
          reconnectTimer = setTimeout(() => {
            startWhatsAppClient(true);
          }, 3000);
        } else {
          const backoffMs = statusCode === 440 ? 10000 : 5000;
          clearTimeout(reconnectTimer);
          reconnectTimer = setTimeout(() => {
            startWhatsAppClient(true);
          }, backoffMs);
        }
      }
    });

    // 6. Listen for Real-time & Appended Messages
    currentSock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (sock !== currentSock) return;
      if (type !== 'notify' && type !== 'append') return;

      for (const msg of messages) {
        await processIncomingOrSyncedMessage(msg, type === 'append');
      }
    });
  } catch (err) {
    console.error('❌ [WhatsApp] Failed to start client:', err.message);
    connectionState.status = 'disconnected';
    connectionState.lastError = err.message;
  } finally {
    isStarting = false;
  }
}

/**
 * Fetches all WhatsApp groups the connected account participates in,
 * auto-matches the 12 official Atlas groups, and populates groups in whatsapp_chats!
 */
async function syncWhatsAppGroups() {
  if (!sock || connectionState.status !== 'connected') {
    throw new Error('الواتساب غير متصل حالياً — يرجى مسح الـ QR أولاً');
  }

  lastGroupSyncAt = Date.now();
  try {
    const groupsObj = await sock.groupFetchAllParticipating();
    const list = [];

    for (const g of Object.values(groupsObj || {})) {
      list.push({
        id: g.id,
        subject: g.subject || '',
        participantsCount: Array.isArray(g.participants) ? g.participants.length : 0,
      });

      // Extract any participant LID -> PN mappings from group participants!
      if (Array.isArray(g.participants)) {
        for (const p of g.participants) {
          const pPn =
            (p.jid && p.jid.endsWith('@s.whatsapp.net') ? p.jid : null) ||
            p.phoneNumber ||
            (p.id?.endsWith('@s.whatsapp.net') ? p.id : null);
          const pLid = p.lid || (p.id?.endsWith('@lid') ? p.id : null);
          if (pLid && pPn) {
            await registerLidMapping(pLid, pPn, null);
          }
        }
      }

      // Also upsert the group into whatsapp_chats so it's visible in the Chats page!
      await db.query(
        `INSERT INTO whatsapp_chats (
           jid, contact_name, is_group, consent_status, last_message_text, last_message_at, updated_at
         ) VALUES ($1, $2, true, 'OPTED_IN', $3, NOW() - INTERVAL '7 days', NOW())
         ON CONFLICT (jid) DO UPDATE SET
           contact_name = EXCLUDED.contact_name,
           is_group = true`,
        [g.id, g.subject || g.id, `👥 جروب واتساب (${g.participants?.length || 0} عضو)`]
      );
    }

    liveGroupsCache = list;
    const matchResult = await autoMatchOfficialGroups(list);

    return {
      liveGroupsCount: list.length,
      liveGroups: list,
      ...matchResult,
    };
  } catch (err) {
    if (String(err.message).includes('rate-overlimit') && liveGroupsCache.length > 0) {
      const matchResult = await autoMatchOfficialGroups(liveGroupsCache);
      return {
        liveGroupsCount: liveGroupsCache.length,
        liveGroups: liveGroupsCache,
        ...matchResult,
      };
    }
    throw err;
  }
}

/**
 * Creates shared Test WhatsApp Group(s) with Abdalla (01224385098)
 * to test sending daily schedules safely before broadcasting to real parent groups!
 */
async function createTestGroupWithPartner({
  partnerPhone = '01224385098',
  mode = 'unified', // 'unified' (1 test group for all stages - safest) | 'single' (for specificConfigId)
  specificConfigId = null,
}) {
  if (!sock || connectionState.status !== 'connected') {
    throw new Error('الواتساب غير متصل حالياً');
  }

  const normPartner = normalizeEgyptPhone(partnerPhone);
  if (!normPartner || normPartner.isLid || normPartner.isGroup) {
    throw new Error('رقم الشريك للاختبار غير صالح');
  }
  const partnerJid = normPartner.jid;

  if (mode === 'single' && specificConfigId) {
    const cfgRes = await db.query('SELECT * FROM whatsapp_groups_config WHERE id = $1', [
      specificConfigId,
    ]);
    const cfg = cfgRes.rows[0];
    if (!cfg) throw new Error('المرحلة غير موجودة');

    const groupTitle = `🧪 اختبار - ${cfg.official_name}`.slice(0, 95);
    const created = await sock.groupCreate(groupTitle, [partnerJid]);
    const testJid = created.id;

    await db.query(
      `UPDATE whatsapp_groups_config
       SET test_group_jid = $1, test_group_name = $2
       WHERE id = $3`,
      [testJid, groupTitle, cfg.id]
    );

    if (!liveGroupsCache.find((g) => g.id === testJid)) {
      liveGroupsCache.push({ id: testJid, subject: groupTitle, participantsCount: 2 });
    }

    await sock.sendMessage(testJid, {
      text: `🧪 *تم إنشاء جروب الاختبار المشترك مع عبد الله (${normPartner.localPhone})*\n📌 مخصص لاختبار جدول: *${cfg.official_name}*`,
    });

    return {
      mode: 'single',
      test_group_jid: testJid,
      test_group_name: groupTitle,
      linkedCount: 1,
    };
  }

  // Default: 'unified' mode — Create 1 shared test group with Abdalla (01224385098) and link all 12 stages to it!
  // Check if we already created it in liveGroupsCache
  const unifiedTitle = '🧪 اختبار جداول أطلس - عبدالله';
  let existingTestGroup = liveGroupsCache.find(
    (g) => g.subject && g.subject.includes('اختبار جداول أطلس')
  );

  let testJid = existingTestGroup?.id || null;

  if (!testJid) {
    const created = await sock.groupCreate(unifiedTitle, [partnerJid]);
    testJid = created.id;
    liveGroupsCache.push({ id: testJid, subject: unifiedTitle, participantsCount: 2 });

    await sock.sendMessage(testJid, {
      text: `🧪 *مرحباً بك في جروب اختبار جداول أكاديمية أطلس 2026* ✨\n\n👤 مشترك مع: *عبد الله (${normPartner.localPhone})*\n✅ تم ربط جميع مراحل الباكدج الـ 12 بهذا الجروب الاختباري لتجربة إرسال الجداول اليومية بأمان تام قبل إرسالها لجروبات أولياء الأمور الرسمية!`,
    });
  }

  await db.query(
    `UPDATE whatsapp_groups_config
     SET test_group_jid = $1, test_group_name = $2`,
    [testJid, unifiedTitle]
  );

  await db.query(
    `UPDATE whatsapp_settings
     SET schedule_send_mode = 'test', test_partner_phone = $1
     WHERE id = 1`,
    [normPartner.localPhone]
  );

  return {
    mode: 'unified',
    test_group_jid: testJid,
    test_group_name: unifiedTitle,
    linkedCount: 12,
  };
}

/**
 * Sends a WhatsApp message with Full Staff Audit Logging, Smart Opt-In Check, and Anti-Ban Pacing
 */
async function sendWhatsAppMessage({
  targetPhoneOrJid,
  messageText,
  category = 'CHAT_REPLY',
  isManualStaffReply = false,
  forceBypassConsent = false,
  staffUser = null,
  studentId = null,
  groupId = null,
  recipientName = null,
}) {
  const norm = await resolveCanonicalChatJid(targetPhoneOrJid);
  if (!norm) {
    throw new Error('رقم الهاتف أو معرف المحادثة غير صالح');
  }

  const jid = norm.jid;
  const senderId = staffUser?.id || null;
  const senderName = staffUser?.name || 'النظام التلقائي';
  const senderRole = staffUser?.role || 'SYSTEM';

  const consentCheck = await checkOutgoingConsent({
    jid,
    category,
    isManualStaffReply,
    forceBypass: forceBypassConsent,
  });

  let resolvedStudent = null;
  if (!norm.isGroup && norm.localPhone) {
    resolvedStudent = await findStudentByPhone(norm.localPhone);
  }
  const finalStudentId = studentId || resolvedStudent?.student_id || null;
  const finalRecipientName =
    recipientName ||
    (resolvedStudent ? resolvedStudent.student_name : norm.localPhone || jid);

  if (!consentCheck.allowed) {
    await db.query(
      `INSERT INTO whatsapp_messages_log (
         chat_jid, phone, recipient_name, direction, category,
         message_text, status, error_message, student_id, group_id,
         sent_by_user_id, sent_by_user_name, sent_by_user_role
       ) VALUES ($1, $2, $3, 'outgoing', $4, $5, 'blocked_consent', $6, $7, $8, $9, $10, $11)`,
      [
        jid,
        norm.localPhone,
        finalRecipientName,
        category,
        messageText,
        consentCheck.message,
        finalStudentId,
        groupId,
        senderId,
        senderName,
        senderRole,
      ]
    );

    return {
      sent: false,
      blockedByConsent: true,
      reason: consentCheck.reason,
      message: consentCheck.message,
    };
  }

  if (!sock || connectionState.status !== 'connected') {
    throw new Error('الواتساب غير متصل حالياً — يرجى التأكد من الاتصال أولاً');
  }

  try {
    await sock.sendPresenceUpdate('composing', jid);
    await sleep(900);
    await sock.sendPresenceUpdate('paused', jid);
  } catch {
    // ignore presence errors
  }

  const sentMsg = await sock.sendMessage(jid, { text: messageText });
  const waMsgId = sentMsg?.key?.id || null;

  const nextConsentStatus = consentCheck.markAsIntroSent ? 'INTRO_SENT_WAITING' : 'OPTED_IN';
  const incIntro = consentCheck.markAsIntroSent ? 1 : 0;

  await db.query(
    `INSERT INTO whatsapp_chats (
       jid, phone, student_phone, parent_phone,
       contact_name, is_group,
       student_id, student_name, student_code, grade_name,
       consent_status, intro_sent_count, intro_sent_at,
       unread_count, last_message_text, last_message_dir, last_message_by, last_message_at, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CASE WHEN $12 > 0 THEN NOW() ELSE NULL END, 0, $13, 'outgoing', $14, NOW(), NOW())
     ON CONFLICT (jid) DO UPDATE SET
       phone = COALESCE(EXCLUDED.phone, whatsapp_chats.phone),
       student_phone = COALESCE(EXCLUDED.student_phone, whatsapp_chats.student_phone),
       parent_phone = COALESCE(EXCLUDED.parent_phone, whatsapp_chats.parent_phone),
       contact_name = COALESCE(whatsapp_chats.contact_name, EXCLUDED.contact_name),
       student_id = COALESCE(whatsapp_chats.student_id, EXCLUDED.student_id),
       student_name = COALESCE(whatsapp_chats.student_name, EXCLUDED.student_name),
       student_code = COALESCE(whatsapp_chats.student_code, EXCLUDED.student_code),
       grade_name = COALESCE(whatsapp_chats.grade_name, EXCLUDED.grade_name),
       consent_status = CASE
         WHEN whatsapp_chats.consent_status = 'OPTED_IN' THEN 'OPTED_IN'
         ELSE $11
       END,
       intro_sent_count = whatsapp_chats.intro_sent_count + $12,
       intro_sent_at = CASE WHEN $12 > 0 THEN NOW() ELSE whatsapp_chats.intro_sent_at END,
       last_message_text = $13,
       last_message_dir = 'outgoing',
       last_message_by = $14,
       last_message_at = NOW(),
       updated_at = NOW()`,
    [
      jid,
      norm.localPhone,
      resolvedStudent?.student_phone || null,
      resolvedStudent?.parent_phone || norm.localPhone,
      finalRecipientName,
      norm.isGroup,
      finalStudentId,
      resolvedStudent?.student_name || null,
      resolvedStudent?.student_code || null,
      resolvedStudent?.grade_name || null,
      nextConsentStatus,
      incIntro,
      messageText,
      senderName,
    ]
  );

  const logRes = await db.query(
    `INSERT INTO whatsapp_messages_log (
       wa_message_id, chat_jid, phone, recipient_name,
       direction, category, message_text, status,
       student_id, group_id,
       sent_by_user_id, sent_by_user_name, sent_by_user_role
     ) VALUES ($1, $2, $3, $4, 'outgoing', $5, $6, 'sent', $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      waMsgId,
      jid,
      norm.localPhone,
      finalRecipientName,
      category,
      messageText,
      finalStudentId,
      groupId,
      senderId,
      senderName,
      senderRole,
    ]
  );

  await db.query(`
    UPDATE whatsapp_settings
    SET sent_today_count = CASE
          WHEN sent_today_date = CURRENT_DATE THEN sent_today_count + 1
          ELSE 1
        END,
        sent_today_date = CURRENT_DATE
    WHERE id = 1
  `);

  return {
    sent: true,
    waMessageId: waMsgId,
    log: logRes.rows[0],
  };
}

/**
 * Broadcasts the Daily Package Schedule to either Test Groups (with Abdalla) or Live Official Groups
 */
async function sendDailyPackageSchedules({
  targetOption = 'today',
  specificConfigId = null,
  sendMode = null, // 'test' | 'live'
  staffUser = null,
  isAutoCron = false,
}) {
  const settingsRes = await db.query('SELECT * FROM whatsapp_settings WHERE id = 1');
  const settings = settingsRes.rows[0] || {};

  if (settings.is_paused) {
    throw new Error('إرسال الواتساب متوقف مؤقتاً من الإعدادات');
  }

  const effectiveMode = sendMode || settings.schedule_send_mode || 'test';
  const { groups, date_info } = await buildAllGroupsSchedulePreviews(targetOption, specificConfigId);

  if (isAutoCron && groups.length > 0 && !groups[0].template_is_approved) {
    console.log('⏸️ [WhatsApp Cron] قالب جدول الباكدج اليومي في وضع المراجعة — تم تخطي الإرسال التلقائي.');
    return { skipped: true, reason: 'template_not_approved_yet' };
  }

  const targetConfigs = groups.filter((g) => {
    if (!g.is_active) return false;
    return effectiveMode === 'test' ? Boolean(g.test_group_jid) : Boolean(g.wa_group_jid);
  });

  if (targetConfigs.length === 0) {
    if (effectiveMode === 'test') {
      throw new Error(
        'أنت الآن في "وضع الاختبار الآمن" ولم يتم إنشاء جروب الاختبار المشترك مع عبد الله (01224385098) بعد — اضغط على زر "🧪 إنشاء وربط جروب اختباري مع عبدالله" أولاً!'
      );
    }
    throw new Error(
      'لا توجد جروبات رسمية مربوطة ومفعّلة حالياً — اضغط على "مزامنة الجروبات" أولاً.'
    );
  }

  const delayMs = Math.max(2, Number(settings.group_delay_seconds || 4)) * 1000;
  const results = [];

  for (let i = 0; i < targetConfigs.length; i++) {
    const cfg = targetConfigs[i];

    // استبعاد أي دفعة أو جروب ليس لديه حصص مقررة اليوم (عطلة) بناءً على طلب الإدارة
    if (!cfg.sessions_count || cfg.sessions_count === 0) {
      console.log(
        `⏩ [WhatsApp Schedule] تخطي إرسال ${cfg.official_name}: عطلة / لا توجد حصص مقررة اليوم.`
      );
      results.push({
        config_id: cfg.config_id,
        official_name: cfg.official_name,
        mode: effectiveMode,
        sent: false,
        skipped: true,
        reason: 'عطلة — لا توجد حصص باكدج مقررة اليوم',
      });
      continue;
    }

    const destJid = effectiveMode === 'test' ? cfg.test_group_jid : cfg.wa_group_jid;
    const destLabel =
      effectiveMode === 'test'
        ? `[اختبار] ${cfg.official_name}`
        : cfg.official_name;
    const finalMessageText =
      effectiveMode === 'test'
        ? `🧪 *[نسخة اختبارية — ${cfg.official_name}]*\n\n${cfg.message_preview}`
        : cfg.message_preview;

    try {
      const sendRes = await sendWhatsAppMessage({
        targetPhoneOrJid: destJid,
        messageText: finalMessageText,
        category: 'DAILY_SCHEDULE',
        forceBypassConsent: true,
        staffUser: staffUser || {
          id: null,
          name: isAutoCron ? 'المجدول التلقائي للباكدج' : 'إدارة الأكاديمية',
          role: 'SYSTEM_CRON',
        },
        recipientName: destLabel,
      });

      await db.query(
        'UPDATE whatsapp_groups_config SET last_sent_at = NOW() WHERE id = $1',
        [cfg.config_id]
      );

      results.push({
        config_id: cfg.config_id,
        official_name: cfg.official_name,
        mode: effectiveMode,
        sent: sendRes.sent,
      });

      if (i < targetConfigs.length - 1) {
        await sleep(delayMs);
      }
    } catch (err) {
      results.push({
        config_id: cfg.config_id,
        official_name: cfg.official_name,
        mode: effectiveMode,
        sent: false,
        error: err.message,
      });
    }
  }

  return {
    mode: effectiveMode,
    date_info,
    totalTargeted: targetConfigs.length,
    sentCount: results.filter((r) => r.sent).length,
    skippedCount: results.filter((r) => r.skipped).length,
    results,
  };
}

/**
 * Disconnects / logs out current WhatsApp session
 */
async function logoutWhatsAppClient() {
  try {
    if (sock) {
      await sock.logout();
    }
  } catch {
    // ignore
  }
  destroyCurrentSocket();
  try {
    fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
  } catch {
    // ignore
  }
  connectionState = {
    status: 'disconnected',
    qrString: null,
    qrDataUrl: null,
    connectedPhone: null,
    connectedName: null,
    lastConnectedAt: null,
    lastError: null,
  };
  setTimeout(() => {
    startWhatsAppClient(true);
  }, 1500);
}

/**
 * Background Cron Ticker
 */
function startAutoScheduleTicker() {
  setInterval(async () => {
    try {
      if (connectionState.status !== 'connected') return;

      const settingsRes = await db.query('SELECT * FROM whatsapp_settings WHERE id = 1');
      const settings = settingsRes.rows[0];
      if (!settings || !settings.auto_send_daily_schedule || settings.is_paused) return;

      const now = new Date();
      const cairoDate = now.toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });
      const cairoTime = now.toLocaleTimeString('en-GB', {
        timeZone: 'Africa/Cairo',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      if (
        cairoTime === settings.daily_schedule_send_time &&
        settings.last_auto_schedule_run_date !== cairoDate
      ) {
        await db.query(
          'UPDATE whatsapp_settings SET last_auto_schedule_run_date = $1 WHERE id = 1',
          [cairoDate]
        );
        console.log(`⏰ [WhatsApp Cron] حان موعد الإرسال التلقائي لجدول الباكدج (${cairoTime})...`);
        await sendDailyPackageSchedules({
          targetOption: settings.daily_schedule_target || 'tomorrow',
          sendMode: settings.schedule_send_mode || 'test',
          isAutoCron: true,
        });
      }
    } catch (err) {
      console.error('Auto schedule ticker error:', err.message);
    }
  }, 45000);
}

function getConnectionState() {
  return {
    ...connectionState,
    liveGroups: liveGroupsCache,
  };
}

module.exports = {
  startWhatsAppClient,
  logoutWhatsAppClient,
  getConnectionState,
  syncWhatsAppGroups,
  createTestGroupWithPartner,
  sendWhatsAppMessage,
  sendDailyPackageSchedules,
  startAutoScheduleTicker,
  sleep,
};
