const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { validate, createStudentSchema, updateStudentSchema, paginationSchema } = require('../utils/validators');
const {
  listStudents, getStudent, createStudent, updateStudent,
  bulkImportStudents, exportAllStudents,
} = require('../controllers/students.controller');
const { printSticker } = require('../controllers/barcode.controller');

// All routes require authentication
router.use(authenticate);

// GET /api/students — Search & List
router.get('/',
  authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'CASHIER', 'RECEPTION_ASSISTANT'),
  validate(paginationSchema, 'query'),
  listStudents
);

// GET /api/students/export-all — Full backup of all students
router.get('/export-all',
  authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER', 'RECEPTION_ASSISTANT', 'CASHIER'),
  exportAllStudents
);

// POST /api/students/bulk-import — Import multiple students
router.post('/bulk-import',
  authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER', 'RECEPTION_ASSISTANT'),
  bulkImportStudents
);

// GET /api/students/:id/print-sticker — Thermal sticker print
router.get('/:id/print-sticker',
  authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'CASHIER', 'RECEPTION_ASSISTANT'),
  printSticker
);

// GET /api/students/:id — Student profile
router.get('/:id',
  authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'CASHIER', 'RECEPTION_ASSISTANT'),
  getStudent
);

// POST /api/students — Create new student
router.post('/',
  authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER', 'RECEPTION_ASSISTANT', 'CASHIER', 'RECEPTIONIST'),
  validate(createStudentSchema),
  createStudent
);

// PUT /api/students/:id — Update student
router.put('/:id',
  authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER', 'RECEPTION_ASSISTANT', 'CASHIER', 'RECEPTIONIST'),
  validate(updateStudentSchema),
  updateStudent
);

module.exports = router;
