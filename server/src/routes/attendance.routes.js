const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { validate, attendanceScanSchema } = require('../utils/validators');
const {
  scanAttendance,
  getTodayAttendance,
  lookupStudent,
  processAbsences,
  excuseAbsence,
  cancelSession,
  cancelTeacherSessions,
  uncancelSession,
  getCancelledSessions,
} = require('../controllers/attendance.controller');

router.use(authenticate);

// ✨ GET /api/attendance/lookup — Preview student details by center code, barcode, or phone
router.get('/lookup',
  authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'CASHIER', 'RECEPTION_ASSISTANT'),
  lookupStudent
);

// ✨ POST /api/attendance/scan — THE GATE ENDPOINT
router.post('/scan',
  authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'CASHIER', 'RECEPTION_ASSISTANT'),
  validate(attendanceScanSchema),
  scanAttendance
);

// POST /api/attendance/process-absences — Trigger absence deduction for passed classes
router.post('/process-absences',
  authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER', 'CASHIER', 'RECEPTION_ASSISTANT'),
  processAbsences
);

// POST /api/attendance/:id/excuse — Excuse an absent session and restore deducted session
router.post('/:id/excuse',
  authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER', 'CASHIER'),
  excuseAbsence
);

// 🚫 Session Cancellation System (إلغاء حصة / اعتذار مدرس)
router.post('/cancel-session',
  authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER', 'CASHIER', 'RECEPTION_ASSISTANT'),
  cancelSession
);

router.post('/cancel-teacher-sessions',
  authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER', 'CASHIER', 'RECEPTION_ASSISTANT'),
  cancelTeacherSessions
);

router.delete('/cancelled-sessions/:id',
  authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER', 'CASHIER'),
  uncancelSession
);

router.get('/cancelled-sessions',
  authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER', 'CASHIER', 'RECEPTION_ASSISTANT'),
  getCancelledSessions
);

// GET /api/attendance/today — Today's attendance log
router.get('/today',
  authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER', 'CASHIER', 'RECEPTION_ASSISTANT'),
  getTodayAttendance
);

module.exports = router;
