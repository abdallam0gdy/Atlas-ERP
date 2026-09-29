require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { testConnection } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================
// MIDDLEWARE STACK
// ============================================================

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS — allow React dev server or proxy
const allowedOrigin = (!process.env.CORS_ORIGIN || process.env.CORS_ORIGIN === '*') 
  ? true 
  : process.env.CORS_ORIGIN;

app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));

// Rate limiting — protect against brute force
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP
  message: {
    success: false,
    code: 'RATE_LIMITED',
    message: 'تم تجاوز الحد المسموح — حاول مرة أخرى بعد قليل',
  },
});
app.use('/api/', limiter);

// Stricter rate limit for auth endpoint
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    code: 'AUTH_RATE_LIMITED',
    message: 'محاولات تسجيل دخول كثيرة — انتظر 15 دقيقة',
  },
});
app.use('/api/auth/login', authLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// HTTP request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Static files — uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ============================================================
// API ROUTES
// ============================================================

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/students', require('./routes/students.routes'));
app.use('/api/teachers', require('./routes/teachers.routes'));
app.use('/api/groups', require('./routes/groups.routes'));
app.use('/api/master', require('./routes/master.routes'));
app.use('/api/barcodes', require('./routes/barcode.routes'));
app.use('/api/attendance', require('./routes/attendance.routes'));
app.use('/api/finance', require('./routes/finance.routes'));
app.use('/api/pos', require('./routes/pos.routes'));
app.use('/api/booklets', require('./routes/booklets.routes'));
app.use('/api/subscriptions', require('./routes/subscriptions.routes'));
app.use('/api/packages', require('./routes/packages.routes'));
app.use('/api/users', require('./routes/users.routes'));
app.use('/api/uploads', require('./routes/uploads.routes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Atlas ERP API is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// ERROR HANDLING
// ============================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    code: 'NOT_FOUND',
    message: `المسار ${req.method} ${req.originalUrl} غير موجود`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);

  // Operational errors (expected)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      details: err.details || undefined,
    });
  }

  // PostgreSQL unique violation
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      code: 'DUPLICATE',
      message: 'البيانات موجودة بالفعل — تأكد من عدم التكرار',
    });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      code: 'FOREIGN_KEY',
      message: 'البيانات المرتبطة غير موجودة — تأكد من صحة المعرفات',
    });
  }

  // Unknown errors
  res.status(500).json({
    success: false,
    code: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'development'
      ? err.message
      : 'حدث خطأ داخلي — الرجاء المحاولة مرة أخرى',
  });
});

// ============================================================
// SERVER STARTUP
// ============================================================

const AttendanceService = require('./services/attendance.service');

const startServer = async () => {
  try {
    // Test database connection
    await testConnection();

    app.listen(PORT, () => {
      console.log('');
      console.log('═══════════════════════════════════════════════');
      console.log('   🏛️  Atlas Educational ERP — سنتر أطلس');
      console.log('═══════════════════════════════════════════════');
      console.log(`   🚀 Server running on port ${PORT}`);
      console.log(`   🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`   📡 API: http://localhost:${PORT}/api`);
      console.log(`   💚 Health: http://localhost:${PORT}/api/health`);
      console.log('═══════════════════════════════════════════════');
      console.log('');

      // Background Worker: Scan passed sessions and deduct absences automatically
      const runAbsenceWorker = async () => {
        try {
          const res = await AttendanceService.processAbsencesForPassedSessions();
          if (res.processedCount > 0) {
            console.log(`[Smart Gate Worker] ⏱️ تم فحص الحصص المنتهية: تم احتساب غياب ${res.processedCount} طالب (تم خصم ${res.deductedCount} حصة من الاشتراكات)`);
          }
        } catch (workerErr) {
          console.error('[Smart Gate Worker] خطأ في فحص الغياب التلقائي:', workerErr.message);
        }
      };

      // Run initial check 10 seconds after boot, then every 5 minutes
      setTimeout(runAbsenceWorker, 10000);
      setInterval(runAbsenceWorker, 5 * 60 * 1000);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
