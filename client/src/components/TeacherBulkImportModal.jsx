import { useState, useRef } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  UploadCloud, FileText, CheckCircle2, AlertCircle, X,
  Download, Loader2, GraduationCap, ClipboardList, Trash2
} from 'lucide-react';

export default function TeacherBulkImportModal({ isOpen, onClose, onSuccess }) {
  const [activeTab, setActiveTab] = useState('paste'); // 'file' | 'paste'
  const [pasteContent, setPasteContent] = useState('');
  const [parsedData, setParsedData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Sample CSV template generator
  const downloadSampleTemplate = () => {
    const headers = [
      'اسم المدرس',
      'التخصص أو المادة',
      'رقم الموبايل',
      'نظام المحاسبة',
      'النسبة أو الأجر',
      'ملاحظات'
    ];

    const sampleRows = [
      ['أ/ حسام إبراهيم', 'فيزياء', '01099998888', 'نسبة مئوية', '40', 'مدرس أول ثانوية عامة'],
      ['أ/ محمد عبد الفتاح', 'كيمياء', '01122223333', 'مبلغ ثابت', '50', ''],
      ['أ/ سارة النجار', 'لغة إنجليزية', '01233334444', 'نسبة مئوية', '45', '']
    ];

    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...sampleRows.map(r => r.map(c => `"${c}"`).join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'نموذج_استيراد_مدرسين_سنتر_أطلس.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('تم تنزيل نموذج استيراد المدرسين بنجاح');
  };

  // Parser for CSV and TSV (Excel clipboard)
  const parseRows = (text) => {
    if (!text || !text.trim()) return [];

    const lines = text.trim().split(/\r\n|\n|\r/);
    if (lines.length === 0) return [];

    const firstLine = lines[0];
    let delimiter = ',';
    if (firstLine.includes('\t')) delimiter = '\t';
    else if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';

    const parseLine = (line) => {
      if (delimiter === '\t') {
        return line.split('\t').map(s => s.trim().replace(/^["']|["']$/g, ''));
      }
      const row = [];
      let inQuotes = false;
      let currentVal = '';
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          row.push(currentVal.trim().replace(/^["']|["']$/g, ''));
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      row.push(currentVal.trim().replace(/^["']|["']$/g, ''));
      return row;
    };

    const parsedLines = lines.map(parseLine).filter(r => r.some(c => c && c.trim()));
    if (parsedLines.length === 0) return [];

    const headers = parsedLines[0];
    const hasHeader = headers.some(h =>
      h.includes('اسم') || h.includes('مدرس') || h.includes('تخصص') || h.includes('مادة') || h.includes('موبايل')
    );

    const dataRows = hasHeader ? parsedLines.slice(1) : parsedLines;

    return dataRows.map((cols, idx) => {
      // [0: name, 1: specialization, 2: phone, 3: split_type, 4: rate_or_percent, 5: notes]
      const fullName = (cols[0] || '').trim();
      const specialization = (cols[1] || '').trim();
      const phone = (cols[2] || '').trim();
      const splitTypeRaw = (cols[3] || '').trim();
      const rateVal = (cols[4] || '').trim();
      const notes = (cols[5] || '').trim();

      const isFixed = splitTypeRaw.includes('ثابت') || splitTypeRaw.toLowerCase() === 'fixed';
      const revenueSplitType = isFixed ? 'fixed' : 'percentage';

      const isValid = Boolean(fullName);

      return {
        rowNum: idx + 1,
        full_name: fullName,
        specialization,
        phone,
        revenue_split_type: revenueSplitType,
        rate_val: rateVal || (isFixed ? '50' : '40'),
        notes,
        isValid
      };
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target.result;
      const parsed = parseRows(content);
      setParsedData(parsed);
      if (parsed.length === 0) {
        toast.error('الملف فارغ أو لا يحتوي على بيانات صالحة');
      } else {
        toast.success(`تم قراءة ${parsed.length} مدرس من الملف`);
      }
    };
    reader.readAsText(file);
  };

  const handlePasteChange = (e) => {
    const val = e.target.value;
    setPasteContent(val);
    const parsed = parseRows(val);
    setParsedData(parsed);
  };

  const handleClear = () => {
    setParsedData([]);
    setPasteContent('');
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    const validRows = parsedData.filter(r => r.isValid);
    if (validRows.length === 0) {
      toast.error('لا يوجد مدرسين صالحين للاستيراد');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await api.post('/teachers/bulk-import', {
        teachers: validRows.map(r => ({
          full_name: r.full_name,
          specialization: r.specialization,
          phone: r.phone,
          revenue_split_type: r.revenue_split_type,
          revenue_split_percent: r.revenue_split_type === 'percentage' ? parseFloat(r.rate_val) || 40 : 0,
          fixed_rate_per_student: r.revenue_split_type === 'fixed' ? parseFloat(r.rate_val) || 50 : 0,
          notes: r.notes
        }))
      });

      toast.success(data.message || `تم بنجاح استيراد ${data.data?.imported_count || validRows.length} مدرس`);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Import error:', err);
      toast.error(err.response?.data?.message || 'فشل الاستيراد، يرجى التحقق من البيانات والمحاولة مجدداً');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validCount = parsedData.filter(r => r.isValid).length;
  const invalidCount = parsedData.length - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className="atlas-card w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden bg-white shadow-2xl rounded-2xl border border-slate-200"
        style={{ direction: 'rtl' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <GraduationCap size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">استيراد هيئة التدريس (Bulk Import)</h2>
              <p className="text-xs text-slate-500">إضافة قائمة المدرسين دفعة واحدة عبر ملف CSV أو النسخ المباشر من Excel</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadSampleTemplate}
              className="atlas-btn atlas-btn-ghost text-xs text-sky-700 hover:bg-sky-50 flex items-center gap-1.5"
              title="تحميل نموذج جاهز للبيانات"
            >
              <Download size={15} />
              <span>تحميل النموذج</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 px-5 pt-3 bg-slate-50/30 gap-4">
          <button
            onClick={() => setActiveTab('paste')}
            className={`pb-2.5 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'paste'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ClipboardList size={16} />
            <span>نسخ ولصق من Excel / Sheets</span>
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`pb-2.5 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'file'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <UploadCloud size={16} />
            <span>رفع ملف CSV / Excel</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {activeTab === 'paste' ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs sm:text-sm font-semibold text-slate-700">
                  الصق الصفوف المنسوخة من جدول المدرسين بالإكسيل هنا:
                </label>
                {pasteContent && (
                  <button
                    onClick={handleClear}
                    className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1"
                  >
                    <Trash2 size={13} />
                    مسح المحتوى
                  </button>
                )}
              </div>
              <textarea
                value={pasteContent}
                onChange={handlePasteChange}
                placeholder="الصق صفوف المدرسين هنا مباشرة (اسم المدرس، التخصص، رقم الموبايل، نظام المحاسبة، النسبة أو الأجر، ملاحظات)..."
                rows={5}
                className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-slate-800"
              />
            </div>
          ) : (
            <div>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-sky-500 hover:bg-sky-50/30 transition-all rounded-2xl p-6 sm:p-8 text-center cursor-pointer"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <UploadCloud size={40} className="mx-auto text-sky-500 mb-2" />
                <p className="font-semibold text-sm text-slate-700">
                  {fileName ? `الملف المحدد: ${fileName}` : 'اضغط لاختيار ملف CSV للمدرسين أو اسحبه هنا'}
                </p>
                <p className="text-xs text-slate-400 mt-1">ملف بتنسيق .csv متوافق مع Excel</p>
              </div>
            </div>
          )}

          {/* Preview */}
          {parsedData.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">معاينة المدرسين المستخرجين:</span>
                  <span className="atlas-badge bg-sky-100 text-sky-800">{parsedData.length} مدرس</span>
                  <span className="atlas-badge bg-emerald-100 text-emerald-800">{validCount} صف صالح</span>
                </div>
                <button
                  onClick={handleClear}
                  className="text-xs text-slate-500 hover:text-rose-600 transition-colors"
                >
                  إلغاء المعاينة
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-600 sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">اسم المدرس</th>
                      <th className="py-2 px-3">التخصص</th>
                      <th className="py-2 px-3">رقم الموبايل</th>
                      <th className="py-2 px-3">نظام المحاسبة</th>
                      <th className="py-2 px-3">القيمة</th>
                      <th className="py-2 px-3">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedData.map((row) => (
                      <tr key={row.rowNum} className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50'}>
                        <td className="py-2 px-3 text-slate-400 font-mono">{row.rowNum}</td>
                        <td className="py-2 px-3 font-semibold text-slate-800">
                          {row.full_name || <span className="text-rose-500">اسم المدرس مطلوب</span>}
                        </td>
                        <td className="py-2 px-3 text-slate-600">{row.specialization || '—'}</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{row.phone || '—'}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.revenue_split_type === 'fixed' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'
                          }`}>
                            {row.revenue_split_type === 'fixed' ? 'مبلغ ثابت' : 'نسبة مئوية'}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-700">
                          {row.revenue_split_type === 'fixed' ? `${row.rate_val} ج/طالب` : `${row.rate_val}%`}
                        </td>
                        <td className="py-2 px-3">
                          {row.isValid ? (
                            <CheckCircle2 size={16} className="text-emerald-500" />
                          ) : (
                            <AlertCircle size={16} className="text-rose-500" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            * سيتم حفظ المدرسين وربطهم بنظام المالية والمجموعات تلقائياً.
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="atlas-btn atlas-btn-ghost flex-1 sm:flex-none text-xs"
              disabled={isSubmitting}
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || validCount === 0}
              className="atlas-btn atlas-btn-primary flex-1 sm:flex-none text-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>جاري الاستيراد...</span>
                </>
              ) : (
                <>
                  <GraduationCap size={16} />
                  <span>تأكيد استيراد {validCount} مدرس</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
