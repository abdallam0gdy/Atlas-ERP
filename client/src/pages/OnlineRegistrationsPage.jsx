import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import {
  Users,
  GraduationCap,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Phone,
  MessageCircle,
  Eye,
  Trash2,
  RefreshCw,
  Printer,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Layers,
  BookOpen,
  MapPin,
  Fingerprint,
  UserCheck,
  User,
  School,
  Briefcase,
  AlertCircle,
  Sparkles,
  Download,
  Info,
  Maximize2,
  Tag,
  Check,
  X,
  FileText,
  LayoutGrid,
  Table as TableIcon,
  RotateCcw,
  SlidersHorizontal,
  Copy,
  CheckCheck,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Share2
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
  const [activeTab, setActiveTab] = useState('teachers'); // 'students' | 'teachers'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'

  // Data states
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [gradeFilter, setGradeFilter] = useState('all');
  const [educationTypeFilter, setEducationTypeFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [dayFilter, setDayFilter] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Pagination states
  const [pageSize, setPageSize] = useState(25); // 10, 20, 25, 50, 100
  const [currentPage, setCurrentPage] = useState(1);

  // Multi-Selection State for Batch Actions
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBatchUpdating, setIsBatchUpdating] = useState(false);

  // Selected item for modal
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [modalActiveTab, setModalActiveTab] = useState('overview'); // for internal modal tabs

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
  }, [activeTab, searchQuery, statusFilter, gradeFilter, educationTypeFilter, genderFilter, subjectFilter, dayFilter, pageSize]);

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
        toast.error('تعذر جلب طلبات الطلاب من السيرفر السحابي');
      } else {
        setStudents(studentsRes.data || []);
      }

      if (teachersRes.error) {
        console.error('Error fetching teachers:', teachersRes.error);
        toast.error('تعذر جلب طلبات المعلمين من السيرفر السحابي');
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
          ? 'تم اعتماد وقبول الطلب بنجاح' 
          : newStatus === 'rejected' 
          ? 'تم رفض الطلب' 
          : 'تم إرجاع الطلب لقيد المراجعة'
      );

      // Update state locally
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
      toast.error('فشل تحديث حالة الطلب، تأكد من الاتصال وصلاحيات السيرفر');
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

      toast.success(`تم تحديث حالة ${count} طلب بنجاح إلى "${newStatus === 'approved' ? 'معتمد' : newStatus === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}"`);

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

  // Collect All Unique Teacher Subjects
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
      if (educationTypeFilter !== 'all' && item.education_type !== educationTypeFilter) return false;
      if (genderFilter !== 'all' && item.gender !== genderFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.full_name?.toLowerCase().includes(q);
        const matchesPhone = item.phone?.includes(q);
        const matchesFather = item.father_phone?.includes(q);
        const matchesMother = item.mother_phone?.includes(q);
        const matchesNid = item.national_id?.includes(q);
        const matchesSchool = item.school_name?.toLowerCase().includes(q);
        const matchesAddress = item.address?.toLowerCase().includes(q);
        const matchesNotes = item.notes?.toLowerCase().includes(q);
        return matchesName || matchesPhone || matchesFather || matchesMother || matchesNid || matchesSchool || matchesAddress || matchesNotes;
      }

      return true;
    });
  }, [students, statusFilter, gradeFilter, educationTypeFilter, genderFilter, searchQuery]);

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
        const matchesGrades = item.target_grades?.toLowerCase().includes(q);
        const matchesBio = item.bio?.toLowerCase().includes(q);
        const matchesGroup = groups.some(
          (g) => g.subject?.toLowerCase().includes(q) || g.day?.includes(q) || g.grade?.toLowerCase().includes(q)
        );
        const assistants = parseAssistantsData(item);
        const matchesAssistant = assistants.some(
          (a) => a.name?.toLowerCase().includes(q) || a.phone?.includes(q)
        );

        return matchesName || matchesNick || matchesPhone || matchesWhatsapp || matchesNid || matchesSpec || matchesGrades || matchesBio || matchesGroup || matchesAssistant;
      }

      return true;
    });
  }, [teachers, statusFilter, subjectFilter, dayFilter, gradeFilter, searchQuery]);

  // Current active list & pagination calculations
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
    const studentRejected = students.filter((s) => s.status === 'rejected').length;

    const teacherPending = teachers.filter((t) => t.status === 'pending').length;
    const teacherApproved = teachers.filter((t) => t.status === 'approved').length;
    const teacherRejected = teachers.filter((t) => t.status === 'rejected').length;

    let totalGroups = 0;
    teachers.forEach((t) => {
      totalGroups += parseGroupsData(t).length;
    });

    return {
      totalStudents: students.length,
      studentPending,
      studentApproved,
      studentRejected,
      totalTeachers: teachers.length,
      teacherPending,
      teacherApproved,
      teacherRejected,
      totalGroups,
      totalApproved: studentApproved + teacherApproved,
      totalPending: studentPending + teacherPending,
    };
  }, [students, teachers]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (gradeFilter !== 'all') count++;
    if (educationTypeFilter !== 'all') count++;
    if (genderFilter !== 'all') count++;
    if (subjectFilter !== 'all') count++;
    if (dayFilter !== 'all') count++;
    return count;
  }, [gradeFilter, educationTypeFilter, genderFilter, subjectFilter, dayFilter]);

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || activeFiltersCount > 0;

  const resetAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setGradeFilter('all');
    setEducationTypeFilter('all');
    setGenderFilter('all');
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

  // CSV Export Engine with UTF-8 BOM for Arabic Excel Support
  const exportToCSV = (type, listToExport) => {
    const dataList = listToExport && listToExport.length > 0 ? listToExport : activeList;
    if (!dataList || dataList.length === 0) {
      toast.error('لا توجد بيانات مطابقة لتصديرها');
      return;
    }

    let headers = [];
    let rows = [];

    if (type === 'students') {
      headers = [
        'كود الطالب',
        'اسم الطالب',
        'الرقم القومي',
        'هاتف الطالب',
        'هاتف ولي الأمر',
        'الصف الدراسي',
        'نوع التعليم',
        'المدرسة',
        'النوع',
        'العنوان',
        'الحالة',
        'تاريخ التسجيل'
      ];

      rows = dataList.map((s) => [
        s.id.slice(0, 8).toUpperCase(),
        `"${(s.full_name || '').replace(/"/g, '""')}"`,
        `'${s.national_id || ''}`,
        `'${s.phone || ''}`,
        `'${s.father_phone || ''}`,
        `"${s.academic_grade || ''}"`,
        `"${s.education_type || ''}"`,
        `"${(s.school_name || '').replace(/"/g, '""')}"`,
        s.gender === 'female' ? 'أنثى' : 'ذكر',
        `"${(s.address || '').replace(/"/g, '""')}"`,
        s.status === 'approved' ? 'معتمد' : s.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة',
        s.created_at ? new Date(s.created_at).toLocaleDateString('ar-EG') : ''
      ]);
    } else {
      headers = [
        'كود المعلم',
        'الاسم الرسمي',
        'اسم الشهرة',
        'الرقم القومي',
        'الهاتف الشخصي',
        'هاتف الواتساب',
        'المواد التخصصية',
        'المراحل المستهدفة',
        'عدد المجموعات المقترحة',
        'فريق السكرتارية',
        'الحالة',
        'تاريخ التقديم'
      ];

      rows = dataList.map((t) => {
        const groups = parseGroupsData(t);
        const assistants = parseAssistantsData(t);
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
          `"${assistants.map((a) => a.name).join('، ')}"`,
          t.status === 'approved' ? 'معتمد' : t.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة',
          t.created_at ? new Date(t.created_at).toLocaleDateString('ar-EG') : ''
        ];
      });
    }

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${type === 'students' ? 'كشف_طلبات_الطلاب' : 'كشف_طلبات_المعلمين'}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
          .title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; }
          .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px; font-size: 13px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; }
          .label { font-size: 11px; color: #64748b; display: block; margin-bottom: 3px; }
          .val { font-weight: bold; color: #0f172a; }
          .table-title { font-size: 15px; font-weight: bold; margin: 20px 0 10px; color: #334155; border-right: 4px solid #7c3aed; padding-right: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: right; }
          th { background: #f1f5f9; color: #334155; font-weight: bold; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; background: #ede9fe; color: #6d28d9; }
          .footer { margin-top: 35px; border-top: 1px dashed #cbd5e1; padding-top: 15px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; }
          @media print { body { padding: 15px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">أكاديمية أطلس التعليمية — استمارة انضمام معلّم</h1>
            <div class="subtitle">رقم الطلب المرجعي: ${teacher.id.slice(0, 8).toUpperCase()} • تاريخ التقديم: ${formatArabicDateTime(teacher.created_at)}</div>
          </div>
          ${teacher.photo_url ? `<img src="${teacher.photo_url}" style="width:70px;height:70px;border-radius:10px;object-fit:cover;" />` : ''}
        </div>

        <div class="grid">
          <div class="card">
            <span class="label">اسم المعلم الرسمي:</span>
            <span class="val">${teacher.full_name}</span>
          </div>
          <div class="card">
            <span class="label">اسم الشهرة / اللقب:</span>
            <span class="val">${teacher.nickname || 'غير محدد'}</span>
          </div>
          <div class="card">
            <span class="label">المواد والتخصصات:</span>
            <span class="val">${teacher.specialization || 'غير محدد'}</span>
          </div>
          <div class="card">
            <span class="label">رقم الهاتف الشخصي:</span>
            <span class="val" dir="ltr">${teacher.phone}</span>
          </div>
          <div class="card">
            <span class="label">رقم هاتف الواتساب:</span>
            <span class="val" dir="ltr">${teacher.whatsapp_phone || teacher.phone}</span>
          </div>
          <div class="card">
            <span class="label">الرقم القومي:</span>
            <span class="val" dir="ltr">${teacher.national_id || 'غير مسجل'}</span>
          </div>
          <div class="card">
            <span class="label">المراحل والصفوف المستهدفة:</span>
            <span class="val">${teacher.target_grades || 'غير محدد'}</span>
          </div>
        </div>

        <div class="table-title">جدول الحصص والمجموعات المقترحة (مادة كل مجموعة ومواعيدها)</div>
        ${groups.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>مادة المجموعة</th>
                <th>الصف الدراسي</th>
                <th>اليوم</th>
                <th>التوقيت</th>
                <th>مدة الحصة</th>
              </tr>
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
        ` : '<p style="font-size:12px;color:#64748b">لا توجد مواعيد محددة مسجلة</p>'}

        <div class="table-title">فريق العمل والسكرتارية (المساعدين)</div>
        ${assistants.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>اسم المساعد / السكرتير</th>
                <th>رقم هاتف المساعد</th>
              </tr>
            </thead>
            <tbody>
              ${assistants.map((a, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${a.name}</td>
                  <td dir="ltr">${a.phone}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p style="font-size:12px;color:#64748b">إدارة شخصية بدون سكرتارية</p>'}

        ${teacher.notes ? `
          <div class="table-title">ملاحظات ومتطلبات خاصة بالقاعات</div>
          <div class="card" style="font-size:12px;">${teacher.notes}</div>
        ` : ''}

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
          .title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; }
          .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px; font-size: 13px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; }
          .label { font-size: 11px; color: #64748b; display: block; margin-bottom: 3px; }
          .val { font-weight: bold; color: #0f172a; }
          .full-width { grid-column: span 2; }
          .footer { margin-top: 35px; border-top: 1px dashed #cbd5e1; padding-top: 15px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; }
          @media print { body { padding: 15px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">أكاديمية أطلس التعليمية — استمارة قيد وتسجيل طالب</h1>
            <div class="subtitle">رقم الطلب المرجعي: ${student.id.slice(0, 8).toUpperCase()} • تاريخ التسجيل: ${formatArabicDateTime(student.created_at)}</div>
          </div>
          ${student.photo_url ? `<img src="${student.photo_url}" style="width:70px;height:70px;border-radius:10px;object-fit:cover;" />` : ''}
        </div>

        <div class="grid">
          <div class="card">
            <span class="label">اسم الطالب رباعي:</span>
            <span class="val">${student.full_name}</span>
          </div>
          <div class="card">
            <span class="label">الصف الدراسي ونوع التعليم:</span>
            <span class="val">${student.academic_grade} (${student.education_type})</span>
          </div>
          <div class="card">
            <span class="label">هاتف الطالب:</span>
            <span class="val" dir="ltr">${student.phone}</span>
          </div>
          <div class="card">
            <span class="label">هاتف ولي الأمر (الأب):</span>
            <span class="val" dir="ltr">${student.father_phone}</span>
          </div>
          <div class="card">
            <span class="label">هاتف والدة الطالب:</span>
            <span class="val" dir="ltr">${student.mother_phone || 'غير مسجل'}</span>
          </div>
          <div class="card">
            <span class="label">مهنة / وظيفة ولي الأمر:</span>
            <span class="val">${student.parent_job || 'غير مسجل'}</span>
          </div>
          <div class="card">
            <span class="label">الرقم القومي:</span>
            <span class="val" dir="ltr">${student.national_id || 'غير متوفر'}</span>
          </div>
          <div class="card">
            <span class="label">تاريخ الميلاد والنوع:</span>
            <span class="val">${student.birth_date || 'غير محدد'} (${student.gender === 'female' ? 'أنثى' : 'ذكر'})</span>
          </div>
          <div class="card">
            <span class="label">المدرسة الحالية:</span>
            <span class="val">${student.school_name || 'غير مسجل'}</span>
          </div>
          <div class="card">
            <span class="label">العنوان بالتفصيل:</span>
            <span class="val">${student.address || 'غير مسجل'}</span>
          </div>
          ${student.notes ? `
            <div class="card full-width">
              <span class="label">ملاحظات الطالب والرغبات:</span>
              <span class="val">${student.notes}</span>
            </div>
          ` : ''}
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
    <div className="space-y-6 pb-20 animate-fade-in font-sans" dir="rtl">
      
      {/* ============================================================
          TOP HERO HEADER & FAST GLOBAL ACTIONS
          ============================================================ */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-sky-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
              <span>البوابة السحابية الموحدة • مزامنة حية (Live Supabase Sync)</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              <span>إدارة طلبات التسجيل الإلكتروني</span>
              <span className="text-xs sm:text-sm font-bold bg-white/15 px-3 py-1 rounded-xl text-slate-200">
                {activeTab === 'teachers' ? 'المعلمين' : 'الطلاب'}
              </span>
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              مراجعة وتدقيق استمارات الطلاب والمعلمين المقدمة إلكترونياً، تنسيق مواعيد الحصص ومادة كل مجموعة، واعتماد انضمامهم لنظام أطلس التعليمي.
            </p>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-white/10 backdrop-blur-md p-1 rounded-2xl border border-white/15">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-300 hover:text-white'
                }`}
                title="عرض في جدول بيانات تفصيلي"
              >
                <TableIcon size={15} />
                <span>جدول</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-300 hover:text-white'
                }`}
                title="عرض بطاقات مرنة للموبايل"
              >
                <LayoutGrid size={15} />
                <span>بطاقات</span>
              </button>
            </div>

            {/* Refresh Data */}
            <button
              onClick={fetchData}
              disabled={isRefreshing}
              className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border border-white/15 transition-all cursor-pointer disabled:opacity-50"
              title="تحديث البيانات فورياً"
            >
              <RefreshCw size={15} className={isRefreshing ? 'animate-spin text-sky-400' : ''} />
              <span className="hidden sm:inline">تحديث فوري</span>
            </button>

            {/* Export CSV / Excel */}
            <button
              onClick={() => exportToCSV(activeTab, activeList)}
              className="px-4 py-2 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/30 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer"
              title="تصدير الكشف الحالي إلى ملف Excel / CSV"
            >
              <FileSpreadsheet size={16} />
              <span>تصدير Excel</span>
            </button>

            {/* Global Print */}
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-2xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-500/30 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer"
              title="طباعة الكشف المعروض"
            >
              <Printer size={15} />
              <span className="hidden sm:inline">طباعة الكشف</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          INTERACTIVE KPI STATS (Clickable Fast Filter Cards)
          ============================================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Students Card */}
        <div 
          onClick={() => { setActiveTab('students'); setStatusFilter('all'); }}
          className={`group bg-white rounded-3xl p-5 border transition-all cursor-pointer shadow-xs hover:shadow-md ${
            activeTab === 'students' ? 'border-sky-500 ring-2 ring-sky-100 bg-sky-50/20' : 'border-slate-100 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">طلبات الطلاب</span>
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{stats.totalStudents}</span>
            <span className="text-xs text-slate-400 font-semibold">طالب مسجل</span>
          </div>
          <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-100 text-[11px] font-bold">
            <span 
              onClick={(e) => { e.stopPropagation(); setActiveTab('students'); setStatusFilter('pending'); }}
              className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
            >
              {stats.studentPending} قيد المراجعة
            </span>
            <span 
              onClick={(e) => { e.stopPropagation(); setActiveTab('students'); setStatusFilter('approved'); }}
              className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              {stats.studentApproved} معتمد
            </span>
          </div>
        </div>

        {/* Teachers Card */}
        <div 
          onClick={() => { setActiveTab('teachers'); setStatusFilter('all'); }}
          className={`group bg-white rounded-3xl p-5 border transition-all cursor-pointer shadow-xs hover:shadow-md ${
            activeTab === 'teachers' ? 'border-rose-500 ring-2 ring-rose-100 bg-rose-50/20' : 'border-slate-100 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">طلبات انضمام المعلمين</span>
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <GraduationCap size={20} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{stats.totalTeachers}</span>
            <span className="text-xs text-slate-400 font-semibold">معلم متقدم</span>
          </div>
          <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-100 text-[11px] font-bold">
            <span 
              onClick={(e) => { e.stopPropagation(); setActiveTab('teachers'); setStatusFilter('pending'); }}
              className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
            >
              {stats.teacherPending} قيد المراجعة
            </span>
            <span 
              onClick={(e) => { e.stopPropagation(); setActiveTab('teachers'); setStatusFilter('approved'); }}
              className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              {stats.teacherApproved} معتمد
            </span>
          </div>
        </div>

        {/* Total Groups Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">المجموعات المقترحة</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Clock size={20} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-purple-600">{stats.totalGroups}</span>
            <span className="text-xs text-purple-400 font-semibold">مجموعة / ميعاد</span>
          </div>
          <p className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-purple-700 font-bold truncate">
            موزعة بالمواد وتنسيق 12h
          </p>
        </div>

        {/* Pending Review Fast Action Card */}
        <div 
          onClick={() => setStatusFilter('pending')}
          className="group bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-3xl p-5 border border-amber-200/80 shadow-xs cursor-pointer hover:border-amber-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800">بانتظار المراجعة الفورية</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-sm shadow-amber-500/30">
              <AlertCircle size={20} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-900">{stats.totalPending}</span>
            <span className="text-xs text-amber-700 font-semibold">طلب معلق</span>
          </div>
          <p className="mt-3 pt-2.5 border-t border-amber-200/60 text-[11px] font-bold text-amber-800 flex items-center justify-between">
            <span>اضغط لعرض المعلق فقط</span>
            <ChevronLeft size={13} className="group-hover:-translate-x-1 transition-transform" />
          </p>
        </div>
      </div>

      {/* ============================================================
          MAIN SECTION TABS & INTEGRATED FILTER HUB
          ============================================================ */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-5">
        
        {/* Tab Selector & Counts */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center bg-slate-100/80 p-1.5 rounded-2xl max-w-fit">
            <button
              onClick={() => {
                setActiveTab('teachers');
                resetAllFilters();
              }}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'teachers'
                  ? 'bg-white text-rose-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap size={18} />
              <span>استمارات المعلمين والمجموعات</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'teachers' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
              }`}>
                {teachers.length}
              </span>
              {stats.teacherPending > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" title="طلبات جديدة" />
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('students');
                resetAllFilters();
              }}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'students'
                  ? 'bg-white text-sky-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users size={18} />
              <span>استمارات الطلاب</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'students' ? 'bg-sky-100 text-sky-800' : 'bg-slate-200 text-slate-700'
              }`}>
                {students.length}
              </span>
              {stats.studentPending > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500" title="طلبات جديدة" />
              )}
            </button>
          </div>

          {/* Quick Page Size & Total items badge */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500">
              إجمالي النتائج: <span className="font-black text-slate-900 font-mono">{totalItems}</span>
            </span>

            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <span>عرض:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-transparent font-black text-slate-900 outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search Bar & Fast Status Filter Pills */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search size={18} className="absolute right-4 top-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === 'teachers'
                    ? 'بحث باسم المعلم، اللقب، الهاتف، المادة التخصصية، مادة المجموعة، اليوم...'
                    : 'بحث باسم الطالب، رقم هاتف الطالب أو ولي الأمر، الرقم القومي، المدرسة، العنوان...'
                }
                className="w-full pr-11 pl-10 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-slate-50/60 placeholder:text-slate-400 font-medium transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3.5 top-3.5 w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-xs transition-colors"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Advanced Filters Toggle Button */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer shrink-0 w-full md:w-auto ${
                showAdvancedFilters || activeFiltersCount > 0
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal size={16} />
              <span>فلاتر متقدمة</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[11px] flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
              {showAdvancedFilters ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>

            {/* Quick Reset Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="px-4 py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0 w-full md:w-auto"
                title="تفريغ كافة الفلاتر والبحث"
              >
                <RotateCcw size={15} />
                <span>إلغاء الفلترة</span>
              </button>
            )}
          </div>

          {/* Status Tabs Row (All / Pending / Approved / Rejected) */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 ml-1">الحالة:</span>
            
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>الكل</span>
              <span className="text-[11px] font-mono opacity-80">
                ({activeTab === 'teachers' ? teachers.length : students.length})
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60'
              }`}
            >
              <Clock size={13} />
              <span>قيد المراجعة</span>
              <span className="text-[11px] font-mono">
                ({activeTab === 'teachers' ? stats.teacherPending : stats.studentPending})
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                statusFilter === 'approved'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
              }`}
            >
              <CheckCircle2 size={13} />
              <span>معتمد ومقبول</span>
              <span className="text-[11px] font-mono">
                ({activeTab === 'teachers' ? stats.teacherApproved : stats.studentApproved})
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                statusFilter === 'rejected'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200/60'
              }`}
            >
              <XCircle size={13} />
              <span>مرفوض</span>
              <span className="text-[11px] font-mono">
                ({activeTab === 'teachers' ? stats.teacherRejected : stats.studentRejected})
              </span>
            </button>
          </div>

          {/* Advanced Collapsible Filter Row */}
          {showAdvancedFilters && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 animate-fade-in-down grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Teacher-Specific Filters */}
              {activeTab === 'teachers' && (
                <>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">المادة التخصصية:</label>
                    <select
                      value={subjectFilter}
                      onChange={(e) => setSubjectFilter(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-purple-900 bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                      <option value="all">كافة المواد التخصصية</option>
                      {uniqueTeacherSubjects.map((sub) => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">يوم الحصص:</label>
                    <select
                      value={dayFilter}
                      onChange={(e) => setDayFilter(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                      <option value="all">كافة الأيام</option>
                      {ALL_DAYS.map((d) => (
                        <option key={d} value={d}>مجموعات يوم {d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">المرحلة والصف:</label>
                    <select
                      value={gradeFilter}
                      onChange={(e) => setGradeFilter(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-purple-500 outline-none"
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
                </>
              )}

              {/* Student-Specific Filters */}
              {activeTab === 'students' && (
                <>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">الصف الدراسي:</label>
                    <select
                      value={gradeFilter}
                      onChange={(e) => setGradeFilter(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                    >
                      <option value="all">كافة الصفوف الدراسية</option>
                      <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
                      <option value="الصف الثاني الثانوي">الصف الثاني الثانوي</option>
                      <option value="الصف الثالث الثانوي">الصف الثالث الثانوي</option>
                      <option value="الصف الأول الإعدادي">الصف الأول الإعدادي</option>
                      <option value="الصف الثاني الإعدادي">الصف الثاني الإعدادي</option>
                      <option value="الصف الثالث الإعدادي">الصف الثالث الإعدادي</option>
                      <option value="الصف السادس الابتدائي">الصف السادس الابتدائي</option>
                      <option value="الصف الخامس الابتدائي">الصف الخامس الابتدائي</option>
                      <option value="الصف الرابع الابتدائي">الصف الرابع الابتدائي</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">نوع التعليم:</label>
                    <select
                      value={educationTypeFilter}
                      onChange={(e) => setEducationTypeFilter(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                    >
                      <option value="all">كافة أنواع التعليم</option>
                      <option value="عام">تعليم عام</option>
                      <option value="لغات">تجريبي / لغات</option>
                      <option value="أزهر">أزهر شريف</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">النوع / الجنس:</label>
                    <select
                      value={genderFilter}
                      onChange={(e) => setGenderFilter(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                    >
                      <option value="all">الذكور والإناث</option>
                      <option value="male">بنين (ذكور)</option>
                      <option value="female">بنات (إناث)</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Active Filter Tags */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
              <span className="text-slate-400 font-bold ml-1">الفلاتر المطبقة:</span>
              
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold">
                  <span>بحث: {searchQuery}</span>
                  <button onClick={() => setSearchQuery('')} className="hover:text-rose-600">✕</button>
                </span>
              )}

              {statusFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-bold border border-amber-200">
                  <span>الحالة: {statusFilter === 'pending' ? 'مراجعة' : statusFilter === 'approved' ? 'معتمد' : 'مرفوض'}</span>
                  <button onClick={() => setStatusFilter('all')} className="hover:text-rose-600">✕</button>
                </span>
              )}

              {subjectFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 font-bold border border-purple-200">
                  <span>المادة: {subjectFilter}</span>
                  <button onClick={() => setSubjectFilter('all')} className="hover:text-rose-600">✕</button>
                </span>
              )}

              {dayFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 font-bold border border-purple-200">
                  <span>اليوم: {dayFilter}</span>
                  <button onClick={() => setDayFilter('all')} className="hover:text-rose-600">✕</button>
                </span>
              )}

              {gradeFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 font-bold border border-sky-200">
                  <span>الصف: {gradeFilter}</span>
                  <button onClick={() => setGradeFilter('all')} className="hover:text-rose-600">✕</button>
                </span>
              )}

              {educationTypeFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 font-bold border border-sky-200">
                  <span>التعليم: {educationTypeFilter}</span>
                  <button onClick={() => setEducationTypeFilter('all')} className="hover:text-rose-600">✕</button>
                </span>
              )}

              {genderFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-bold border border-blue-200">
                  <span>النوع: {genderFilter === 'female' ? 'إناث' : 'ذكور'}</span>
                  <button onClick={() => setGenderFilter('all')} className="hover:text-rose-600">✕</button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================
          MAIN DATA LIST (TABLE OR MOBILE CARDS)
          ============================================================ */}
      {isLoading ? (
        <div className="bg-white rounded-3xl p-16 text-center shadow-xs border border-slate-100 space-y-4">
          <RefreshCw size={36} className="animate-spin text-indigo-600 mx-auto" />
          <p className="text-slate-600 text-sm font-bold">جاري تحميل الاستمارات الإلكترونية من السيرفر السحابي...</p>
        </div>
      ) : paginatedList.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center shadow-xs border border-slate-100 space-y-4">
          <div className="w-20 h-20 bg-slate-50 text-slate-400 rounded-3xl flex items-center justify-center mx-auto border border-slate-200">
            {activeTab === 'students' ? <Users size={36} /> : <GraduationCap size={36} />}
          </div>
          <h3 className="text-lg font-black text-slate-800">لا توجد استمارات مسجلة تطابق شروط البحث والفلترة</h3>
          <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto">
            تأكد من شروط الفلترة المحددة أو جرب البحث بكلمات أخرى أو تفريغ الفلاتر.
          </p>
          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="px-5 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm hover:bg-slate-800"
            >
              <RotateCcw size={14} />
              <span>إعادة تعيين كافة الفلاتر</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ============================================================
              DESKTOP TABLE VIEW (With Sticky Header & Multi-Select)
              ============================================================ */}
          <div className={`${viewMode === 'cards' ? 'hidden' : 'hidden md:block'} bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden`}>
            <div className="overflow-x-auto max-h-[75vh]">
              <table className="w-full text-right text-xs sm:text-sm min-w-[1100px] border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-md border-b border-slate-200/80 text-slate-600 text-[11px] sm:text-xs">
                  <tr>
                    <th className="py-4 px-4 w-12 text-center">
                      <button
                        type="button"
                        onClick={handleSelectAllCurrentPage}
                        className="text-slate-500 hover:text-slate-800 cursor-pointer"
                        title={isCurrentPageAllSelected ? 'إلغاء تحديد الصفحة' : 'تحديد جميع عناصر الصفحة'}
                      >
                        {isCurrentPageAllSelected ? (
                          <CheckSquare size={17} className="text-indigo-600" />
                        ) : (
                          <Square size={17} />
                        )}
                      </button>
                    </th>
                    {activeTab === 'teachers' ? (
                      <>
                        <th className="py-4 px-4 font-black min-w-[220px]">المعلم</th>
                        <th className="py-4 px-4 font-black min-w-[160px]">المواد والتخصصات</th>
                        <th className="py-4 px-4 font-black min-w-[160px]">المراحل المستهدفة</th>
                        <th className="py-4 px-4 font-black min-w-[280px]">المجموعات ومواعيد الحصص (مادة كل مجموعة)</th>
                        <th className="py-4 px-4 font-black min-w-[130px]">فريق المساعدين</th>
                        <th className="py-4 px-4 font-black min-w-[150px]">بيانات التواصل</th>
                        <th className="py-4 px-4 font-black min-w-[130px]">تاريخ التقديم</th>
                        <th className="py-4 px-4 font-black text-center min-w-[100px]">الحالة</th>
                        <th className="py-4 px-4 font-black text-center min-w-[140px]">الإجراءات</th>
                      </>
                    ) : (
                      <>
                        <th className="py-4 px-4 font-black min-w-[220px]">الطالب</th>
                        <th className="py-4 px-4 font-black min-w-[150px]">الصف ونوع التعليم</th>
                        <th className="py-4 px-4 font-black min-w-[180px]">المدرسة والعنوان</th>
                        <th className="py-4 px-4 font-black min-w-[160px]">بيانات التواصل</th>
                        <th className="py-4 px-4 font-black min-w-[130px]">تاريخ التسجيل</th>
                        <th className="py-4 px-4 font-black text-center min-w-[100px]">الحالة</th>
                        <th className="py-4 px-4 font-black text-center min-w-[140px]">الإجراءات</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeTab === 'teachers'
                    ? paginatedList.map((teacher) => {
                        const assistants = parseAssistantsData(teacher);
                        const groups = parseGroupsData(teacher);
                        const specs = (teacher.specialization || '').split(/[،,]/).map((s) => s.trim()).filter(Boolean);
                        const isSelected = selectedIds.includes(teacher.id);

                        return (
                          <tr 
                            key={teacher.id} 
                            className={`transition-colors hover:bg-slate-50/80 ${isSelected ? 'bg-indigo-50/40' : ''}`}
                          >
                            {/* Checkbox */}
                            <td className="py-4 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleSelect(teacher.id)}
                                className="text-slate-400 hover:text-slate-700 cursor-pointer"
                              >
                                {isSelected ? (
                                  <CheckSquare size={17} className="text-indigo-600" />
                                ) : (
                                  <Square size={17} />
                                )}
                              </button>
                            </td>

                            {/* Teacher Info */}
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div 
                                  onClick={() => teacher.photo_url ? setPreviewImage({ url: teacher.photo_url, title: teacher.full_name }) : setSelectedTeacher(teacher)}
                                  className="w-11 h-11 rounded-2xl overflow-hidden bg-rose-50 border border-rose-200 shrink-0 cursor-pointer hover:opacity-80 transition-opacity shadow-2xs"
                                  title="اضغط لمعاينة الصورة بالحجم الكامل"
                                >
                                  {teacher.photo_url ? (
                                    <img
                                      src={teacher.photo_url}
                                      alt={teacher.full_name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-rose-500">
                                      <GraduationCap size={20} />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span 
                                      onClick={() => setSelectedTeacher(teacher)}
                                      className="font-bold text-slate-900 hover:text-rose-600 cursor-pointer leading-tight"
                                    >
                                      {teacher.nickname ? `${teacher.nickname}` : teacher.full_name}
                                    </span>
                                  </div>
                                  <span className="text-xs text-slate-500 block mt-0.5">{teacher.full_name}</span>
                                  <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                                    كود: {teacher.id.slice(0, 8).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Specialization */}
                            <td className="py-4 px-4">
                              <div className="flex flex-wrap gap-1 max-w-[160px]">
                                {specs.map((s, idx) => (
                                  <span key={idx} className="bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded-lg text-xs border border-rose-200/60">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </td>

                            {/* Target Grades */}
                            <td className="py-4 px-4">
                              <span className="text-xs text-slate-700 block max-w-[180px] leading-relaxed">
                                {teacher.target_grades || 'غير محدد'}
                              </span>
                            </td>

                            {/* Groups with Individual Subject */}
                            <td className="py-4 px-4">
                              {groups.length > 0 ? (
                                <div className="space-y-1.5 max-w-[320px]">
                                  {groups.slice(0, 2).map((grp, idx) => (
                                    <div 
                                      key={idx}
                                      className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-purple-50/70 border border-purple-200/70 text-[11px]"
                                    >
                                      <div className="flex items-center gap-1.5 font-bold text-purple-950">
                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                                        <span>{grp.day}</span>
                                        <span className="font-mono text-purple-800">
                                          ({formatTime12H(grp.start_time)})
                                        </span>
                                      </div>
                                      <span className="px-1.5 py-0.5 rounded-md bg-purple-200/80 text-purple-900 font-bold text-[10px]">
                                        مادة: {grp.subject}
                                      </span>
                                    </div>
                                  ))}
                                  {groups.length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() => setSelectedTeacher(teacher)}
                                      className="text-[11px] text-purple-700 font-bold hover:underline block text-center w-full"
                                    >
                                      + {groups.length - 2} مجموعات أخرى (اضغط للعرض)
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">لا توجد مواعيد</span>
                              )}
                            </td>

                            {/* Assistants */}
                            <td className="py-4 px-4">
                              {assistants.length > 0 ? (
                                <div className="space-y-0.5">
                                  <span className="font-bold text-slate-800 text-xs block">
                                    {assistants[0].name}
                                  </span>
                                  {assistants.length > 1 && (
                                    <span className="text-[10px] text-slate-400 block">
                                      + {assistants.length - 1} مساعدين آخرين
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400">إدارة شخصية</span>
                              )}
                            </td>

                            {/* Contacts & Quick WhatsApp */}
                            <td className="py-4 px-4">
                              <div className="space-y-1 font-mono text-xs">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-800">{teacher.phone}</span>
                                  <button
                                    onClick={() => copyToClipboard(teacher.phone, `t_phone_${teacher.id}`)}
                                    className="text-slate-400 hover:text-slate-700"
                                    title="نسخ الرقم"
                                  >
                                    {copiedKey === `t_phone_${teacher.id}` ? <CheckCheck size={13} className="text-emerald-600" /> : <Copy size={13} />}
                                  </button>
                                </div>
                                {teacher.whatsapp_phone && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] text-slate-500">واتساب: {teacher.whatsapp_phone}</span>
                                    <a
                                      href={getDirectWhatsAppUrl(teacher.whatsapp_phone, `مرحباً بحضرتك يا ${teacher.nickname || teacher.full_name}`)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-emerald-600 hover:text-emerald-700"
                                      title="محادثة واتساب مباشرة"
                                    >
                                      <MessageCircle size={13} />
                                    </a>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Created At */}
                            <td className="py-4 px-4">
                              <span className="text-xs text-slate-600 block">
                                {formatArabicDateTime(teacher.created_at)}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-4 px-4 text-center">
                              {teacher.status === 'approved' ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 size={12} />
                                  <span>معتمد</span>
                                </span>
                              ) : teacher.status === 'rejected' ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  <XCircle size={12} />
                                  <span>مرفوض</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  <Clock size={12} />
                                  <span>مراجعة</span>
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setSelectedTeacher(teacher)}
                                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                  title="عرض كافة التفاصيل والجدول"
                                >
                                  <Eye size={15} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => printTeacherApplication(teacher)}
                                  className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors cursor-pointer"
                                  title="طباعة الاستمارة الرسمية"
                                >
                                  <Printer size={15} />
                                </button>
                                {teacher.status !== 'approved' && (
                                  <button
                                    type="button"
                                    disabled={updatingId === teacher.id}
                                    onClick={() => handleUpdateStatus('teacher', teacher.id, 'approved')}
                                    className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                                    title="اعتماد وقبول"
                                  >
                                    <CheckCircle2 size={15} />
                                  </button>
                                )}
                                {teacher.status !== 'rejected' && (
                                  <button
                                    type="button"
                                    disabled={updatingId === teacher.id}
                                    onClick={() => handleUpdateStatus('teacher', teacher.id, 'rejected')}
                                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                                    title="رفض"
                                  >
                                    <XCircle size={15} />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  disabled={updatingId === teacher.id}
                                  onClick={() => handleDeleteRecord('teacher', teacher.id, teacher.full_name)}
                                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                  title="حذف الاستمارة"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    : paginatedList.map((student) => {
                        const isElementaryNoPhone = student.phone?.includes('طالب ابتدائي') || student.phone?.includes('لا يوجد');
                        const isSelected = selectedIds.includes(student.id);

                        return (
                          <tr 
                            key={student.id} 
                            className={`transition-colors hover:bg-slate-50/80 ${isSelected ? 'bg-sky-50/40' : ''}`}
                          >
                            {/* Checkbox */}
                            <td className="py-4 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleSelect(student.id)}
                                className="text-slate-400 hover:text-slate-700 cursor-pointer"
                              >
                                {isSelected ? (
                                  <CheckSquare size={17} className="text-indigo-600" />
                                ) : (
                                  <Square size={17} />
                                )}
                              </button>
                            </td>

                            {/* Student Info */}
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div 
                                  onClick={() => student.photo_url ? setPreviewImage({ url: student.photo_url, title: student.full_name }) : setSelectedStudent(student)}
                                  className="w-11 h-11 rounded-2xl overflow-hidden bg-sky-50 border border-sky-200 shrink-0 cursor-pointer hover:opacity-80 transition-opacity shadow-2xs"
                                  title="اضغط لمعاينة الصورة"
                                >
                                  {student.photo_url ? (
                                    <img
                                      src={student.photo_url}
                                      alt={student.full_name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-sky-500">
                                      <User size={20} />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <span 
                                    onClick={() => setSelectedStudent(student)}
                                    className="font-bold text-slate-900 hover:text-sky-600 cursor-pointer block leading-tight"
                                  >
                                    {student.full_name}
                                  </span>
                                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                                    <span className="font-mono">{student.national_id || 'غير مسجل'}</span>
                                    {student.gender && (
                                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${student.gender === 'female' ? 'bg-pink-50 text-pink-700' : 'bg-blue-50 text-blue-700'}`}>
                                        {student.gender === 'female' ? 'أنثى' : 'ذكر'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Grade & Education Type */}
                            <td className="py-4 px-4">
                              <span className="font-bold text-slate-800 block">{student.academic_grade}</span>
                              <span className="text-[11px] text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-lg font-bold inline-block mt-0.5 border border-sky-200/60">
                                {student.education_type}
                              </span>
                            </td>

                            {/* School Name & Address */}
                            <td className="py-4 px-4">
                              <span className="text-slate-800 text-xs font-bold block">{student.school_name || 'غير مسجل'}</span>
                              <span className="text-[11px] text-slate-400 block truncate max-w-[180px] mt-0.5">
                                {student.address || 'العنوان غير مسجل'}
                              </span>
                            </td>

                            {/* Contacts */}
                            <td className="py-4 px-4">
                              <div className="space-y-1 text-xs font-mono">
                                <div className="flex items-center gap-1.5">
                                  {isElementaryNoPhone ? (
                                    <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md font-sans font-bold border border-amber-200">
                                      طالب بدون هاتف
                                    </span>
                                  ) : (
                                    <>
                                      <span className="font-bold text-slate-900">{student.phone}</span>
                                      <a
                                        href={getDirectWhatsAppUrl(student.phone, `أهلاً بك يا ${student.full_name}`)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-emerald-600 hover:text-emerald-700"
                                      >
                                        <MessageCircle size={13} />
                                      </a>
                                    </>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                                  <span>ولي الأمر: {student.father_phone}</span>
                                  <a
                                    href={getDirectWhatsAppUrl(student.father_phone, `السلام عليكم، بخصوص تسجيل الطالب/ة ${student.full_name}`)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-emerald-600 hover:text-emerald-700"
                                  >
                                    <MessageCircle size={13} />
                                  </a>
                                </div>
                              </div>
                            </td>

                            {/* Created At */}
                            <td className="py-4 px-4">
                              <span className="text-xs text-slate-600 block">
                                {formatArabicDateTime(student.created_at)}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-4 px-4 text-center">
                              {student.status === 'approved' ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 size={12} />
                                  <span>معتمد</span>
                                </span>
                              ) : student.status === 'rejected' ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  <XCircle size={12} />
                                  <span>مرفوض</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  <Clock size={12} />
                                  <span>مراجعة</span>
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setSelectedStudent(student)}
                                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                  title="عرض كافة التفاصيل"
                                >
                                  <Eye size={15} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => printStudentApplication(student)}
                                  className="p-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 transition-colors cursor-pointer"
                                  title="طباعة الاستمارة"
                                >
                                  <Printer size={15} />
                                </button>
                                {student.status !== 'approved' && (
                                  <button
                                    type="button"
                                    disabled={updatingId === student.id}
                                    onClick={() => handleUpdateStatus('student', student.id, 'approved')}
                                    className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                                    title="اعتماد"
                                  >
                                    <CheckCircle2 size={15} />
                                  </button>
                                )}
                                {student.status !== 'rejected' && (
                                  <button
                                    type="button"
                                    disabled={updatingId === student.id}
                                    onClick={() => handleUpdateStatus('student', student.id, 'rejected')}
                                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                                    title="رفض"
                                  >
                                    <XCircle size={15} />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  disabled={updatingId === student.id}
                                  onClick={() => handleDeleteRecord('student', student.id, student.full_name)}
                                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                  title="حذف"
                                >
                                  <Trash2 size={15} />
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
              MOBILE / CARDS VIEW (Responsive & Touch-Optimized)
              ============================================================ */}
          <div className={`${viewMode === 'cards' ? 'grid' : 'grid md:hidden'} grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`}>
            {activeTab === 'teachers'
              ? paginatedList.map((teacher) => {
                  const assistants = parseAssistantsData(teacher);
                  const groups = parseGroupsData(teacher);
                  const specs = (teacher.specialization || '').split(/[،,]/).map((s) => s.trim()).filter(Boolean);
                  const isSelected = selectedIds.includes(teacher.id);

                  return (
                    <div 
                      key={teacher.id}
                      className={`bg-white rounded-3xl p-5 border transition-all shadow-xs hover:shadow-md flex flex-col justify-between space-y-4 text-right ${
                        isSelected ? 'border-indigo-500 ring-2 ring-indigo-100 bg-indigo-50/20' : 'border-slate-100 hover:border-slate-300'
                      }`}
                    >
                      {/* Top Row: Avatar + Name + Checkbox + Status */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggleSelect(teacher.id)}
                            className="text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            {isSelected ? <CheckSquare size={18} className="text-indigo-600" /> : <Square size={18} />}
                          </button>

                          <div 
                            onClick={() => teacher.photo_url ? setPreviewImage({ url: teacher.photo_url, title: teacher.full_name }) : setSelectedTeacher(teacher)}
                            className="w-12 h-12 rounded-2xl overflow-hidden bg-rose-50 border border-rose-200 shrink-0 cursor-pointer shadow-2xs"
                          >
                            {teacher.photo_url ? (
                              <img src={teacher.photo_url} alt={teacher.full_name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-rose-500">
                                <GraduationCap size={22} />
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 
                              onClick={() => setSelectedTeacher(teacher)}
                              className="font-black text-slate-900 text-sm hover:text-rose-600 cursor-pointer leading-tight"
                            >
                              {teacher.nickname ? `${teacher.nickname}` : teacher.full_name}
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">{teacher.full_name}</p>
                            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                              {formatArabicDateTime(teacher.created_at)}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {teacher.status === 'approved' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={11} />
                              <span>معتمد</span>
                            </span>
                          ) : teacher.status === 'rejected' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle size={11} />
                              <span>مرفوض</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <Clock size={11} />
                              <span>مراجعة</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Specializations & Targets */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                        <div className="flex flex-wrap gap-1">
                          {specs.map((s, idx) => (
                            <span key={idx} className="bg-rose-50 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-rose-200/60">
                              {s}
                            </span>
                          ))}
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-1">{teacher.target_grades}</p>
                      </div>

                      {/* Groups List Highlight */}
                      {groups.length > 0 && (
                        <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-100 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between text-[11px] font-bold text-purple-900">
                            <span>المجموعات المسجلة:</span>
                            <span className="bg-purple-200/80 px-2 py-0.5 rounded-full text-[10px]">
                              {groups.length} مواعيد
                            </span>
                          </div>
                          {groups.slice(0, 2).map((grp, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[11px] bg-white p-2 rounded-xl border border-purple-100">
                              <span className="font-bold text-purple-950">
                                {grp.day}: {formatTime12H(grp.start_time)}
                              </span>
                              <span className="text-[10px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md">
                                {grp.subject}
                              </span>
                            </div>
                          ))}
                          {groups.length > 2 && (
                            <span className="text-[10px] text-purple-700 font-bold block text-center pt-0.5">
                              + {groups.length - 2} مجموعات أخرى
                            </span>
                          )}
                        </div>
                      )}

                      {/* Quick Contacts Bar */}
                      <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">{teacher.phone}</span>
                          <button
                            onClick={() => copyToClipboard(teacher.phone, `card_t_phone_${teacher.id}`)}
                            className="text-slate-400 hover:text-slate-700"
                            title="نسخ"
                          >
                            {copiedKey === `card_t_phone_${teacher.id}` ? <CheckCheck size={12} className="text-emerald-600" /> : <Copy size={12} />}
                          </button>
                        </div>
                        {teacher.whatsapp_phone && (
                          <a
                            href={getDirectWhatsAppUrl(teacher.whatsapp_phone, `مرحباً بحضرتك يا ${teacher.nickname || teacher.full_name}`)}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center gap-1 hover:bg-emerald-100"
                          >
                            <MessageCircle size={13} />
                            <span>واتساب</span>
                          </a>
                        )}
                      </div>

                      {/* Bottom Action strip */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedTeacher(teacher)}
                          className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye size={14} />
                          <span>عرض الملف الكامل</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => printTeacherApplication(teacher)}
                          className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors"
                          title="طباعة الاستمارة"
                        >
                          <Printer size={16} />
                        </button>
                        {teacher.status !== 'approved' && (
                          <button
                            type="button"
                            disabled={updatingId === teacher.id}
                            onClick={() => handleUpdateStatus('teacher', teacher.id, 'approved')}
                            className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                            title="اعتماد"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                        )}
                        {teacher.status !== 'rejected' && (
                          <button
                            type="button"
                            disabled={updatingId === teacher.id}
                            onClick={() => handleUpdateStatus('teacher', teacher.id, 'rejected')}
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors"
                            title="رفض"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={updatingId === teacher.id}
                          onClick={() => handleDeleteRecord('teacher', teacher.id, teacher.full_name)}
                          className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition-colors"
                          title="حذف"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              : paginatedList.map((student) => {
                  const isElementaryNoPhone = student.phone?.includes('طالب ابتدائي') || student.phone?.includes('لا يوجد');
                  const isSelected = selectedIds.includes(student.id);

                  return (
                    <div 
                      key={student.id}
                      className={`bg-white rounded-3xl p-5 border transition-all shadow-xs hover:shadow-md flex flex-col justify-between space-y-4 text-right ${
                        isSelected ? 'border-sky-500 ring-2 ring-sky-100 bg-sky-50/20' : 'border-slate-100 hover:border-slate-300'
                      }`}
                    >
                      {/* Top Row: Avatar + Name + Checkbox + Status */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggleSelect(student.id)}
                            className="text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            {isSelected ? <CheckSquare size={18} className="text-indigo-600" /> : <Square size={18} />}
                          </button>

                          <div 
                            onClick={() => student.photo_url ? setPreviewImage({ url: student.photo_url, title: student.full_name }) : setSelectedStudent(student)}
                            className="w-12 h-12 rounded-2xl overflow-hidden bg-sky-50 border border-sky-200 shrink-0 cursor-pointer shadow-2xs"
                          >
                            {student.photo_url ? (
                              <img src={student.photo_url} alt={student.full_name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-sky-500">
                                <User size={22} />
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 
                              onClick={() => setSelectedStudent(student)}
                              className="font-black text-slate-900 text-sm hover:text-sky-600 cursor-pointer leading-tight"
                            >
                              {student.full_name}
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">{student.academic_grade} ({student.education_type})</p>
                            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                              {formatArabicDateTime(student.created_at)}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {student.status === 'approved' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={11} />
                              <span>معتمد</span>
                            </span>
                          ) : student.status === 'rejected' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle size={11} />
                              <span>مرفوض</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <Clock size={11} />
                              <span>مراجعة</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* School & Address */}
                      <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                        <p className="font-bold text-slate-800">المدرسة: {student.school_name || 'غير مسجل'}</p>
                        <p className="text-[11px] text-slate-400 truncate">العنوان: {student.address || 'غير مسجل'}</p>
                      </div>

                      {/* Contacts Box */}
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 text-[11px]">الطالب:</span>
                          {isElementaryNoPhone ? (
                            <span className="text-[10px] text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md font-bold">
                              بدون هاتف
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5 font-mono">
                              <span className="font-bold text-slate-900">{student.phone}</span>
                              <a
                                href={getDirectWhatsAppUrl(student.phone, `أهلاً بك يا ${student.full_name}`)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-600 hover:text-emerald-700"
                              >
                                <MessageCircle size={13} />
                              </a>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 text-[11px]">ولي الأمر:</span>
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="font-bold text-slate-900">{student.father_phone}</span>
                            <a
                              href={getDirectWhatsAppUrl(student.father_phone, `السلام عليكم، بخصوص تسجيل الطالب/ة ${student.full_name}`)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-600 hover:text-emerald-700"
                            >
                              <MessageCircle size={13} />
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Action strip */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedStudent(student)}
                          className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye size={14} />
                          <span>عرض الاستمارة</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => printStudentApplication(student)}
                          className="p-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 transition-colors"
                          title="طباعة الاستمارة"
                        >
                          <Printer size={16} />
                        </button>
                        {student.status !== 'approved' && (
                          <button
                            type="button"
                            disabled={updatingId === student.id}
                            onClick={() => handleUpdateStatus('student', student.id, 'approved')}
                            className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                            title="اعتماد"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                        )}
                        {student.status !== 'rejected' && (
                          <button
                            type="button"
                            disabled={updatingId === student.id}
                            onClick={() => handleUpdateStatus('student', student.id, 'rejected')}
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors"
                            title="رفض"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={updatingId === student.id}
                          onClick={() => handleDeleteRecord('student', student.id, student.full_name)}
                          className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition-colors"
                          title="حذف"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
          </div>

          {/* ============================================================
              PAGINATION BAR (Controls: 10, 20, 25, 50, 100 & Page Nav)
              ============================================================ */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-5 border border-slate-200/80 rounded-3xl bg-white shadow-xs gap-4">
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
              <p>
                عرض <span className="font-black text-slate-900 font-mono">{totalItems === 0 ? 0 : startIndex + 1} - {endIndex}</span> من إجمالي <span className="font-black text-slate-900 font-mono">{totalItems}</span> {activeTab === 'students' ? 'طالب' : 'معلم'}
              </p>
              {totalPages > 1 && (
                <span className="text-slate-400">
                  (صفحة <span className="font-black text-slate-800">{safeCurrentPage}</span> من <span className="font-black text-slate-800">{totalPages}</span>)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage <= 1}
                className="px-4 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                title="الصفحة السابقة"
              >
                <ChevronRight size={15} />
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
                        className={`w-8 h-8 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          safeCurrentPage === p
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'text-slate-700 hover:bg-slate-100'
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
                className="px-4 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                title="الصفحة التالية"
              >
                <span>التالي</span>
                <ChevronLeft size={15} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* ============================================================
          FLOATING BATCH ACTIONS BAR (Appears When 1+ Items Selected)
          ============================================================ */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white px-5 py-3.5 rounded-3xl shadow-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-4 max-w-xl w-[94%] animate-fade-in-up">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
              {selectedIds.length}
            </span>
            <span className="text-xs sm:text-sm font-bold">تم تحديد {selectedIds.length} استمارة</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isBatchUpdating}
              onClick={() => handleBatchStatusUpdate('approved')}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
            >
              <CheckCircle2 size={14} />
              <span>اعتماد المحددين</span>
            </button>

            <button
              type="button"
              disabled={isBatchUpdating}
              onClick={() => handleBatchStatusUpdate('rejected')}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
            >
              <XCircle size={14} />
              <span>رفض المحددين</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
          STUDENT DETAILS MODAL (Sticky Action Bar + Tabs)
          ============================================================ */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-hidden shadow-2xl border border-slate-100 flex flex-col text-right">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3.5">
                <div 
                  onClick={() => selectedStudent.photo_url && setPreviewImage({ url: selectedStudent.photo_url, title: selectedStudent.full_name })}
                  className="w-16 h-16 rounded-2xl overflow-hidden bg-sky-50 border-2 border-sky-500 shadow-sm shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                  title="اضغط للتكبير"
                >
                  {selectedStudent.photo_url ? (
                    <img
                      src={selectedStudent.photo_url}
                      alt={selectedStudent.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sky-600 font-bold">
                      <User size={30} />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">{selectedStudent.full_name}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-sky-800 bg-sky-100 px-2.5 py-0.5 rounded-md">
                      {selectedStudent.academic_grade} ({selectedStudent.education_type})
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      كود: {selectedStudent.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => printStudentApplication(selectedStudent)}
                  className="p-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  title="طباعة الاستمارة"
                >
                  <Printer size={16} />
                  <span className="hidden sm:inline">طباعة</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
              {/* General Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-xs mb-0.5">الرقم القومي:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono text-slate-900">{selectedStudent.national_id || 'غير مسجل'}</span>
                    {selectedStudent.national_id && (
                      <button
                        onClick={() => copyToClipboard(selectedStudent.national_id, 'm_st_nid')}
                        className="text-slate-400 hover:text-slate-700"
                        title="نسخ"
                      >
                        {copiedKey === 'm_st_nid' ? <CheckCheck size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-xs mb-0.5">تاريخ الميلاد والنوع:</span>
                  <span className="font-bold text-slate-900">
                    {selectedStudent.birth_date || 'غير محدد'} ({selectedStudent.gender === 'female' ? 'أنثى' : 'ذكر'})
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-xs mb-0.5">هاتف الطالب:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono text-slate-900">{selectedStudent.phone}</span>
                    <a
                      href={getDirectWhatsAppUrl(selectedStudent.phone, `أهلاً بك يا ${selectedStudent.full_name}`)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-600 hover:underline flex items-center gap-1 text-xs"
                    >
                      <MessageCircle size={13} />
                      <span>واتساب</span>
                    </a>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-xs mb-0.5">هاتف ولي الأمر (الأب):</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono text-slate-900">{selectedStudent.father_phone}</span>
                    <a
                      href={getDirectWhatsAppUrl(selectedStudent.father_phone, `السلام عليكم، بخصوص تسجيل الطالب/ة ${selectedStudent.full_name}`)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-600 hover:underline flex items-center gap-1 text-xs"
                    >
                      <MessageCircle size={13} />
                      <span>واتساب</span>
                    </a>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-xs mb-0.5">هاتف والدة الطالب:</span>
                  <span className="font-bold font-mono text-slate-900">{selectedStudent.mother_phone || 'غير مسجل'}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-xs mb-0.5">مهنة / وظيفة ولي الأمر:</span>
                  <span className="font-bold text-slate-900">{selectedStudent.parent_job || 'غير مسجل'}</span>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-slate-400 block text-xs mb-0.5">المدرسة الحالية:</span>
                  <span className="font-bold text-slate-900">{selectedStudent.school_name || 'غير مسجل'}</span>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-slate-400 block text-xs mb-0.5">العنوان بالتفصيل:</span>
                  <span className="font-bold text-slate-900">{selectedStudent.address || 'غير مسجل'}</span>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-slate-400 block text-xs mb-0.5">تاريخ ووقت استلام الاستمارة:</span>
                  <span className="font-bold text-sky-700">{formatArabicDateTime(selectedStudent.created_at)}</span>
                </div>
              </div>

              {/* Notes */}
              {selectedStudent.notes && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="font-bold text-slate-800 block mb-1">ملاحظات ورغبات الطالب:</span>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-line">{selectedStudent.notes}</p>
                </div>
              )}
            </div>

            {/* Sticky Action Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                {selectedStudent.status !== 'approved' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('student', selectedStudent.id, 'approved')}
                    className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <CheckCircle2 size={16} />
                    <span>اعتماد وقبول الطالب</span>
                  </button>
                )}

                {selectedStudent.status !== 'rejected' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('student', selectedStudent.id, 'rejected')}
                    className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <XCircle size={16} />
                    <span>رفض الطلب</span>
                  </button>
                )}

                {selectedStudent.status !== 'pending' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('student', selectedStudent.id, 'pending')}
                    className="px-3 py-2.5 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Clock size={16} />
                    <span>إرجاع للمراجعة</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2.5 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs cursor-pointer"
              >
                إغلاق النافذة
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================
          TEACHER DETAILS MODAL (Sticky Action Bar + Groups Matrix)
          ============================================================ */}
      {selectedTeacher && (() => {
        const groups = parseGroupsData(selectedTeacher);
        const assistants = parseAssistantsData(selectedTeacher);
        const specs = (selectedTeacher.specialization || '').split(/[،,]/).map((s) => s.trim()).filter(Boolean);
        const targetGrds = (selectedTeacher.target_grades || '').split(/[،,]/).map((g) => g.trim()).filter(Boolean);

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-hidden shadow-2xl border border-slate-100 flex flex-col text-right">
              
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3.5">
                  <div 
                    onClick={() => selectedTeacher.photo_url && setPreviewImage({ url: selectedTeacher.photo_url, title: selectedTeacher.full_name })}
                    className="w-16 h-16 rounded-2xl overflow-hidden bg-rose-50 border-2 border-rose-500 shadow-sm shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                    title="اضغط للتكبير"
                  >
                    {selectedTeacher.photo_url ? (
                      <img
                        src={selectedTeacher.photo_url}
                        alt={selectedTeacher.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-rose-600 font-bold">
                        <GraduationCap size={32} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">
                      {selectedTeacher.nickname ? `${selectedTeacher.nickname}` : selectedTeacher.full_name}
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold">{selectedTeacher.full_name}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {specs.map((s, idx) => (
                        <span key={idx} className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedTeacher.logo_url && (
                    <div 
                      onClick={() => setPreviewImage({ url: selectedTeacher.logo_url, title: `شعار المعلم - ${selectedTeacher.nickname || selectedTeacher.full_name}` })}
                      className="w-12 h-12 rounded-xl p-1 border border-slate-200 bg-white shadow-xs shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                      title="شعار المعلم (اضغط للتكبير)"
                    >
                      <img
                        src={selectedTeacher.logo_url}
                        alt="شعار المعلم"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => printTeacherApplication(selectedTeacher)}
                    className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    title="طباعة الاستمارة الرسمية"
                  >
                    <Printer size={16} />
                    <span className="hidden sm:inline">طباعة</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTeacher(null)}
                    className="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
                
                {/* General Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-xs mb-0.5">الهاتف الشخصي:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono text-slate-900">{selectedTeacher.phone}</span>
                      <button
                        onClick={() => copyToClipboard(selectedTeacher.phone, 'm_t_phone')}
                        className="text-slate-400 hover:text-slate-700"
                        title="نسخ"
                      >
                        {copiedKey === 'm_t_phone' ? <CheckCheck size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-xs mb-0.5">رقم الواتساب المعتمد:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono text-slate-900">{selectedTeacher.whatsapp_phone || selectedTeacher.phone}</span>
                      <a
                        href={getDirectWhatsAppUrl(selectedTeacher.whatsapp_phone || selectedTeacher.phone, `مرحباً بحضرتك يا ${selectedTeacher.nickname || selectedTeacher.full_name}`)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 hover:underline flex items-center gap-1 text-xs"
                      >
                        <MessageCircle size={14} />
                        <span>محادثة واتساب</span>
                      </a>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-xs mb-0.5">الرقم القومي:</span>
                    <span className="font-bold font-mono text-slate-900">{selectedTeacher.national_id || 'غير مسجل'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-xs mb-0.5">كود الطلب المرجعي:</span>
                    <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      {selectedTeacher.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-xs mb-1">المراحل والصفوف الدراسية المستهدفة:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {targetGrds.map((g, idx) => (
                        <span key={idx} className="bg-white border border-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded-xl text-xs">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-xs mb-0.5">تاريخ ووقت استلام الاستمارة:</span>
                    <span className="font-bold text-rose-700">{formatArabicDateTime(selectedTeacher.created_at)}</span>
                  </div>
                </div>

                {/* Groups Matrix (Per-Group Subject Highlight) */}
                <div className="p-4 rounded-3xl bg-purple-50/60 border border-purple-200">
                  <div className="flex items-center justify-between mb-3.5">
                    <h4 className="font-black text-purple-950 flex items-center gap-2 text-sm">
                      <Clock size={17} className="text-purple-600" />
                      <span>جدول الحصص والمجموعات المقترحة لكل مادة:</span>
                    </h4>
                    <span className="text-xs font-bold text-purple-700 bg-purple-100 px-3 py-0.5 rounded-full border border-purple-300">
                      {groups.length} مجموعات مسجلة
                    </span>
                  </div>

                  {groups.length > 0 ? (
                    <div className="space-y-2.5">
                      {groups.map((grp, idx) => {
                        const duration = calculateGroupDuration(grp.start_time, grp.end_time);

                        return (
                          <div 
                            key={grp.id || idx} 
                            className="p-3.5 rounded-2xl bg-white border border-purple-200 shadow-2xs space-y-2"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-100 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-bold">
                                  {idx + 1}
                                </span>
                                <span className="font-black text-purple-950 text-sm">المجموعة رقم {idx + 1}</span>
                              </div>

                              <div className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 py-1 rounded-xl text-xs font-bold shadow-xs">
                                <BookOpen size={13} />
                                <span>مادة المجموعة: {grp.subject}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                              <div>
                                <span className="text-slate-400 block text-[11px]">يوم الحصة:</span>
                                <span className="font-bold text-slate-800">{grp.day}</span>
                              </div>

                              <div>
                                <span className="text-slate-400 block text-[11px]">التوقيت (12 ساعة):</span>
                                <span className="font-bold text-purple-950">
                                  من {formatTime12H(grp.start_time, true)} إلى {formatTime12H(grp.end_time, true)}
                                </span>
                              </div>

                              <div>
                                <span className="text-slate-400 block text-[11px]">مدة الحصة:</span>
                                <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded inline-block">
                                  {duration || 'غير محدد'}
                                </span>
                              </div>

                              <div>
                                <span className="text-slate-400 block text-[11px]">الصف الدراسي:</span>
                                <span className="font-bold text-slate-800">{grp.grade}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-purple-700">لا توجد مواعيد محددة مسجلة</p>
                  )}
                </div>

                {/* Assistants Team */}
                <div className="p-4 rounded-3xl bg-amber-50/60 border border-amber-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-black text-amber-950 flex items-center gap-2 text-sm">
                      <Users size={17} className="text-amber-600" />
                      <span>فريق العمل والمساعدين (السكرتارية):</span>
                    </h4>
                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-0.5 rounded-full border border-amber-300">
                      {assistants.length} مساعد
                    </span>
                  </div>

                  {assistants.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {assistants.map((asst, idx) => (
                        <div key={idx} className="p-3 rounded-2xl bg-white border border-amber-200 flex items-center justify-between text-xs shadow-2xs">
                          <div>
                            <span className="font-bold text-slate-900 block">مساعد {idx + 1}: {asst.name}</span>
                            <span className="font-mono text-slate-600 block mt-0.5">{asst.phone}</span>
                          </div>
                          {asst.phone && (
                            <a
                              href={getDirectWhatsAppUrl(asst.phone, `السلام عليكم أ/ ${asst.name}`)}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center gap-1 text-xs font-bold"
                            >
                              <MessageCircle size={14} />
                              <span>واتساب</span>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-amber-800 font-semibold">إدارة شخصية بدون سكرتارية (يتواصل المعلم مع أولياء الأمور بنفسه)</p>
                  )}
                </div>

                {/* Bio & Experience */}
                {selectedTeacher.bio && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                    <span className="font-bold text-slate-800 block mb-1">النبذة التعريفية وسنوات الخبرة:</span>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-line">{selectedTeacher.bio}</p>
                  </div>
                )}

                {/* Social Platform Links */}
                {(selectedTeacher.facebook_link || selectedTeacher.youtube_link || selectedTeacher.telegram_link) && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                    <span className="font-bold text-slate-800 block mb-2">منصات وقنوات التواصل:</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedTeacher.facebook_link && (
                        <a
                          href={selectedTeacher.facebook_link}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 font-bold flex items-center gap-1.5 hover:bg-blue-100"
                        >
                          <ExternalLink size={13} />
                          <span>صفحة فيسبوك</span>
                        </a>
                      )}
                      {selectedTeacher.youtube_link && (
                        <a
                          href={selectedTeacher.youtube_link}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-bold flex items-center gap-1.5 hover:bg-rose-100"
                        >
                          <ExternalLink size={13} />
                          <span>قناة يوتيوب</span>
                        </a>
                      )}
                      {selectedTeacher.telegram_link && (
                        <a
                          href={selectedTeacher.telegram_link}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 font-bold flex items-center gap-1.5 hover:bg-sky-100"
                        >
                          <ExternalLink size={13} />
                          <span>قناة تليجرام</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedTeacher.notes && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                    <span className="font-bold text-slate-800 block mb-1">متطلبات القاعات وملاحظات:</span>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-line">{selectedTeacher.notes}</p>
                  </div>
                )}
              </div>

              {/* Sticky Action Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  {selectedTeacher.status !== 'approved' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus('teacher', selectedTeacher.id, 'approved')}
                      className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      <CheckCircle2 size={16} />
                      <span>اعتماد وقبول المعلم</span>
                    </button>
                  )}

                  {selectedTeacher.status !== 'rejected' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus('teacher', selectedTeacher.id, 'rejected')}
                      className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <XCircle size={16} />
                      <span>رفض الطلب</span>
                    </button>
                  )}

                  {selectedTeacher.status !== 'pending' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus('teacher', selectedTeacher.id, 'pending')}
                      className="px-3 py-2.5 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Clock size={16} />
                      <span>إرجاع للمراجعة</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTeacher(null)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs cursor-pointer"
                >
                  إغلاق النافذة
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
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-5 max-w-xl w-full shadow-2xl border border-slate-200 text-center relative"
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-800">{previewImage.title}</span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[70vh] overflow-hidden rounded-2xl flex items-center justify-center bg-slate-50">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[70vh] w-auto object-contain rounded-2xl shadow-sm"
              />
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <a
                href={previewImage.url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink size={14} />
                <span>فتح بالحجم الأصلي في تبويب جديد</span>
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
