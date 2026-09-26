const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { AuthenticationError } = require('../utils/errors');

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const identifier = (username || '').trim();

    // Fetch user with role info and permissions (by username OR phone number)
    const userResult = await db.query(
      `SELECT u.id, u.username, u.password_hash, u.full_name, u.full_name_ar, u.phone, u.email,
              u.is_active, r.id as role_id, r.name as role_name, r.label_ar as role_label, r.allowed_pages
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE LOWER(u.username) = LOWER($1) OR u.phone = $1`,
      [identifier]
    );

    if (userResult.rows.length === 0) {
      throw new AuthenticationError('اسم المستخدم أو كلمة المرور غير صحيحة');
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      throw new AuthenticationError('الحساب معطل — تواصل مع مدير النظام');
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new AuthenticationError('اسم المستخدم أو كلمة المرور غير صحيحة');
    }

    // Fetch permissions for this role
    const permResult = await db.query(
      `SELECT p.code FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = $1`,
      [user.role_id]
    );
    const permissions = permResult.rows.map((r) => r.code);

    const allowedPages = Array.isArray(user.allowed_pages)
      ? user.allowed_pages
      : (typeof user.allowed_pages === 'string' ? JSON.parse(user.allowed_pages) : []);

    // Generate JWT
    const tokenPayload = {
      id: user.id,
      username: user.username,
      role: user.role_id,
      roleName: user.role_name,
      allowedPages,
      permissions,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    });

    const refreshToken = jwt.sign(
      { id: user.id, type: 'refresh' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    // Update last login
    await db.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    res.json({
      success: true,
      data: {
        token,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.full_name,
          fullNameAr: user.full_name_ar,
          phone: user.phone,
          email: user.email,
          role: {
            id: user.role_id,
            name: user.role_name,
            label: user.role_label,
            allowedPages,
          },
          permissions,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 * Get current authenticated user info
 */
const getMe = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.username, u.full_name, u.full_name_ar, u.phone, u.email,
              u.is_active, u.last_login_at,
              r.id as role_id, r.name as role_name, r.label_ar as role_label, r.allowed_pages
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      throw new AuthenticationError('المستخدم غير موجود');
    }

    const user = result.rows[0];
    const allowedPages = Array.isArray(user.allowed_pages)
      ? user.allowed_pages
      : (typeof user.allowed_pages === 'string' ? JSON.parse(user.allowed_pages) : []);

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        fullNameAr: user.full_name_ar,
        phone: user.phone,
        email: user.email,
        isActive: user.is_active,
        lastLoginAt: user.last_login_at,
        role: {
          id: user.role_id,
          name: user.role_name,
          label: user.role_label,
          allowedPages,
        },
        permissions: req.user.permissions || [],
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/auth/profile
 * Update profile of authenticated user
 */
const updateProfile = async (req, res, next) => {
  try {
    const { fullName, fullNameAr, username, phone, email } = req.body;

    if (username) {
      const existing = await db.query(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [username, req.user.id]
      );
      if (existing.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'اسم المستخدم مسجل بالفعل بحساب آخر' });
      }
    }

    const updated = await db.query(
      `UPDATE users
       SET full_name = COALESCE($1, full_name),
           full_name_ar = COALESCE($2, full_name_ar),
           username = COALESCE($3, username),
           phone = $4,
           email = $5,
           updated_at = NOW()
       WHERE id = $6
       RETURNING id, username, full_name, full_name_ar, phone, email, is_active, role_id`,
      [fullName, fullNameAr, username, phone || null, email || null, req.user.id]
    );

    const user = updated.rows[0];

    const roleRes = await db.query('SELECT name, label_ar FROM roles WHERE id = $1', [user.role_id]);
    const role = roleRes.rows[0] || {};

    res.json({
      success: true,
      message: 'تم تحديث بيانات الملف الشخصي بنجاح',
      data: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        fullNameAr: user.full_name_ar,
        phone: user.phone,
        email: user.email,
        isActive: user.is_active,
        role: {
          id: user.role_id,
          name: role.name,
          label: role.label_ar,
        },
        permissions: req.user.permissions || [],
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/auth/change-password
 * Change password for authenticated user
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'يرجى إدخال كلمة المرور الحالية والجديدة' });
    }

    if (newPassword.length < 3) {
      return res.status(400).json({ success: false, message: 'يجب ألا تقل كلمة المرور الجديدة عن 3 أحرف أو أرقام' });
    }

    const userRes = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (userRes.rows.length === 0) {
      throw new AuthenticationError('المستخدم غير موجود');
    }

    const isMatch = await bcrypt.compare(currentPassword, userRes.rows[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'كلمة المرور الحالية غير صحيحة' });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await db.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, req.user.id]);

    res.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, getMe, updateProfile, changePassword };
