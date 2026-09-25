const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const {
  getDebtsReport,
  settleDebt,
  getTreasuryStats,
  listTransactions,
  addExpense,
  addDeposit,
  addPettyCashMovement,
  closeSettlement,
  listSettlements,
} = require('../controllers/finance.controller');

router.use(authenticate);

// Debts engine
router.get('/debts', authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER', 'RECEPTION_ASSISTANT', 'CASHIER', 'RECEPTIONIST'), getDebtsReport);
router.post('/settle-debt', authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER', 'RECEPTION_ASSISTANT', 'CASHIER', 'RECEPTIONIST'), settleDebt);

// Treasury & Manager stats
router.get('/treasury-stats', authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER'), getTreasuryStats);
router.get('/transactions', authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER'), listTransactions);

// Cash operations
router.post('/expenses', authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER'), addExpense);
router.post('/deposits', authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER'), addDeposit);
router.post('/petty-cash', authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER', 'RECEPTION_ASSISTANT', 'CASHIER', 'RECEPTIONIST'), addPettyCashMovement);

// Shift closing & settlement
router.post('/settlements', authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER'), closeSettlement);
router.get('/settlements', authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER'), listSettlements);

module.exports = router;
