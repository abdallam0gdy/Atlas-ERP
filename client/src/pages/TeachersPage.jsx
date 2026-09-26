import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import TeacherModal from '../components/TeacherModal';
import TeacherBulkImportModal from '../components/TeacherBulkImportModal';
import PrintReportModal from '../components/PrintReportModal';
import {
  Search, Plus, Phone, GraduationCap, Users,
  Loader2, BookOpen, Percent, Coins, Edit2,
  ToggleLeft, ToggleRight, Download, Printer, Filter,
  RefreshCw, X, LayoutGrid, Table as TableIcon, Upload
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function TeachersPage() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedSplitType, setSelectedSplitType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'


  const fetchSubjects = async () => {
    try {
      const { data } = await api.get('/master/subjects');
      setSubjects(data.data || []);
    } catch (err) {
      console.error('Failed to load subjects:', err);
    }
  };

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (selectedSplitType) params.revenue_split_type = selectedSplitType;
      if (selectedStatus !== '') params.is_active = selectedStatus === 'active';
      if (selectedSubject) params.subject_id = selectedSubject;

      const { data } = await api.get('/teachers', { params });
      setTeachers(data.data || []);
    } catch (err) {
      console.error('Failed to load teachers:', err);
      toast.error('فشل تحميل قائمة المدرسين');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => fetchTeachers(), 300);
    return () => clearTimeout(debounce);
  }, [search, selectedSplitType, selectedStatus, selectedSubject]);

  const hasActiveFilters = Boolean(search || selectedSplitType || selectedStatus || selectedSubject);

  const resetFilters = () => {
    setSearch('');
    setSelectedSplitType('');
    setSelectedStatus('');
    setSelectedSubject('');
  };

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (teacher) => {
    try {
      const { data } = await api.put(`/teachers/${teacher.id}`, {
        is_active: !teacher.is_active,
      });
      toast.success(data.message || (teacher.is_active ? 'تم تعطيل المدرس' : 'تم تفعيل المدرس'));
      fetchTeachers();
    } catch (err) {
      toast.error('حدث خطأ أثناء تغيير الحالة');
    }
  };

  // Export to CSV with UTF-8 BOM
  const handleExportCsv = () => {
    if (teachers.length === 0) {
      toast.error('لا توجد بيانات مدرسين لتصديرها');
      return;
    }

    const headers = [
      'اسم المدرس',
      'التخصص / المادة',
      'رقم الموبايل',
      'عدد المجموعات النشطة',
      'إجمالي الطلاب المسجلين',
      'نظام المحاسبة',
      'القيمة',
      'الحالة'
    ];

    const rows = teachers.map((t) => [
      t.full_name || '',
      t.specialization || '',
      t.phone || '',
      t.active_groups || 0,
      t.total_students || 0,
      t.revenue_split_type === 'fixed' ? 'أجر ثابت لكل طالب' : 'نسبة مئوية',
      t.revenue_split_type === 'fixed' ? `${t.fixed_rate_per_student} جنيه` : `${t.revenue_split_percent}%`,
      t.is_active ? 'نشط' : 'معطل'
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
    link.setAttribute('download', `كشف_المدرسين_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('تم تصدير كشف المدرسين بنجاح');
  };

  // Filter summaries for print modal
  const activeFiltersList = useMemo(() => {
    const list = [];
    if (search) list.push(`بحث: "${search}"`);
    if (selectedSubject) {
      const sub = subjects.find((s) => s.id === selectedSubject);
      if (sub) list.push(`المادة: ${sub.name_ar}`);
    }
    if (selectedSplitType) {
      list.push(`نظام الحساب: ${selectedSplitType === 'fixed' ? 'مبلغ ثابت' : 'نسبة مئوية'}`);
    }
    if (selectedStatus) {
      list.push(`الحالة: ${selectedStatus === 'active' ? 'نشط' : 'معطل'}`);
    }
    return list;
  }, [search, selectedSubject, selectedSplitType, selectedStatus, subjects]);

  // Printable table columns
  const printColumns = [
    { header: 'اسم المدرس', accessor: 'full_name' },
    { header: 'التخصص', render: (t) => t.specialization || '—' },
    { header: 'رقم الموبايل', render: (t) => t.phone || '—' },
    { header: 'المجموعات', render: (t) => `${t.active_groups || 0} مجموعة` },
    { header: 'إجمالي الطلاب', render: (t) => `${t.total_students || 0} طالب` },
    {
      header: 'نظام الحساب',
      render: (t) =>
        t.revenue_split_type === 'fixed'
          ? `${t.fixed_rate_per_student} ج / طالب`
          : `${t.revenue_split_percent}% للمدرس`
    },
    { header: 'الحالة', render: (t) => (t.is_active ? 'نشط' : 'معطل') }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2" style={{ color: '#0C3C82' }}>
            <span>إدارة المدرسين</span>
            <span className="atlas-badge bg-sky-100 text-sky-800 text-xs">
              {teachers.length} مدرس
            </span>
          </h1>
          <p className="text-xs sm:text-sm mt-1 text-slate-500">
            متابعة هيئة التدريس، المجموعات، ونسب توزيع الأرباح والطباعة الفورية
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => {
              setEditingTeacher(null);
              setIsModalOpen(true);
            }}
            className="atlas-btn atlas-btn-primary text-xs sm:text-sm flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={16} />
            <span>إضافة مدرس جديد</span>
          </button>

          <button
            onClick={() => setIsBulkImportOpen(true)}
            className="atlas-btn atlas-btn-secondary text-xs sm:text-sm flex items-center gap-1.5"
            title="استيراد قائمة المدرسين من ملف CSV أو نسخ ولصق من الإكسيل"
          >
            <Upload size={16} className="text-sky-600" />
            <span>استيراد جماعي (CSV/Excel)</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="atlas-btn atlas-btn-secondary text-xs sm:text-sm flex items-center gap-1.5"
            title="تصدير كشف المدرسين إلى Excel مع دعم اللغة العربية"
          >
            <Download size={16} className="text-emerald-600" />
            <span>تصدير Excel</span>
          </button>

          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="atlas-btn atlas-btn-secondary text-xs sm:text-sm flex items-center gap-1.5"
            title="معاينة وطباعة كشف المدرسين"
          >
            <Printer size={16} className="text-slate-600" />
            <span>طباعة كشف</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="atlas-card p-4 animate-fade-in-up" style={{ animationDelay: '80ms', animationFillMode: 'backwards' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative sm:col-span-2">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              id="teachers-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث باسم المدرس أو التخصص أو رقم الموبايل..."
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



          {/* Subjects Filter */}
          {subjects.length > 0 && (
            <div>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="atlas-input text-xs sm:text-sm"
              >
                <option value="">المادة / التخصص (الكل)</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name_ar}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Secondary Filter & View Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <Filter size={14} className="text-slate-400" />
              الحالة:
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
                النشطون
              </button>
              <button
                onClick={() => setSelectedStatus('inactive')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  selectedStatus === 'inactive' ? 'bg-rose-500 text-white font-bold shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                المعطلون
              </button>
            </div>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 mr-2"
              >
                <RefreshCw size={13} />
                <span>إعادة ضبط</span>
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'table' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <TableIcon size={14} />
              <span>جدول</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'cards' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <LayoutGrid size={14} />
              <span>بطاقات</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={36} className="animate-spin text-sky-600" />
          <p className="text-xs font-medium text-slate-500">جاري تحميل بيانات المدرسين...</p>
        </div>
      ) : teachers.length === 0 ? (
        <div className="atlas-card text-center py-20 px-4">
          <GraduationCap size={48} className="mx-auto mb-3 text-slate-300" />
          <p className="text-lg font-bold text-slate-700">لا يوجد مدرسين مطابقين</p>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            {hasActiveFilters ? 'جرب تغيير شروط البحث والفلاتر أعلاه' : 'أضف أول مدرس من الزر في الأعلى'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="mt-4 atlas-btn atlas-btn-secondary text-xs"
            >
              مسح الفلاتر
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="atlas-card overflow-hidden animate-fade-in-up" style={{ animationDelay: '160ms', animationFillMode: 'backwards' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr style={{ background: '#0C3C82' }}>
                  <th className="text-white text-xs font-semibold py-3 px-4">المدرس</th>
                  <th className="text-white text-xs font-semibold py-3 px-4">التخصص</th>
                  <th className="text-white text-xs font-semibold py-3 px-4">الموبايل</th>
                  <th className="text-white text-xs font-semibold py-3 px-4">المجموعات</th>
                  <th className="text-white text-xs font-semibold py-3 px-4">الطلاب</th>
                  <th className="text-white text-xs font-semibold py-3 px-4">الحالة</th>
                  <th className="text-white text-xs font-semibold py-3 px-4">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teachers.map((teacher) => (
                  <tr
                    key={teacher.id}
                    className="hover:bg-sky-50/60 cursor-pointer transition-colors"
                    onClick={() => navigate(`/teachers/${teacher.id}`)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm overflow-hidden border border-slate-200"
                          style={{ background: 'linear-gradient(135deg, #0C3C82, #0EA5E9)' }}
                        >
                          {teacher.photo_url ? (
                            <img
                              src={teacher.photo_url}
                              alt={teacher.full_name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '';
                              }}
                            />
                          ) : (
                            teacher.full_name?.[0] || '؟'
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                            <span>{teacher.full_name}</span>
                            {teacher.aka && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 font-bold border border-amber-200">
                                {teacher.aka}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {teacher.specialization || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-mono text-slate-600">
                        {teacher.phone || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="atlas-badge atlas-badge-info text-xs">
                        {teacher.active_groups || 0} مجموعة
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="atlas-badge atlas-badge-success text-xs">
                        {teacher.total_students || 0} طالب
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                        teacher.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${teacher.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {teacher.is_active ? 'نشط' : 'معطل'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleEdit(teacher)}
                          className="p-1.5 rounded-lg hover:bg-sky-100 text-slate-500 hover:text-sky-700 transition-colors"
                          title="تعديل بيانات المدرس"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(teacher)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            teacher.is_active ? 'hover:bg-amber-100 text-slate-400 hover:text-amber-700' : 'hover:bg-emerald-100 text-slate-400 hover:text-emerald-700'
                          }`}
                          title={teacher.is_active ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                        >
                          {teacher.is_active ? <ToggleRight size={17} /> : <ToggleLeft size={17} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in-up" style={{ animationDelay: '160ms', animationFillMode: 'backwards' }}>
          {teachers.map((teacher, i) => (
            <div
              key={teacher.id}
              className="atlas-card p-5 cursor-pointer group hover:shadow-lg transition-all"
              onClick={() => navigate(`/teachers/${teacher.id}`)}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-md shrink-0 overflow-hidden border border-slate-200"
                    style={{ background: 'linear-gradient(135deg, #0C3C82, #0EA5E9)' }}
                  >
                    {teacher.photo_url ? (
                      <img
                        src={teacher.photo_url}
                        alt={teacher.full_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '';
                        }}
                      />
                    ) : (
                      teacher.full_name?.[0] || '؟'
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                      <span>{teacher.full_name}</span>
                      {teacher.aka && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 font-bold border border-amber-200">
                          {teacher.aka}
                        </span>
                      )}
                    </p>
                    <p className="text-xs mt-0.5 text-slate-500">{teacher.specialization || 'بدون تخصص'}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  teacher.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {teacher.is_active ? 'نشط' : 'معطل'}
                </span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                  <p className="text-lg font-bold" style={{ color: '#0C3C82' }}>{teacher.active_groups || 0}</p>
                  <p className="text-[11px] text-slate-500 font-medium">مجموعة نشطة</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                  <p className="text-lg font-bold" style={{ color: '#0EA5E9' }}>{teacher.total_students || 0}</p>
                  <p className="text-[11px] text-slate-500 font-medium">طالب مسجل</p>
                </div>
              </div>

              {/* Specialization & Phone */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-xs text-slate-500 font-medium">{teacher.specialization || 'مدرس'}</span>
                {teacher.phone && (
                  <span className="font-mono text-slate-400 flex items-center gap-1">
                    <Phone size={12} />
                    {teacher.phone}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleEdit(teacher)}
                  className="atlas-btn atlas-btn-ghost text-xs flex-1"
                >
                  <Edit2 size={14} />
                  <span>تعديل</span>
                </button>
                <button
                  onClick={() => navigate(`/teachers/${teacher.id}`)}
                  className="atlas-btn atlas-btn-outline text-xs flex-1"
                >
                  <span>عرض التفاصيل</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Teacher Modal */}
      <TeacherModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTeacher(null);
        }}
        onSuccess={fetchTeachers}
        initialData={editingTeacher}
      />

      {/* Teacher Bulk Import Modal */}
      <TeacherBulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onSuccess={fetchTeachers}
      />

      {/* Print Report Modal */}
      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="كشف بيانات ومستحقات المدرسين"
        subtitle={`إجمالي المدرسين المحددين (${teachers.length} مدرس)`}
        columns={printColumns}
        data={teachers}
        filtersSummary={activeFiltersList}
      />
    </div>
  );
}
