const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const {
  getStudentAccount,
  renewSubscription,
  enrollStudentInGroup,
  unenrollStudent,
  getDebtsList,
  payDebt,
  refundClearance,
} = require('../controllers/subscriptions.controller');

router.use(authenticate);

// Student account & sessions balance
router.get('/student-account/:studentId', authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER', 'RECEPTION_ASSISTANT', 'CASHIER', 'RECEPTIONIST'), getStudentAccount);

// Renew / credit sessions
router.post('/renew', authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER', 'RECEPTION_ASSISTANT', 'CASHIER', 'RECEPTIONIST'), renewSubscription);

// Pay debt without adding sessions
router.post('/pay-debt', authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER', 'RECEPTION_ASSISTANT', 'CASHIER', 'RECEPTIONIST'), payDebt);

// Clearance & refund remaining sessions
router.post('/refund-clearance', authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER', 'RECEPTION_ASSISTANT', 'CASHIER', 'RECEPTIONIST'), refundClearance);

// Group enrollment actions
router.post('/enroll', authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER', 'RECEPTION_ASSISTANT', 'CASHIER', 'RECEPTIONIST'), enrollStudentInGroup);
router.delete('/enroll/:enrollmentId', authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER', 'RECEPTION_ASSISTANT', 'CASHIER', 'RECEPTIONIST'), unenrollStudent);

// Debts list
router.get('/debts', authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER', 'RECEPTION_ASSISTANT', 'CASHIER', 'RECEPTIONIST'), getDebtsList);

module.exports = router;
