const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const {
  listGrades, listSubjects, createSubject, updateSubject, deleteSubject,
  listClassrooms, createClassroom, updateClassroom, deleteClassroom,
  getSettings, updateSettings,
  listStudentStatuses, listRoles, getDashboardStats,
} = require('../controllers/master.controller');

router.use(authenticate);

// Dashboard stats
router.get('/dashboard-stats', getDashboardStats);

// System Settings
router.get('/settings', getSettings);
router.put('/settings', authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER'), updateSettings);

// Lookups — available to all authenticated users
router.get('/grades', listGrades);
router.get('/subjects', listSubjects);
router.post('/subjects', authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER'), createSubject);
router.put('/subjects/:id', authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER'), updateSubject);
router.delete('/subjects/:id', authorize('SUPER_ADMIN_OWNER'), deleteSubject);

// Classrooms
router.get('/classrooms', listClassrooms);
router.post('/classrooms', authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER'), createClassroom);
router.put('/classrooms/:id', authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER'), updateClassroom);
router.delete('/classrooms/:id', authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER'), deleteClassroom);

router.get('/student-statuses', listStudentStatuses);

// Roles — admin only
router.get('/roles',
  authorize('SUPER_ADMIN_OWNER'),
  listRoles
);

module.exports = router;

