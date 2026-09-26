const express = require('express');
const router = express.Router();
const bookletsController = require('../controllers/booklets.controller');
const { authenticate } = require('../middleware/auth');
const { authorize, requirePageAccess } = require('../middleware/rbac');

router.use(authenticate);
router.use(requirePageAccess('booklets'));

// Booklets CRUD
router.get('/', bookletsController.listBooklets);
router.post('/', authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER', 'RECEPTION_ASSISTANT', 'CASHIER', 'RECEPTIONIST'), bookletsController.createBooklet);
router.put('/:id', authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER', 'RECEPTION_ASSISTANT', 'CASHIER', 'RECEPTIONIST'), bookletsController.updateBooklet);

// Reservations
router.get('/reservations', bookletsController.listReservations);
router.post('/reservations', authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER', 'RECEPTION_ASSISTANT', 'CASHIER', 'RECEPTIONIST'), bookletsController.createReservation);
router.put('/reservations/:id/deliver', authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER', 'RECEPTION_ASSISTANT', 'CASHIER', 'RECEPTIONIST'), bookletsController.deliverReservation);
router.delete('/reservations/:id/cancel', authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER', 'RECEPTION_ASSISTANT', 'CASHIER', 'RECEPTIONIST'), bookletsController.cancelReservation);

// Treasury stats for booklets desk
router.get('/treasury-stats', bookletsController.getBookletsTreasuryStats);

module.exports = router;
