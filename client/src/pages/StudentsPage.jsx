import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import StudentModal from '../components/StudentModal';
import StudentBulkImportModal from '../components/StudentBulkImportModal';
import PrintReportModal from '../components/PrintReportModal';
import {
  Search, Plus, Filter, ChevronLeft, ChevronRight,
  Phone, ScanBarcode, GraduationCap, Loader2, Users,
  Download, Printer, RefreshCw, Upload, Database, X, CheckCircle2, UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentsPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState([]);

  // Filters
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedEnrollmentType, setSelectedEnrollmentType] = useState('');
  const [selectedEducationType, setSelectedEducationType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);

  const [pageSize, setPageSize] = useState(25);

  const fetchStudents = async (page = 1, currentLimit = pageSize) => {
    setLoading(true);
    try {
      const params = { page, limit: currentLimit, search, sort_by: 'created_at', sort_order: 'desc' };
      if (selectedGrade) params.grade_id = selectedGrade;
      if (selectedEnrollmentType) params.enrollment_type = selectedEnrollmentType;
      if (selectedEducationType) params.education_type = selectedEducationType;
      if (selectedStatus !== '') params.is_active = selectedStatus === 'active';

      const { data } = await api.get('/students', { params });
      setStudents(data.data.students || []);
      setPagination(data.data.pagination || { page, limit: currentLimit, total: 0, totalPages: 0 });
    } catch (err) {
      console.error('Failed to load students:', err);
      toast.error('فشل تحميل قائمة الطلاب');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/master/grades').then(({ data }) => setGrades(data.data || []));
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => fetchStudents(1, pageSize), 300);
    return () => clearTimeout(debounce);
  }, [search, selectedGrade, selectedEnrollmentType, selectedEducationType, selectedStatus, pageSize]);

  const hasActiveFilters = Boolean(
    search || selectedGrade || selectedEnrollmentType || selectedEducationType || selectedStatus
  );

  const resetFilters = () => {
    setSearch('');
    setSelectedGrade('');
    setSelectedEnrollmentType('');
    setSelectedEducationType('');
    setSelectedStatus('');
  };

  // Export current list to CSV with UTF-8 BOM
  const handleExportCurrent = () => {
    if (students.length === 0) {
      toast.error('لا توجد بيانات لتصديرها');
      return;
    }

    const headers = [
      'كود الطالب',
      'باركود الطالب',
      'اسم الطالب',
      'المرحلة الدراسية',
      'رقم الموبايل',
      'اسم ولي الأمر',
      'رقم ولي الأمر',
      'نظام التسجيل',
      'نوع التعليم',
      'عدد المجموعات',
      'الحالة'
    ];

    const rows = students.map((s) => [
      s.student_code || '',
      s.barcode_id || '',
      s.full_name || '',
      s.grade_name || '',
      s.phone || '',
      s.parent_name || '',
      s.parent_phone || '',
      s.enrollment_type === 'PRIVATE' ? 'برايفت' : 'باقة سنتر',
      s.education_type === 'LANGUAGES' ? 'لغات' : 'عام',
      s.group_count || 0,
      s.is_active ? 'نشط' : 'معطل'
    ]);

    const csvContent =
      '\uFEFF' +
      [
        headers.join(','),
        ...rows.map((row) =>
          row
            .map((val) => {
              const str = String(val ?? '').replace(/"/g, '""');
              return `"${str}"`;
            })
            .join(',')
        )
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `كشف_الطلاب_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('تم تصدير كشف الطلاب بنجاح');
  };

  // Full system backup download
  const handleFullBackup = async () => {
    setIsBackingUp(true);
    try {
      const { data } = await api.get('/students/export-all');
      const allStudents = data.data || [];

      if (allStudents.length === 0) {
        toast.error('لا توجد سجلات طلاب لحفظها');
        return;
      }

      const headers = [
        'كود الطالب',
        'باركود الطالب',
        'اسم الطالب',
        'المرحلة الدراسية',
        'رقم الموبايل',
        'اسم ولي الأمر',
        'رقم ولي الأمر',
        'نظام التسجيل',
        'نوع التعليم',
        'عدد المجموعات',
        'الحالة',
        'تاريخ التسجيل'
      ];

      const rows = allStudents.map((s) => [
        s.student_code || '',
        s.barcode_id || '',
        s.full_name || '',
        s.grade_name || '',
        s.phone || '',
        s.parent_name || '',
        s.parent_phone || '',
        s.enrollment_type === 'PRIVATE' ? 'برايفت' : 'باقة سنتر',
        s.education_type === 'LANGUAGES' ? 'لغات' : 'عام',
        s.group_count || 0,
        s.is_active ? 'نشط' : 'معطل',
        s.created_at ? new Date(s.created_at).toLocaleDateString('ar-EG') : ''
      ]);

      const csvContent =
        '\uFEFF' +
        [
          headers.join(','),
          ...rows.map((row) =>
            row
              .map((val) => {
                const str = String(val ?? '').replace(/"/g, '""');
                return `"${str}"`;
              })
              .join(',')
          )
        ].join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `نسخة_احتياطية_كاملة_للطلاب_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`تم سحب وتنزيل نسخة احتياطية كاملة لـ ${allStudents.length} طالب`);
    } catch (err) {
      console.error('Backup failed:', err);
      toast.error('فشل سحب النسخة الاحتياطية');
    } finally {
      setIsBackingUp(false);
    }
  };

  // Filter summaries for print modal
  const activeFiltersList = useMemo(() => {
    const list = [];
    if (search) list.push(`بحث: "${search}"`);
    if (selectedGrade) {
      const g = grades.find((gr) => gr.id === selectedGrade);
      if (g) list.push(`المرحلة: ${g.name_ar}`);
    }
    if (selectedEnrollmentType) {
      list.push(`النظام: ${selectedEnrollmentType === 'PRIVATE' ? 'برايفت' : 'باقة سنتر'}`);
    }
    if (selectedEducationType) {
      list.push(`التعليم: ${selectedEducationType === 'LANGUAGES' ? 'لغات' : 'عام'}`);
    }
    if (selectedStatus) {
      list.push(`الحالة: ${selectedStatus === 'active' ? 'نشط' : 'معطل'}`);
    }
    return list;
  }, [search, selectedGrade, selectedEnrollmentType, selectedEducationType, selectedStatus, grades]);

  // Printable table columns
  const printColumns = [
    { header: 'كود / باركود', render: (s) => `#${s.student_code || ''} (${s.barcode_id})` },
    { header: 'اسم الطالب', accessor: 'full_name' },
    { header: 'المرحلة', accessor: 'grade_name' },
    { header: 'موبايل الطالب', accessor: 'phone' },
    { header: 'ولي الأمر', render: (s) => `${s.parent_name || 'ولي أمر'} - ${s.parent_phone || s.phone || '—'}` },
    { header: 'النظام', render: (s) => (s.enrollment_type === 'PRIVATE' ? 'برايفت' : 'باقة') },
    { header: 'التعليم', render: (s) => (s.education_type === 'LANGUAGES' ? 'لغات' : 'عام') },
    { header: 'الحالة', render: (s) => (s.is_active ? 'نشط' : 'معطل') }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header & Actions Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2" style={{ color: '#0C3C82' }}>
            <span>إدارة الطلاب</span>
            <span className="atlas-badge bg-sky-100 text-sky-800 text-xs">
              {pagination.total} مسجل
            </span>
          </h1>
          <p className="text-xs sm:text-sm mt-1 text-slate-500">
            البحث المتقدم، استيراد البيانات الضخمة، والطباعة والتصدير الفوري
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="atlas-btn atlas-btn-primary text-xs sm:text-sm flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={16} />
            <span>إضافة طالب جديد</span>
          </button>

          <button
            onClick={() => setIsBulkImportOpen(true)}
            className="atlas-btn atlas-btn-secondary text-xs sm:text-sm flex items-center gap-1.5"
            title="استيراد مئات الطلاب بملف واحد أو نسخ ولصق من الإكسيل"
          >
            <Upload size={16} className="text-sky-600" />
            <span>استيراد جماعي (CSV/Excel)</span>
          </button>

          <button
            onClick={handleExportCurrent}
            className="atlas-btn atlas-btn-secondary text-xs sm:text-sm flex items-center gap-1.5"
            title="تنزيل النتائج الحالية كملف Excel / CSV مع دعم الحروف العربية"
          >
            <Download size={16} className="text-emerald-600" />
            <span>تصدير Excel</span>
          </button>

          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="atlas-btn atlas-btn-secondary text-xs sm:text-sm flex items-center gap-1.5"
            title="معاينة وطباعة الكشف الحالي"
          >
            <Printer size={16} className="text-slate-600" />
            <span>طباعة كشف</span>
          </button>

          <button
            onClick={handleFullBackup}
            disabled={isBackingUp}
            className="atlas-btn atlas-btn-outline text-xs sm:text-sm flex items-center gap-1.5 text-slate-700 hover:text-slate-900 border-slate-300"
            title="تنزيل نسخة احتياطية كاملة لجميع طلاب السنتر"
          >
            {isBackingUp ? (
              <Loader2 size={16} className="animate-spin text-sky-600" />
            ) : (
              <Database size={16} className="text-indigo-600" />
            )}
            <span>نسخة احتياطية (Backup)</span>
          </button>
        </div>
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="atlas-card p-4 animate-fade-in-up" style={{ animationDelay: '80ms', animationFillMode: 'backwards' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative sm:col-span-2">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              id="students-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم، الكود، الباركود، أو الموبايل..."
              className="atlas-input pr-10 text-xs sm:text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Grade Filter */}
          <div>
            <select
              id="students-grade-filter"
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="atlas-input text-xs sm:text-sm"
            >
              <option value="">جميع المراحل الدراسية</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>{g.name_ar}</option>
              ))}
            </select>
          </div>

          {/* Enrollment Type Filter */}
          <div>
            <select
              value={selectedEnrollmentType}
              onChange={(e) => setSelectedEnrollmentType(e.target.value)}
              className="atlas-input text-xs sm:text-sm"
            >
              <option value="">نظام الطالب (الكل)</option>
              <option value="PACKAGE">باقة سنتر أطلس</option>
              <option value="PRIVATE">طالب برايفت</option>
            </select>
          </div>

          {/* Education Type Filter */}
          <div>
            <select
              value={selectedEducationType}
              onChange={(e) => setSelectedEducationType(e.target.value)}
              className="atlas-input text-xs sm:text-sm"
            >
              <option value="">نوع التعليم (الكل)</option>
              <option value="PUBLIC">عام / عربي</option>
              <option value="LANGUAGES">لغات / تجريبي</option>
            </select>
          </div>
        </div>

        {/* Secondary Filter Row & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <Filter size={14} className="text-slate-400" />
              حالة الحساب:
            </span>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setSelectedStatus('')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  selectedStatus === '' ? 'bg-white shadow-sm text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setSelectedStatus('active')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  selectedStatus === 'active' ? 'bg-emerald-500 text-white font-bold shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                النشطون فقط
              </button>
              <button
                onClick={() => setSelectedStatus('inactive')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  selectedStatus === 'inactive' ? 'bg-rose-500 text-white font-bold shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                المعطلون فقط
              </button>
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 transition-colors"
            >
              <RefreshCw size={13} />
              <span>إعادة ضبط الفلاتر</span>
            </button>
          )}
        </div>
      </div>

      {/* Students Table / Cards View */}
      <div className="atlas-card overflow-hidden animate-fade-in-up" style={{ animationDelay: '160ms', animationFillMode: 'backwards' }}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={36} className="animate-spin text-sky-600" />
            <p className="text-xs font-medium text-slate-500">جاري تحميل سجلات الطلاب...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-20 px-4">
            <Users size={48} className="mx-auto mb-3 text-slate-300" />
            <p className="text-lg font-bold text-slate-700">لا يوجد طلاب مطابقون</p>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              {hasActiveFilters ? 'لم نجد أي طلاب يطابقون خيارات البحث والفلاتر المحددة' : 'لم يتم تسجيل أي طلاب في النظام حتى الآن'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="mt-4 atlas-btn atlas-btn-secondary text-xs"
              >
                مسح الفلاتر والبحث مجدداً
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr style={{ background: '#0C3C82' }}>
                  <th className="text-white text-xs font-semibold py-3 px-4">كود الطالب / الباركود</th>
                  <th className="text-white text-xs font-semibold py-3 px-4">الاسم الكامل</th>
                  <th className="text-white text-xs font-semibold py-3 px-4">المرحلة الدراسية</th>
                  <th className="text-white text-xs font-semibold py-3 px-4">موبايل الطالب</th>
                  <th className="text-white text-xs font-semibold py-3 px-4">بيانات ولي الأمر</th>
                  <th className="text-white text-xs font-semibold py-3 px-4">النظام والتعليم</th>
                  <th className="text-white text-xs font-semibold py-3 px-4">المجموعات</th>
                  <th className="text-white text-xs font-semibold py-3 px-4">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr
                    key={student.id}
                    onClick={() => navigate(`/students/${student.id}`)}
                    className="hover:bg-sky-50/60 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {student.student_code && (
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                            #{student.student_code}
                          </span>
                        )}
                        <code className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {student.barcode_id}
                        </code>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs bg-slate-100 text-[#0C3C82] border border-slate-200">
                          {student.photo_url ? (
                            <img
                              src={student.photo_url}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '';
                              }}
                            />
                          ) : (
                            student.full_name?.[0] || 'ط'
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                            <span>{student.full_name}</span>
                            {student.gender && (
                              <span className="text-[11px]" title={student.gender === 'female' ? 'أنثى' : 'ذكر'}>
                                {student.gender === 'female' ? '👧' : '👦'}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">
                        {student.grade_name || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-mono text-slate-600">
                        {student.phone || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs">
                        <p className="font-semibold text-slate-700">{student.parent_name || 'ولي أمر'}</p>
                        <p className="font-mono text-slate-500 text-[11px]">
                          {student.father_phone || student.parent_phone || student.mother_phone || student.phone || '—'}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          student.enrollment_type === 'PRIVATE'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {student.enrollment_type === 'PRIVATE' ? '👤 برايفت' : '🏫 باقة سنتر'}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {student.education_type === 'LANGUAGES' ? '🌐 لغات' : '🏛️ حكومي'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="atlas-badge atlas-badge-info text-xs">
                        {student.group_count || 0} مجموعة
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                        student.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${student.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {student.is_active ? 'نشط' : 'معطل'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-slate-100 gap-3 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs text-slate-500">
              عرض <span className="font-bold text-slate-800">{students.length}</span> من أصل <span className="font-bold text-slate-800">{pagination.total}</span> طالب
              {pagination.totalPages > 1 && (
                <span className="mr-1">
                  (صفحة <span className="font-bold text-slate-800">{pagination.page}</span> من <span className="font-bold text-slate-800">{pagination.totalPages}</span>)
                </span>
              )}
            </p>

            <div className="flex items-center gap-1.5 text-xs text-slate-600 border-r border-slate-200 pr-3">
              <span>الحد الأقصى بالصفحة:</span>
              <select
                id="students-page-size"
                value={pageSize}
                onChange={(e) => {
                  const newLimit = Number(e.target.value);
                  setPageSize(newLimit);
                  fetchStudents(1, newLimit);
                }}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 outline-none cursor-pointer hover:border-slate-300 transition-colors shadow-2xs"
              >
                <option value={10}>10 طلاب</option>
                <option value={25}>25 طالب</option>
                <option value={50}>50 طالب</option>
                <option value={100}>100 طالب</option>
                <option value={200}>200 طالب</option>
                <option value={500}>500 طالب</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => fetchStudents(pagination.page - 1, pageSize)}
              disabled={pagination.page <= 1}
              className="atlas-btn atlas-btn-ghost text-xs flex items-center gap-1 disabled:opacity-40"
              title="الصفحة السابقة"
            >
              <ChevronRight size={15} />
              <span>السابق</span>
            </button>

            {/* Quick page numbers */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, idx) => {
                  let p = idx + 1;
                  if (pagination.totalPages > 5 && pagination.page > 3) {
                    p = pagination.page - 2 + idx;
                    if (p > pagination.totalPages) p = pagination.totalPages - (4 - idx);
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => fetchStudents(p, pageSize)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                        pagination.page === p
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-200/60'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => fetchStudents(pagination.page + 1, pageSize)}
              disabled={pagination.page >= pagination.totalPages}
              className="atlas-btn atlas-btn-ghost text-xs flex items-center gap-1 disabled:opacity-40"
              title="الصفحة التالية"
            >
              <span>التالي</span>
              <ChevronLeft size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Add Single Student Modal */}
      <StudentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => fetchStudents(1)}
      />

      {/* Bulk Import Modal */}
      <StudentBulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onSuccess={() => fetchStudents(1)}
        grades={grades}
      />

      {/* Print Report Preview Modal */}
      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="كشف سجلات الطلاب"
        subtitle={`المطابق للفلاتر الحالية (${students.length} طالب)`}
        columns={printColumns}
        data={students}
        filtersSummary={activeFiltersList}
      />
    </div>
  );
}
