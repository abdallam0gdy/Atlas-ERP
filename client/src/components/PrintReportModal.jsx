import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  X,
  FileText,
  Maximize2,
  Minimize2,
  Stamp,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { buildOfficialReportHtml, printHtmlDocument } from '../lib/printUtils';

export default function PrintReportModal({
  isOpen,
  onClose,
  title = 'تقرير البيانات الرسمي',
  subtitle = '',
  columns = [],
  data = [],
  filtersSummary = [],
  defaultOrientation,
  isLoadingData = false,
}) {
  // Automatically default to landscape if table has 8+ columns unless specified
  const initialOrientation =
    defaultOrientation || (columns.length >= 8 ? 'landscape' : 'portrait');

  const [orientation, setOrientation] = useState(initialOrientation);
  const [density, setDensity] = useState('compact'); // 'compact' | 'comfortable'
  const [showWatermark, setShowWatermark] = useState(true);
  const [showSignatures, setShowSignatures] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setOrientation(
        defaultOrientation || (columns.length >= 8 ? 'landscape' : 'portrait')
      );
    }
  }, [isOpen, defaultOrientation, columns.length]);

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeFormatted = now.toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const currentDateFormatted = `${dateFormatted} (${timeFormatted})`;

  const refNumber = `ATL-REP-${now.getFullYear()}${(now.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${(data.length * 7 + 101).toString().padStart(4, '0')}`;

  const handlePrint = useCallback(() => {
    if (isLoadingData) return;
    const html = buildOfficialReportHtml({
      title,
      subtitle,
      columns,
      data,
      filtersSummary,
      orientation,
      density,
      showWatermark,
      showSignatures,
      refNumber,
      currentDateFormatted,
    });
    printHtmlDocument(html);
  }, [
    isLoadingData,
    title,
    subtitle,
    columns,
    data,
    filtersSummary,
    orientation,
    density,
    showWatermark,
    showSignatures,
    refNumber,
    currentDateFormatted,
  ]);

  // Intercept Ctrl+P / Cmd+P and Escape while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        handlePrint();
      } else if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePrint, onClose]);

  if (!isOpen) return null;

  const isCompact = density === 'compact';

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 print-only-report"
      dir="rtl"
    >
      {/* Modal Shell Container */}
      <div
        className={`atlas-card print-card-visible w-full ${
          orientation === 'landscape' ? 'max-w-6xl' : 'max-w-5xl'
        } max-h-[95vh] flex flex-col overflow-hidden bg-white shadow-xl rounded-2xl border border-slate-200 print:shadow-none print:border-none print:max-h-none print:w-full print:rounded-none`}
      >
        {/* Modal Top Bar & Print Controls - hidden when printing */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-200 bg-slate-50 print:hidden space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#0C3C82] text-white flex items-center justify-center shrink-0">
                <Printer size={18} />
              </div>
              <div>
                <h2 className="font-black text-slate-900 text-sm sm:text-base leading-tight">
                  معاينة الكشف الرسمي وإعدادات الطباعة
                </h2>
                <p className="text-[11px] text-slate-500">
                  طباعة معزولة وعالية الدقة على ورق A4 (إجمالي {data.length} سجل)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                disabled={isLoadingData}
                className="atlas-btn atlas-btn-primary text-xs sm:text-sm flex items-center gap-2 px-5 py-2 cursor-pointer font-bold disabled:opacity-50"
              >
                {isLoadingData ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Printer size={16} />
                )}
                <span>طباعة الكشف الآن (Ctrl+P)</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 cursor-pointer"
                title="إغلاق المعاينة (Esc)"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Print Formatting Options Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              {/* Orientation Switcher */}
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1 cursor-pointer ${
                    orientation === 'portrait'
                      ? 'bg-[#0C3C82] text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <FileText size={13} />
                  <span>طولي (Portrait)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1 cursor-pointer ${
                    orientation === 'landscape'
                      ? 'bg-[#0C3C82] text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Maximize2 size={13} />
                  <span>عرضي (Landscape)</span>
                </button>
              </div>

              {/* Density Switcher */}
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setDensity('compact')}
                  className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1 cursor-pointer ${
                    density === 'compact'
                      ? 'bg-sky-700 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Minimize2 size={13} />
                  <span>مضغوط (سعة قصوى)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDensity('comfortable')}
                  className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1 cursor-pointer ${
                    density === 'comfortable'
                      ? 'bg-sky-700 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Maximize2 size={13} />
                  <span>مريح (خط أكبر)</span>
                </button>
              </div>
            </div>

            {/* Watermark & Signatures Toggles */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowWatermark((v) => !v)}
                className={`px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1.5 cursor-pointer ${
                  showWatermark
                    ? 'bg-sky-50 border-sky-300 text-[#0C3C82]'
                    : 'bg-white border-slate-200 text-slate-500'
                }`}
              >
                <ImageIcon size={13} />
                <span>العلامة المائية: {showWatermark ? 'مفعلة' : 'مخفية'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSignatures((v) => !v)}
                className={`px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1.5 cursor-pointer ${
                  showSignatures
                    ? 'bg-sky-50 border-sky-300 text-[#0C3C82]'
                    : 'bg-white border-slate-200 text-slate-500'
                }`}
              >
                <Stamp size={13} />
                <span>التوقيعات والختم: {showSignatures ? 'مفعلة' : 'مخفية'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Printable Document Preview Area */}
        <div
          className="relative flex-1 overflow-y-auto p-4 sm:p-8 print:p-0 text-slate-900 bg-white"
          id="printable-report-area"
        >
          {isLoadingData ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 size={36} className="animate-spin text-[#0C3C82] mx-auto" />
              <p className="text-sm font-bold text-slate-700">
                جاري تحضير كافة السجلات المطابقة للطباعة...
              </p>
            </div>
          ) : (
            <>
              {/* Subtle Watermark Center Logo in Background */}
              {showWatermark && (
                <div
                  className="print-watermark-overlay pointer-events-none absolute inset-0 flex items-center justify-center select-none overflow-hidden"
                  aria-hidden="true"
                  style={{ zIndex: 0 }}
                >
                  <img
                    src="/atlas-logo.png"
                    alt=""
                    className="w-[340px] h-[340px] sm:w-[400px] sm:h-[400px] object-contain opacity-[0.06] select-none -rotate-8"
                  />
                </div>
              )}

              {/* Report Main Container */}
              <div className="relative z-10 space-y-3 sm:space-y-4 print:space-y-1.5">
                {/* Top Identity Ribbon Accent */}
                <div className="h-1 w-full rounded-full bg-gradient-to-r from-[#0C3C82] via-[#0EA5E9] to-[#D8232A]" />

                {/* Official Institutional Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-[#0C3C82] pb-3 gap-3">
                  {/* Right: Center Identity */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white p-1 border border-slate-200 flex items-center justify-center shrink-0">
                      <img
                        src="/atlas-logo.png"
                        alt="Atlas"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="text-right">
                      <h1 className="text-lg sm:text-xl font-black text-[#0C3C82] leading-tight">
                        أكاديمية أطلس التعليمية
                      </h1>
                      <div
                        className="text-[10px] font-bold text-slate-500 font-mono tracking-wider uppercase"
                        dir="ltr"
                      >
                        ATLAS EDUCATIONAL ACADEMY
                      </div>
                      <p className="text-xs font-semibold text-slate-600 mt-0.5">
                        المنظومة الإدارية والتعليمية المتكاملة
                      </p>
                    </div>
                  </div>

                  {/* Center: Document Title Badge */}
                  <div className="text-center">
                    <div className="inline-block px-4 py-1.5 rounded-lg text-xs sm:text-sm font-black bg-[#0C3C82] text-white">
                      {title}
                    </div>
                    {subtitle && (
                      <span className="block text-xs text-slate-600 font-bold mt-1">
                        {subtitle}
                      </span>
                    )}
                  </div>

                  {/* Left: Document Metadata Box */}
                  <div className="bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-right sm:w-64 space-y-1 shrink-0 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500 font-bold">رقم المرجع:</span>
                      <span dir="ltr" className="font-mono font-bold text-slate-900">
                        {refNumber}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500 font-bold">تاريخ الإصدار:</span>
                      <span className="font-bold text-slate-800 text-[11px]">
                        {currentDateFormatted}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-600 font-bold">إجمالي السجلات:</span>
                      <span className="font-black text-[#0C3C82] bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        {data.length} سجل
                      </span>
                    </div>
                  </div>
                </div>

                {/* Subtitle & Filter Badges Ribbon */}
                {(subtitle || filtersSummary.length > 0) && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs flex flex-wrap items-center gap-1.5">
                    {subtitle && (
                      <span className="font-black text-[#0C3C82] ml-1">{subtitle} —</span>
                    )}
                    <span className="font-bold text-slate-600">الفلاتر المطبقة:</span>
                    {filtersSummary.length > 0 ? (
                      filtersSummary.map((f, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-white border border-slate-300 rounded font-bold text-slate-800 text-[11px]"
                        >
                          {f}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 font-semibold">
                        كافة السجلات المعروضة
                      </span>
                    )}
                  </div>
                )}

                {/* Main Table */}
                <div className="overflow-x-auto rounded-lg border border-slate-300">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-[#0C3C82] text-white">
                        <th
                          className={`${
                            isCompact ? 'py-1.5 px-2 text-[11px]' : 'py-2.5 px-3 text-xs'
                          } border border-blue-900 font-bold w-10 text-center`}
                        >
                          #
                        </th>
                        {columns.map((col, idx) => (
                          <th
                            key={idx}
                            className={`${
                              isCompact ? 'py-1.5 px-2.5 text-[11px]' : 'py-2.5 px-3 text-xs'
                            } border border-blue-900 font-bold whitespace-nowrap`}
                          >
                            {col.header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {data.length === 0 ? (
                        <tr>
                          <td
                            colSpan={columns.length + 1}
                            className="py-10 text-center text-slate-500 font-bold text-xs"
                          >
                            لا توجد سجلات مطابقة للطباعة
                          </td>
                        </tr>
                      ) : (
                        data.map((row, rIdx) => (
                          <tr
                            key={rIdx}
                            className={rIdx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}
                          >
                            <td
                              className={`${
                                isCompact ? 'py-1 px-2 text-[11px]' : 'py-2 px-2.5 text-xs'
                              } border border-slate-200 text-center font-mono text-slate-500 font-bold`}
                            >
                              {rIdx + 1}
                            </td>
                            {columns.map((col, cIdx) => (
                              <td
                                key={cIdx}
                                className={`${
                                  isCompact ? 'py-1 px-2.5 text-[11px]' : 'py-2 px-3 text-xs'
                                } border border-slate-200 text-slate-900 font-semibold`}
                              >
                                {col.render ? col.render(row) : row[col.accessor] || '—'}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Official Endorsements & Signatures Section */}
                {showSignatures && (
                  <div className="pt-3 border-t border-slate-300 grid grid-cols-3 gap-3 text-center">
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-xs font-bold text-slate-800 mb-3">
                        إعداد ومراجعة المسؤول
                      </p>
                      <div className="border-t border-dashed border-slate-400 pt-1 text-[10px] text-slate-500">
                        الاسم والتوقيع: .......................................
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col items-center justify-center">
                      <p className="text-xs font-bold text-slate-800 mb-1">
                        خاتم السنتر المعتمد
                      </p>
                      <div className="w-10 h-10 rounded-full border-2 border-dashed border-slate-400 flex items-center justify-center text-[8px] text-slate-400 font-bold">
                        ختم السنتر
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-xs font-bold text-slate-800 mb-3">
                        اعتماد الإدارة العامة
                      </p>
                      <div className="border-t border-dashed border-slate-400 pt-1 text-[10px] text-slate-500">
                        المدير العام: .......................................
                      </div>
                    </div>
                  </div>
                )}

                {/* Document Bottom Security Notice */}
                <div className="pt-2 text-center text-[10px] text-slate-400 flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 gap-1">
                  <span>
                    * مستند رسمي صادر إلكترونياً ومعتمد من أكاديمية أطلس التعليمية.
                  </span>
                  <span className="font-mono" dir="ltr">
                    Atlas ERP System • {refNumber}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Bottom Bar */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
          <span className="text-xs text-slate-500">
            اتجاه الورقة الحالي:{' '}
            <strong className="text-slate-800">
              {orientation === 'landscape' ? 'عرضي (A4 Landscape)' : 'طولي (A4 Portrait)'}
            </strong>{' '}
            • الكثافة:{' '}
            <strong className="text-slate-800">
              {density === 'compact' ? 'مضغوطة' : 'مريحة'}
            </strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isLoadingData}
              className="atlas-btn atlas-btn-primary text-xs py-1.5 px-4 flex items-center gap-1.5 cursor-pointer"
            >
              <Printer size={14} />
              <span>طباعة الآن</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="atlas-btn atlas-btn-ghost text-xs py-1.5 px-3 cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
}
