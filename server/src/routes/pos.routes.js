const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize, requirePageAccess } = require('../middleware/rbac');
const {
  listInventory,
  createItem,
  updateItem,
  deleteItem,
  createSale,
  listSales,
  getSaleDetails,
} = require('../controllers/pos.controller');

router.use(authenticate);
router.use(requirePageAccess('pos'));

// Inventory
router.get('/inventory', listInventory);
router.post('/inventory', authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER'), createItem);
router.put('/inventory/:id', authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER'), updateItem);
router.delete('/inventory/:id', authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER'), deleteItem);

// POS Sales
router.get('/sales', listSales);
router.get('/sales/:id', getSaleDetails);
router.post('/sales', createSale);

module.exports = router;
