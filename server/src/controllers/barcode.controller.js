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

/**
 * Helper to query students for batch printing with filters
 */
const queryStudentsForPrint = async (db, params) => {
  const { ids, grade_id, search, from_code, to_code, limit } = params;
  let sql = `
    SELECT s.id, s.barcode_id, s.student_code, s.full_name, s.full_name_ar,
           s.phone, s.parent_phone, s.father_phone,
           ag.name_ar as grade_name, ag.grade_order
    FROM students s
    LEFT JOIN academic_grades ag ON s.grade_id = ag.id
    WHERE 1=1
  `;
  const values = [];

  if (ids) {
    const idList = ids.split(',').map((s) => s.trim()).filter(Boolean);
    if (idList.length > 0) {
      values.push(idList);
      sql += ` AND s.id = ANY($${values.length}::uuid[])`;
    }
  }

  if (grade_id && grade_id !== 'all') {
    values.push(grade_id);
    sql += ` AND s.grade_id = $${values.length}`;
  }

  if (from_code) {
    values.push(parseInt(from_code, 10));
    sql += ` AND s.student_code >= $${values.length}`;
  }

  if (to_code) {
    values.push(parseInt(to_code, 10));
    sql += ` AND s.student_code <= $${values.length}`;
  }

  if (search && search.trim()) {
    const q = `%${search.trim()}%`;
    values.push(q);
    const idx = values.length;
    sql += ` AND (s.full_name ILIKE $${idx} OR s.full_name_ar ILIKE $${idx} OR s.barcode_id ILIKE $${idx} OR CAST(s.student_code AS TEXT) ILIKE $${idx} OR s.phone ILIKE $${idx} OR s.parent_phone ILIKE $${idx})`;
  }

  sql += ` ORDER BY s.student_code ASC`;

  const limitNum = Math.min(5000, Math.max(1, parseInt(limit, 10) || 5000));
  values.push(limitNum);
  sql += ` LIMIT $${values.length}`;

  const result = await db.query(sql, values);
  return result.rows;
};

/**
 * GET /api/students/print-thermal-roll
 * Server-rendered continuous thermal roll printing (50x25mm per sticker)
 */
const printThermalRoll = async (req, res, next) => {
  try {
    const db = require('../config/db');
    const students = await queryStudentsForPrint(db, req.query);

    if (students.length === 0) {
      return res.status(404).send('<h2 style="font-family:sans-serif;text-align:center;margin-top:50px;">لا يوجد طلاب مطابقين للبيانات المحددة للطباعة</h2>');
    }

    const logoDataUri = getLogoDataUri();

    // Generate QR codes concurrently on the server (super fast, ~100ms for 300 students)
    const stickersHtml = await Promise.all(
      students.map(async (student) => {
        const codeValue = student.barcode_id ||
          (student.grade_order
            ? `ATL-G${String(student.grade_order).padStart(2, '0')}-${student.student_code}`
            : `ATL-${student.student_code}`);

        let qrSvg = '';
        try {
          qrSvg = await QRCode.toString(codeValue, {
            type: 'svg',
            margin: 0,
            errorCorrectionLevel: 'M',
          });
        } catch {
          qrSvg = '';
        }

        const studentName = student.full_name_ar || student.full_name || 'طالب أطلس';
        const gradeName = student.grade_name || '';
        const phone = student.phone || student.father_phone || student.parent_phone || '';

        return `
        <div class="sticker">
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
        </div>`;
      })
    );

    const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>طباعة رول حراري (${students.length} طالب) - أكاديمية أطلس</title>
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
      background: #ffffff;
      color: #000000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Arabic', 'IBM Plex Sans Arabic', Arial, sans-serif;
      direction: rtl;
    }
    .sticker {
      width: 50mm;
      height: 25mm;
      max-height: 25mm;
      overflow: hidden;
      position: relative;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      padding: 1.8mm 2.2mm;
      page-break-after: always;
      break-after: page;
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
        padding: 15px;
        background: #f1f5f9;
      }
      .sticker {
        margin: 8px auto;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
        border: 1px dashed #94a3b8;
        border-radius: 4px;
        background: #ffffff;
      }
    }
  </style>
</head>
<body>
  ${stickersHtml.join('')}
  <script>
    window.onload = () => {
      setTimeout(() => {
        window.print();
      }, 150);
    };
  </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/students/print-cards-sheet
 * Server-rendered A4 sheet ID cards printing (8 cards per page)
 */
const printCardsSheet = async (req, res, next) => {
  try {
    const db = require('../config/db');
    const students = await queryStudentsForPrint(db, req.query);

    if (students.length === 0) {
      return res.status(404).send('<h2 style="font-family:sans-serif;text-align:center;margin-top:50px;">لا يوجد طلاب مطابقين للبيانات المحددة للطباعة</h2>');
    }

    const logoDataUri = getLogoDataUri();

    // Chunk students into pages of 8 cards
    const pageSize = 8;
    const pages = [];
    for (let i = 0; i < students.length; i += pageSize) {
      pages.push(students.slice(i, i + pageSize));
    }

    const pagesHtml = await Promise.all(
      pages.map(async (pageStudents) => {
        const cardsHtml = await Promise.all(
          pageStudents.map(async (student) => {
            const codeValue = student.barcode_id ||
              (student.grade_order
                ? `ATL-G${String(student.grade_order).padStart(2, '0')}-${student.student_code}`
                : `ATL-${student.student_code}`);

            let qrSvg = '';
            try {
              qrSvg = await QRCode.toString(codeValue, {
                type: 'svg',
                margin: 0,
                errorCorrectionLevel: 'M',
              });
            } catch {
              qrSvg = '';
            }

            const studentName = student.full_name_ar || student.full_name || 'طالب أطلس';
            const gradeName = student.grade_name || '';
            const phone = student.phone || student.father_phone || student.parent_phone || '';

            return `
            <div class="card">
              <img src="${logoDataUri}" class="card-watermark" alt="" aria-hidden="true" />
              <div class="card-header">
                <div class="card-brand">
                  <div class="brand-badge">أ</div>
                  <div>
                    <div class="brand-title">أكاديمية أطلس التعليمية</div>
                    <div class="brand-sub">Atlas Smart ID Card</div>
                  </div>
                </div>
                <div class="code-badge">#${student.student_code}</div>
              </div>
              <div class="card-body">
                <div class="qr-wrapper">
                  ${qrSvg}
                </div>
                <div class="details">
                  <div class="student-name">${studentName}</div>
                  <div class="student-grade">${gradeName}</div>
                  <div class="student-code">${codeValue}</div>
                  ${phone ? `<div class="student-phone">${phone}</div>` : ''}
                </div>
              </div>
            </div>`;
          })
        );

        return `
        <div class="sheet-page">
          ${cardsHtml.join('')}
        </div>`;
      })
    );

    const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>طباعة شيت كروت A4 (${students.length} طالب) - أكاديمية أطلس</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      background: #ffffff;
      color: #000000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Arabic', 'IBM Plex Sans Arabic', Arial, sans-serif;
      direction: rtl;
    }
    .sheet-page {
      width: 100%;
      height: 280mm;
      max-height: 280mm;
      page-break-after: always;
      break-after: page;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: repeat(4, 1fr);
      gap: 5mm;
      margin-bottom: 8mm;
    }
    .card {
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      padding: 3.5mm;
      position: relative;
      background: #ffffff;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 48mm;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .card-watermark {
      position: absolute;
      left: 4mm;
      top: 50%;
      transform: translateY(-50%) rotate(-6deg);
      width: 28mm;
      height: 28mm;
      object-fit: contain;
      opacity: 0.12;
      pointer-events: none;
      z-index: 1;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .card-header {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 1.5mm;
      margin-bottom: 1.5mm;
    }
    .card-brand {
      display: flex;
      align-items: center;
      gap: 2mm;
    }
    .brand-badge {
      width: 6mm;
      height: 6mm;
      border-radius: 4px;
      background: #0C3C82;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 8pt;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .brand-title {
      font-size: 8.5pt;
      font-weight: 900;
      color: #0C3C82;
    }
    .brand-sub {
      font-size: 6.5pt;
      color: #64748b;
    }
    .code-badge {
      font-family: 'Courier New', Courier, monospace;
      font-weight: 900;
      font-size: 8.5pt;
      background: #eff6ff;
      color: #0C3C82;
      padding: 1mm 2mm;
      border-radius: 4px;
      border: 1px solid #bfdbfe;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .card-body {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      gap: 3mm;
    }
    .qr-wrapper {
      width: 22mm;
      height: 22mm;
      padding: 0.5mm;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      flex-shrink: 0;
    }
    .qr-wrapper svg {
      width: 100%;
      height: 100%;
      display: block;
      shape-rendering: crispEdges;
    }
    .details {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.8mm;
      text-align: right;
    }
    .student-name {
      font-size: 9pt;
      font-weight: 900;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .student-grade {
      font-size: 7.5pt;
      font-weight: 700;
      color: #475569;
    }
    .student-code {
      font-size: 7.5pt;
      font-family: 'Courier New', Courier, monospace;
      font-weight: 900;
      color: #0C3C82;
    }
    .student-phone {
      font-size: 7pt;
      font-family: 'Courier New', Courier, monospace;
      color: #64748b;
    }
    @media screen {
      body {
        padding: 20px;
        background: #f8fafc;
      }
      .sheet-page {
        max-width: 210mm;
        margin: 0 auto 20px;
        background: #ffffff;
        padding: 8mm;
        box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      }
    }
  </style>
</head>
<body>
  ${pagesHtml.join('')}
  <script>
    window.onload = () => {
      setTimeout(() => {
        window.print();
      }, 150);
    };
  </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  generateBatch,
  assignCard,
  listBatches,
  getBatchItems,
  printSticker,
  printThermalRoll,
  printCardsSheet,
};
