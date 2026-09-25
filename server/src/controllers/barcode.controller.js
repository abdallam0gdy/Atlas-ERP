const BarcodeService = require('../services/barcode.service');
const QRCode = require('qrcode');

/**
 * POST /api/barcodes/generate-batch
 * Generate a batch of sequential barcodes
 */
const generateBatch = async (req, res, next) => {
  try {
    const { batch_name, grade_id, count, start_from } = req.body;

    const result = await BarcodeService.generateBatch({
      batch_name,
      grade_id,
      count,
      start_from: start_from || 1,
      generated_by: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: `تم توليد ${result.barcodes.length} باركود بنجاح للـ ${result.gradeName}`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/barcodes/assign
 * Assign a pre-printed barcode card to a student
 */
const assignCard = async (req, res, next) => {
  try {
    const { barcode_value, student_id } = req.body;

    const result = await BarcodeService.assignCard(barcode_value, student_id);

    res.json({
      success: true,
      message: 'تم ربط الكارت بالطالب بنجاح',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/barcodes/batches
 * List all barcode batches
 */
const listBatches = async (req, res, next) => {
  try {
    const batches = await BarcodeService.listBatches();
    res.json({ success: true, data: batches });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/barcodes/batches/:id/items
 * Get items for a specific batch
 */
const getBatchItems = async (req, res, next) => {
  try {
    const items = await BarcodeService.getBatchItems(req.params.id);
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
};

const fs = require('fs');
const path = require('path');

let cachedLogoDataUri = null;
const getLogoDataUri = () => {
  if (!cachedLogoDataUri) {
    try {
      const candidates = [
        path.resolve(__dirname, '../../../client/public/atlas-logo.png'),
        path.resolve(__dirname, '../../public/atlas-logo.png'),
        path.resolve(process.cwd(), 'client/public/atlas-logo.png'),
        path.resolve(process.cwd(), 'server/public/atlas-logo.png'),
      ];
      for (const p of candidates) {
        if (fs.existsSync(p)) {
          const b64 = fs.readFileSync(p).toString('base64');
          cachedLogoDataUri = `data:image/png;base64,${b64}`;
          break;
        }
      }
    } catch (e) {
      console.error('Error loading logo for sticker watermark:', e);
    }
  }
  return cachedLogoDataUri || '/atlas-logo.png';
};

/**
 * GET /api/students/:id/print-sticker
 * Generate QR code sticker HTML for thermal printing (50x25mm)
 */
const printSticker = async (req, res, next) => {
  try {
    const db = require('../config/db');
    const { id } = req.params;

    const result = await db.query(
      `SELECT s.id, s.barcode_id, s.student_code, s.full_name, s.full_name_ar, s.phone, s.parent_phone,
              ag.name_ar as grade_name, ag.grade_order
       FROM students s
       LEFT JOIN academic_grades ag ON s.grade_id = ag.id
       WHERE s.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'الطالب غير موجود' });
    }

    const student = result.rows[0];
    const codeValue = student.barcode_id ||
      (student.grade_order
        ? `ATL-G${String(student.grade_order).padStart(2, '0')}-${student.student_code}`
        : `ATL-${student.student_code}`);

    // Generate crisp QR code SVG
    const qrSvg = await QRCode.toString(codeValue, {
      type: 'svg',
      margin: 0,
      errorCorrectionLevel: 'M',
    });

    const studentName = student.full_name_ar || student.full_name;
    const gradeName = student.grade_name || '';
    const phone = student.phone || student.parent_phone || '';
    const logoDataUri = getLogoDataUri();

    // Return HTML formatted for 50x25mm thermal sticker with QR code and logo watermark
    const stickerHtml = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>${studentName} - استيكر QR</title>
  <style>
    @page {
      size: 50mm 25mm;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      width: 50mm;
      height: 25mm;
      max-height: 25mm;
      overflow: hidden;
      background: #ffffff;
      color: #000000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Arabic', 'IBM Plex Sans Arabic', Arial, sans-serif;
      direction: rtl;
    }
    body {
      position: relative;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      padding: 1.8mm 2.2mm;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .watermark-logo {
      position: absolute;
      top: 50%;
      right: 4.5mm;
      transform: translateY(-50%);
      width: 19mm;
      height: 19mm;
      object-fit: contain;
      opacity: 0.18;
      pointer-events: none;
      z-index: 1;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .info {
      position: relative;
      z-index: 2;
      flex: 1;
      height: 21mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding-left: 1.5mm;
      overflow: hidden;
      text-align: right;
    }
    .name {
      font-size: 8pt;
      font-weight: 800;
      line-height: 1.15;
      color: #000000;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .grade {
      font-size: 6.5pt;
      font-weight: 700;
      color: #222222;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 0.5mm;
    }
    .meta {
      display: flex;
      flex-direction: column;
      gap: 0.4mm;
    }
    .code {
      font-size: 7pt;
      font-family: 'Courier New', Courier, monospace;
      font-weight: 900;
      color: #000000;
      letter-spacing: 0.3px;
      white-space: nowrap;
    }
    .phone {
      font-size: 6.5pt;
      font-family: 'Courier New', Courier, monospace;
      font-weight: 600;
      color: #333333;
      white-space: nowrap;
    }
    .qr-container {
      position: relative;
      z-index: 10;
      width: 20.5mm;
      height: 20.5mm;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: #ffffff;
      padding: 0.4mm;
      border-radius: 0.5mm;
    }
    .qr-container svg {
      width: 100%;
      height: 100%;
      display: block;
      shape-rendering: crispEdges;
      background: #ffffff;
    }
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .watermark-logo {
        opacity: 0.20 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
    @media screen {
      body {
        margin: 8px auto;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
        border: 1px dashed #94a3b8;
        border-radius: 4px;
      }
    }
  </style>
</head>
<body>
  <img src="${logoDataUri}" class="watermark-logo" alt="" aria-hidden="true" />
  <div class="info">
    <div>
      <div class="name">${studentName}</div>
      <div class="grade">${gradeName}</div>
    </div>
    <div class="meta">
      <div class="code">${codeValue}</div>
      ${phone ? `<div class="phone">${phone}</div>` : ''}
    </div>
  </div>
  <div class="qr-container">
    ${qrSvg}
  </div>
  <script>
    window.onload = () => {
      setTimeout(() => {
        window.print();
      }, 100);
    };
  </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(stickerHtml);
  } catch (err) {
    next(err);
  }
};

module.exports = { generateBatch, assignCard, listBatches, getBatchItems, printSticker };
