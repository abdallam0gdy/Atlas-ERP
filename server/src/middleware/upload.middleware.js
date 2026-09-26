const multer = require('multer');
const sharp = require('sharp');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { BadRequestError } = require('../utils/errors');

// Allowed categories
const ALLOWED_CATEGORIES = ['students', 'teachers', 'logos', 'users'];

// Base uploads directory
const UPLOADS_ROOT = path.join(__dirname, '../../uploads');

// Ensure upload folders exist
ALLOWED_CATEGORIES.forEach((cat) => {
  const dir = path.join(UPLOADS_ROOT, cat);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Memory storage to process in-memory before saving compressed file
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError('نوع الملف غير مدعوم، يرجى رفع صورة فقط (JPEG, PNG, WebP)'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max input
  },
  fileFilter,
});

/**
 * Compress image with sharp and save with a cryptographically secure random filename
 * @param {Buffer} buffer
 * @param {string} category 'students' | 'teachers' | 'logos' | 'users'
 * @returns {Promise<{ url: string, originalSize: number, compressedSize: number, savedPercentage: number }>}
 */
const compressAndSaveImage = async (buffer, category = 'students') => {
  const validCategory = ALLOWED_CATEGORIES.includes(category) ? category : 'students';
  const targetDir = path.join(UPLOADS_ROOT, validCategory);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Generate 48-character cryptographically secure unguessable name
  const secureRandomToken = crypto.randomBytes(24).toString('hex');
  const filename = `${validCategory}_${secureRandomToken}.webp`;
  const filePath = path.join(targetDir, filename);

  const isLogo = validCategory === 'logos';
  const maxWidth = isLogo ? 600 : 500;
  const maxHeight = isLogo ? 600 : 500;
  const quality = isLogo ? 85 : 80;

  const compressedBuffer = await sharp(buffer)
    .resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality, effort: 4 })
    .toBuffer();

  await fs.promises.writeFile(filePath, compressedBuffer);

  const originalSize = buffer.length;
  const compressedSize = compressedBuffer.length;
  const savedPercentage = Math.round(((originalSize - compressedSize) / originalSize) * 100);

  return {
    url: `/uploads/${validCategory}/${filename}`,
    filename,
    category: validCategory,
    originalSize,
    compressedSize,
    savedPercentage: Math.max(0, savedPercentage),
  };
};

module.exports = {
  upload,
  compressAndSaveImage,
  ALLOWED_CATEGORIES,
  UPLOADS_ROOT,
};
