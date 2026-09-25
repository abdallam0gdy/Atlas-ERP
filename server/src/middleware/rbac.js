const { AuthorizationError } = require('../utils/errors');

/**
 * Role-Based Access Control (RBAC) Middleware
 * 
 * Usage:
 *   router.get('/admin-only', authorize('SUPER_ADMIN_OWNER'), handler);
 *   router.get('/managers', authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER'), handler);
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        code: 'AUTH_REQUIRED',
        message: 'الرجاء تسجيل الدخول أولاً',
      });
    }

    const userRole = req.user.roleName;

    // SUPER_ADMIN_OWNER always has access to everything
    if (userRole === 'SUPER_ADMIN_OWNER') {
      return next();
    }

    // Role alias normalization (e.g. RECEPTIONIST <-> RECEPTION_ASSISTANT)
    const normalize = (r) => (r === 'RECEPTIONIST' ? 'RECEPTION_ASSISTANT' : r);
    const normalizedUserRole = normalize(userRole);
    const normalizedAllowed = allowedRoles.map(normalize);

    if (!normalizedAllowed.includes(normalizedUserRole)) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'ليس لديك صلاحية للوصول إلى هذا المورد',
        required_roles: allowedRoles,
        your_role: userRole,
      });
    }

    next();
  };
};

/**
 * Permission-Based Access Control
 * More granular than role-based — checks specific permission codes
 * 
 * Usage:
 *   router.delete('/students/:id', requirePermission('students.delete'), handler);
 */
const requirePermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        code: 'AUTH_REQUIRED',
        message: 'الرجاء تسجيل الدخول أولاً',
      });
    }

    // SUPER_ADMIN_OWNER bypasses permission checks
    if (req.user.roleName === 'SUPER_ADMIN_OWNER') {
      return next();
    }

    const userPermissions = req.user.permissions || [];
    const hasPermission = requiredPermissions.some((p) => userPermissions.includes(p));

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'ليس لديك الصلاحيات المطلوبة',
        required: requiredPermissions,
      });
    }

    next();
  };
};

module.exports = { authorize, requirePermission };
