/**
 * Atlas ERP — Unified High-Reliability Print Engine
 * Prints reports, schedules, thermal receipts, and QR stickers via an isolated
 * hidden iframe so page layouts, flex containers, and popup blockers never interfere.
 */

const escapeHtml = (val) => {
  if (val === null || val === undefined) return '—';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

/**
 * Prints a complete HTML document string inside a clean, isolated hidden iframe.
 * Never blocked by browser popup blockers and 100% isolated from the main SPA DOM.
 */
export function printHtmlDocument(rawHtml) {
  if (!rawHtml || typeof document === 'undefined') return;

  // Remove any existing print iframe
  const existingFrame = document.getElementById('atlas-print-iframe');
  if (existingFrame && existingFrame.parentNode) {
    existingFrame.parentNode.removeChild(existingFrame);
  }

  // Strip inline auto-print scripts from server/template HTML to avoid double print dialogs
  const cleanHtml = rawHtml.replace(
    /<script\b[^>]*>[\s\S]*?window\.print\s*\(\s*\)[\s\S]*?<\/script>/gi,
    ''
  );

  const iframe = document.createElement('iframe');
  iframe.id = 'atlas-print-iframe';
  iframe.setAttribute('title', 'Atlas Print Frame');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  iframe.style.pointerEvents = 'none';

  document.body.appendChild(iframe);

  const frameDoc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!frameDoc) return;

  let hasPrinted = false;
  const triggerPrint = () => {
    if (hasPrinted) return;
    hasPrinted = true;
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.error('Print execution error:', err);
    }
  };

  frameDoc.open();
  frameDoc.write(cleanHtml);
  frameDoc.close();

  // Wait for images inside the iframe to load (with a fast safety timeout)
  const checkImagesAndPrint = () => {
    try {
      const imgs = Array.from(frameDoc.images || []);
      if (imgs.length === 0 || imgs.every((img) => img.complete)) {
        setTimeout(triggerPrint, 80);
        return;
      }

      let remaining = imgs.length;
      const onImgDone = () => {
        remaining -= 1;
        if (remaining <= 0) {
          setTimeout(triggerPrint, 80);
        }
      };

      imgs.forEach((img) => {
        if (img.complete) {
          onImgDone();
        } else {
          img.addEventListener('load', onImgDone, { once: true });
          img.addEventListener('error', onImgDone, { once: true });
        }
      });

      // Fallback timeout in case an image is slow
      setTimeout(triggerPrint, 550);
    } catch {
      setTimeout(triggerPrint, 120);
    }
  };

  if (frameDoc.readyState === 'complete') {
    checkImagesAndPrint();
  } else {
    iframe.onload = checkImagesAndPrint;
    setTimeout(checkImagesAndPrint, 350);
  }
}

/**
 * Generates a complete, standalone A4 HTML document for official center reports & timetables.
 */
export function buildOfficialReportHtml({
  title = 'تقرير البيانات الرسمي',
  subtitle = '',
  columns = [],
  data = [],
  filtersSummary = [],
  orientation = 'portrait', // 'portrait' | 'landscape'
  density = 'compact', // 'compact' | 'comfortable'
  showWatermark = true,
  showSignatures = true,
  refNumber = '',
  currentDateFormatted = '',
}) {
  const isCompact = density === 'compact';
  const cellPad = isCompact ? '5px 7px' : '8px 10px';
  const headPad = isCompact ? '6px 7px' : '9px 10px';
  const fontSize = isCompact ? '10.5px' : '12px';
  const headFontSize = isCompact ? '11px' : '12.5px';
  const originUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const logoSrc = `${originUrl}/atlas-logo.png`;

  const headersHtml = columns
    .map((col) => `<th>${escapeHtml(col.header)}</th>`)
    .join('');

  const rowsHtml =
    data.length > 0
      ? data
          .map((row, rIdx) => {
            const cells = columns
              .map((col) => {
                let rawVal;
                try {
                  rawVal = col.render ? col.render(row) : row[col.accessor];
                } catch {
                  rawVal = '—';
                }
                if (rawVal === null || rawVal === undefined || rawVal === '') {
                  rawVal = '—';
                }
                return `<td>${escapeHtml(rawVal)}</td>`;
              })
              .join('');

            return `<tr class="${rIdx % 2 === 1 ? 'even-row' : 'odd-row'}">
              <td class="idx-cell">${rIdx + 1}</td>
              ${cells}
            </tr>`;
          })
          .join('')
      : `<tr><td colspan="${columns.length + 1}" style="text-align:center;padding:24px;color:#64748b;font-weight:bold;">لا توجد سجلات مطابقة للعرض والطباعة</td></tr>`;

  const filtersHtml =
    subtitle || (filtersSummary && filtersSummary.length > 0)
      ? `<div class="filters-bar">
          ${subtitle ? `<span class="subtitle-text">${escapeHtml(subtitle)}</span>` : ''}
          ${
            filtersSummary && filtersSummary.length > 0
              ? `<span class="filters-label">الفلاتر المطبقة:</span>
                 ${filtersSummary
                   .map((f) => `<span class="filter-chip">${escapeHtml(f)}</span>`)
                   .join('')}`
              : `<span class="filter-chip">كافة السجلات المعروضة</span>`
          }
        </div>`
      : '';

  const watermarkHtml = showWatermark
    ? `<div class="watermark" aria-hidden="true">
        <img src="${logoSrc}" alt="" />
      </div>`
    : '';

  const signaturesHtml = showSignatures
    ? `<div class="signatures-grid">
        <div class="sig-box">
          <div class="sig-title">إعداد ومراجعة المسؤول</div>
          <div class="sig-line">الاسم والتوقيع: .......................................</div>
        </div>
        <div class="sig-box sig-stamp">
          <div class="sig-title">خاتم السنتر المعتمد</div>
          <div class="stamp-circle">ختم الأكاديمية</div>
        </div>
        <div class="sig-box">
          <div class="sig-title">اعتماد الإدارة العامة</div>
          <div class="sig-line">المدير العام: .......................................</div>
        </div>
      </div>`
    : '';

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)} — أكاديمية أطلس التعليمية</title>
  <style>
    @page {
      size: A4 ${orientation === 'landscape' ? 'landscape' : 'portrait'};
      margin: 7mm 8mm 7mm 8mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      width: 100%;
      background: #ffffff;
      color: #0f172a;
      font-family: 'Cairo', 'Tajawal', 'Segoe UI', Tahoma, Arial, sans-serif;
      direction: rtl;
      line-height: 1.4;
    }
    .report-wrapper {
      position: relative;
      width: 100%;
      z-index: 1;
    }
    .top-accent {
      height: 4px;
      width: 100%;
      background: linear-gradient(90deg, #0C3C82 0%, #0EA5E9 55%, #D8232A 100%);
      border-radius: 4px;
      margin-bottom: 8px;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #0C3C82;
      padding-bottom: 8px;
      margin-bottom: 8px;
      gap: 12px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .brand-logo {
      width: 44px;
      height: 44px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      padding: 3px;
      object-fit: contain;
      background: #fff;
    }
    .brand-title {
      font-size: 16px;
      font-weight: 900;
      color: #0C3C82;
      line-height: 1.2;
    }
    .brand-en {
      font-size: 9px;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.8px;
      font-family: monospace;
    }
    .brand-sub {
      font-size: 10px;
      color: #475569;
      font-weight: 600;
      margin-top: 1px;
    }
    .doc-badge-wrap {
      text-align: center;
    }
    .doc-badge {
      display: inline-block;
      background: #0C3C82;
      color: #ffffff;
      font-size: 13px;
      font-weight: 800;
      padding: 5px 16px;
      border-radius: 8px;
    }
    .doc-sub {
      display: block;
      font-size: 10px;
      font-weight: 700;
      color: #475569;
      margin-top: 3px;
    }
    .meta-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 5px 10px;
      font-size: 10px;
      min-width: 195px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      margin-bottom: 2px;
    }
    .meta-row:last-child {
      margin-bottom: 0;
    }
    .meta-label {
      color: #64748b;
      font-weight: 700;
    }
    .meta-val {
      color: #0f172a;
      font-weight: 800;
    }
    .meta-count {
      background: #e0f2fe;
      color: #0C3C82;
      border: 1px solid #bae6fd;
      padding: 0 6px;
      border-radius: 4px;
      font-weight: 900;
    }
    .filters-bar {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 5px 10px;
      margin-bottom: 8px;
      font-size: 10.5px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
    }
    .subtitle-text {
      font-weight: 800;
      color: #0C3C82;
      margin-left: 6px;
    }
    .filters-label {
      font-weight: 700;
      color: #475569;
    }
    .filter-chip {
      background: #ffffff;
      border: 1px solid #94a3b8;
      border-radius: 4px;
      padding: 1px 7px;
      font-weight: 700;
      color: #1e293b;
      font-size: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: ${fontSize};
      margin-bottom: 10px;
      border: 1px solid #475569;
    }
    thead {
      display: table-header-group;
    }
    thead tr {
      background-color: #0C3C82 !important;
      color: #ffffff !important;
    }
    th {
      padding: ${headPad};
      font-size: ${headFontSize};
      font-weight: 800;
      text-align: right;
      border: 1px solid #1e3a8a;
      color: #ffffff !important;
      background-color: #0C3C82 !important;
      white-space: nowrap;
    }
    th:first-child {
      text-align: center;
      width: 34px;
    }
    tbody tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    tbody tr.odd-row {
      background-color: #ffffff;
    }
    tbody tr.even-row {
      background-color: #f1f5f9;
    }
    td {
      padding: ${cellPad};
      border: 1px solid #cbd5e1;
      color: #0f172a;
      font-weight: 600;
      vertical-align: middle;
    }
    td.idx-cell {
      text-align: center;
      font-family: monospace;
      font-weight: 700;
      color: #475569;
      background-color: #f8fafc;
      width: 34px;
    }
    .signatures-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-top: 10px;
      padding-top: 8px;
      border-top: 1px solid #94a3b8;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .sig-box {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 7px 10px;
      text-align: center;
      background: #ffffff;
    }
    .sig-title {
      font-size: 10px;
      font-weight: 800;
      color: #1e293b;
      margin-bottom: 14px;
    }
    .sig-stamp .sig-title {
      margin-bottom: 4px;
    }
    .sig-line {
      border-top: 1px dashed #94a3b8;
      padding-top: 4px;
      font-size: 9px;
      color: #64748b;
    }
    .stamp-circle {
      width: 38px;
      height: 38px;
      margin: 0 auto;
      border-radius: 50%;
      border: 1.5px dashed #94a3b8;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      font-weight: 700;
      color: #94a3b8;
    }
    .footer-note {
      margin-top: 6px;
      padding-top: 4px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8.5px;
      color: #64748b;
    }
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-8deg);
      width: 360px;
      height: 360px;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      z-index: 0;
    }
    .watermark img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      opacity: 0.06;
    }
  </style>
</head>
<body>
  ${watermarkHtml}
  <div class="report-wrapper">
    <div class="top-accent"></div>

    <div class="header">
      <div class="brand">
        <img src="${logoSrc}" alt="Atlas" class="brand-logo" />
        <div>
          <div class="brand-title">أكاديمية أطلس التعليمية</div>
          <div class="brand-en" dir="ltr">ATLAS EDUCATIONAL ACADEMY</div>
          <div class="brand-sub">المنظومة الإدارية والتعليمية المتكاملة</div>
        </div>
      </div>

      <div class="doc-badge-wrap">
        <div class="doc-badge">${escapeHtml(title)}</div>
        ${subtitle ? `<span class="doc-sub">${escapeHtml(subtitle)}</span>` : ''}
      </div>

      <div class="meta-box">
        <div class="meta-row">
          <span class="meta-label">رقم المرجع:</span>
          <span class="meta-val" dir="ltr" style="font-family:monospace;">${escapeHtml(refNumber)}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">تاريخ الإصدار:</span>
          <span class="meta-val">${escapeHtml(currentDateFormatted)}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">إجمالي السجلات:</span>
          <span class="meta-count">${data.length} سجل</span>
        </div>
      </div>
    </div>

    ${filtersHtml}

    <table>
      <thead>
        <tr>
          <th>#</th>
          ${headersHtml}
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    ${signaturesHtml}

    <div class="footer-note">
      <span>* مستند رسمي صادر إلكترونياً ومعتمد من أكاديمية أطلس التعليمية.</span>
      <span dir="ltr" style="font-family:monospace;">Atlas ERP System • ${escapeHtml(refNumber)}</span>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generates an 80mm thermal receipt HTML document for POS sales.
 */
export function buildThermalReceiptHtml(sale) {
  if (!sale) return '';
  const itemsRows = (sale.items || [])
    .map((it) => {
      const name = escapeHtml(it.name || it.item_name || 'صنف');
      const qty = Number(it.quantity) || 1;
      const price = (parseFloat(it.selling_price || it.unit_price || 0) * qty).toFixed(2);
      return `<tr>
        <td style="padding:4px 0;text-align:right;font-weight:700;">${name}</td>
        <td style="padding:4px 0;text-align:center;">${qty}</td>
        <td style="padding:4px 0;text-align:left;font-weight:800;">${price} ج</td>
      </tr>`;
    })
    .join('');

  const subtotal = parseFloat(sale.subtotal || 0).toFixed(2);
  const discount = parseFloat(sale.discount || 0);
  const total = parseFloat(sale.total_amount || 0).toFixed(2);
  const paid = parseFloat(sale.paid_amount || 0).toFixed(2);
  const change = parseFloat(sale.change_amount || 0).toFixed(2);
  const createdAt = sale.created_at
    ? new Date(sale.created_at).toLocaleString('ar-EG')
    : new Date().toLocaleString('ar-EG');

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8" />
  <title>إيصال مبيعات #${escapeHtml(sale.invoice_number)}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 2mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      width: 74mm;
      margin: 0 auto;
      padding: 4px;
      font-family: 'Cairo', 'Segoe UI', Tahoma, monospace;
      color: #000;
      background: #fff;
      font-size: 11px;
      line-height: 1.4;
      direction: rtl;
    }
    .center { text-align: center; }
    .divider { border-top: 1px dashed #334155; margin: 6px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { border-bottom: 1px dashed #334155; padding-bottom: 4px; font-weight: 800; }
    .row { display: flex; justify-content: space-between; margin: 2px 0; }
    .total-row { font-size: 13px; font-weight: 900; border-top: 1px solid #000; padding-top: 4px; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="center">
    <div style="font-size:15px;font-weight:900;">أكاديمية أطلس التعليمية</div>
    <div style="font-size:9px;color:#475569;">Atlas Educational Academy</div>
    <div style="font-size:11px;font-weight:700;margin-top:3px;">إيصال مبيعات نقدية</div>
    <div style="font-size:11px;font-weight:800;">رقم: ${escapeHtml(sale.invoice_number)}</div>
    <div style="font-size:9.5px;color:#475569;">${escapeHtml(createdAt)}</div>
  </div>
  <div class="divider"></div>
  <table>
    <thead>
      <tr>
        <th style="text-align:right;">الصنف</th>
        <th style="text-align:center;">الكمية</th>
        <th style="text-align:left;">الإجمالي</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
    </tbody>
  </table>
  <div class="divider"></div>
  <div class="row"><span>الإجمالي الفرعي:</span><span>${subtotal} ج.م</span></div>
  ${discount > 0 ? `<div class="row"><span>الخصم:</span><span>-${discount.toFixed(2)} ج.م</span></div>` : ''}
  <div class="row total-row"><span>الصافي المطلوب:</span><span>${total} ج.م</span></div>
  <div class="row"><span>المدفوع:</span><span>${paid} ج.م</span></div>
  <div class="row" style="font-weight:800;"><span>الباقي:</span><span>${change} ج.م</span></div>
  <div class="divider"></div>
  <div class="center" style="font-size:10px;color:#334155;">
    <div>شكراً لزيارتكم أكاديمية أطلس ✨</div>
    <div>نتمنى لأبنائنا الطلاب دوام التوفيق والنجاح</div>
  </div>
</body>
</html>`;
}
