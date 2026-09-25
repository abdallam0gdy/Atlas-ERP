const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const usersController = require('../controllers/users.controller');

// All user and role management routes are strictly restricted to SUPER_ADMIN_OWNER
router.use(authenticate);
router.use(authorize('SUPER_ADMIN_OWNER'));

// --- Roles & Permissions Management ---
router.get('/roles', usersController.getRoles);
router.post('/roles', usersController.createRole);
router.put('/roles/:id', usersController.updateRole);
router.delete('/roles/:id', usersController.deleteRole);

// --- Users Management ---
router.get('/', usersController.getUsers);
router.get('/:id', usersController.getUserById);
router.post('/', usersController.createUser);
router.put('/:id', usersController.updateUser);
router.put('/:id/reset-password', usersController.resetPassword);
router.put('/:id/toggle-active', usersController.toggleUserActive);
router.delete('/:id', usersController.deleteUser);

module.exports = router;
