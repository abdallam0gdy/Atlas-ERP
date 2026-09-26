const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { upload } = require('../middleware/upload.middleware');
const uploadsController = require('../controllers/uploads.controller');

// All upload actions require active authentication
router.use(authenticate);

// POST /api/uploads/photo/:category
router.post('/photo/:category', upload.single('photo'), uploadsController.uploadPhoto);

// DELETE /api/uploads/photo
router.delete('/photo', uploadsController.deletePhoto);

module.exports = router;
