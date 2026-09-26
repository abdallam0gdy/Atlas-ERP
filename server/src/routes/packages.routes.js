const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize, requirePageAccess } = require('../middleware/rbac');
const {
  listPackages,
  getPackage,
  createPackage,
  updatePackage,
  getPackageGroups,
  getAvailableGroupsForPackage,
  addGroupsToPackage,
  removeGroupFromPackage,
  enrollStudentInPackage,
  getPackageStudents,
} = require('../controllers/packages.controller');

router.use(authenticate);
router.use(requirePageAccess('packages'));

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

// --- Package Groups & Enrollment Endpoints ---
router.get('/:id/groups',
  authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER', 'CASHIER', 'RECEPTION_ASSISTANT', 'RECEPTIONIST'),
  getPackageGroups
);

router.get('/:id/available-groups',
  authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER'),
  getAvailableGroupsForPackage
);

router.post('/:id/groups',
  authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER'),
  addGroupsToPackage
);

router.delete('/:id/groups/:groupId',
  authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER'),
  removeGroupFromPackage
);

router.post('/:id/enroll',
  authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER', 'CASHIER', 'RECEPTION_ASSISTANT', 'RECEPTIONIST'),
  enrollStudentInPackage
);

router.get('/:id/students',
  authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER', 'CASHIER', 'RECEPTION_ASSISTANT', 'RECEPTIONIST'),
  getPackageStudents
);

module.exports = router;
