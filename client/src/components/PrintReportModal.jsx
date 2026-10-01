import { useRef } from 'react';
import { Printer, X, Download, ShieldCheck, CheckCircle2, FileText, Stamp, Award } from 'lucide-react';

export default function PrintReportModal({
  isOpen,
  onClose,
  title = 'تقرير البيانات الرسمي',
  subtitle = '',
  columns = [],
  data = [],
  filtersSummary = []
}) {
  const printAreaRef = useRef(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const timeFormatted = now.toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit'
  });
  const currentDateFormatted = `${dateFormatted} (${timeFormatted})`;

  const refNumber = `ATL-REP-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}-${(data.length * 7 + 101).toString().padStart(4, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/65 backdrop-blur-sm animate-fade-in print-only-report">
      {/* Modal Shell Container */}
      <div
        className="atlas-card print-card-visible w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden bg-white shadow-2xl rounded-3xl border border-slate-200 print:shadow-none print:border-none print:max-h-none print:w-full print:rounded-none"
        style={{ direction: 'rtl' }}
      >
        {/* Modal Top Bar - hidden when printing */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/90 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shadow-xs">
              <Printer size={19} />
            </div>
            <div>
              <span className="font-bold text-slate-800 text-base">معاينة الكشف الرسمي والطباعة</span>
              <p className="text-xs text-slate-500">جاهز للطباعة على ورق A4 مع علامة مائية موسعة وختم السنتر المعتمد</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="atlas-btn atlas-btn-primary text-xs sm:text-sm flex items-center gap-2 shadow-md px-5 py-2.5 cursor-pointer font-bold"
            >
              <Printer size={17} />
              <span>إرسال لأمر الطباعة (Ctrl+P)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="إغلاق المعاينة"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div
          ref={printAreaRef}
          className="relative flex-1 overflow-y-auto p-6 sm:p-10 print:p-0 text-slate-900 bg-white"
          id="printable-report-area"
        >
          {/* Watermark Center Logo in Background — Centered Horizontally & Vertically */}
          <div
            className="print-watermark-overlay pointer-events-none absolute inset-0 flex items-center justify-center select-none overflow-hidden"
            aria-hidden="true"
            style={{ zIndex: 0 }}
          >
            <img
              src="/atlas-logo.png"
              alt=""
              className="w-[420px] h-[420px] sm:w-[500px] sm:h-[500px] object-contain opacity-40 select-none -rotate-8 transition-opacity"
            />
          </div>

          {/* Report Main Container — relative z-10 so all content is on top of watermark */}
          <div className="relative z-10 space-y-4 sm:space-y-6 print:space-y-1">
            {/* Top Identity Ribbon Accent */}
            <div className="h-1 print:h-0.5 w-full rounded-full bg-gradient-to-r from-[#0C3C82] via-[#0EA5E9] to-[#D8232A] mb-1 print:mb-0.5" />

            {/* Official Institutional Header — Ultra-Compact in Print */}
            <div className="flex items-center justify-between border-b-2 border-slate-300 pb-3 print:pb-1.5 print:border-b print:border-slate-800 gap-3">
              {/* Right: Center Identity */}
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-14 h-14 sm:w-16 sm:h-16 print:w-9 print:h-9 rounded-xl bg-white p-1 border border-slate-200 shadow-2xs flex items-center justify-center shrink-0">
                  <img src="/atlas-logo.png" alt="Atlas" className="w-full h-full object-contain" />
                </div>
                <div className="flex flex-col justify-center text-right">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl print:text-sm font-black tracking-normal text-[#0C3C82] leading-tight">
                      أكاديمية أطلس التعليمية
                    </h1>
                    <span className="hidden print:inline-block text-[8px] font-bold text-slate-500 font-mono tracking-wider" dir="ltr">
                      ATLAS EDUCATIONAL ACADEMY
                    </span>
                  </div>
                  <div className="text-[11px] print:hidden font-bold text-slate-500 font-mono tracking-widest uppercase" dir="ltr">
                    ATLAS EDUCATIONAL ACADEMY
                  </div>
                  <p className="text-xs print:text-[8px] font-semibold text-slate-700 leading-tight print:mt-0.5">
                    المنظومة الإدارية والتعليمية المتكاملة لإدارة المراحل والدروس
                  </p>
                  <p className="text-[11px] print:hidden text-slate-400">
                    الترخيص الأكاديمي والتعليمي المعتمد • قسم شؤون الطلاب والمالية
                  </p>
                </div>
              </div>

              {/* Center: Document Title Badge */}
              <div className="text-center shrink-0">
                <div className="px-3.5 py-1 print:px-3 print:py-0.5 rounded-lg text-xs print:text-[10px] font-black bg-[#0C3C82] text-white tracking-wide shadow-2xs">
                  {title}
                </div>
                {subtitle && (
                  <span className="hidden print:block text-[8px] text-slate-500 font-medium mt-0.5">
                    {subtitle}
                  </span>
                )}
              </div>

              {/* Left: Document Metadata Box */}
              <div className="bg-slate-50/90 border border-slate-300 rounded-xl p-2.5 print:p-0 print:border-none print:bg-transparent text-right w-64 sm:w-72 print:w-auto shadow-2xs print:shadow-none space-y-1 print:space-y-0.5 shrink-0">
                <div className="flex items-center justify-between text-xs print:text-[8.5px] gap-2 print:gap-1.5">
                  <span className="text-[10px] print:text-[8px] text-slate-500 font-semibold shrink-0">المرجع:</span>
                  <span dir="ltr" className="font-mono font-bold text-slate-900 tracking-wider">{refNumber}</span>
                </div>

                <div className="flex items-center justify-between text-xs print:text-[8.5px] gap-2 print:gap-1.5">
                  <span className="text-[10px] print:text-[8px] text-slate-500 font-semibold shrink-0">تاريخ الإصدار:</span>
                  <span className="font-bold text-slate-800 whitespace-nowrap">{currentDateFormatted}</span>
                </div>

                <div className="flex items-center justify-between text-xs print:text-[8.5px] gap-2 print:gap-1.5">
                  <span className="text-[10px] print:text-[8px] text-slate-600 font-bold shrink-0">إجمالي السجلات:</span>
                  <span className="font-black text-[#0C3C82] bg-sky-50 px-2 py-0.5 rounded border border-sky-300 print:text-[8.5px] print:py-0">
                    {data.length} سجل
                  </span>
                </div>
              </div>
            </div>

            {/* Subtitle & Filter Badges Ribbon */}
            {(subtitle || filtersSummary.length > 0) ? (
              <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-2.5 print:p-1 text-xs print:text-[8.5px] flex flex-wrap items-center gap-1.5 print:bg-white print:border-slate-300 print:my-0.5">
                {subtitle && <span className="font-bold text-slate-800">{subtitle} — </span>}
                <span className="font-bold text-slate-600">الفلاتر المطبقة:</span>
                {filtersSummary.length > 0 ? (
                  filtersSummary.map((f, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-white border border-slate-300 rounded font-bold text-slate-800 print:border-slate-400"
                    >
                      {f}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 font-medium">كافة السجلات دون استثناء</span>
                )}
              </div>
            ) : null}

            {/* Main High-Density Table */}
            <div className="overflow-x-auto print:overflow-visible rounded-xl print:rounded-none border border-slate-300 print:border-slate-700 overflow-hidden shadow-2xs my-3 print:my-1">
              <table className="w-full text-right text-xs print:text-[9.5px] border-collapse">
                <thead>
                  <tr style={{ background: '#0C3C82' }} className="text-white print:bg-[#0C3C82] print:text-white">
                    <th className="py-2.5 px-3 print:py-1 print:px-1.5 border-b border-slate-700 print:border-slate-800 font-bold w-10 print:w-7 text-center">#</th>
                    {columns.map((col, idx) => (
                      <th key={idx} className="py-2.5 px-3 print:py-1 print:px-1.5 border-b border-slate-700 print:border-slate-800 font-bold text-xs print:text-[9.5px]">
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 print:divide-slate-300">
                  {data.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className={`print-avoid-break transition-colors ${
                        rIdx % 2 === 1 ? 'bg-slate-50/80 print:bg-slate-50/50' : 'bg-white'
                      }`}
                    >
                      <td className="py-2 px-2.5 print:py-0.5 print:px-1 border-r border-slate-200 print:border-slate-300 text-center font-mono text-slate-500 font-semibold print:text-[8.5px]">
                        {rIdx + 1}
                      </td>
                      {columns.map((col, cIdx) => (
                        <td key={cIdx} className="py-2 px-3 print:py-0.5 print:px-1.5 border-r border-slate-200 print:border-slate-300 text-slate-800 font-medium print:text-[9px] print:leading-tight">
                          {col.render ? col.render(row) : (row[col.accessor] || '—')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Official Endorsements & Signatures Section — Ultra Compact */}
            <div className="pt-3 print:pt-1 border-t border-slate-300 print:border-slate-400 grid grid-cols-3 gap-3 print:gap-2 text-center print-avoid-break">
              {/* Operator Signature */}
              <div className="p-2.5 print:p-1 bg-slate-50/80 rounded-xl print:rounded-md border border-slate-200 print:border-slate-300 print:bg-white">
                <p className="text-xs print:text-[8.5px] font-bold text-slate-800 mb-3 print:mb-1">إعداد ومراجعة المسؤول</p>
                <div className="border-t border-dashed border-slate-400 pt-1 text-[10px] print:text-[7.5px] text-slate-500">
                  الاسم والتوقيع: .......................................
                </div>
              </div>

              {/* Official Seal / Stamp */}
              <div className="p-2.5 print:p-1 bg-slate-50/80 rounded-xl print:rounded-md border border-slate-200 print:border-slate-300 flex flex-col items-center justify-center print:bg-white">
                <p className="text-xs print:text-[8.5px] font-bold text-slate-800 mb-1">خاتم السنتر المعتمد</p>
                <div className="w-12 h-12 print:w-7 print:h-7 rounded-full border-2 border-dashed border-slate-400 flex items-center justify-center text-[9px] print:text-[6.5px] text-slate-400 font-bold">
                  ختم السنتر
                </div>
              </div>

              {/* Director General Approval */}
              <div className="p-2.5 print:p-1 bg-slate-50/80 rounded-xl print:rounded-md border border-slate-200 print:border-slate-300 print:bg-white">
                <p className="text-xs print:text-[8.5px] font-bold text-slate-800 mb-3 print:mb-1">اعتماد الإدارة العامة للسنتر</p>
                <div className="border-t border-dashed border-slate-400 pt-1 text-[10px] print:text-[7.5px] text-slate-500">
                  المدير العام: .......................................
                </div>
              </div>
            </div>

            {/* Document Bottom Security Notice */}
            <div className="pt-2 print:pt-0.5 text-center text-[10px] print:text-[7px] text-slate-400 flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 print:text-slate-600 gap-1">
              <span>* مستند رسمي صادر إلكترونياً ومعتمد من أكاديمية أطلس التعليمية. أي تعديل أو شطب يلغي صحة البيانات.</span>
              <span className="font-mono">نظام أطلس ERP v2.5.0</span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Bar - hidden when printing */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/90 flex items-center justify-between print:hidden">
          <span className="text-xs text-slate-500">
            جاهز للطباعة على ورق المقاس القياسي A4 ومزود بعلامة مائية واضحة وموسعة لشعار الأكاديمية
          </span>
          <button
            onClick={onClose}
            className="atlas-btn atlas-btn-ghost text-xs"
          >
            إغلاق المعاينة
          </button>
        </div>
      </div>
    </div>
  );
}
