import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { supabase } from '../lib/supabase';
import StudentModal from '../components/StudentModal';
import StudentBulkImportModal from '../components/StudentBulkImportModal';
import PrintReportModal from '../components/PrintReportModal';
import { printHtmlDocument } from '../lib/printUtils';
import {
  Search, Plus, Filter, ChevronLeft, ChevronRight,
  Phone, GraduationCap, Loader2, Users,
  Download, Printer, RefreshCw, Upload, Database, X,
  Trash2, AlertTriangle, Edit, Eye, QrCode, ArrowUpDown, CloudUpload
} from 'lucide-react';
import toast from 'react-hot-toast';

// Memoized Student Table Row to prevent re-rendering rows when modals open or inputs change
const StudentRow = memo(function StudentRow({
  student,
  onNavigate,
  onEdit,
  onPrintSticker,
  onDelete,
  printingId,
}) {
  const parentPhoneDisplay =
    student.father_phone || student.parent_phone || student.mother_phone || student.phone || '';

  return (
    <tr
      onClick={() => onNavigate(student.id)}
      className="hover:bg-sky-50/70 cursor-pointer border-b border-slate-100 last:border-b-0"
    >
      {/* Code & Barcode */}
      <td className="py-2.5 px-3.5 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          {student.student_code && (
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">
              #{student.student_code}
            </span>
          )}
          <code className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
            {student.barcode_id}
          </code>
        </div>
      </td>

      {/* Full Name */}
      <td className="py-2.5 px-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs bg-slate-100 text-[#0C3C82] border border-slate-200">
            {student.photo_url ? (
              <img
                src={student.photo_url}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              student.full_name?.[0] || 'ط'
            )}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-slate-800 truncate flex items-center gap-1">
              <span>{student.full_name}</span>
              <span className="text-[11px]" title={student.gender === 'female' ? 'أنثى' : 'ذكر'}>
                {student.gender === 'female' ? '👧' : '👦'}
              </span>
            </p>
          </div>
        </div>
      </td>

      {/* Grade */}
      <td className="py-2.5 px-3.5 whitespace-nowrap">
        <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
          {student.grade_name || '—'}
        </span>
      </td>

      {/* Student Phone */}
      <td className="py-2.5 px-3.5 whitespace-nowrap">
        {student.phone ? (
          <span className="text-xs font-mono font-medium text-slate-700 flex items-center gap-1">
            <Phone size={12} className="text-slate-400" />
            {student.phone}
          </span>
        ) : (
          <span className="text-[11px] text-slate-400 italic">بدون رقم</span>
        )}
      </td>

      {/* Parent Info */}
      <td className="py-2.5 px-3.5 whitespace-nowrap">
        <div className="text-xs">
          <p className="font-semibold text-slate-700 truncate max-w-[140px]">
            {student.parent_name || 'ولي الأمر'}
          </p>
          {parentPhoneDisplay ? (
            <p className="font-mono text-slate-500 text-[11px]">{parentPhoneDisplay}</p>
          ) : (
            <p className="text-slate-400 text-[10px]">—</p>
          )}
        </div>
      </td>

      {/* Enrollment & Education Type */}
      <td className="py-2.5 px-3.5 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              student.enrollment_type === 'PRIVATE'
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            {student.enrollment_type === 'PRIVATE' ? '💎 برايفت' : '📦 باكدج'}
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
              student.education_type === 'LANGUAGES'
                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {student.education_type === 'LANGUAGES' ? 'لغات' : 'عربي'}
          </span>
        </div>
      </td>

      {/* Groups Count */}
      <td className="py-2.5 px-3.5 whitespace-nowrap text-center">
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
          {student.group_count || 0} مجموعة
        </span>
      </td>

      {/* Status */}
      <td className="py-2.5 px-3.5 whitespace-nowrap">
        <span
          className={`px-2 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
            student.is_active
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              student.is_active ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          />
          {student.is_active ? 'نشط' : 'معطل'}
        </span>
      </td>

      {/* Quick Actions */}
      <td
        className="py-2.5 px-3 whitespace-nowrap text-center w-[170px] min-w-[170px] max-w-[170px]"
        style={{ width: '170px', minWidth: '170px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="inline-flex items-center justify-center gap-1.5 w-max min-w-[145px]">
          <button
            type="button"
            onClick={() => onNavigate(student.id)}
            className="w-8 h-8 min-w-[32px] max-w-[32px] min-h-[32px] max-h-[32px] aspect-square rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-600 hover:text-white border border-sky-200 hover:border-sky-600 inline-flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-xs"
            style={{ width: '32px', height: '32px', minWidth: '32px', minHeight: '32px', flexShrink: 0 }}
            title="فتح ملف الطالب"
          >
            <Eye size={16} className="shrink-0 pointer-events-none" />
          </button>
          <button
            type="button"
            onClick={() => onEdit(student)}
            className="w-8 h-8 min-w-[32px] max-w-[32px] min-h-[32px] max-h-[32px] aspect-square rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white border border-amber-200 hover:border-amber-600 inline-flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-xs"
            style={{ width: '32px', height: '32px', minWidth: '32px', minHeight: '32px', flexShrink: 0 }}
            title="تعديل سريع لبيانات الطالب"
          >
            <Edit size={16} className="shrink-0 pointer-events-none" />
          </button>
          <button
            type="button"
            onClick={() => onPrintSticker(student)}
            disabled={printingId === student.id}
            className="w-8 h-8 min-w-[32px] max-w-[32px] min-h-[32px] max-h-[32px] aspect-square rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white border border-indigo-200 hover:border-indigo-600 inline-flex items-center justify-center shrink-0 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
            style={{ width: '32px', height: '32px', minWidth: '32px', minHeight: '32px', flexShrink: 0 }}
            title="طباعة استيكر الباركود / QR"
          >
            {printingId === student.id ? (
              <Loader2 size={16} className="animate-spin text-indigo-600 shrink-0 pointer-events-none" />
            ) : (
              <QrCode size={16} className="shrink-0 pointer-events-none" />
            )}
          </button>
          <button
            type="button"
            onClick={() => onDelete(student)}
            className="w-8 h-8 min-w-[32px] max-w-[32px] min-h-[32px] max-h-[32px] aspect-square rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 inline-flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-xs"
            style={{ width: '32px', height: '32px', minWidth: '32px', minHeight: '32px', flexShrink: 0 }}
            title={`حذف الطالب ${student.full_name}`}
          >
            <Trash2 size={16} className="shrink-0 pointer-events-none" />
          </button>
        </div>
      </td>
    </tr>
  );
});

export default function StudentsPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState([]);

  // Filters
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedEnrollmentType, setSelectedEnrollmentType] = useState('');
  const [selectedEducationType, setSelectedEducationType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState(null);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printStudentsData, setPrintStudentsData] = useState([]);
  const [isLoadingPrintData, setIsLoadingPrintData] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isPublishingCards, setIsPublishingCards] = useState(false);
  const [printingId, setPrintingId] = useState(null);

  // Delete Student State
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [pageSize, setPageSize] = useState(25);

  // Debounce search input so typing is 100% lag-free on weak PCs
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    api.get('/master/grades').then(({ data }) => setGrades(data.data || []));
  }, []);

  const fetchStudents = useCallback(
    async (page = 1, currentLimit = pageSize) => {
      setLoading(true);
      try {
        const params = {
          page,
          limit: currentLimit,
          search: debouncedSearch,
          sort_by: sortBy,
          sort_order: sortOrder,
        };
        if (selectedGrade) params.grade_id = selectedGrade;
        if (selectedEnrollmentType) params.enrollment_type = selectedEnrollmentType;
        if (selectedEducationType) params.education_type = selectedEducationType;
        if (selectedStatus !== '') params.is_active = selectedStatus === 'active';

        const { data } = await api.get('/students', { params });
        setStudents(data.data.students || []);
        setPagination(
          data.data.pagination || { page, limit: currentLimit, total: 0, totalPages: 0 }
        );
      } catch (err) {
        console.error('Failed to load students:', err);
        toast.error('فشل تحميل قائمة الطلاب');
      } finally {
        setLoading(false);
      }
    },
    [
      debouncedSearch,
      selectedGrade,
      selectedEnrollmentType,
      selectedEducationType,
      selectedStatus,
      sortBy,
      sortOrder,
      pageSize,
    ]
  );

  useEffect(() => {
    fetchStudents(1, pageSize);
  }, [fetchStudents, pageSize]);

  const handleNavigate = useCallback(
    (id) => {
      navigate(`/students/${id}`);
    },
    [navigate]
  );

  const handleOpenEdit = useCallback((student) => {
    setStudentToEdit(student);
    setIsAddModalOpen(true);
  }, []);

  const handleOpenAdd = useCallback(() => {
    setStudentToEdit(null);
    setIsAddModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsAddModalOpen(false);
    setStudentToEdit(null);
  }, []);

  const handlePrintSticker = useCallback(async (student) => {
    if (!student?.id) return;
    setPrintingId(student.id);
    try {
      const res = await api.get(`/students/${student.id}/print-sticker`, {
        responseType: 'text',
      });
      printHtmlDocument(res.data);
    } catch {
      toast.error('تعذر تجهيز استيكر الطالب للطباعة');
    } finally {
      setPrintingId(null);
    }
  }, []);

  const handleOpenPrintModal = useCallback(async () => {
    setIsPrintModalOpen(true);
    if (pagination.total <= students.length) {
      setPrintStudentsData(students);
      return;
    }
    setIsLoadingPrintData(true);
    try {
      const params = {
        page: 1,
        limit: 2000,
        search: debouncedSearch,
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      if (selectedGrade) params.grade_id = selectedGrade;
      if (selectedEnrollmentType) params.enrollment_type = selectedEnrollmentType;
      if (selectedEducationType) params.education_type = selectedEducationType;
      if (selectedStatus !== '') params.is_active = selectedStatus === 'active';

      const { data } = await api.get('/students', { params });
      setPrintStudentsData(data.data?.students || students);
    } catch {
      setPrintStudentsData(students);
    } finally {
      setIsLoadingPrintData(false);
    }
  }, [
    pagination.total,
    students,
    debouncedSearch,
    sortBy,
    sortOrder,
    selectedGrade,
    selectedEnrollmentType,
    selectedEducationType,
    selectedStatus,
  ]);

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    setIsDeleting(true);
    try {
      const { data } = await api.delete(`/students/${studentToDelete.id}`);
      toast.success(data.message || `تم حذف الطالب (${studentToDelete.full_name}) بنجاح`);
      setStudentToDelete(null);
      fetchStudents(pagination.page, pageSize);
    } catch (err) {
      console.error('Delete student error:', err);
      toast.error(err.response?.data?.message || 'فشل حذف الطالب');
    } finally {
      setIsDeleting(false);
    }
  };

  const hasActiveFilters = Boolean(
    searchInput ||
      selectedGrade ||
      selectedEnrollmentType ||
      selectedEducationType ||
      selectedStatus
  );

  const resetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setSelectedGrade('');
    setSelectedEnrollmentType('');
    setSelectedEducationType('');
    setSelectedStatus('');
    setSortBy('created_at');
    setSortOrder('desc');
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
      'الحالة',
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
      s.is_active ? 'نشط' : 'معطل',
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
        ),
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
        'تاريخ التسجيل',
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
        s.created_at ? new Date(s.created_at).toLocaleDateString('ar-EG') : '',
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
          ),
        ].join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `نسخة_احتياطية_كاملة_للطلاب_${new Date().toISOString().slice(0, 10)}.csv`
      );
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

  // Publish all local students' codes, barcodes, photos & schedules online to Supabase for public National ID lookup
  const handlePublishCardsOnline = async () => {
    setIsPublishingCards(true);
    try {
      const [{ data: payloadRes }, secretRes] = await Promise.all([
        api.get('/students/cloud-cards-payload'),
        api.get('/students/online-secret').catch(() => ({ data: { data: { pin: 'Abd#01224385098' } } })),
      ]);

      const cards = payloadRes?.data?.cards || [];
      const missingCount = payloadRes?.data?.missingNationalIdCount || 0;
      const pin = secretRes?.data?.data?.pin || 'Abd#01224385098';

      if (cards.length === 0) {
        toast.error('لا يوجد طلاب مسجل لهم رقم قومي (14 رقماً) حالياً للنشر أونلاين');
        return;
      }

      let totalInserted = 0;
      let totalUpdated = 0;
      const CHUNK_SIZE = 100;

      for (let i = 0; i < cards.length; i += CHUNK_SIZE) {
        const chunk = cards.slice(i, i + CHUNK_SIZE);
        const { data: rpcResult, error: rpcErr } = await supabase.rpc('admin_upsert_student_cards', {
          pin,
          p_students: chunk,
        });
        if (rpcErr) {
          throw new Error(
            rpcErr.message.includes('admin_upsert_student_cards')
              ? 'يرجى تشغيل ملف supabase_student_card_lookup.sql مرة واحدة في Supabase SQL Editor أولاً'
              : rpcErr.message
          );
        }
        totalInserted += rpcResult?.inserted || 0;
        totalUpdated += rpcResult?.updated || 0;
      }

      const missingNote = missingCount > 0 ? ` (${missingCount} طالب بدون رقم قومي)` : '';
      toast.success(
        `تم نشر وتحديث ${totalInserted + totalUpdated} كارنيه أونلاين بنجاح (${totalInserted} جديد، ${totalUpdated} محدث)${missingNote}`,
        { duration: 5500 }
      );
    } catch (err) {
      console.error('Publish cards online error:', err);
      toast.error(err?.message || 'تعذر نشر الكارنيهات أونلاين — تأكد من الاتصال بالإنترنت');
    } finally {
      setIsPublishingCards(false);
    }
  };

  // Filter summaries for print modal
  const activeFiltersList = useMemo(() => {
    const list = [];
    if (debouncedSearch) list.push(`بحث: "${debouncedSearch}"`);
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
  }, [
    debouncedSearch,
    selectedGrade,
    selectedEnrollmentType,
    selectedEducationType,
    selectedStatus,
    grades,
  ]);

  // Printable table columns
  const printColumns = useMemo(
    () => [
      { header: 'كود / باركود', render: (s) => `#${s.student_code || ''} (${s.barcode_id})` },
      { header: 'اسم الطالب', accessor: 'full_name' },
      { header: 'المرحلة', accessor: 'grade_name' },
      { header: 'موبايل الطالب', render: (s) => s.phone || '—' },
      {
        header: 'ولي الأمر',
        render: (s) =>
          `${s.parent_name || 'ولي أمر'} - ${s.parent_phone || s.father_phone || s.phone || '—'}`,
      },
      { header: 'النظام', render: (s) => (s.enrollment_type === 'PRIVATE' ? 'برايفت' : 'باقة') },
      { header: 'التعليم', render: (s) => (s.education_type === 'LANGUAGES' ? 'لغات' : 'عام') },
      { header: 'الحالة', render: (s) => (s.is_active ? 'نشط' : 'معطل') },
    ],
    []
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5">
      {/* Top Header & Actions Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1
            className="text-xl sm:text-2xl font-bold flex items-center gap-2"
            style={{ color: '#0C3C82' }}
          >
            <span>إدارة شؤون الطلاب</span>
            <span className="atlas-badge bg-sky-100 text-sky-800 text-xs">
              {pagination.total} طالب
            </span>
          </h1>
          <p className="text-xs sm:text-sm mt-1 text-slate-500">
            تسجيل الطلاب الفوري، التعديل السريع، طباعة الاستيكر، والبحث المتقدم
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOpenAdd}
            className="atlas-btn atlas-btn-primary text-xs sm:text-sm flex items-center gap-1.5"
          >
            <Plus size={16} />
            <span>إضافة طالب جديد</span>
          </button>

          <button
            onClick={() => setIsBulkImportOpen(true)}
            className="atlas-btn atlas-btn-secondary text-xs sm:text-sm flex items-center gap-1.5"
            title="استيراد مئات الطلاب بملف واحد أو نسخ ولصق من الإكسيل"
          >
            <Upload size={15} className="text-sky-600" />
            <span>استيراد جماعي</span>
          </button>

          <button
            onClick={handleExportCurrent}
            className="atlas-btn atlas-btn-secondary text-xs sm:text-sm flex items-center gap-1.5"
            title="تنزيل النتائج الحالية كملف Excel / CSV"
          >
            <Download size={15} className="text-emerald-600" />
            <span>تصدير Excel</span>
          </button>

          <button
            onClick={handleOpenPrintModal}
            className="atlas-btn atlas-btn-secondary text-xs sm:text-sm flex items-center gap-1.5"
            title="معاينة وطباعة الكشف الحالي"
          >
            <Printer size={15} className="text-slate-600" />
            <span>طباعة كشف</span>
          </button>

          <button
            onClick={handlePublishCardsOnline}
            disabled={isPublishingCards}
            className="atlas-btn atlas-btn-secondary text-xs sm:text-sm flex items-center gap-1.5 border-sky-200 text-sky-800 bg-sky-50 hover:bg-sky-100"
            title="نشر وتحديث أكواد وباركود وجداول جميع الطلاب أونلاين لصفحة الاستعلام بالرقم القومي (/student-card)"
          >
            {isPublishingCards ? (
              <Loader2 size={15} className="animate-spin text-sky-600" />
            ) : (
              <CloudUpload size={15} className="text-sky-600" />
            )}
            <span>نشر الكارنيهات أونلاين</span>
          </button>

          <button
            onClick={handleFullBackup}
            disabled={isBackingUp}
            className="atlas-btn atlas-btn-outline text-xs sm:text-sm flex items-center gap-1.5 text-slate-700 border-slate-300"
            title="تنزيل نسخة احتياطية كاملة لجميع طلاب السنتر"
          >
            {isBackingUp ? (
              <Loader2 size={15} className="animate-spin text-sky-600" />
            ) : (
              <Database size={15} className="text-indigo-600" />
            )}
            <span>نسخة احتياطية</span>
          </button>
        </div>
      </div>

      {/* Quick Enrollment System Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 rounded-xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedEnrollmentType('')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer ${
              selectedEnrollmentType === ''
                ? 'bg-[#0C3C82] text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            👥 كل الطلاب
          </button>
          <button
            type="button"
            onClick={() => setSelectedEnrollmentType('PACKAGE')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer ${
              selectedEnrollmentType === 'PACKAGE'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
            }`}
          >
            📦 طلاب الباكدج
          </button>
          <button
            type="button"
            onClick={() => setSelectedEnrollmentType('PRIVATE')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer ${
              selectedEnrollmentType === 'PRIVATE'
                ? 'bg-amber-600 text-white'
                : 'text-slate-600 hover:bg-amber-50 hover:text-amber-700'
            }`}
          >
            💎 طلاب البرايفت
          </button>
        </div>

        {/* Education Type Quick Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setSelectedEducationType('')}
            className={`px-2.5 py-1 rounded-md font-bold cursor-pointer ${
              selectedEducationType === '' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
            }`}
          >
            الكل (عربي + لغات)
          </button>
          <button
            type="button"
            onClick={() => setSelectedEducationType('PUBLIC')}
            className={`px-2.5 py-1 rounded-md font-bold cursor-pointer ${
              selectedEducationType === 'PUBLIC'
                ? 'bg-white text-blue-800 shadow-2xs'
                : 'text-slate-500'
            }`}
          >
            🏛️ عربي / عام
          </button>
          <button
            type="button"
            onClick={() => setSelectedEducationType('LANGUAGES')}
            className={`px-2.5 py-1 rounded-md font-bold cursor-pointer ${
              selectedEducationType === 'LANGUAGES'
                ? 'bg-white text-purple-800 shadow-2xs'
                : 'text-slate-500'
            }`}
          >
            🌐 لغات
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="atlas-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="relative sm:col-span-2 lg:col-span-5">
            <Search
              size={17}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              id="students-search"
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="ابحث بالاسم، كود الطالب (#1001)، الباركود، أو رقم الموبايل..."
              className="atlas-input pr-9 text-xs sm:text-sm"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Grade Filter */}
          <div className="lg:col-span-3">
            <select
              id="students-grade-filter"
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="atlas-input text-xs sm:text-sm"
            >
              <option value="">جميع المراحل الدراسية</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name_ar}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Selector */}
          <div className="lg:col-span-2">
            <select
              value={`${sortBy}:${sortOrder}`}
              onChange={(e) => {
                const [col, ord] = e.target.value.split(':');
                setSortBy(col);
                setSortOrder(ord);
              }}
              className="atlas-input text-xs sm:text-sm"
              title="ترتيب القائمة"
            >
              <option value="created_at:desc">الأحدث تسجيلاً</option>
              <option value="student_code:asc">كود الطالب (تصاعدي)</option>
              <option value="student_code:desc">كود الطالب (تنازلي)</option>
              <option value="full_name:asc">الاسم (أبجدياً أ-ي)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="atlas-input text-xs sm:text-sm"
            >
              <option value="">حالة الحساب (الكل)</option>
              <option value="active">النشطون فقط</option>
              <option value="inactive">المعطلون فقط</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-xs">
            <div className="flex flex-wrap items-center gap-1.5 text-slate-600">
              <span>الفلاتر النشطة:</span>
              {activeFiltersList.map((f, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200 font-semibold"
                >
                  {f}
                </span>
              ))}
            </div>
            <button
              onClick={resetFilters}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>مسح كل الفلاتر</span>
            </button>
          </div>
        )}
      </div>

      {/* Students Table */}
      <div className="atlas-card overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2.5">
            <Loader2 size={32} className="animate-spin text-sky-600" />
            <p className="text-xs font-medium text-slate-500">جاري تحميل سجلات الطلاب...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Users size={44} className="mx-auto mb-2.5 text-slate-300" />
            <p className="text-base font-bold text-slate-700">لا يوجد طلاب مطابقون</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {hasActiveFilters
                ? 'لم نجد أي طلاب يطابقون خيارات البحث والفلاتر المحددة'
                : 'لم يتم تسجيل أي طلاب في النظام حتى الآن'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="mt-3 atlas-btn atlas-btn-secondary text-xs"
              >
                مسح الفلاتر والبحث مجدداً
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[1250px] text-right border-collapse">
              <thead>
                <tr style={{ background: '#0C3C82' }}>
                  <th className="text-white text-xs font-semibold py-3 px-3.5 whitespace-nowrap">
                    كود الطالب / الباركود
                  </th>
                  <th className="text-white text-xs font-semibold py-3 px-3.5 whitespace-nowrap">
                    اسم الطالب
                  </th>
                  <th className="text-white text-xs font-semibold py-3 px-3.5 whitespace-nowrap">
                    المرحلة الدراسية
                  </th>
                  <th className="text-white text-xs font-semibold py-3 px-3.5 whitespace-nowrap">
                    موبايل الطالب
                  </th>
                  <th className="text-white text-xs font-semibold py-3 px-3.5 whitespace-nowrap">
                    ولي الأمر
                  </th>
                  <th className="text-white text-xs font-semibold py-3 px-3.5 whitespace-nowrap">
                    النظام والتعليم
                  </th>
                  <th className="text-white text-xs font-semibold py-3 px-3.5 text-center whitespace-nowrap">
                    المجموعات
                  </th>
                  <th className="text-white text-xs font-semibold py-3 px-3.5 whitespace-nowrap">
                    الحالة
                  </th>
                  <th
                    className="text-white text-xs font-semibold py-3 px-3 text-center whitespace-nowrap w-[170px] min-w-[170px] max-w-[170px]"
                    style={{ width: '170px', minWidth: '170px' }}
                  >
                    إجراءات سريعة
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <StudentRow
                    key={student.id}
                    student={student}
                    onNavigate={handleNavigate}
                    onEdit={handleOpenEdit}
                    onPrintSticker={handlePrintSticker}
                    onDelete={setStudentToDelete}
                    printingId={printingId}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 border-t border-slate-100 gap-3 bg-slate-50/60">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs text-slate-500">
              عرض <span className="font-bold text-slate-800">{students.length}</span> من أصل{' '}
              <span className="font-bold text-slate-800">{pagination.total}</span> طالب
              {pagination.totalPages > 1 && (
                <span className="mr-1">
                  (صفحة <span className="font-bold text-slate-800">{pagination.page}</span> من{' '}
                  <span className="font-bold text-slate-800">{pagination.totalPages}</span>)
                </span>
              )}
            </p>

            <div className="flex items-center gap-1.5 text-xs text-slate-600 border-r border-slate-200 pr-3">
              <span>العدد بالصفحة:</span>
              <select
                id="students-page-size"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                }}
                className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value={15}>15 طالب</option>
                <option value={25}>25 طالب</option>
                <option value={50}>50 طالب</option>
                <option value={100}>100 طالب</option>
                <option value={200}>200 طالب</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => fetchStudents(pagination.page - 1, pageSize)}
              disabled={pagination.page <= 1}
              className="atlas-btn atlas-btn-ghost text-xs flex items-center gap-1 disabled:opacity-40"
            >
              <ChevronRight size={15} />
              <span>السابق</span>
            </button>

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
                      className={`w-7 h-7 rounded-lg text-xs font-bold cursor-pointer ${
                        pagination.page === p
                          ? 'bg-sky-600 text-white'
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
            >
              <span>التالي</span>
              <ChevronLeft size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Quick Edit Single Student Modal */}
      <StudentModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        onSuccess={() => fetchStudents(pagination.page, pageSize)}
        initialData={studentToEdit}
        grades={grades}
      />

      {/* Bulk Import Modal */}
      <StudentBulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onSuccess={() => fetchStudents(1, pageSize)}
        grades={grades}
      />

      {/* Print Report Preview Modal */}
      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="كشف سجلات الطلاب"
        subtitle={`المطابق للفلاتر الحالية (${printStudentsData.length || students.length} طالب)`}
        columns={printColumns}
        data={printStudentsData.length > 0 ? printStudentsData : students}
        filtersSummary={activeFiltersList}
        isLoadingData={isLoadingPrintData}
      />

      {/* Delete Student Confirmation Modal (Zero blur/animation for weak PCs) */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-lg border border-slate-200 overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle size={26} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                تأكيد حذف الطالب نهائياً
              </h3>
              <p className="text-slate-500 text-xs mb-4">
                هل أنت متأكد من رغبتك في حذف هذا الطالب؟ لا يمكن التراجع عن هذه الخطوة.
              </p>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-right mb-4 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">اسم الطالب:</span>
                  <span className="font-bold text-slate-800">{studentToDelete.full_name}</span>
                </div>
                {studentToDelete.student_code && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">كود الطالب:</span>
                    <span className="font-mono font-bold text-sky-700">
                      #{studentToDelete.student_code}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">باركود البطاقة:</span>
                  <span className="font-mono text-slate-700">{studentToDelete.barcode_id}</span>
                </div>
                {studentToDelete.grade_name && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">المرحلة الدراسية:</span>
                    <span className="text-slate-700">{studentToDelete.grade_name}</span>
                  </div>
                )}
              </div>

              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs text-right leading-relaxed mb-4 flex items-start gap-2">
                <AlertTriangle size={15} className="shrink-0 mt-0.5 text-rose-600" />
                <span>
                  <strong>تنبيه:</strong> سيتم حذف اشتراكات الطالب وسجلات الحضور والمدفوعات المرتبطة به.
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleDeleteStudent}
                  disabled={isDeleting}
                  className="flex-1 py-2 px-4 rounded-xl font-bold text-white text-xs sm:text-sm bg-rose-600 hover:bg-rose-700 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>جاري الحذف...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={15} />
                      <span>تأكيد الحذف</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setStudentToDelete(null)}
                  disabled={isDeleting}
                  className="py-2 px-4 rounded-xl font-semibold text-slate-700 text-xs sm:text-sm bg-slate-100 hover:bg-slate-200 cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
