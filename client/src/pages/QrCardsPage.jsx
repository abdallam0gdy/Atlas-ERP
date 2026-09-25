import { useState, useEffect, useRef } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode, Plus, Printer, Search, Filter, Loader2,
  Sparkles, CheckCircle2, Download, RefreshCw, User,
  Receipt, Tag, SlidersHorizontal
} from 'lucide-react';

export default function QrCardsPage() {
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [printMode, setPrintMode] = useState('sheet'); // 'sheet' | 'thermal'

  // Single card modal preview
  const [selectedStudent, setSelectedStudent] = useState(null);

  const printAreaRef = useRef(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, gRes] = await Promise.all([
        api.get('/students?limit=200'),
        api.get('/master/grades'),
      ]);
      setStudents(sRes.data.data.students || []);
      setGrades(gRes.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('فشل تحميل بيانات كروت الـ QR');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePrintSheet = () => {
    setPrintMode('sheet');
    document.body.classList.remove('print-thermal-mode');
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handlePrintThermalRoll = () => {
    setPrintMode('thermal');
    document.body.classList.add('print-thermal-mode');
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.body.classList.remove('print-thermal-mode');
        setPrintMode('sheet');
      }, 500);
    }, 150);
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      !search ||
      s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.student_code?.toString().includes(search) ||
      s.phone?.includes(search);

    const matchesGrade =
      selectedGrade === 'all' || s.grade_id === selectedGrade;

    return matchesSearch && matchesGrade;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Screen-only Controls (Hidden during print) */}
      <div className="print:hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
              <QrCode size={26} style={{ color: '#0C3C82' }} />
              منظومة كروت واستيكرات الـ QR الذكية
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              توليد وطباعة كروت واستيكرات الحضور السريع للطلاب بجودة فائقة بنظام QR Code للورق العادي والاستيكر الحراري
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handlePrintSheet}
              disabled={filteredStudents.length === 0}
              className="atlas-btn-primary text-xs px-4 py-2.5 flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
              title="طباعة شبكة الكروت على ورق A4 مجمع"
            >
              <Printer size={16} />
              طباعة شيت مجمع (A4 Sheet)
            </button>

            <button
              onClick={handlePrintThermalRoll}
              disabled={filteredStudents.length === 0}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs px-4 py-2.5 flex items-center gap-1.5 disabled:opacity-50 shadow-sm transition-colors cursor-pointer"
              title="طباعة كافة الاستيكرات وراء بعضها على ماكينة الاستيكر الحراري (50x25mm / 80mm)"
            >
              <Receipt size={16} />
              طباعة رول حراري متتالي ({filteredStudents.length})
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="atlas-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="بحث باسم الطالب، كود السنتر، الهاتف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="atlas-input text-xs w-full pr-9"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="atlas-input text-xs"
            >
              <option value="all">كافة المراحل الدراسية</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name_ar}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Printable Cards Grid */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center text-slate-400">
          <Loader2 size={32} className="animate-spin text-[#0C3C82] mb-3" />
          <p className="text-xs">جاري تجهيز كروت الـ QR للطلاب...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="atlas-card py-16 text-center text-slate-400 print:hidden">
          <QrCode size={40} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm font-bold text-slate-600">لا يوجد طلاب مطابقين للبحث</p>
        </div>
      ) : (
        <>
          {/* A4 Sheet Print Grid & Screen Grid */}
          <div
            ref={printAreaRef}
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${
              printMode === 'thermal' ? 'print:hidden' : 'print:grid-cols-2 print:gap-3 print:m-0'
            }`}
          >
          {filteredStudents.map((student) => {
            const qrValue =
              student.barcode_id ||
              student.barcode_value ||
              (student.grade_order
                ? `ATL-G${String(student.grade_order).padStart(2, '0')}-${student.student_code}`
                : `ATL-${student.student_code}`);

            return (
              <div
                key={student.id}
                className="atlas-card p-4 rounded-xl border-2 border-slate-200 relative overflow-hidden bg-white shadow-xs hover:shadow-md transition-shadow print:shadow-none print:border print:p-3 print:break-inside-avoid"
              >
                {/* Card Watermark Logo */}
                <img
                  src="/atlas-logo.png"
                  alt=""
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-20 h-20 print:w-18 print:h-18 object-contain opacity-[0.16] select-none pointer-events-none -rotate-6"
                  aria-hidden="true"
                />

                {/* Center Branding Header */}
                <div className="relative z-10 flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-md bg-[#0C3C82] text-white flex items-center justify-center font-black text-xs">
                      أ
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[#0C3C82] tracking-tight">
                        سنتر أطلس التعليمي
                      </h4>
                      <p className="text-[9px] text-slate-400">Atlas Center Card</p>
                    </div>
                  </div>
                  <span className="atlas-badge font-mono text-[11px] font-black bg-blue-50 text-[#0C3C82]">
                    #{student.student_code}
                  </span>
                </div>

                {/* QR Code & Student Info */}
                <div className="relative z-10 flex items-center gap-3">
                  {/* QR Code SVG — on white bg to protect scannability */}
                  <div className="p-2 rounded-lg bg-white border border-slate-200/80 flex-shrink-0 flex items-center justify-center shadow-2xs">
                    <QRCodeSVG
                      value={qrValue}
                      size={80}
                      level="M"
                      includeMargin={false}
                    />
                  </div>

                  {/* Student Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-slate-800 text-sm truncate leading-snug">
                      {student.full_name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {student.grade_name || 'عام'}
                    </p>
                    <p className="font-mono text-[10px] text-[#0C3C82] font-bold mt-1 truncate">
                      كود: {qrValue}
                    </p>
                    <p className="font-mono text-[10px] text-slate-600 mt-0.5">
                      {student.phone || student.parent_phone || '—'}
                    </p>
                  </div>
                </div>

                {/* Card Footer Button (Hidden during print) */}
                <div className="relative z-10 mt-3 pt-2 border-t border-slate-100 flex items-center justify-end print:hidden">
                  <button
                    onClick={() => setSelectedStudent(student)}
                    className="text-[11px] font-bold text-[#0C3C82] hover:underline flex items-center gap-1"
                  >
                    <Printer size={12} />
                    طباعة مفردة
                  </button>
                </div>
              </div>
            );
        })}
      </div>

      {/* Sequential Thermal Roll Print Container (Visible only during thermal print) */}
      {printMode === 'thermal' && (
        <div className="hidden print:block print:w-full">
          {filteredStudents.map((student) => {
            const qrValue =
              student.barcode_id ||
              student.barcode_value ||
              (student.grade_order
                ? `ATL-G${String(student.grade_order).padStart(2, '0')}-${student.student_code}`
                : `ATL-${student.student_code}`);

            return (
              <div
                key={`thermal-${student.id}`}
                className="print-page-break print-avoid-break overflow-hidden flex items-center justify-between text-black font-sans bg-white border border-slate-300 relative"
                style={{
                  width: '50mm',
                  height: '25mm',
                  maxHeight: '25mm',
                  padding: '2mm',
                  boxSizing: 'border-box',
                  margin: '0 auto',
                  direction: 'rtl',
                }}
              >
                {/* Thermal sticker watermark */}
                <img
                  src="/atlas-logo.png"
                  alt=""
                  className="absolute top-1/2 right-[4mm] -translate-y-1/2 w-[18mm] h-[18mm] object-contain pointer-events-none select-none opacity-[0.18]"
                  aria-hidden="true"
                />

                {/* Details side */}
                <div
                  className="relative z-10 flex-1 pl-1 flex flex-col justify-between overflow-hidden text-right leading-tight"
                  style={{ height: '21mm' }}
                >
                  <div>
                    <div className="text-[10px] font-black truncate text-black leading-tight">
                      {student.full_name_ar || student.full_name}
                    </div>
                    <div className="text-[8px] text-slate-700 truncate font-bold mt-0.5">
                      {student.grade_name || ''}
                    </div>
                  </div>
                  <div>
                    <div className="text-[8px] font-mono font-black text-black leading-none">
                      {qrValue}
                    </div>
                    <div className="text-[7.5px] font-mono text-slate-600 mt-0.5">
                      {student.phone || student.parent_phone || ''}
                    </div>
                  </div>
                </div>

                {/* QR Code side — pure white bg to protect scannability */}
                <div className="relative z-10 flex-shrink-0 flex items-center justify-center p-0.5 bg-white">
                  <QRCodeSVG
                    value={qrValue}
                    size={62}
                    level="M"
                    includeMargin={false}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  )}

      {/* Single Student Card Print Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in print:hidden">
          <div className="atlas-card w-full max-w-sm p-6 bg-white shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-800">
              معاينة كارت الطالب للطباعة
            </h3>

            {/* Preview Card */}
            <div className="p-5 rounded-2xl border-2 border-[#0C3C82] bg-linear-to-br from-white to-blue-50/50 shadow-md space-y-3 relative overflow-hidden">
              {/* Single card watermark logo */}
              <img
                src="/atlas-logo.png"
                alt=""
                className="absolute left-8 top-1/2 -translate-y-1/2 w-28 h-28 object-contain opacity-[0.16] select-none pointer-events-none -rotate-6"
                aria-hidden="true"
              />

              <div className="relative z-10 flex items-center justify-between border-b pb-2">
                <div>
                  <h4 className="font-black text-sm text-[#0C3C82]">سنتر أطلس التعليمي</h4>
                  <p className="text-[10px] text-slate-500">كارت الحضور الذكي</p>
                </div>
                <span className="font-mono font-black text-sm text-[#0C3C82] bg-blue-100/70 px-2 py-0.5 rounded">
                  #{selectedStudent.student_code}
                </span>
              </div>

              <div className="relative z-10 flex items-center gap-4 py-2">
                {/* QR on pure white to protect scannability */}
                <div className="p-2 bg-white rounded-xl shadow-xs border">
                  <QRCodeSVG
                    value={
                      selectedStudent.barcode_id ||
                      selectedStudent.barcode_value ||
                      (selectedStudent.grade_order
                        ? `ATL-G${String(selectedStudent.grade_order).padStart(2, '0')}-${selectedStudent.student_code}`
                        : `ATL-${selectedStudent.student_code}`)
                    }
                    size={95}
                    level="H"
                  />
                </div>

                <div className="space-y-1">
                  <p className="font-black text-sm text-slate-800">
                    {selectedStudent.full_name}
                  </p>
                  <p className="text-xs text-slate-600">
                    {selectedStudent.grade_name}
                  </p>
                  <p className="font-mono text-[11px] text-[#0C3C82] font-bold">
                    كود: {selectedStudent.barcode_id ||
                      selectedStudent.barcode_value ||
                      (selectedStudent.grade_order
                        ? `ATL-G${String(selectedStudent.grade_order).padStart(2, '0')}-${selectedStudent.student_code}`
                        : `ATL-${selectedStudent.student_code}`)}
                  </p>
                  <p className="font-mono text-[11px] text-slate-500">
                    {selectedStudent.phone || selectedStudent.parent_phone || '—'}
                  </p>
                </div>
              </div>

              <p className="relative z-10 text-[9px] text-slate-400 text-center pt-2 border-t">
                يرجى إبراز هذا الكود أمام كاميرا البوابة عند كل حصة
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPrintMode('sheet');
                  window.print();
                }}
                className="atlas-btn-primary py-2 text-xs flex items-center justify-center gap-1.5"
              >
                <Printer size={15} />
                طباعة الكارت (A4)
              </button>

              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await api.get(`/students/${selectedStudent.id}/print-sticker`, {
                      responseType: 'text',
                    });
                    const printWin = window.open('', '_blank', 'width=450,height=300');
                    if (printWin) {
                      printWin.document.open();
                      printWin.document.write(res.data);
                      printWin.document.close();
                    } else {
                      const token = localStorage.getItem('token');
                      window.open(`/api/students/${selectedStudent.id}/print-sticker?token=${encodeURIComponent(token || '')}`, '_blank');
                    }
                  } catch (err) {
                    toast.error('تعذر تجهيز استيكر الباركود للطباعة');
                  }
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl py-2 text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Receipt size={15} />
                استيكر حراري (50x25)
              </button>
            </div>

            <button
              type="button"
              onClick={() => setSelectedStudent(null)}
              className="atlas-btn-secondary w-full py-2 text-xs mt-1"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
