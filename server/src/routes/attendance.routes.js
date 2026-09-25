const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { validate, attendanceScanSchema } = require('../utils/validators');
const { scanAttendance, getTodayAttendance, lookupStudent } = require('../controllers/attendance.controller');

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

// GET /api/attendance/today — Today's attendance log
router.get('/today',
  authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER', 'CASHIER', 'RECEPTION_ASSISTANT'),
  getTodayAttendance
);

module.exports = router;
