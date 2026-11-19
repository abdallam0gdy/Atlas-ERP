const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

const WA_SERVICE_BASE = process.env.WHATSAPP_SERVICE_URL || 'http://127.0.0.1:5055/api';

// Cache user display names for 60 seconds to avoid repetitive queries
const staffInfoCache = new Map();

async function resolveStaffUser(reqUser) {
  if (!reqUser || !reqUser.id) {
    return { id: null, name: 'موظف النظام', role: 'STAFF' };
  }

  const cached = staffInfoCache.get(reqUser.id);
  if (cached && Date.now() - cached.ts < 60000) {
    return cached.data;
  }

  try {
    const res = await db.query(
      `SELECT COALESCE(u.full_name_ar, u.full_name, u.username) AS display_name,
              COALESCE(r.label_ar, r.name, 'موظف') AS role_label
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1
       LIMIT 1`,
      [reqUser.id]
    );
    const row = res.rows[0];
    const data = {
      id: reqUser.id,
      name: row ? row.display_name : reqUser.username || 'موظف النظام',
      role: row ? row.role_label : reqUser.roleName || 'موظف',
    };
    staffInfoCache.set(reqUser.id, { ts: Date.now(), data });
    return data;
  } catch {
    return {
      id: reqUser.id,
      name: reqUser.username || 'موظف النظام',
      role: reqUser.roleName || 'موظف',
    };
  }
}

// Protect all WhatsApp ERP endpoints with JWT authentication
// (Any logged-in staff member can view & reply to chats, and their user info is logged!)
router.use(authenticate);

// Forward all requests under /api/whatsapp/* to the standalone whatsapp-system microservice
router.use(async (req, res) => {
  const staffUser = await resolveStaffUser(req.user);
  const subPath = req.originalUrl.replace(/^\/api\/whatsapp/, '') || '/status';
  const targetUrl = `${WA_SERVICE_BASE}${subPath}`;

  try {
    const headers = {
      'Content-Type': 'application/json',
      'x-staff-user-id': staffUser.id ? String(staffUser.id) : '',
      'x-staff-user-name': encodeURIComponent(staffUser.name),
      'x-staff-user-role': encodeURIComponent(staffUser.role),
    };

    const fetchOptions = {
      method: req.method,
      headers,
    };

    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      fetchOptions.body = JSON.stringify({
        ...(req.body || {}),
        staffUser,
      });
    }

    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    // Graceful fallback if the standalone whatsapp-system service on port 5055 is offline
    if (req.path === '/status' || subPath.startsWith('/status')) {
      return res.json({
        success: true,
        data: {
          connection: {
            status: 'service_offline',
            qrDataUrl: null,
            connectedPhone: null,
            connectedName: null,
            lastError: 'خدمة الواتساب المستقلة (whatsapp-system) غير مشغلة حالياً على المنفذ 5055',
            liveGroups: [],
          },
          settings: {},
          stats: {
            total_chats: 0,
            unread_messages: 0,
            opted_in_contacts: 0,
            sent_today: 0,
            total_logs: 0,
          },
        },
      });
    }

    return res.status(503).json({
      success: false,
      serviceOffline: true,
      message: 'خدمة الواتساب المستقلة (whatsapp-system) غير متصلة حالياً — تأكد من تشغيلها.',
      error: err.message,
    });
  }
});

module.exports = router;

