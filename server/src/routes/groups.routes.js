const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize, requirePageAccess } = require('../middleware/rbac');
const { validate, createGroupSchema } = require('../utils/validators');
const { listGroups, getGroup, createGroup, updateGroup, enrollStudent } = require('../controllers/groups.controller');

router.use(authenticate);
router.use(requirePageAccess('groups'));

router.get('/',
  authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER', 'CASHIER', 'RECEPTION_ASSISTANT', 'RECEPTIONIST'),
  listGroups
);

router.get('/:id',
  authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER', 'CASHIER', 'RECEPTION_ASSISTANT', 'RECEPTIONIST'),
  getGroup
);

router.post('/',
  authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER'),
  validate(createGroupSchema),
  createGroup
);

router.put('/:id',
  authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER'),
  updateGroup
);

router.post('/:id/enroll',
  authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER', 'RECEPTION_ASSISTANT', 'CASHIER', 'RECEPTIONIST'),
  enrollStudent
);

module.exports = router;

