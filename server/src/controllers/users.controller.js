const bcrypt = require('bcryptjs');
const db = require('../config/db');

// All standard pages in Atlas ERP for selection
const ALL_SYSTEM_PAGES = [
  { id: 'dashboard', label_ar: 'لوحة التحكم والمؤشرات', icon: 'LayoutDashboard' },
  { id: 'students', label_ar: 'شؤون الطلاب', icon: 'Users' },
  { id: 'teachers', label_ar: 'هيئة التدريس والمدرسين', icon: 'GraduationCap' },
  { id: 'groups', label_ar: 'المجموعات والقاعات', icon: 'BookOpen' },
  { id: 'subjects', label_ar: 'المواد الدراسية', icon: 'BookMarked' },
  { id: 'subscriptions', label_ar: 'اشتراكات الطلاب والحصص', icon: 'CreditCard' },
  { id: 'packages', label_ar: 'منظومة الباكدجات', icon: 'Package' },
  { id: 'finance', label_ar: 'الخزينة والمالية العامة', icon: 'Wallet' },
  { id: 'booklets', label_ar: 'مكتب الملازم والكتب', icon: 'Library' },
  { id: 'qrcode', label_ar: 'كروت الـ QR والباركود', icon: 'QrCode' },
  { id: 'gate', label_ar: 'بوابة الحضور السريعة', icon: 'DoorOpen' },
  { id: 'users', label_ar: 'إدارة الحسابات والصلاحيات', icon: 'ShieldCheck' },
];

/**
 * GET /api/users
 * List all users with role details
 */
const getUsers = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.username, u.full_name, u.full_name_ar, u.phone, u.email, u.photo_url,
              u.is_active, u.last_login_at, u.created_at,
              r.id as role_id, r.name as role_name, r.label_ar as role_label_ar,
              r.allowed_pages, r.is_system as role_is_system
       FROM users u
       JOIN roles r ON u.role_id = r.id
       ORDER BY u.created_at ASC`
    );

    res.json({
      success: true,
      data: result.rows.map((u) => ({
        id: u.id,
        username: u.username,
        fullName: u.full_name,
        fullNameAr: u.full_name_ar,
        phone: u.phone,
        email: u.email,
        photoUrl: u.photo_url,
        isActive: u.is_active,
        lastLoginAt: u.last_login_at,
        createdAt: u.created_at,
        role: {
          id: u.role_id,
          name: u.role_name,
          label: u.role_label_ar,
          isSystem: u.role_is_system,
          allowedPages: Array.isArray(u.allowed_pages)
            ? u.allowed_pages
            : (typeof u.allowed_pages === 'string' ? JSON.parse(u.allowed_pages) : []),
        },
      })),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/:id
 * Get single user
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT u.id, u.username, u.full_name, u.full_name_ar, u.phone, u.email,
              u.is_active, u.last_login_at, u.created_at,
              r.id as role_id, r.name as role_name, r.label_ar as role_label_ar,
              r.allowed_pages
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }

    const u = result.rows[0];
    res.json({
      success: true,
      data: {
        id: u.id,
        username: u.username,
        fullName: u.full_name,
        fullNameAr: u.full_name_ar,
        phone: u.phone,
        email: u.email,
        isActive: u.is_active,
        lastLoginAt: u.last_login_at,
        role: {
          id: u.role_id,
          name: u.role_name,
          label: u.role_label_ar,
          allowedPages: u.allowed_pages || [],
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/users
 * Create a new user with ready role
 */
const createUser = async (req, res, next) => {
  try {
    const { username, password, fullName, fullNameAr, phone, email, photoUrl, roleId } = req.body;

    if (!username || !password || !fullName || !roleId) {
      return res.status(400).json({
        success: false,
        message: 'يرجى إدخال جميع الحقول المطلوبة (اسم المستخدم، كلمة المرور، الاسم الكامل، ونوع الصلاحية)',
      });
    }

    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'اسم المستخدم يجب ألا يقل عن 3 أحرف باللغة الإنجليزية',
      });
    }

    if (password.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'كلمة المرور يجب ألا تقل عن 4 خانات',
      });
    }

    // Check unique username
    const exists = await db.query('SELECT id FROM users WHERE LOWER(username) = $1', [cleanUsername]);
    if (exists.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'اسم المستخدم مسجل بالفعل بحساب آخر — اختر اسم مستخدم آخر',
      });
    }

    // Check role exists
    const roleCheck = await db.query('SELECT id, name, label_ar, allowed_pages FROM roles WHERE id = $1', [roleId]);
    if (roleCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'نوع الصلاحية المحدد غير موجود',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const insertResult = await db.query(
      `INSERT INTO users (username, password_hash, full_name, full_name_ar, phone, email, photo_url, role_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
       RETURNING id, username, full_name, full_name_ar, phone, email, photo_url, is_active, created_at`,
      [cleanUsername, passwordHash, fullName.trim(), fullNameAr?.trim() || fullName.trim(), phone || null, email || null, photoUrl || null, roleId]
    );

    const newUser = insertResult.rows[0];
    const role = roleCheck.rows[0];

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      data: {
        id: newUser.id,
        username: newUser.username,
        fullName: newUser.full_name,
        fullNameAr: newUser.full_name_ar,
        phone: newUser.phone,
        email: newUser.email,
        photoUrl: newUser.photo_url,
        isActive: newUser.is_active,
        role: {
          id: role.id,
          name: role.name,
          label: role.label_ar,
          allowedPages: role.allowed_pages || [],
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/users/:id
 * Update user details & role
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fullName, fullNameAr, phone, email, photoUrl, roleId, isActive } = req.body;

    const userCheck = await db.query('SELECT id, username, role_id FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }

    const existingUser = userCheck.rows[0];

    // Cannot demote primary admin username
    if (existingUser.username === 'admin') {
      const superRole = await db.query("SELECT id FROM roles WHERE name = 'SUPER_ADMIN_OWNER'");
      if (roleId && roleId !== superRole.rows[0]?.id) {
        return res.status(400).json({ success: false, message: 'لا يمكن تغيير رتبة حساب المدير الأساسي (admin)' });
      }
    }

    const updated = await db.query(
      `UPDATE users
       SET full_name = COALESCE($1, full_name),
           full_name_ar = COALESCE($2, full_name_ar),
           phone = $3,
           email = $4,
           photo_url = COALESCE($5, photo_url),
           role_id = COALESCE($6, role_id),
           is_active = COALESCE($7, is_active),
           updated_at = NOW()
       WHERE id = $8
       RETURNING id, username, full_name, full_name_ar, phone, email, photo_url, is_active, role_id`,
      [
        fullName?.trim() || null,
        fullNameAr?.trim() || null,
        phone || null,
        email || null,
        photoUrl !== undefined ? photoUrl : null,
        roleId || null,
        isActive !== undefined ? isActive : null,
        id,
      ]
    );

    const u = updated.rows[0];
    const roleRes = await db.query('SELECT id, name, label_ar, allowed_pages FROM roles WHERE id = $1', [u.role_id]);
    const role = roleRes.rows[0] || {};

    res.json({
      success: true,
      message: 'تم تحديث بيانات الحساب بنجاح',
      data: {
        id: u.id,
        username: u.username,
        fullName: u.full_name,
        fullNameAr: u.full_name_ar,
        phone: u.phone,
        email: u.email,
        photoUrl: u.photo_url,
        isActive: u.is_active,
        role: {
          id: role.id,
          name: role.name,
          label: role.label_ar,
          allowedPages: role.allowed_pages || [],
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/users/:id/reset-password
 * Reset user password by Admin
 */
const resetPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'كلمة المرور الجديدة يجب ألا تقل عن 4 خانات',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    const result = await db.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING id, username',
      [passwordHash, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }

    res.json({
      success: true,
      message: `تم إعادة تعيين كلمة المرور للمستخدم (${result.rows[0].username}) بنجاح`,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/users/:id/toggle-active
 * Toggle user active/inactive
 */
const toggleUserActive = async (req, res, next) => {
  try {
    const { id } = req.params;

    const userCheck = await db.query('SELECT id, username, is_active FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }

    if (userCheck.rows[0].username === 'admin') {
      return res.status(400).json({ success: false, message: 'لا يمكن تعطيل حساب المدير الأساسي (admin)' });
    }

    if (userCheck.rows[0].id === req.user.id) {
      return res.status(400).json({ success: false, message: 'لا يمكنك تعطيل حسابك الحالي' });
    }

    const newStatus = !userCheck.rows[0].is_active;
    await db.query('UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2', [newStatus, id]);

    res.json({
      success: true,
      message: newStatus ? 'تم تفعيل الحساب بنجاح' : 'تم تعطيل الحساب بنجاح',
      data: { isActive: newStatus },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/users/:id
 * Delete user (protected against admin and self)
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const userCheck = await db.query('SELECT id, username FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }

    if (userCheck.rows[0].username === 'admin') {
      return res.status(400).json({ success: false, message: 'لا يمكن حذف حساب المدير الأساسي (admin)' });
    }

    if (userCheck.rows[0].id === req.user.id) {
      return res.status(400).json({ success: false, message: 'لا يمكنك حذف حسابك الحالي أثناء تسجيل الدخول به' });
    }

    await db.query('DELETE FROM users WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'تم حذف حساب المستخدم بنجاح',
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// ROLES & PERMISSIONS MANAGEMENT (أنواع الحسابات والصلاحيات)
// ============================================================

/**
 * GET /api/users/roles
 * List all roles with allowed pages and user counts
 */
const getRoles = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT r.id, r.name, r.label_ar, r.label_en, r.description, r.is_system,
              r.allowed_pages, r.created_at,
              COUNT(u.id) as user_count
       FROM roles r
       LEFT JOIN users u ON r.id = u.role_id
       GROUP BY r.id
       ORDER BY r.is_system DESC, r.created_at ASC`
    );

    res.json({
      success: true,
      data: result.rows.map((r) => ({
        id: r.id,
        name: r.name,
        labelAr: r.label_ar,
        labelEn: r.label_en,
        description: r.description,
        isSystem: r.is_system,
        userCount: parseInt(r.user_count, 10) || 0,
        allowedPages: Array.isArray(r.allowed_pages)
          ? r.allowed_pages
          : (typeof r.allowed_pages === 'string' ? JSON.parse(r.allowed_pages) : []),
      })),
      systemPages: ALL_SYSTEM_PAGES,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/users/roles
 * Create a new custom role with allowed pages
 */
const createRole = async (req, res, next) => {
  try {
    const { name, labelAr, description, allowedPages } = req.body;

    if (!name || !labelAr) {
      return res.status(400).json({
        success: false,
        message: 'يرجى إدخال اسم الدور بالإنجليزية والاسم المعروض بالعربية',
      });
    }

    const cleanName = name.trim().toUpperCase().replace(/\s+/g, '_');

    // Check unique name
    const exists = await db.query('SELECT id FROM roles WHERE name = $1', [cleanName]);
    if (exists.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'نوع الصلاحية بهذا الاسم موجود بالفعل',
      });
    }

    const pagesArray = Array.isArray(allowedPages) ? allowedPages : [];

    const insertResult = await db.query(
      `INSERT INTO roles (name, label_ar, label_en, description, is_system, allowed_pages)
       VALUES ($1, $2, $3, $4, false, $5::jsonb)
       RETURNING id, name, label_ar, description, is_system, allowed_pages, created_at`,
      [cleanName, labelAr.trim(), cleanName, description?.trim() || null, JSON.stringify(pagesArray)]
    );

    const newRole = insertResult.rows[0];

    res.status(201).json({
      success: true,
      message: 'تم إنشاء نوع الحساب بنجاح',
      data: {
        id: newRole.id,
        name: newRole.name,
        labelAr: newRole.label_ar,
        description: newRole.description,
        isSystem: newRole.is_system,
        userCount: 0,
        allowedPages: newRole.allowed_pages || [],
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/users/roles/:id
 * Update role and its allowed pages
 */
const updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { labelAr, description, allowedPages } = req.body;

    const roleCheck = await db.query('SELECT id, name, is_system, allowed_pages FROM roles WHERE id = $1', [id]);
    if (roleCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'نوع الحساب غير موجود' });
    }

    const currentRole = roleCheck.rows[0];

    // SUPER_ADMIN_OWNER always keeps all pages
    let finalPages = Array.isArray(allowedPages) ? allowedPages : currentRole.allowed_pages;
    if (currentRole.name === 'SUPER_ADMIN_OWNER') {
      finalPages = ALL_SYSTEM_PAGES.map((p) => p.id);
    }

    const updated = await db.query(
      `UPDATE roles
       SET label_ar = COALESCE($1, label_ar),
           description = COALESCE($2, description),
           allowed_pages = $3::jsonb,
           updated_at = NOW()
       WHERE id = $4
       RETURNING id, name, label_ar, label_en, description, is_system, allowed_pages`,
      [labelAr?.trim() || null, description !== undefined ? description?.trim() : null, JSON.stringify(finalPages), id]
    );

    const r = updated.rows[0];

    res.json({
      success: true,
      message: 'تم تحديث نوع الحساب وصفحاته المسموحة بنجاح',
      data: {
        id: r.id,
        name: r.name,
        labelAr: r.label_ar,
        labelEn: r.label_en,
        description: r.description,
        isSystem: r.is_system,
        allowedPages: r.allowed_pages || [],
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/users/roles/:id
 * Delete custom role
 */
const deleteRole = async (req, res, next) => {
  try {
    const { id } = req.params;

    const roleCheck = await db.query('SELECT id, name, is_system FROM roles WHERE id = $1', [id]);
    if (roleCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'نوع الحساب غير موجود' });
    }

    if (roleCheck.rows[0].is_system) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن حذف الأدوار الأساسية الخاصة بالنظام',
      });
    }

    // Check if any users are assigned
    const userCount = await db.query('SELECT COUNT(*) FROM users WHERE role_id = $1', [id]);
    if (parseInt(userCount.rows[0].count, 10) > 0) {
      return res.status(400).json({
        success: false,
        message: `لا يمكن حذف هذا الدور لوجود (${userCount.rows[0].count}) حسابات مرتبطة به — قم بتغيير أدوارهم أولاً`,
      });
    }

    await db.query('DELETE FROM roles WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'تم حذف نوع الحساب بنجاح',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  resetPassword,
  toggleUserActive,
  deleteUser,
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  ALL_SYSTEM_PAGES,
};
