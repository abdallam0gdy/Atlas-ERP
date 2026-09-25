const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { validate, generateBarcodeSchema, assignBarcodeSchema } = require('../utils/validators');
const { generateBatch, assignCard, listBatches, getBatchItems, printSticker } = require('../controllers/barcode.controller');

router.use(authenticate);

// Generate a batch of barcodes
router.post('/generate-batch',
  authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER'),
  validate(generateBarcodeSchema),
  generateBatch
);

// Assign a pre-printed card to a student
router.post('/assign',
  authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'RECEPTION_ASSISTANT'),
  validate(assignBarcodeSchema),
  assignCard
);

// List all batches
router.get('/batches',
  authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER'),
  listBatches
);

// Get items in a batch
router.get('/batches/:id/items',
  authorize('SUPER_ADMIN_OWNER', 'CENTER_MANAGER'),
  getBatchItems
);

// Print barcode sticker for a student
router.get('/students/:id/print-sticker', printSticker);

module.exports = router;
