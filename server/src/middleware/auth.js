const jwt = require('jsonwebtoken');
const { AuthenticationError } = require('../utils/errors');

/**
 * JWT Authentication Middleware
 * Extracts and verifies the JWT token from Authorization header
 * Attaches decoded user data to req.user
 */
const authenticate = (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      throw new AuthenticationError('Token مطلوب — الرجاء تسجيل الدخول');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
      roleName: decoded.roleName,
      permissions: decoded.permissions || [],
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        code: 'TOKEN_EXPIRED',
        message: 'انتهت صلاحية الجلسة — الرجاء تسجيل الدخول مرة أخرى',
      });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        code: 'INVALID_TOKEN',
        message: 'Token غير صالح',
      });
    }
    if (err instanceof AuthenticationError) {
      return res.status(err.statusCode).json({
        success: false,
        code: err.code,
        message: err.message,
      });
    }
    next(err);
  }
};

/**
 * Optional authentication — doesn't fail if no token, just doesn't set req.user
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role,
        roleName: decoded.roleName,
        permissions: decoded.permissions || [],
      };
    }
  } catch (err) {
    // Silently ignore — user just won't be authenticated
  }
  next();
};

module.exports = { authenticate, optionalAuth };
