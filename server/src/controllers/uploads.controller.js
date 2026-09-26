const path = require('path');
const fs = require('fs');
const { compressAndSaveImage, ALLOWED_CATEGORIES, UPLOADS_ROOT } = require('../middleware/upload.middleware');
const { BadRequestError } = require('../utils/errors');

/**
 * POST /api/uploads/photo/:category
 * Upload and compress an image to WebP with secure unguessable random name
 */
const uploadPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new BadRequestError('يرجى اختيار صورة لرفعها');
    }

    const category = req.params.category || 'students';
    if (!ALLOWED_CATEGORIES.includes(category)) {
      throw new BadRequestError(`القسم غير صالح. الأقسام المتاحة: ${ALLOWED_CATEGORIES.join(', ')}`);
    }

    const result = await compressAndSaveImage(req.file.buffer, category);

    res.status(201).json({
      success: true,
      message: `تم رفع وضغط الصورة بنجاح (توفير مساحة ${result.savedPercentage}%)`,
      data: {
        url: result.url,
        filename: result.filename,
        category: result.category,
        originalSizeKb: Math.round(result.originalSize / 1024),
        compressedSizeKb: Math.round(result.compressedSize / 1024),
        savedPercentage: result.savedPercentage,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/uploads/photo
 * Delete an uploaded photo file
 */
const deletePhoto = async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      throw new BadRequestError('رابط الصورة مطلوب');
    }

    // Security check: ensure path is within /uploads/ and doesn't do directory traversal
    const normalized = path.normalize(url).replace(/^(\.\.(\/|\\|$))+/, '');
    if (!normalized.startsWith('/uploads/')) {
      throw new BadRequestError('مسار الصورة غير صالح');
    }

    const relativeSubPath = normalized.replace(/^\/uploads\//, '');
    const absolutePath = path.join(UPLOADS_ROOT, relativeSubPath);

    // Verify it stays inside UPLOADS_ROOT
    if (!absolutePath.startsWith(UPLOADS_ROOT)) {
      throw new BadRequestError('مسار غير مصرح به');
    }

    if (fs.existsSync(absolutePath)) {
      await fs.promises.unlink(absolutePath);
    }

    res.json({
      success: true,
      message: 'تم حذف الصورة بنجاح',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadPhoto,
  deletePhoto,
};
