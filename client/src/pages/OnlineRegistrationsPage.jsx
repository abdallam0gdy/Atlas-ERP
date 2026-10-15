import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import {
  Users,
  GraduationCap,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  MessageCircle,
  Eye,
  Trash2,
  RefreshCw,
  Printer,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  BookOpen,
  User,
  RotateCcw,
  Copy,
  CheckCheck,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Table as TableIcon,
  LayoutGrid
} from 'lucide-react';

// ============================================================
// HELPER FUNCTIONS & SAFE PARSERS
// ============================================================

export const parseGroupsData = (teacher) => {
  if (!teacher) return [];
  let list = [];

  if (Array.isArray(teacher.groups_data)) {
    list = teacher.groups_data;
  } else if (typeof teacher.groups_data === 'string') {
    try {
      const parsed = JSON.parse(teacher.groups_data);
      if (Array.isArray(parsed)) list = parsed;
    } catch {}
  }

  // Fallback: check if notes contain [المجموعات المقترحة]: [...]
  if (list.length === 0 && teacher.notes && teacher.notes.includes('[المجموعات المقترحة]:')) {
    try {
      const match = teacher.notes.match(/\[المجموعات المقترحة\]:\s*(\[.*?\])/s);
      if (match && match[1]) {
        const parsed = JSON.parse(match[1]);
        if (Array.isArray(parsed)) list = parsed;
      }
    } catch {}
  }

  const defaultSub = (teacher.specialization || '').split(/[،,]/)[0]?.trim() || '';

  return list.map((g, idx) => ({
    id: g.id || idx + 1,
    day: g.day || 'السبت',
    start_time: g.start_time || '14:00',
    end_time: g.end_time || '16:00',
    grade: g.grade || 'الصف الأول الثانوي',
    subject: g.subject || defaultSub || 'المادة العامة',
  }));
};

export const parseAssistantsData = (teacher) => {
  if (!teacher) return [];
  let list = [];

  if (Array.isArray(teacher.assistants_data)) {
    list = teacher.assistants_data;
  } else if (typeof teacher.assistants_data === 'string') {
    try {
      const parsed = JSON.parse(teacher.assistants_data);
      if (Array.isArray(parsed)) list = parsed;
    } catch {}
  }

  // Fallback: check if notes contain [بيانات المساعدين]: [...]
  if (list.length === 0 && teacher.notes && teacher.notes.includes('[بيانات المساعدين]:')) {
    try {
      const match = teacher.notes.match(/\[بيانات المساعدين\]:\s*(\[.*?\])/s);
      if (match && match[1]) {
        const parsed = JSON.parse(match[1]);
        if (Array.isArray(parsed)) list = parsed;
      }
    } catch {}
  }

  return list.map((a, idx) => ({
    id: a.id || idx + 1,
    name: a.name || `مساعد ${idx + 1}`,
    phone: a.phone || '',
  }));
};

export const calculateGroupDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return '';
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  if (isNaN(startH) || isNaN(endH)) return '';

  const startMinutes = startH * 60 + (startM || 0);
  const endMinutes = endH * 60 + (endM || 0);
  const duration = endMinutes - startMinutes;
  if (duration <= 0) return '';

  const hours = Math.floor(duration / 60);
  const mins = duration % 60;
  if (hours > 0 && mins > 0) return `${hours} س و ${mins} د`;
  if (hours === 1) return 'ساعة واحدة';
  if (hours === 2) return 'ساعتان';
  if (hours > 2) return `${hours} ساعات`;
  return `${mins} دقيقة`;
};

export const formatTime12H = (time24, includeWord = false) => {
  if (!time24) return '';
  const parts = String(time24).split(':');
  if (parts.length < 2) return time24;
  let h = parseInt(parts[0], 10);
  const m = parts[1] || '00';
  if (isNaN(h)) return time24;

  const isPM = h >= 12;
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;

  const hStr = String(h12).padStart(2, '0');
  const period = isPM ? 'م' : 'ص';
  const word = isPM ? (h === 12 ? 'ظهراً' : 'مساءً') : (h === 0 ? 'منتصف الليل' : 'صباحاً');

  if (includeWord) {
    return `${hStr}:${m} ${word}`;
  }
  return `${hStr}:${m} ${period}`;
};

export const formatArabicDateTime = (dateStr) => {
  if (!dateStr) return 'غير محدد';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  return d.toLocaleString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const getDirectWhatsAppUrl = (phone, text = '') => {
  if (!phone) return '#';
  let clean = String(phone).replace(/\D/g, '');
  if (clean.startsWith('0')) clean = '2' + clean;
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
};

const ALL_DAYS = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function OnlineRegistrationsPage() {
  const [activeTab, setActiveTab] = useState('teachers'); // 'teachers' | 'students'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'

  // Data states
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [dayFilter, setDayFilter] = useState('all');

  // Pagination states
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Multi-Selection State for Batch Actions
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBatchUpdating, setIsBatchUpdating] = useState(false);

  // Selected item for modal
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  // Lightbox Image Preview
  const [previewImage, setPreviewImage] = useState(null);

  // Status updating indicator
  const [updatingId, setUpdatingId] = useState(null);

  // Copy to clipboard tracker
  const [copiedKey, setCopiedKey] = useState(null);

  // Reset pagination & selection on filter or tab change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [activeTab, searchQuery, statusFilter, gradeFilter, subjectFilter, dayFilter, pageSize]);

  // Copy to clipboard helper
  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('تم النسخ إلى الحافظة');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Fetch online students and teachers from Supabase
  const fetchData = async () => {
    try {
      setIsRefreshing(true);

      const [studentsRes, teachersRes] = await Promise.all([
        supabase
          .from('online_students')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('online_teachers')
          .select('*')
          .order('created_at', { ascending: false }),
      ]);

      if (studentsRes.error) {
        console.error('Error fetching students:', studentsRes.error);
        toast.error('تعذر جلب طلبات الطلاب');
      } else {
        setStudents(studentsRes.data || []);
      }

      if (teachersRes.error) {
        console.error('Error fetching teachers:', teachersRes.error);
        toast.error('تعذر جلب طلبات المعلمين');
      } else {
        setTeachers(teachersRes.data || []);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('حدث خطأ أثناء تحميل البيانات');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update Status in Supabase
  const handleUpdateStatus = async (type, id, newStatus) => {
    setUpdatingId(id);
    const table = type === 'student' ? 'online_students' : 'online_teachers';

    try {
      const { error } = await supabase
        .from(table)
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      toast.success(
        newStatus === 'approved' 
          ? 'تم اعتماد وقبول الطلب' 
          : newStatus === 'rejected' 
          ? 'تم رفض الطلب' 
          : 'تم إرجاع الطلب لقيد المراجعة'
      );

      if (type === 'student') {
        setStudents((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
        );
        if (selectedStudent?.id === id) {
          setSelectedStudent((prev) => ({ ...prev, status: newStatus }));
        }
      } else {
        setTeachers((prev) =>
          prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
        );
        if (selectedTeacher?.id === id) {
          setSelectedTeacher((prev) => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      console.error('Status update error:', err);
      toast.error('فشل تحديث حالة الطلب');
    } finally {
      setUpdatingId(null);
    }
  };

  // Batch Status Update
  const handleBatchStatusUpdate = async (newStatus) => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    const table = activeTab === 'students' ? 'online_students' : 'online_teachers';

    setIsBatchUpdating(true);
    try {
      const { error } = await supabase
        .from(table)
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .in('id', selectedIds);

      if (error) throw error;

      toast.success(`تم تحديث ${count} طلب بنجاح`);

      if (activeTab === 'students') {
        setStudents((prev) =>
          prev.map((s) => (selectedIds.includes(s.id) ? { ...s, status: newStatus } : s))
        );
      } else {
        setTeachers((prev) =>
          prev.map((t) => (selectedIds.includes(t.id) ? { ...t, status: newStatus } : t))
        );
      }
      setSelectedIds([]);
    } catch (err) {
      console.error('Batch update error:', err);
      toast.error('فشل التحديث الجماعي');
    } finally {
      setIsBatchUpdating(false);
    }
  };

  // Delete Record
  const handleDeleteRecord = async (type, id, name) => {
    if (!window.confirm(`هل أنت متأكد من حذف استمارة "${name}" نهائياً؟`)) return;

    setUpdatingId(id);
    const table = type === 'student' ? 'online_students' : 'online_teachers';

    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('تم حذف الاستمارة بنجاح');
      if (type === 'student') {
        setStudents((prev) => prev.filter((s) => s.id !== id));
        if (selectedStudent?.id === id) setSelectedStudent(null);
      } else {
        setTeachers((prev) => prev.filter((t) => t.id !== id));
        if (selectedTeacher?.id === id) setSelectedTeacher(null);
      }
      setSelectedIds((prev) => prev.filter((itemId) => itemId !== id));
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('فشل حذف الاستمارة');
    } finally {
      setUpdatingId(null);
    }
  };

  // Unique Teacher Subjects
  const uniqueTeacherSubjects = useMemo(() => {
    const set = new Set();
    teachers.forEach((t) => {
      if (t.specialization) {
        t.specialization.split(/[،,]/).forEach((s) => {
          const trimmed = s.trim();
          if (trimmed) set.add(trimmed);
        });
      }
      const groups = parseGroupsData(t);
      groups.forEach((g) => {
        if (g.subject) set.add(g.subject.trim());
      });
    });
    return Array.from(set).sort();
  }, [teachers]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (gradeFilter !== 'all' && item.academic_grade !== gradeFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.full_name?.toLowerCase().includes(q);
        const matchesPhone = item.phone?.includes(q);
        const matchesFather = item.father_phone?.includes(q);
        const matchesMother = item.mother_phone?.includes(q);
        const matchesNid = item.national_id?.includes(q);
        const matchesSchool = item.school_name?.toLowerCase().includes(q);
        return matchesName || matchesPhone || matchesFather || matchesMother || matchesNid || matchesSchool;
      }

      return true;
    });
  }, [students, statusFilter, gradeFilter, searchQuery]);

  // Filtered Teachers
  const filteredTeachers = useMemo(() => {
    return teachers.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;

      const groups = parseGroupsData(item);

      if (subjectFilter !== 'all') {
        const matchesSpec = item.specialization?.includes(subjectFilter);
        const matchesGroupSub = groups.some((g) => g.subject?.includes(subjectFilter));
        if (!matchesSpec && !matchesGroupSub) return false;
      }

      if (dayFilter !== 'all') {
        const matchesDay = groups.some((g) => g.day === dayFilter);
        if (!matchesDay) return false;
      }

      if (gradeFilter !== 'all') {
        const matchesTarget = item.target_grades?.includes(gradeFilter);
        const matchesGroupGrd = groups.some((g) => g.grade === gradeFilter);
        if (!matchesTarget && !matchesGroupGrd) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.full_name?.toLowerCase().includes(q);
        const matchesNick = item.nickname?.toLowerCase().includes(q);
        const matchesPhone = item.phone?.includes(q);
        const matchesWhatsapp = item.whatsapp_phone?.includes(q);
        const matchesNid = item.national_id?.includes(q);
        const matchesSpec = item.specialization?.toLowerCase().includes(q);
        return matchesName || matchesNick || matchesPhone || matchesWhatsapp || matchesNid || matchesSpec;
      }

      return true;
    });
  }, [teachers, statusFilter, subjectFilter, dayFilter, gradeFilter, searchQuery]);

  // Pagination calculations
  const activeList = activeTab === 'students' ? filteredStudents : filteredTeachers;
  const totalItems = activeList.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedList = activeList.slice(startIndex, endIndex);

  // Statistics
  const stats = useMemo(() => {
    const studentPending = students.filter((s) => s.status === 'pending').length;
    const studentApproved = students.filter((s) => s.status === 'approved').length;
    const teacherPending = teachers.filter((t) => t.status === 'pending').length;
    const teacherApproved = teachers.filter((t) => t.status === 'approved').length;

    let totalGroups = 0;
    teachers.forEach((t) => {
      totalGroups += parseGroupsData(t).length;
    });

    return {
      totalStudents: students.length,
      studentPending,
      studentApproved,
      totalTeachers: teachers.length,
      teacherPending,
      teacherApproved,
      totalGroups,
      totalPending: studentPending + teacherPending,
    };
  }, [students, teachers]);

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || gradeFilter !== 'all' || subjectFilter !== 'all' || dayFilter !== 'all';

  const resetAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setGradeFilter('all');
    setSubjectFilter('all');
    setDayFilter('all');
  };

  // Multi-Selection Handlers
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllCurrentPage = () => {
    const pageIds = paginatedList.map((item) => item.id);
    const allSelected = pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const isCurrentPageAllSelected = paginatedList.length > 0 && paginatedList.every((item) => selectedIds.includes(item.id));

  // CSV Export
  const exportToCSV = (type, listToExport) => {
    const dataList = listToExport && listToExport.length > 0 ? listToExport : activeList;
    if (!dataList || dataList.length === 0) {
      toast.error('لا توجد بيانات مطابقة لتصديرها');
      return;
    }

    let headers = [];
    let rows = [];

    if (type === 'students') {
      headers = ['كود الطالب', 'اسم الطالب', 'الرقم القومي', 'هاتف الطالب', 'هاتف ولي الأمر', 'الصف', 'نوع التعليم', 'المدرسة', 'الحالة', 'تاريخ التسجيل'];
      rows = dataList.map((s) => [
        s.id.slice(0, 8).toUpperCase(),
        `"${(s.full_name || '').replace(/"/g, '""')}"`,
        `'${s.national_id || ''}`,
        `'${s.phone || ''}`,
        `'${s.father_phone || ''}`,
        `"${s.academic_grade || ''}"`,
        `"${s.education_type || ''}"`,
        `"${(s.school_name || '').replace(/"/g, '""')}"`,
        s.status === 'approved' ? 'معتمد' : s.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة',
        s.created_at ? new Date(s.created_at).toLocaleDateString('ar-EG') : ''
      ]);
    } else {
      headers = ['كود المعلم', 'الاسم الرسمي', 'اسم الشهرة', 'الرقم القومي', 'الهاتف الشخصي', 'هاتف الواتساب', 'المواد', 'المراحل', 'المجموعات', 'الحالة', 'تاريخ التقديم'];
      rows = dataList.map((t) => {
        const groups = parseGroupsData(t);
        return [
          t.id.slice(0, 8).toUpperCase(),
          `"${(t.full_name || '').replace(/"/g, '""')}"`,
          `"${(t.nickname || '').replace(/"/g, '""')}"`,
          `'${t.national_id || ''}`,
          `'${t.phone || ''}`,
          `'${t.whatsapp_phone || ''}`,
          `"${(t.specialization || '').replace(/"/g, '""')}"`,
          `"${(t.target_grades || '').replace(/"/g, '""')}"`,
          groups.length,
          t.status === 'approved' ? 'معتمد' : t.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة',
          t.created_at ? new Date(t.created_at).toLocaleDateString('ar-EG') : ''
        ];
      });
    }

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type === 'students' ? 'كشف_طلبات_الطلاب' : 'كشف_طلبات_المعلمين'}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('تم تصدير ملف الكشف بنجاح');
  };

  // Print single teacher application
  const printTeacherApplication = (teacher) => {
    const groups = parseGroupsData(teacher);
    const assistants = parseAssistantsData(teacher);

    const printWin = window.open('', '_blank');
    if (!printWin) {
      toast.error('يرجى السماح بالنوافذ المنبثقة لطباعة الاستمارة');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>استمارة انضمام معلّم - ${teacher.full_name}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 25px; margin: 0; color: #1e293b; background: #fff; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; }
          .title { font-size: 20px; font-weight: 800; color: #0C3C82; margin: 0; }
          .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px; font-size: 13px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
          .label { font-size: 11px; color: #64748b; display: block; margin-bottom: 3px; }
          .val { font-weight: bold; color: #0f172a; }
          .table-title { font-size: 14px; font-weight: bold; margin: 20px 0 10px; color: #0C3C82; border-right: 4px solid #0C3C82; padding-right: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: right; }
          th { background: #f1f5f9; color: #334155; font-weight: bold; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; background: #e0f2fe; color: #0369a1; }
          .footer { margin-top: 35px; border-top: 1px dashed #cbd5e1; padding-top: 15px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; }
          @media print { body { padding: 15px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">أكاديمية أطلس التعليمية — استمارة انضمام معلّم</h1>
            <div class="subtitle">رقم الطلب: ${teacher.id.slice(0, 8).toUpperCase()} • تاريخ التقديم: ${formatArabicDateTime(teacher.created_at)}</div>
          </div>
          ${teacher.photo_url ? `<img src="${teacher.photo_url}" style="width:65px;height:65px;border-radius:8px;object-fit:cover;" />` : ''}
        </div>

        <div class="grid">
          <div class="card"><span class="label">اسم المعلم:</span><span class="val">${teacher.full_name}</span></div>
          <div class="card"><span class="label">اسم الشهرة:</span><span class="val">${teacher.nickname || '—'}</span></div>
          <div class="card"><span class="label">التخصصات:</span><span class="val">${teacher.specialization || '—'}</span></div>
          <div class="card"><span class="label">الهاتف الشخصي:</span><span class="val" dir="ltr">${teacher.phone}</span></div>
          <div class="card"><span class="label">الواتساب:</span><span class="val" dir="ltr">${teacher.whatsapp_phone || teacher.phone}</span></div>
          <div class="card"><span class="label">الرقم القومي:</span><span class="val" dir="ltr">${teacher.national_id || '—'}</span></div>
        </div>

        <div class="table-title">جدول الحصص والمجموعات المقترحة</div>
        ${groups.length > 0 ? `
          <table>
            <thead>
              <tr><th>#</th><th>المادة</th><th>الصف</th><th>اليوم</th><th>التوقيت</th><th>المدة</th></tr>
            </thead>
            <tbody>
              ${groups.map((g, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td><span class="badge">${g.subject}</span></td>
                  <td>${g.grade}</td>
                  <td>${g.day}</td>
                  <td>من ${formatTime12H(g.start_time, true)} إلى ${formatTime12H(g.end_time, true)}</td>
                  <td>${calculateGroupDuration(g.start_time, g.end_time)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p style="font-size:12px;color:#64748b">لا توجد مواعيد مسجلة</p>'}

        <div class="footer">
          <span>أكاديمية أطلس — نظام الإدارة المتكامل ERP</span>
          <span>توقيع الإدارة والتنسيق: __________________</span>
        </div>

        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `;

    printWin.document.write(html);
    printWin.document.close();
  };

  // Print single student application
  const printStudentApplication = (student) => {
    const printWin = window.open('', '_blank');
    if (!printWin) {
      toast.error('يرجى السماح بالنوافذ المنبثقة لطباعة الاستمارة');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>استمارة تسجيل طالب - ${student.full_name}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 25px; margin: 0; color: #1e293b; background: #fff; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; }
          .title { font-size: 20px; font-weight: 800; color: #0C3C82; margin: 0; }
          .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px; font-size: 13px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
          .label { font-size: 11px; color: #64748b; display: block; margin-bottom: 3px; }
          .val { font-weight: bold; color: #0f172a; }
          .footer { margin-top: 35px; border-top: 1px dashed #cbd5e1; padding-top: 15px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; }
          @media print { body { padding: 15px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">أكاديمية أطلس التعليمية — استمارة تسجيل طالب</h1>
            <div class="subtitle">رقم الطلب: ${student.id.slice(0, 8).toUpperCase()} • تاريخ التسجيل: ${formatArabicDateTime(student.created_at)}</div>
          </div>
          ${student.photo_url ? `<img src="${student.photo_url}" style="width:65px;height:65px;border-radius:8px;object-fit:cover;" />` : ''}
        </div>

        <div class="grid">
          <div class="card"><span class="label">اسم الطالب:</span><span class="val">${student.full_name}</span></div>
          <div class="card"><span class="label">الصف والتعليم:</span><span class="val">${student.academic_grade} (${student.education_type})</span></div>
          <div class="card"><span class="label">هاتف الطالب:</span><span class="val" dir="ltr">${student.phone}</span></div>
          <div class="card"><span class="label">هاتف ولي الأمر:</span><span class="val" dir="ltr">${student.father_phone}</span></div>
          <div class="card"><span class="label">الرقم القومي:</span><span class="val" dir="ltr">${student.national_id || '—'}</span></div>
          <div class="card"><span class="label">المدرسة:</span><span class="val">${student.school_name || '—'}</span></div>
          <div class="card" style="grid-column: span 2;"><span class="label">العنوان:</span><span class="val">${student.address || '—'}</span></div>
        </div>

        <div class="footer">
          <span>أكاديمية أطلس — نظام الإدارة المتكامل ERP</span>
          <span>توقيع شؤون الطلاب: __________________</span>
        </div>

        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `;

    printWin.document.write(html);
    printWin.document.close();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in font-sans" dir="rtl">
      
      {/* ============================================================
          TOP HEADER & ACTIONS (MATCHING ATLAS ERP SYSTEM)
          ============================================================ */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2.5" style={{ color: '#0C3C82' }}>
            <span>استمارات التسجيل الإلكتروني (أونلاين)</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>مزامنة سحابية حية</span>
            </span>
          </h1>
          <p className="text-xs sm:text-sm mt-1 text-slate-500">
            مراجعة وتنسيق طلبات انضمام الطلاب والمعلمين المقدمة عبر البوابة الإلكترونية
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Table / Cards View Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="عرض جدول"
            >
              <TableIcon size={14} />
              <span>جدول</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'cards' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="عرض بطاقات"
            >
              <LayoutGrid size={14} />
              <span>بطاقات</span>
            </button>
          </div>

          <button
            onClick={fetchData}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            title="تحديث البيانات"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-sky-600' : ''} />
            <span>تحديث</span>
          </button>

          <button
            onClick={() => exportToCSV(activeTab, activeList)}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-emerald-700 border border-emerald-200 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            title="تصدير النتائج إلى Excel"
          >
            <FileSpreadsheet size={15} />
            <span>تصدير Excel</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            title="طباعة الكشف الحالي"
          >
            <Printer size={15} />
            <span>طباعة</span>
          </button>
        </div>
      </div>

      {/* ============================================================
          CLEAN KPI STATS CARDS (LIGHT & HARMONIOUS)
          ============================================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Teachers Card */}
        <div 
          onClick={() => { setActiveTab('teachers'); setStatusFilter('all'); }}
          className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer shadow-xs ${
            activeTab === 'teachers' ? 'border-sky-500 ring-2 ring-sky-100' : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">طلبات المعلمين</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <GraduationCap size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold text-slate-800">{stats.totalTeachers}</span>
            <span className="text-xs text-slate-400">معلم</span>
          </div>
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded">
              {stats.teacherPending} مراجعة
            </span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
              {stats.teacherApproved} معتمد
            </span>
          </div>
        </div>

        {/* Students Card */}
        <div 
          onClick={() => { setActiveTab('students'); setStatusFilter('all'); }}
          className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer shadow-xs ${
            activeTab === 'students' ? 'border-sky-500 ring-2 ring-sky-100' : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">طلبات الطلاب</span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold text-slate-800">{stats.totalStudents}</span>
            <span className="text-xs text-slate-400">طالب</span>
          </div>
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded">
              {stats.studentPending} مراجعة
            </span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
              {stats.studentApproved} معتمد
            </span>
          </div>
        </div>

        {/* Total Groups Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">المجموعات المقترحة</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <BookOpen size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold text-purple-700">{stats.totalGroups}</span>
            <span className="text-xs text-slate-400">مجموعة وميعاد</span>
          </div>
          <p className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-purple-800 font-semibold truncate">
            موزعة بالمواد وتنسيق 12h
          </p>
        </div>

        {/* Pending Card */}
        <div 
          onClick={() => setStatusFilter('pending')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs cursor-pointer hover:border-amber-400 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">بانتظار المراجعة</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold text-amber-700">{stats.totalPending}</span>
            <span className="text-xs text-slate-400">طلب معلق</span>
          </div>
          <p className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-amber-700 font-bold">
            اضغط لتصفية المعلق فقط ←
          </p>
        </div>
      </div>

      {/* ============================================================
          TABS & FILTER BAR (CLEAN, INTEGRATED & RESPONSIVE)
          ============================================================ */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
        
        {/* Main Tab Switcher */}
        <div className="flex items-center border-b border-slate-100 pb-3 gap-2 overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab('teachers');
              resetAllFilters();
            }}
            className={`pb-2 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'teachers'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <GraduationCap size={16} />
            <span>استمارات المعلمين ومجموعاتهم</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-rose-50 text-rose-700 font-semibold border border-rose-200/60">
              {teachers.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('students');
              resetAllFilters();
            }}
            className={`pb-2 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'students'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users size={16} />
            <span>استمارات الطلاب</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-sky-50 text-sky-700 font-semibold border border-sky-200/60">
              {students.length}
            </span>
          </button>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative sm:col-span-2">
            <Search size={16} className="absolute right-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'teachers'
                  ? 'بحث باسم المعلم، اللقب، الهاتف، المادة...'
                  : 'بحث باسم الطالب، هاتف ولي الأمر، الرقم القومي...'
              }
              className="w-full pr-10 pl-8 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="all">كافة الحالات</option>
              <option value="pending">⏳ قيد المراجعة ({activeTab === 'teachers' ? stats.teacherPending : stats.studentPending})</option>
              <option value="approved">✓ معتمد ومقبول ({activeTab === 'teachers' ? stats.teacherApproved : stats.studentApproved})</option>
              <option value="rejected">✕ مرفوض</option>
            </select>
          </div>

          {/* Contextual Filter */}
          {activeTab === 'teachers' ? (
            <div>
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer text-purple-900"
              >
                <option value="all">كافة المواد التخصصية</option>
                {uniqueTeacherSubjects.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                <option value="all">كافة الصفوف الدراسية</option>
                <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
                <option value="الصف الثاني الثانوي">الصف الثاني الثانوي</option>
                <option value="الصف الثالث الثانوي">الصف الثالث الثانوي</option>
                <option value="الصف الأول الإعدادي">الصف الأول الإعدادي</option>
                <option value="الصف الثاني الإعدادي">الصف الثاني الإعدادي</option>
                <option value="الصف الثالث الإعدادي">الصف الثالث الإعدادي</option>
              </select>
            </div>
          )}

          {/* Page Size & Reset */}
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:outline-none cursor-pointer"
              title="عدد العناصر في كل صفحة"
            >
              <option value={10}>10 بالصفحة</option>
              <option value={20}>20 بالصفحة</option>
              <option value={25}>25 بالصفحة</option>
              <option value={50}>50 بالصفحة</option>
              <option value={100}>100 بالصفحة</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
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
          MAIN DATA CONTENT (TABLE OR MOBILE CARDS)
          ============================================================ */}
      {isLoading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <RefreshCw size={32} className="animate-spin text-sky-600 mx-auto mb-2" />
          <p className="text-slate-500 text-xs font-semibold">جاري تحميل الاستمارات السحابية...</p>
        </div>
      ) : paginatedList.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          {activeTab === 'students' ? (
            <Users size={40} className="text-slate-300 mx-auto mb-2" />
          ) : (
            <GraduationCap size={40} className="text-slate-300 mx-auto mb-2" />
          )}
          <h3 className="text-sm font-bold text-slate-700">لا توجد استمارات مسجلة تطابق البحث</h3>
          <p className="text-slate-400 text-xs mt-1">تأكد من شروط الفلترة أو جرب البحث بكلمات أخرى</p>
          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="mt-3 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>إعادة تعيين الفلاتر</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ============================================================
              DESKTOP TABLE VIEW
              ============================================================ */}
          <div className={`${viewMode === 'cards' ? 'hidden' : 'hidden md:block'} bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs sm:text-sm min-w-[1050px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">
                      <button
                        type="button"
                        onClick={handleSelectAllCurrentPage}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                        title={isCurrentPageAllSelected ? 'إلغاء التحديد' : 'تحديد عناصر الصفحة'}
                      >
                        {isCurrentPageAllSelected ? <CheckSquare size={16} className="text-sky-600" /> : <Square size={16} />}
                      </button>
                    </th>
                    {activeTab === 'teachers' ? (
                      <>
                        <th className="py-3 px-3 font-bold min-w-[200px]">المعلم</th>
                        <th className="py-3 px-3 font-bold min-w-[150px]">المواد والتخصصات</th>
                        <th className="py-3 px-3 font-bold min-w-[260px]">المجموعات ومواعيد الحصص (مادة كل ميعاد)</th>
                        <th className="py-3 px-3 font-bold min-w-[140px]">بيانات الاتصال</th>
                        <th className="py-3 px-3 font-bold min-w-[120px]">تاريخ التقديم</th>
                        <th className="py-3 px-3 font-bold text-center min-w-[90px]">الحالة</th>
                        <th className="py-3 px-3 font-bold text-center min-w-[140px]">الإجراءات</th>
                      </>
                    ) : (
                      <>
                        <th className="py-3 px-3 font-bold min-w-[200px]">الطالب</th>
                        <th className="py-3 px-3 font-bold min-w-[140px]">الصف ونوع التعليم</th>
                        <th className="py-3 px-3 font-bold min-w-[160px]">المدرسة والعنوان</th>
                        <th className="py-3 px-3 font-bold min-w-[150px]">بيانات الاتصال</th>
                        <th className="py-3 px-3 font-bold min-w-[120px]">تاريخ التسجيل</th>
                        <th className="py-3 px-3 font-bold text-center min-w-[90px]">الحالة</th>
                        <th className="py-3 px-3 font-bold text-center min-w-[140px]">الإجراءات</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeTab === 'teachers'
                    ? paginatedList.map((teacher) => {
                        const groups = parseGroupsData(teacher);
                        const specs = (teacher.specialization || '').split(/[،,]/).map((s) => s.trim()).filter(Boolean);
                        const isSelected = selectedIds.includes(teacher.id);

                        return (
                          <tr key={teacher.id} className={`hover:bg-slate-50/70 transition-colors ${isSelected ? 'bg-sky-50/30' : ''}`}>
                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleSelect(teacher.id)}
                                className="text-slate-400 hover:text-slate-700 cursor-pointer"
                              >
                                {isSelected ? <CheckSquare size={16} className="text-sky-600" /> : <Square size={16} />}
                              </button>
                            </td>

                            {/* Teacher info */}
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2.5">
                                <div 
                                  onClick={() => teacher.photo_url ? setPreviewImage({ url: teacher.photo_url, title: teacher.full_name }) : setSelectedTeacher(teacher)}
                                  className="w-10 h-10 rounded-xl overflow-hidden bg-rose-50 border border-rose-200 shrink-0 cursor-pointer"
                                  title="اضغط للتكبير"
                                >
                                  {teacher.photo_url ? (
                                    <img src={teacher.photo_url} alt={teacher.full_name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-rose-500">
                                      <GraduationCap size={18} />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <span 
                                    onClick={() => setSelectedTeacher(teacher)}
                                    className="font-bold text-slate-800 hover:text-rose-600 cursor-pointer block leading-tight"
                                  >
                                    {teacher.nickname ? `${teacher.nickname}` : teacher.full_name}
                                  </span>
                                  <span className="text-[11px] text-slate-400 block">{teacher.full_name}</span>
                                </div>
                              </div>
                            </td>

                            {/* Specialization */}
                            <td className="py-3 px-3">
                              <div className="flex flex-wrap gap-1">
                                {specs.map((s, idx) => (
                                  <span key={idx} className="bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded text-[11px] border border-rose-200/60">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </td>

                            {/* Groups with individual subject */}
                            <td className="py-3 px-3">
                              {groups.length > 0 ? (
                                <div className="space-y-1">
                                  {groups.slice(0, 2).map((grp, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-[11px] bg-purple-50/70 p-1.5 rounded-lg border border-purple-100">
                                      <span className="font-bold text-purple-950">
                                        {grp.day}: {formatTime12H(grp.start_time)}
                                      </span>
                                      <span className="font-bold text-purple-800 bg-purple-200/60 px-1.5 py-0.2 rounded text-[10px]">
                                        مادة: {grp.subject}
                                      </span>
                                    </div>
                                  ))}
                                  {groups.length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() => setSelectedTeacher(teacher)}
                                      className="text-[11px] text-purple-700 font-bold hover:underline"
                                    >
                                      + {groups.length - 2} مجموعات أخرى
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-xs">لا توجد مواعيد</span>
                              )}
                            </td>

                            {/* Contacts */}
                            <td className="py-3 px-3">
                              <div className="space-y-0.5 text-xs font-mono">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-800">{teacher.phone}</span>
                                  <button
                                    onClick={() => copyToClipboard(teacher.phone, `t_phone_${teacher.id}`)}
                                    className="text-slate-400 hover:text-slate-600"
                                    title="نسخ"
                                  >
                                    {copiedKey === `t_phone_${teacher.id}` ? <CheckCheck size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                  </button>
                                </div>
                                {teacher.whatsapp_phone && (
                                  <div className="flex items-center gap-1 text-[11px]">
                                    <span className="text-slate-500">واتساب: {teacher.whatsapp_phone}</span>
                                    <a
                                      href={getDirectWhatsAppUrl(teacher.whatsapp_phone, `مرحباً بحضرتك يا ${teacher.nickname || teacher.full_name}`)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-emerald-600 hover:text-emerald-700"
                                    >
                                      <MessageCircle size={12} />
                                    </a>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Date */}
                            <td className="py-3 px-3">
                              <span className="text-xs text-slate-600 block">
                                {formatArabicDateTime(teacher.created_at)}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-3 text-center">
                              {teacher.status === 'approved' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 size={11} />
                                  <span>معتمد</span>
                                </span>
                              ) : teacher.status === 'rejected' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  <XCircle size={11} />
                                  <span>مرفوض</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  <Clock size={11} />
                                  <span>مراجعة</span>
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setSelectedTeacher(teacher)}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                  title="عرض التفاصيل"
                                >
                                  <Eye size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => printTeacherApplication(teacher)}
                                  className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors cursor-pointer"
                                  title="طباعة الاستمارة"
                                >
                                  <Printer size={14} />
                                </button>
                                {teacher.status !== 'approved' && (
                                  <button
                                    type="button"
                                    disabled={updatingId === teacher.id}
                                    onClick={() => handleUpdateStatus('teacher', teacher.id, 'approved')}
                                    className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                                    title="اعتماد"
                                  >
                                    <CheckCircle2 size={14} />
                                  </button>
                                )}
                                {teacher.status !== 'rejected' && (
                                  <button
                                    type="button"
                                    disabled={updatingId === teacher.id}
                                    onClick={() => handleUpdateStatus('teacher', teacher.id, 'rejected')}
                                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                                    title="رفض"
                                  >
                                    <XCircle size={14} />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  disabled={updatingId === teacher.id}
                                  onClick={() => handleDeleteRecord('teacher', teacher.id, teacher.full_name)}
                                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                  title="حذف"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    : paginatedList.map((student) => {
                        const isSelected = selectedIds.includes(student.id);

                        return (
                          <tr key={student.id} className={`hover:bg-slate-50/70 transition-colors ${isSelected ? 'bg-sky-50/30' : ''}`}>
                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleSelect(student.id)}
                                className="text-slate-400 hover:text-slate-700 cursor-pointer"
                              >
                                {isSelected ? <CheckSquare size={16} className="text-sky-600" /> : <Square size={16} />}
                              </button>
                            </td>

                            {/* Student Info */}
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2.5">
                                <div 
                                  onClick={() => student.photo_url ? setPreviewImage({ url: student.photo_url, title: student.full_name }) : setSelectedStudent(student)}
                                  className="w-10 h-10 rounded-xl overflow-hidden bg-sky-50 border border-sky-200 shrink-0 cursor-pointer"
                                  title="اضغط للتكبير"
                                >
                                  {student.photo_url ? (
                                    <img src={student.photo_url} alt={student.full_name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-sky-500">
                                      <User size={18} />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <span 
                                    onClick={() => setSelectedStudent(student)}
                                    className="font-bold text-slate-800 hover:text-sky-600 cursor-pointer block leading-tight"
                                  >
                                    {student.full_name}
                                  </span>
                                  <span className="text-[11px] font-mono text-slate-400 block">{student.national_id || 'غير مسجل'}</span>
                                </div>
                              </div>
                            </td>

                            {/* Grade & Education Type */}
                            <td className="py-3 px-3">
                              <span className="font-bold text-slate-800 block text-xs">{student.academic_grade}</span>
                              <span className="text-[11px] text-sky-700 bg-sky-50 px-2 py-0.2 rounded font-semibold inline-block mt-0.5 border border-sky-200/60">
                                {student.education_type}
                              </span>
                            </td>

                            {/* School & Address */}
                            <td className="py-3 px-3">
                              <span className="text-slate-800 text-xs font-semibold block">{student.school_name || 'غير مسجل'}</span>
                              <span className="text-[11px] text-slate-400 block truncate max-w-[170px]">
                                {student.address || 'غير مسجل'}
                              </span>
                            </td>

                            {/* Contacts */}
                            <td className="py-3 px-3">
                              <div className="space-y-0.5 text-xs font-mono">
                                <div className="flex items-center gap-1 font-bold text-slate-800">
                                  <span>{student.phone}</span>
                                  <a
                                    href={getDirectWhatsAppUrl(student.phone, `أهلاً بك يا ${student.full_name}`)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-emerald-600 hover:text-emerald-700"
                                  >
                                    <MessageCircle size={12} />
                                  </a>
                                </div>
                                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                                  <span>ولي الأمر: {student.father_phone}</span>
                                  <a
                                    href={getDirectWhatsAppUrl(student.father_phone, `السلام عليكم بخصوص الطالب ${student.full_name}`)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-emerald-600 hover:text-emerald-700"
                                  >
                                    <MessageCircle size={12} />
                                  </a>
                                </div>
                              </div>
                            </td>

                            {/* Date */}
                            <td className="py-3 px-3">
                              <span className="text-xs text-slate-600 block">
                                {formatArabicDateTime(student.created_at)}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-3 text-center">
                              {student.status === 'approved' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 size={11} />
                                  <span>معتمد</span>
                                </span>
                              ) : student.status === 'rejected' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  <XCircle size={11} />
                                  <span>مرفوض</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  <Clock size={11} />
                                  <span>مراجعة</span>
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setSelectedStudent(student)}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                  title="عرض التفاصيل"
                                >
                                  <Eye size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => printStudentApplication(student)}
                                  className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 transition-colors cursor-pointer"
                                  title="طباعة"
                                >
                                  <Printer size={14} />
                                </button>
                                {student.status !== 'approved' && (
                                  <button
                                    type="button"
                                    disabled={updatingId === student.id}
                                    onClick={() => handleUpdateStatus('student', student.id, 'approved')}
                                    className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                                    title="اعتماد"
                                  >
                                    <CheckCircle2 size={14} />
                                  </button>
                                )}
                                {student.status !== 'rejected' && (
                                  <button
                                    type="button"
                                    disabled={updatingId === student.id}
                                    onClick={() => handleUpdateStatus('student', student.id, 'rejected')}
                                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                                    title="رفض"
                                  >
                                    <XCircle size={14} />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  disabled={updatingId === student.id}
                                  onClick={() => handleDeleteRecord('student', student.id, student.full_name)}
                                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                  title="حذف"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ============================================================
              MOBILE / CARDS VIEW
              ============================================================ */}
          <div className={`${viewMode === 'cards' ? 'grid' : 'grid md:hidden'} grid-cols-1 sm:grid-cols-2 gap-3.5`}>
            {activeTab === 'teachers'
              ? paginatedList.map((teacher) => {
                  const groups = parseGroupsData(teacher);
                  const specs = (teacher.specialization || '').split(/[،,]/).map((s) => s.trim()).filter(Boolean);
                  const isSelected = selectedIds.includes(teacher.id);

                  return (
                    <div 
                      key={teacher.id}
                      className={`bg-white rounded-2xl p-4 border transition-all shadow-xs flex flex-col justify-between space-y-3 text-right ${
                        isSelected ? 'border-sky-500 ring-2 ring-sky-100' : 'border-slate-200/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleToggleSelect(teacher.id)}
                            className="text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            {isSelected ? <CheckSquare size={16} className="text-sky-600" /> : <Square size={16} />}
                          </button>

                          <div 
                            onClick={() => teacher.photo_url ? setPreviewImage({ url: teacher.photo_url, title: teacher.full_name }) : setSelectedTeacher(teacher)}
                            className="w-10 h-10 rounded-xl overflow-hidden bg-rose-50 border border-rose-200 shrink-0 cursor-pointer"
                          >
                            {teacher.photo_url ? (
                              <img src={teacher.photo_url} alt={teacher.full_name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-rose-500">
                                <GraduationCap size={18} />
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 
                              onClick={() => setSelectedTeacher(teacher)}
                              className="font-bold text-slate-800 text-xs sm:text-sm hover:text-rose-600 cursor-pointer"
                            >
                              {teacher.nickname ? `${teacher.nickname}` : teacher.full_name}
                            </h4>
                            <p className="text-[11px] text-slate-500">{teacher.full_name}</p>
                          </div>
                        </div>

                        <div>
                          {teacher.status === 'approved' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={10} />
                              <span>معتمد</span>
                            </span>
                          ) : teacher.status === 'rejected' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle size={10} />
                              <span>مرفوض</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <Clock size={10} />
                              <span>مراجعة</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Specialization Tags */}
                      <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-100">
                        {specs.map((s, idx) => (
                          <span key={idx} className="bg-rose-50 text-rose-800 text-[10px] font-bold px-2 py-0.2 rounded border border-rose-200/60">
                            {s}
                          </span>
                        ))}
                      </div>

                      {/* Groups highlight */}
                      {groups.length > 0 && (
                        <div className="p-2 rounded-xl bg-purple-50/70 border border-purple-100 text-[11px] space-y-1">
                          <span className="font-bold text-purple-900 block">المواعيد ({groups.length}):</span>
                          {groups.slice(0, 2).map((grp, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white p-1 rounded border border-purple-100">
                              <span className="font-bold text-purple-950">{grp.day}: {formatTime12H(grp.start_time)}</span>
                              <span className="text-[10px] font-bold text-purple-800 bg-purple-100 px-1 py-0.2 rounded">{grp.subject}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Contacts & Quick Actions */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                        <span className="font-mono font-bold text-slate-800">{teacher.phone}</span>
                        {teacher.whatsapp_phone && (
                          <a
                            href={getDirectWhatsAppUrl(teacher.whatsapp_phone, `مرحباً بحضرتك يا ${teacher.nickname || teacher.full_name}`)}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px] font-semibold flex items-center gap-1"
                          >
                            <MessageCircle size={11} />
                            <span>واتساب</span>
                          </a>
                        )}
                      </div>

                      {/* Card Footer Buttons */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedTeacher(teacher)}
                          className="flex-1 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                        >
                          <Eye size={13} />
                          <span>التفاصيل</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => printTeacherApplication(teacher)}
                          className="p-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors"
                          title="طباعة"
                        >
                          <Printer size={14} />
                        </button>
                        {teacher.status !== 'approved' && (
                          <button
                            type="button"
                            disabled={updatingId === teacher.id}
                            onClick={() => handleUpdateStatus('teacher', teacher.id, 'approved')}
                            className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                            title="اعتماد"
                          >
                            <CheckCircle2 size={14} />
                          </button>
                        )}
                        {teacher.status !== 'rejected' && (
                          <button
                            type="button"
                            disabled={updatingId === teacher.id}
                            onClick={() => handleUpdateStatus('teacher', teacher.id, 'rejected')}
                            className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors"
                            title="رفض"
                          >
                            <XCircle size={14} />
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={updatingId === teacher.id}
                          onClick={() => handleDeleteRecord('teacher', teacher.id, teacher.full_name)}
                          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition-colors"
                          title="حذف"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              : paginatedList.map((student) => {
                  const isSelected = selectedIds.includes(student.id);

                  return (
                    <div 
                      key={student.id}
                      className={`bg-white rounded-2xl p-4 border transition-all shadow-xs flex flex-col justify-between space-y-3 text-right ${
                        isSelected ? 'border-sky-500 ring-2 ring-sky-100' : 'border-slate-200/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleToggleSelect(student.id)}
                            className="text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            {isSelected ? <CheckSquare size={16} className="text-sky-600" /> : <Square size={16} />}
                          </button>

                          <div 
                            onClick={() => student.photo_url ? setPreviewImage({ url: student.photo_url, title: student.full_name }) : setSelectedStudent(student)}
                            className="w-10 h-10 rounded-xl overflow-hidden bg-sky-50 border border-sky-200 shrink-0 cursor-pointer"
                          >
                            {student.photo_url ? (
                              <img src={student.photo_url} alt={student.full_name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-sky-500">
                                <User size={18} />
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 
                              onClick={() => setSelectedStudent(student)}
                              className="font-bold text-slate-800 text-xs sm:text-sm hover:text-sky-600 cursor-pointer"
                            >
                              {student.full_name}
                            </h4>
                            <p className="text-[11px] text-slate-500">{student.academic_grade} ({student.education_type})</p>
                          </div>
                        </div>

                        <div>
                          {student.status === 'approved' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={10} />
                              <span>معتمد</span>
                            </span>
                          ) : student.status === 'rejected' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle size={10} />
                              <span>مرفوض</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <Clock size={10} />
                              <span>مراجعة</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Contacts */}
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 text-[11px]">الطالب:</span>
                          <span className="font-mono font-bold text-slate-800">{student.phone}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 text-[11px]">ولي الأمر:</span>
                          <span className="font-mono font-bold text-slate-800">{student.father_phone}</span>
                        </div>
                      </div>

                      {/* Card Footer Buttons */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedStudent(student)}
                          className="flex-1 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                        >
                          <Eye size={13} />
                          <span>التفاصيل</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => printStudentApplication(student)}
                          className="p-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 transition-colors"
                          title="طباعة"
                        >
                          <Printer size={14} />
                        </button>
                        {student.status !== 'approved' && (
                          <button
                            type="button"
                            disabled={updatingId === student.id}
                            onClick={() => handleUpdateStatus('student', student.id, 'approved')}
                            className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                            title="اعتماد"
                          >
                            <CheckCircle2 size={14} />
                          </button>
                        )}
                        {student.status !== 'rejected' && (
                          <button
                            type="button"
                            disabled={updatingId === student.id}
                            onClick={() => handleUpdateStatus('student', student.id, 'rejected')}
                            className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors"
                            title="رفض"
                          >
                            <XCircle size={14} />
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={updatingId === student.id}
                          onClick={() => handleDeleteRecord('student', student.id, student.full_name)}
                          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition-colors"
                          title="حذف"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
          </div>

          {/* ============================================================
              PAGINATION BAR
              ============================================================ */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-3 sm:p-4 border border-slate-200 rounded-2xl bg-white shadow-2xs gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <p>
                عرض <span className="font-bold text-slate-800 font-mono">{totalItems === 0 ? 0 : startIndex + 1} - {endIndex}</span> من أصل <span className="font-bold text-slate-800 font-mono">{totalItems}</span>
              </p>
              {totalPages > 1 && (
                <span className="text-slate-400">
                  (صفحة <span className="font-bold text-slate-700">{safeCurrentPage}</span> من <span className="font-bold text-slate-700">{totalPages}</span>)
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage <= 1}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="السابق"
              >
                <ChevronRight size={14} />
                <span>السابق</span>
              </button>

              {/* Page Number Buttons */}
              {totalPages > 1 && (
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
                        onClick={() => setCurrentPage(p)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          safeCurrentPage === p
                            ? 'bg-slate-800 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              )}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage >= totalPages}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="التالي"
              >
                <span>التالي</span>
                <ChevronLeft size={14} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* ============================================================
          FLOATING BATCH ACTIONS BAR (When 1+ Selected)
          ============================================================ */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-800 flex items-center justify-between gap-3 max-w-lg w-[92%] animate-fade-in-up">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-xs">
              {selectedIds.length}
            </span>
            <span className="text-xs font-semibold">محدد {selectedIds.length} طلب</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isBatchUpdating}
              onClick={() => handleBatchStatusUpdate('approved')}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <CheckCircle2 size={13} />
              <span>اعتماد</span>
            </button>

            <button
              type="button"
              disabled={isBatchUpdating}
              onClick={() => handleBatchStatusUpdate('rejected')}
              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <XCircle size={13} />
              <span>رفض</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
          STUDENT DETAILS MODAL
          ============================================================ */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl border border-slate-200 flex flex-col text-right">
            
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div 
                  onClick={() => selectedStudent.photo_url && setPreviewImage({ url: selectedStudent.photo_url, title: selectedStudent.full_name })}
                  className="w-12 h-12 rounded-xl overflow-hidden bg-sky-50 border border-sky-300 shrink-0 cursor-pointer"
                  title="اضغط للتكبير"
                >
                  {selectedStudent.photo_url ? (
                    <img src={selectedStudent.photo_url} alt={selectedStudent.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sky-600 font-bold">
                      <User size={24} />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">{selectedStudent.full_name}</h3>
                  <span className="text-xs text-slate-500 font-mono">كود: {selectedStudent.id.slice(0, 8).toUpperCase()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => printStudentApplication(selectedStudent)}
                  className="p-1.5 px-2.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Printer size={14} />
                  <span>طباعة</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-xs">الرقم القومي:</span>
                  <span className="font-bold font-mono text-slate-800">{selectedStudent.national_id || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">الصف الدراسي والتعليم:</span>
                  <span className="font-bold text-slate-800">{selectedStudent.academic_grade} ({selectedStudent.education_type})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">هاتف الطالب:</span>
                  <span className="font-bold font-mono text-slate-800">{selectedStudent.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">هاتف ولي الأمر:</span>
                  <span className="font-bold font-mono text-slate-800">{selectedStudent.father_phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">المدرسة:</span>
                  <span className="font-bold text-slate-800">{selectedStudent.school_name || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">تاريخ التسجيل:</span>
                  <span className="font-bold text-slate-800">{formatArabicDateTime(selectedStudent.created_at)}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block text-xs">العنوان:</span>
                  <span className="font-bold text-slate-800">{selectedStudent.address || '—'}</span>
                </div>
              </div>

              {selectedStudent.notes && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <span className="font-bold text-slate-700 block mb-1">ملاحظات:</span>
                  <p className="text-slate-600 whitespace-pre-line">{selectedStudent.notes}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {selectedStudent.status !== 'approved' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('student', selectedStudent.id, 'approved')}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <CheckCircle2 size={14} />
                    <span>اعتماد الطالب</span>
                  </button>
                )}
                {selectedStudent.status !== 'rejected' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('student', selectedStudent.id, 'rejected')}
                    className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <XCircle size={14} />
                    <span>رفض الطلب</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs cursor-pointer"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================
          TEACHER DETAILS MODAL
          ============================================================ */}
      {selectedTeacher && (() => {
        const groups = parseGroupsData(selectedTeacher);
        const assistants = parseAssistantsData(selectedTeacher);
        const specs = (selectedTeacher.specialization || '').split(/[،,]/).map((s) => s.trim()).filter(Boolean);

        return (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-xl border border-slate-200 flex flex-col text-right">
              
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div 
                    onClick={() => selectedTeacher.photo_url && setPreviewImage({ url: selectedTeacher.photo_url, title: selectedTeacher.full_name })}
                    className="w-12 h-12 rounded-xl overflow-hidden bg-rose-50 border border-rose-300 shrink-0 cursor-pointer"
                    title="اضغط للتكبير"
                  >
                    {selectedTeacher.photo_url ? (
                      <img src={selectedTeacher.photo_url} alt={selectedTeacher.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-rose-600 font-bold">
                        <GraduationCap size={24} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      {selectedTeacher.nickname ? `${selectedTeacher.nickname}` : selectedTeacher.full_name}
                    </h3>
                    <span className="text-xs text-slate-500">{selectedTeacher.full_name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => printTeacherApplication(selectedTeacher)}
                    className="p-1.5 px-2.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Printer size={14} />
                    <span>طباعة</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTeacher(null)}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-xs">الهاتف الشخصي:</span>
                    <span className="font-bold font-mono text-slate-800">{selectedTeacher.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">هاتف الواتساب:</span>
                    <span className="font-bold font-mono text-slate-800">{selectedTeacher.whatsapp_phone || selectedTeacher.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">الرقم القومي:</span>
                    <span className="font-bold font-mono text-slate-800">{selectedTeacher.national_id || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">كود الطلب:</span>
                    <span className="font-mono font-bold text-slate-700">{selectedTeacher.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-xs mb-1">المواد والتخصصات:</span>
                    <div className="flex flex-wrap gap-1">
                      {specs.map((s, idx) => (
                        <span key={idx} className="bg-rose-50 text-rose-800 font-bold px-2 py-0.5 rounded text-xs border border-rose-200/60">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Groups Matrix */}
                <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-950">جدول الحصص والمجموعات المقترحة لكل مادة:</span>
                    <span className="text-[11px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full">{groups.length} مجموعات</span>
                  </div>
                  {groups.length > 0 ? (
                    <div className="space-y-1.5">
                      {groups.map((grp, idx) => (
                        <div key={idx} className="flex flex-wrap items-center justify-between gap-2 p-2 bg-white rounded-lg border border-purple-100">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-[10px]">{idx + 1}</span>
                            <span className="font-bold text-purple-950">{grp.day}</span>
                            <span className="text-slate-500 font-mono">({formatTime12H(grp.start_time)} إلى {formatTime12H(grp.end_time)})</span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[11px]">
                            مادة: {grp.subject}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400">لا توجد مواعيد مسجلة</p>
                  )}
                </div>

                {/* Assistants */}
                {assistants.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200 text-xs space-y-1.5">
                    <span className="font-bold text-amber-950 block">فريق السكرتارية والمساعدين:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {assistants.map((asst, idx) => (
                        <div key={idx} className="p-2 bg-white rounded-lg border border-amber-100 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-800 block">{asst.name}</span>
                            <span className="font-mono text-slate-500 text-[11px]">{asst.phone}</span>
                          </div>
                          {asst.phone && (
                            <a
                              href={getDirectWhatsAppUrl(asst.phone, `السلام عليكم أ/ ${asst.name}`)}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px] font-semibold"
                            >
                              واتساب
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Socials & Bio */}
                {selectedTeacher.bio && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <span className="font-bold text-slate-700 block mb-1">النبذة التعريفية:</span>
                    <p className="text-slate-600 whitespace-pre-line">{selectedTeacher.bio}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {selectedTeacher.status !== 'approved' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus('teacher', selectedTeacher.id, 'approved')}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <CheckCircle2 size={14} />
                      <span>اعتماد المعلم</span>
                    </button>
                  )}
                  {selectedTeacher.status !== 'rejected' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus('teacher', selectedTeacher.id, 'rejected')}
                      className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <XCircle size={14} />
                      <span>رفض الطلب</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTeacher(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs cursor-pointer"
                >
                  إغلاق
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ============================================================
          LIGHTBOX IMAGE PREVIEW MODAL
          ============================================================ */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-4 max-w-lg w-full shadow-2xl border border-slate-200 text-center relative"
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800">{previewImage.title}</span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[65vh] overflow-hidden rounded-xl flex items-center justify-center bg-slate-50">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[65vh] w-auto object-contain rounded-xl"
              />
            </div>

            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-end">
              <a
                href={previewImage.url}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-bold flex items-center gap-1"
              >
                <ExternalLink size={13} />
                <span>فتح في تبويب جديد</span>
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
