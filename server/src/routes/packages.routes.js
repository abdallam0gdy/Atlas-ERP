const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const {
  listPackages,
  getPackage,
  createPackage,
  updatePackage,
} = require('../controllers/packages.controller');

router.use(authenticate);

router.get('/',
  authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER', 'CASHIER', 'RECEPTION_ASSISTANT', 'RECEPTIONIST'),
  listPackages
);

router.get('/:id',
  authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER', 'CASHIER', 'RECEPTION_ASSISTANT', 'RECEPTIONIST'),
  getPackage
);

router.post('/',
  authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER'),
  createPackage
);

router.put('/:id',
  authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER'),
  updatePackage
);

module.exports = router;
