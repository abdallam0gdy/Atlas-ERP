import { useState, useEffect, useMemo, useRef } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode, Printer, Search, Filter, Loader2,
  RefreshCw, User, Receipt, ChevronLeft, ChevronRight,
  Layers, CheckSquare, Square, Eye, Copy, CheckCheck,
  RotateCcw, SlidersHorizontal, BookOpen, GraduationCap
} from 'lucide-react';

export default function QrCardsPage() {
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedEducationType, setSelectedEducationType] = useState('all');
  const [sortBy, setSortBy] = useState('student_code_asc'); // 'student_code_asc' | 'student_code_desc' | 'name_asc' | 'created_desc'

  // Pagination states (To preserve RAM & keep browser fast)
  const [pageSize, setPageSize] = useState(24);
  const [currentPage, setCurrentPage] = useState(1);

  // Single card preview modal
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Print Batch Dialog State
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printTargetMode, setPrintTargetMode] = useState('thermal'); // 'thermal' | 'sheet'
  const [printScope, setPrintScope] = useState('all'); // 'all' | 'page'
  const [isGeneratingPrint, setIsGeneratingPrint] = useState(false);

  // Copy tracker
  const [copiedKey, setCopiedKey] = useState(null);

  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('تم النسخ');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Helper to format student QR code string
  const getStudentQrValue = (student) => {
    if (!student) return '';
    if (student.barcode_id) return student.barcode_id;
    if (student.barcode_value) return student.barcode_value;
    if (student.grade_order) {
      return `ATL-G${String(student.grade_order).padStart(2, '0')}-${student.student_code}`;
    }
    return `ATL-${student.student_code}`;
  };

  // Fetch all students (limit=5000) & master grades
  const fetchData = async () => {
    try {
      setIsRefreshing(true);
      const [sRes, gRes] = await Promise.all([
        api.get('/students?limit=5000'),
        api.get('/master/grades'),
      ]);
      setStudents(sRes.data?.data?.students || []);
      setGrades(gRes.data?.data || []);
    } catch (err) {
      console.error(err);
      toast.error('فشل تحميل بيانات الطلاب والكروت');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedGrade, selectedEducationType, sortBy, pageSize]);

  // Filtered & Sorted Students
  const filteredStudents = useMemo(() => {
    let list = students.filter((s) => {
      if (selectedGrade !== 'all' && s.grade_id !== selectedGrade) return false;
      if (selectedEducationType !== 'all' && s.education_type !== selectedEducationType) return false;

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = s.full_name?.toLowerCase().includes(q) || s.full_name_ar?.toLowerCase().includes(q);
        const matchesCode = String(s.student_code || '').includes(q);
        const matchesBarcode = s.barcode_id?.toLowerCase().includes(q);
        const matchesPhone = s.phone?.includes(q) || s.parent_phone?.includes(q) || s.father_phone?.includes(q);
        return matchesName || matchesCode || matchesBarcode || matchesPhone;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === 'student_code_asc') return (a.student_code || 0) - (b.student_code || 0);
      if (sortBy === 'student_code_desc') return (b.student_code || 0) - (a.student_code || 0);
      if (sortBy === 'name_asc') return (a.full_name || '').localeCompare(b.full_name || '', 'ar');
      if (sortBy === 'created_desc') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      return 0;
    });

    return list;
  }, [students, search, selectedGrade, selectedEducationType, sortBy]);

  // Pagination Slice (Only slice items are rendered in DOM to keep RAM light)
  const totalItems = filteredStudents.length;
  const effectivePageSize = pageSize === 'all' ? Math.max(1, totalItems) : Number(pageSize);
  const totalPages = Math.ceil(totalItems / effectivePageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * effectivePageSize;
  const endIndex = Math.min(startIndex + effectivePageSize, totalItems);
  const paginatedStudents = pageSize === 'all' ? filteredStudents : filteredStudents.slice(startIndex, endIndex);

  // ============================================================
  // ULTRA HIGH-SPEED SERVER-RENDERED THERMAL ROLL PRINTING (ZERO RAM)
  // ============================================================

  const getAuthToken = () => {
    return localStorage.getItem('atlas_token') || localStorage.getItem('token') || '';
  };

  // 1. Thermal Roll Printing (50x25mm / Continuous Roll)
  const executeThermalRollPrint = (targetStudents, isScopeAll = false) => {
    if (!targetStudents || targetStudents.length === 0) {
      toast.error('لا يوجد طلاب محددين للطباعة');
      return;
    }

    const token = getAuthToken();
    if (!token) {
      toast.error('لم يتم العثور على جلسة تسجيل الدخول، يرجى تسجيل الدخول مجدداً');
      return;
    }

    const params = new URLSearchParams();
    params.set('token', token);

    // Single student print
    if (targetStudents.length === 1) {
      const student = targetStudents[0];
      const win = window.open(`/api/students/${student.id}/print-sticker?${params.toString()}`, '_blank');
      if (!win) {
        toast.error('يرجى السماح بفتح النوافذ المنبثقة (Popups)');
      }
      return;
    }

    // Batch print
    if (!isScopeAll && targetStudents.length < students.length) {
      params.set('ids', targetStudents.map((s) => s.id).join(','));
    } else {
      if (selectedGrade !== 'all') params.set('grade_id', selectedGrade);
      if (search.trim()) params.set('search', search.trim());
    }

    const win = window.open(`/api/students/print-thermal-roll?${params.toString()}`, '_blank');
    if (!win) {
      toast.error('يرجى السماح بفتح النوافذ المنبثقة (Popups) لإتمام الطباعة');
    } else {
      toast.success(`تم تجهيز رول الطباعة الحراري (${targetStudents.length} طالب)`);
      setPrintModalOpen(false);
    }
  };

  // 2. High-Speed Server-Rendered A4 Sheet Printing (8 ID Cards per sheet)
  const executeA4SheetPrint = (targetStudents, isScopeAll = false) => {
    if (!targetStudents || targetStudents.length === 0) {
      toast.error('لا يوجد طلاب محددين للطباعة');
      return;
    }

    const token = getAuthToken();
    if (!token) {
      toast.error('لم يتم العثور على جلسة تسجيل الدخول، يرجى تسجيل الدخول مجدداً');
      return;
    }

    const params = new URLSearchParams();
    params.set('token', token);

    if (targetStudents.length === 1) {
      params.set('ids', targetStudents[0].id);
    } else if (!isScopeAll && targetStudents.length < students.length) {
      params.set('ids', targetStudents.map((s) => s.id).join(','));
    } else {
      if (selectedGrade !== 'all') params.set('grade_id', selectedGrade);
      if (search.trim()) params.set('search', search.trim());
    }

    const win = window.open(`/api/students/print-cards-sheet?${params.toString()}`, '_blank');
    if (!win) {
      toast.error('يرجى السماح بفتح النوافذ المنبثقة (Popups) لإتمام الطباعة');
    } else {
      toast.success(`تم تجهيز شيت طباعة الكروت (${targetStudents.length} كارت)`);
      setPrintModalOpen(false);
    }
  };

  // Dispatch print according to selected scope and mode
  const handleStartPrint = () => {
    const isAll = printScope === 'all';
    const targetStudents = isAll ? filteredStudents : paginatedStudents;
    if (printTargetMode === 'thermal') {
      executeThermalRollPrint(targetStudents, isAll);
    } else {
      executeA4SheetPrint(targetStudents, isAll);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 font-sans" dir="rtl">
      
      {/* ============================================================
          TOP HEADER & PRINT LAUNCHERS
          ============================================================ */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5" style={{ color: '#0C3C82' }}>
            <QrCode size={26} />
            <span>منظومة كروت واستيكرات الـ QR الذكية</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-[#0C3C82]">
              {totalItems} طالب
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            توليد وطباعة كروت واستيكرات الحضور السريع للطلاب بنظام QR Code عالي الدقة (رول حراري متتالي وشيت A4 مجمع)
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Thermal Roll Print Button */}
          <button
            type="button"
            onClick={() => {
              setPrintTargetMode('thermal');
              setPrintModalOpen(true);
            }}
            disabled={totalItems === 0 || isGeneratingPrint}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            title="طباعة رول حراري متتالي للطلاب (50x25mm / 80mm)"
          >
            <Receipt size={16} />
            <span>طباعة رول حراري متتالي ({totalItems})</span>
          </button>

          {/* A4 Sheet Print Button */}
          <button
            type="button"
            onClick={() => {
              setPrintTargetMode('sheet');
              setPrintModalOpen(true);
            }}
            disabled={totalItems === 0 || isGeneratingPrint}
            className="px-4 py-2.5 rounded-xl bg-[#0C3C82] hover:bg-[#092c61] text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            title="طباعة كروت مجمعة على ورق A4"
          >
            <Printer size={16} />
            <span>طباعة شيت مجمع (A4 Sheet)</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchData}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            title="تحديث البيانات"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-sky-600' : ''} />
          </button>
        </div>
      </div>

      {/* ============================================================
          FILTERS & CONTROLS BAR (CLEAN & INTEGRATED)
          ============================================================ */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Search Input */}
          <div className="relative sm:col-span-2">
            <Search size={16} className="absolute right-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="بحث باسم الطالب، كود السنتر (#1004)، الباركود، الهاتف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-8 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50/50"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Grade Filter */}
          <div>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="all">كافة المراحل الدراسية ({students.length})</option>
              {grades.map((g) => {
                const count = students.filter((s) => s.grade_id === g.id).length;
                return (
                  <option key={g.id} value={g.id}>
                    {g.name_ar} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="student_code_asc">ترتيب: كود الطالب تصاعدي (1, 2, 3..)</option>
              <option value="student_code_desc">ترتيب: كود الطالب تنازلي</option>
              <option value="name_asc">ترتيب: أبجدياً بالاسم (أ - ي)</option>
              <option value="created_desc">ترتيب: تاريخ الإضافة (الأحدث أولاً)</option>
            </select>
          </div>

          {/* Page Size Selector */}
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:outline-none cursor-pointer"
              title="عدد الكروت المعروضة في الشاشة"
            >
              <option value={12}>12 كارت بالصفحة</option>
              <option value={24}>24 كارت بالصفحة (مستحسن للسرعة)</option>
              <option value={48}>48 كارت بالصفحة</option>
              <option value={96}>96 كارت بالصفحة</option>
              <option value="all">عرض الكل ({totalItems})</option>
            </select>

            {(search || selectedGrade !== 'all' || selectedEducationType !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedGrade('all');
                  setSelectedEducationType('all');
                }}
                className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs transition-colors cursor-pointer shrink-0"
                title="تفريغ الفلاتر"
              >
                <RotateCcw size={15} />
              </button>
            )}
          </div>

        </div>
      </div>

      {/* ============================================================
          MAIN CARDS DISPLAY (LIGHTWEIGHT ON RAM, 24/48 AT A TIME)
          ============================================================ */}
      {loading ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-200">
          <Loader2 size={36} className="animate-spin text-[#0C3C82] mx-auto mb-3" />
          <p className="text-slate-600 text-sm font-bold">جاري تحميل بيانات كروت واستيكرات الطلاب...</p>
        </div>
      ) : totalItems === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-200">
          <QrCode size={44} className="text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">لا يوجد طلاب مطابقين للبحث</h3>
          <p className="text-slate-400 text-xs mt-1">تأكد من شروط الفلترة أو جرب البحث باسم أو كود آخر</p>
        </div>
      ) : (
        <>
          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedStudents.map((student) => {
              const qrValue = getStudentQrValue(student);

              return (
                <div
                  key={student.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between space-y-3 relative overflow-hidden text-right group"
                >
                  {/* Subtle Background Watermark */}
                  <img
                    src="/atlas-logo.png"
                    alt=""
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-20 h-20 object-contain opacity-[0.08] select-none pointer-events-none -rotate-6 group-hover:opacity-[0.14] transition-opacity"
                    aria-hidden="true"
                  />

                  {/* Card Header */}
                  <div className="relative z-10 flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-md bg-[#0C3C82] text-white flex items-center justify-center font-black text-xs">
                        أ
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-[#0C3C82] tracking-tight">
                          أكاديمية أطلس
                        </h4>
                        <p className="text-[9px] text-slate-400 font-sans">Atlas Academy</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs font-black bg-blue-50 text-[#0C3C82] px-2 py-0.5 rounded-lg border border-blue-100">
                        #{student.student_code}
                      </span>
                    </div>
                  </div>

                  {/* QR Code & Student Info */}
                  <div className="relative z-10 flex items-center gap-3">
                    {/* QR Code Box */}
                    <div 
                      onClick={() => setSelectedStudent(student)}
                      className="p-1.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex-shrink-0 flex items-center justify-center cursor-pointer hover:border-[#0C3C82] transition-colors"
                      title="اضغط لمعاينة وطباعة الكارت"
                    >
                      <QRCodeSVG
                        value={qrValue}
                        size={74}
                        level="M"
                        includeMargin={false}
                      />
                    </div>

                    {/* Student Text Info */}
                    <div className="flex-1 min-w-0">
                      <h3 
                        onClick={() => setSelectedStudent(student)}
                        className="font-black text-slate-800 text-xs sm:text-sm truncate hover:text-[#0C3C82] cursor-pointer"
                        title={student.full_name}
                      >
                        {student.full_name}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate font-semibold">
                        {student.grade_name || 'الصف العام'}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="font-mono text-[10px] text-[#0C3C82] font-bold truncate">
                          {qrValue}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(qrValue, `qr_${student.id}`)}
                          className="text-slate-400 hover:text-slate-600 cursor-pointer"
                          title="نسخ الكود"
                        >
                          {copiedKey === `qr_${student.id}` ? <CheckCheck size={11} className="text-emerald-600" /> : <Copy size={11} />}
                        </button>
                      </div>
                      <p className="font-mono text-[10px] text-slate-500 mt-0.5">
                        {student.phone || student.father_phone || student.parent_phone || '—'}
                      </p>
                    </div>
                  </div>

                  {/* Quick Actions Footer */}
                  <div className="relative z-10 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedStudent(student)}
                      className="flex-1 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Eye size={13} />
                      <span>معاينة</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => executeThermalRollPrint([student])}
                      className="py-1.5 px-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border border-amber-200/60"
                      title="طباعة استيكر حراري فردي (50x25mm)"
                    >
                      <Receipt size={13} />
                      <span>استيكر</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ============================================================
              PAGINATION BAR (CONTROLS PAGE NUMBER & ITEMS ON SCREEN)
              ============================================================ */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 sm:p-4 border border-slate-200 rounded-2xl bg-white shadow-2xs gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <p>
                عرض <span className="font-bold text-slate-800 font-mono">{totalItems === 0 ? 0 : startIndex + 1} - {endIndex}</span> من أصل <span className="font-bold text-slate-800 font-mono">{totalItems}</span> كارت
              </p>
              {totalPages > 1 && (
                <span className="text-slate-400">
                  (صفحة <span className="font-bold text-slate-700">{safeCurrentPage}</span> من <span className="font-bold text-slate-700">{totalPages}</span>)
                </span>
              )}
            </div>

            {pageSize !== 'all' && totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage <= 1}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title="السابق"
                >
                  <ChevronRight size={14} />
                  <span>السابق</span>
                </button>

                {/* Page Number Buttons */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                    let p = idx + 1;
                    if (totalPages > 5 && safeCurrentPage > 3) {
                      p = safeCurrentPage - 2 + idx;
                      if (p > totalPages) p = totalPages - (4 - idx);
                    }
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setCurrentPage(p)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          safeCurrentPage === p
                            ? 'bg-[#0C3C82] text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage >= totalPages}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title="التالي"
                >
                  <span>التالي</span>
                  <ChevronLeft size={14} />
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ============================================================
          BATCH PRINT DIALOG (FOR CONTINUOUS ROLL & A4 SHEETS)
          ============================================================ */}
      {printModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-5 text-right">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  printTargetMode === 'thermal' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-[#0C3C82]'
                }`}>
                  {printTargetMode === 'thermal' ? <Receipt size={20} /> : <Printer size={20} />}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800">
                    {printTargetMode === 'thermal' ? 'طباعة رول حراري متتالي' : 'طباعة شيت كروت مجمع (A4)'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {printTargetMode === 'thermal' ? 'استيكرات باركود 50x25mm وراء بعضها' : 'شبكة كروت مجمعة على ورق A4'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPrintModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Scope Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">نطاق الطلاب للطباعة:</label>
              
              <div className="grid grid-cols-1 gap-2">
                <label 
                  onClick={() => setPrintScope('all')}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    printScope === 'all' ? 'border-[#0C3C82] bg-blue-50/50 ring-2 ring-blue-100' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="print_scope"
                      checked={printScope === 'all'}
                      onChange={() => setPrintScope('all')}
                      className="text-[#0C3C82]"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">كافة الطلاب المفلترين حالياً</span>
                      <span className="text-[11px] text-slate-500">طباعة الرول بالكامل لجميع الطلاب في البحث/المرحلة</span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                    {totalItems} طالب
                  </span>
                </label>

                <label 
                  onClick={() => setPrintScope('page')}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    printScope === 'page' ? 'border-[#0C3C82] bg-blue-50/50 ring-2 ring-blue-100' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="print_scope"
                      checked={printScope === 'page'}
                      onChange={() => setPrintScope('page')}
                      className="text-[#0C3C82]"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">طلاب الصفحة المعروضة حالياً فقط</span>
                      <span className="text-[11px] text-slate-500">طباعة مجموعة محددة (من كود إلى كود)</span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                    {paginatedStudents.length} طالب
                  </span>
                </label>
              </div>
            </div>

            {/* Print Mode Switcher inside modal */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-slate-700 block">طريقة ونوع الإخراج:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPrintTargetMode('thermal')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    printTargetMode === 'thermal'
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Receipt size={14} />
                  <span>رول حراري (50x25)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintTargetMode('sheet')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    printTargetMode === 'sheet'
                      ? 'bg-[#0C3C82] text-white border-[#0C3C82] shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Printer size={14} />
                  <span>شيت مجمع (A4)</span>
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
              <button
                type="button"
                onClick={handleStartPrint}
                disabled={isGeneratingPrint}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50 ${
                  printTargetMode === 'thermal' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#0C3C82] hover:bg-[#092c61]'
                }`}
              >
                {isGeneratingPrint ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Printer size={16} />
                )}
                <span>
                  {isGeneratingPrint
                    ? 'جاري تجهيز الطباعة...'
                    : `بدء الطباعة (${printScope === 'all' ? totalItems : paginatedStudents.length} كارت)`}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPrintModalOpen(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================
          SINGLE CARD PREVIEW & PRINT MODAL
          ============================================================ */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-slate-200 space-y-4 text-right">
            
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-800">
                معاينة كارت الطالب للطباعة
              </h3>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Preview Card */}
            <div className="p-5 rounded-2xl border-2 border-[#0C3C82] bg-linear-to-br from-white to-blue-50/50 shadow-md space-y-3 relative overflow-hidden">
              <img
                src="/atlas-logo.png"
                alt=""
                className="absolute left-6 top-1/2 -translate-y-1/2 w-28 h-28 object-contain opacity-[0.14] select-none pointer-events-none -rotate-6"
                aria-hidden="true"
              />

              <div className="relative z-10 flex items-center justify-between border-b border-blue-100 pb-2">
                <div>
                  <h4 className="font-black text-sm text-[#0C3C82]">أكاديمية أطلس التعليمية</h4>
                  <p className="text-[10px] text-slate-500 font-sans">Atlas Smart Card</p>
                </div>
                <span className="font-mono font-black text-sm text-[#0C3C82] bg-blue-100/70 px-2 py-0.5 rounded-lg border border-blue-200">
                  #{selectedStudent.student_code}
                </span>
              </div>

              <div className="relative z-10 flex items-center gap-3.5 py-1">
                <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-200 shrink-0">
                  <QRCodeSVG
                    value={getStudentQrValue(selectedStudent)}
                    size={88}
                    level="H"
                  />
                </div>

                <div className="space-y-1 min-w-0">
                  <p className="font-black text-sm text-slate-800 truncate">
                    {selectedStudent.full_name}
                  </p>
                  <p className="text-xs text-slate-600 font-semibold truncate">
                    {selectedStudent.grade_name || 'الصف العام'}
                  </p>
                  <p className="font-mono text-[11px] text-[#0C3C82] font-bold truncate">
                    {getStudentQrValue(selectedStudent)}
                  </p>
                  <p className="font-mono text-[11px] text-slate-500">
                    {selectedStudent.phone || selectedStudent.father_phone || selectedStudent.parent_phone || '—'}
                  </p>
                </div>
              </div>

              <p className="relative z-10 text-[9px] text-slate-400 text-center pt-2 border-t border-slate-200/60">
                يرجى إبراز هذا الكود أمام كاميرا البوابة عند كل حصة
              </p>
            </div>

            {/* Print Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => executeA4SheetPrint([selectedStudent])}
                className="py-2.5 rounded-xl bg-[#0C3C82] hover:bg-[#092c61] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Printer size={15} />
                <span>طباعة كارت A4</span>
              </button>

              <button
                type="button"
                onClick={() => executeThermalRollPrint([selectedStudent])}
                className="py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Receipt size={15} />
                <span>استيكر حراري (50x25)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setSelectedStudent(null)}
              className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
