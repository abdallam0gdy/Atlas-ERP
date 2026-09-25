const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { validate, createTeacherSchema } = require('../utils/validators');
const { listTeachers, getTeacher, createTeacher, updateTeacher, bulkImportTeachers } = require('../controllers/teachers.controller');

router.use(authenticate);

router.get('/',
  authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER', 'CASHIER', 'RECEPTION_ASSISTANT', 'RECEPTIONIST'),
  listTeachers
);

router.post('/bulk-import',
  authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER'),
  bulkImportTeachers
);

router.get('/:id',
  authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER', 'CASHIER', 'RECEPTION_ASSISTANT', 'RECEPTIONIST'),
  getTeacher
);


router.post('/',
  authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER'),
  validate(createTeacherSchema),
  createTeacher
);

router.put('/:id',
  authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER'),
  updateTeacher
);

module.exports = router;
