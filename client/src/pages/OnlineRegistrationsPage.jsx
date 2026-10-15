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
  FileText
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

  if (list.length === 0 && (teacher.assistant_name || teacher.assistant_phone)) {
    list = [
      {
        id: 1,
        name: teacher.assistant_name || 'مساعد السكرتارية',
        phone: teacher.assistant_phone || '',
      },
    ];
  }

  return list;
};

export const calculateGroupDuration = (start, end) => {
  if (!start || !end) return '';
  try {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const diffMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (diffMinutes <= 0) return '';
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    if (hours === 1 && mins === 0) return 'ساعة واحدة';
    if (hours === 1 && mins === 30) return 'ساعة ونصف';
    if (hours === 2 && mins === 0) return 'ساعتان';
    if (hours === 2 && mins === 30) return 'ساعتان ونصف';
    if (hours === 3 && mins === 0) return '3 ساعات';
    let text = '';
    if (hours > 0) text += `${hours} ساعة `;
    if (mins > 0) text += `و ${mins} دقيقة`;
    return text.trim();
  } catch {
    return '';
  }
};

export function formatTime12H(time24, includeWord = false) {
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
}

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
  const [activeTab, setActiveTab] = useState('students'); // 'students' | 'teachers'

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

  // Selected item for modal
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  // Lightbox Image Preview
  const [previewImage, setPreviewImage] = useState(null);

  // Status updating indicator
  const [updatingId, setUpdatingId] = useState(null);

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
          : 'تم إعادة الطلب لقيد المراجعة'
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
      toast.error('فشل تحديث حالة الطلب، تأكد من الاتصال وصلاحيات Supabase');
    } finally {
      setUpdatingId(null);
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
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('فشل حذف الاستمارة');
    } finally {
      setUpdatingId(null);
    }
  };

  // Collect All Unique Teacher Subjects (Specializations + Group Subjects)
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
      // Status Filter
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;

      // Grade Filter
      if (gradeFilter !== 'all' && item.academic_grade !== gradeFilter) return false;

      // Education Type Filter
      if (educationTypeFilter !== 'all' && item.education_type !== educationTypeFilter) return false;

      // Gender Filter
      if (genderFilter !== 'all' && item.gender !== genderFilter) return false;

      // Search Query
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
      // Status Filter
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;

      const groups = parseGroupsData(item);

      // Subject Filter (Matches specialization OR any group's subject)
      if (subjectFilter !== 'all') {
        const matchesSpec = item.specialization?.includes(subjectFilter);
        const matchesGroupSub = groups.some((g) => g.subject?.includes(subjectFilter));
        if (!matchesSpec && !matchesGroupSub) return false;
      }

      // Day Filter (Matches any group's day)
      if (dayFilter !== 'all') {
        const matchesDay = groups.some((g) => g.day === dayFilter);
        if (!matchesDay) return false;
      }

      // Grade Filter (Matches target_grades OR any group's grade)
      if (gradeFilter !== 'all') {
        const matchesTarget = item.target_grades?.includes(gradeFilter);
        const matchesGroupGrd = groups.some((g) => g.grade === gradeFilter);
        if (!matchesTarget && !matchesGroupGrd) return false;
      }

      // Search
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

    const latestStudent = students[0];
    const latestTeacher = teachers[0];

    return {
      totalStudents: students.length,
      studentPending,
      studentApproved,
      totalTeachers: teachers.length,
      teacherPending,
      teacherApproved,
      totalGroups,
      totalApproved: studentApproved + teacherApproved,
      latestDate: latestStudent?.created_at || latestTeacher?.created_at,
    };
  }, [students, teachers]);

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
          .logo { max-height: 70px; }
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
          @media print { body { padding: 15px; } button { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">أكاديمية أطلس التعليمية — استمارة انضمام معلّم</h1>
            <div class="subtitle">رقم الطلب المرجعي: ${teacher.id.slice(0, 8).toUpperCase()} • تاريخ التقديم: ${formatArabicDateTime(teacher.created_at)}</div>
          </div>
          ${teacher.logo_url ? `<img src="${teacher.logo_url}" class="logo" />` : ''}
        </div>

        <div class="grid">
          <div class="card">
            <span class="label">اسم المعلم الكامل:</span>
            <span class="val">${teacher.full_name} ${teacher.nickname ? `(${teacher.nickname})` : ''}</span>
          </div>
          <div class="card">
            <span class="label">المواد التعليمية التخصصية:</span>
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
    <div className="space-y-6 pb-12 animate-fade-in font-sans" dir="rtl">
      
      {/* Top Header & Actions */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 text-xs font-bold text-sky-600 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>بوابة التسجيل والتقديم الإلكتروني (أونلاين)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
            استمارات الطلاب والمعلمين المسجلين
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            متابعة فورية لطلبات التقديم، مراجعة وتدقيق كافة البيانات، جداول المجموعات ومادة كل مجموعة، اعتماد الطلبات والتواصل المباشر
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={fetchData}
            disabled={isRefreshing}
            className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            title="تحديث البيانات من سوبابيز"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-sky-600' : ''} />
            <span>تحديث البيانات</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs sm:text-sm font-bold flex items-center gap-2 border border-sky-200 transition-all cursor-pointer"
          >
            <Printer size={16} />
            <span className="hidden sm:inline">طباعة التقرير</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-1">طلبات تسجيل الطلاب</span>
            <span className="text-2xl font-black text-slate-800">{stats.totalStudents}</span>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                {stats.studentPending} قيد المراجعة
              </span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                {stats.studentApproved} معتمد
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            <Users size={24} />
          </div>
        </div>

        {/* Total Teachers */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-1">طلبات انضمام المعلمين</span>
            <span className="text-2xl font-black text-slate-800">{stats.totalTeachers}</span>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                {stats.teacherPending} قيد المراجعة
              </span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                {stats.teacherApproved} معتمد
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <GraduationCap size={24} />
          </div>
        </div>

        {/* Total Groups Scheduled */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-1">إجمالي المجموعات المقترحة</span>
            <span className="text-2xl font-black text-purple-600">{stats.totalGroups}</span>
            <span className="text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded inline-block mt-2 font-medium">
              مجموعات وحصص مسجلة بالمواد
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Clock size={24} />
          </div>
        </div>

        {/* Total Approved */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-1">إجمالي المعتمدين والمقبولين</span>
            <span className="text-2xl font-black text-emerald-600">{stats.totalApproved}</span>
            <span className="text-[11px] text-slate-500 block mt-2">
              جاهزون للاستيراد وتوزيع القاعات والكروت
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={24} />
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200 gap-3">
        <button
          onClick={() => {
            setActiveTab('students');
            setStatusFilter('all');
            setSearchQuery('');
            setGradeFilter('all');
          }}
          className={`pb-3 px-5 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'students'
              ? 'border-sky-600 text-sky-700 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users size={18} />
          <span>استمارات الطلاب</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700">
            {students.length}
          </span>
          {stats.studentPending > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500" title="يوجد طلبات جديدة" />
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('teachers');
            setStatusFilter('all');
            setSearchQuery('');
            setSubjectFilter('all');
            setDayFilter('all');
          }}
          className={`pb-3 px-5 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'teachers'
              ? 'border-rose-600 text-rose-700 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <GraduationCap size={18} />
          <span>استمارات المعلمين ومجموعات المواد</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700">
            {teachers.length}
          </span>
          {stats.teacherPending > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500" title="يوجد طلبات جديدة" />
          )}
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 flex flex-col md:flex-row flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[260px] w-full">
          <Search size={18} className="absolute right-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'students'
                ? 'ابحث باسم الطالب، هاتف الطالب أو الأب، الرقم القومي، المدرسة، العنوان...'
                : 'ابحث باسم المعلم، اللقب، الهاتف، المادة، مادة المجموعة، اليوم، المساعد...'
            }
            className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
          />
        </div>

        {/* Status Filter */}
        <div className="w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white font-medium cursor-pointer"
          >
            <option value="all">كافة الحالات</option>
            <option value="pending">⏳ قيد المراجعة</option>
            <option value="approved">✓ معتمد ومقبول</option>
            <option value="rejected">✕ مرفوض</option>
          </select>
        </div>

        {/* Filters For Teachers Tab */}
        {activeTab === 'teachers' && (
          <>
            {/* Subject Filter (Specializations & Group Subjects) */}
            <div className="w-full sm:w-auto">
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-purple-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-purple-50/50 font-medium text-purple-900 cursor-pointer"
              >
                <option value="all">كافة المواد التخصصية</option>
                {uniqueTeacherSubjects.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            {/* Day Filter */}
            <div className="w-full sm:w-auto">
              <select
                value={dayFilter}
                onChange={(e) => setDayFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white font-medium cursor-pointer"
              >
                <option value="all">كافة أيام الأسبوع</option>
                {ALL_DAYS.map((d) => (
                  <option key={d} value={d}>مجموعات يوم {d}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* Filters For Students Tab */}
        {activeTab === 'students' && (
          <>
            {/* Grade Filter */}
            <div className="w-full sm:w-auto">
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white font-medium cursor-pointer"
              >
                <option value="all">كافة الصفوف الدراسية</option>
                <option value="الصف الأول الثانوي">أولى ثانوي</option>
                <option value="الصف الثاني الثانوي">تانية ثانوي</option>
                <option value="الصف الثالث الثانوي">تالتة ثانوي</option>
                <option value="الصف الأول الإعدادي">أولى إعدادي</option>
                <option value="الصف الثاني الإعدادي">تانية إعدادي</option>
                <option value="الصف الثالث الإعدادي">تالتة إعدادي</option>
                <option value="الصف السادس الابتدائي">سادسة ابتدائي</option>
                <option value="الصف الخامس الابتدائي">خامسة ابتدائي</option>
                <option value="الصف الرابع الابتدائي">رابعة ابتدائي</option>
              </select>
            </div>

            {/* Education Type Filter */}
            <div className="w-full sm:w-auto">
              <select
                value={educationTypeFilter}
                onChange={(e) => setEducationTypeFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white font-medium cursor-pointer"
              >
                <option value="all">كافة أنواع التعليم</option>
                <option value="عام">تعليم عام</option>
                <option value="لغات">تجريبي / لغات</option>
                <option value="أزهر">أزهر شريف</option>
              </select>
            </div>

            {/* Gender Filter */}
            <div className="w-full sm:w-auto">
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white font-medium cursor-pointer"
              >
                <option value="all">الذكور والإناث</option>
                <option value="male">بنين (ذكور)</option>
                <option value="female">بنات (إناث)</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* ============================================================
          MAIN DATA CONTENT (STUDENTS OR TEACHERS)
          ============================================================ */}
      {isLoading ? (
        <div className="bg-white rounded-3xl p-16 text-center shadow-xs border border-slate-100">
          <RefreshCw size={36} className="animate-spin text-sky-600 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-bold">جاري تحميل الاستمارات الإلكترونية من السيرفر السحابي...</p>
        </div>
      ) : activeTab === 'students' ? (
        /* ==================== STUDENTS TABLE ==================== */
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {filteredStudents.length === 0 ? (
            <div className="p-16 text-center">
              <Users size={48} className="text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">لا توجد استمارات طلاب مسجلة تطابق البحث</h3>
              <p className="text-slate-400 text-xs mt-1">تأكد من شروط الفلترة أو جرب البحث بكلمات أخرى</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[11px] sm:text-xs">
                    <th className="py-3.5 px-4 font-bold">الطالب</th>
                    <th className="py-3.5 px-4 font-bold">الصف ونوع التعليم</th>
                    <th className="py-3.5 px-4 font-bold">المدرسة والعنوان</th>
                    <th className="py-3.5 px-4 font-bold">أرقام التواصل</th>
                    <th className="py-3.5 px-4 font-bold">تاريخ التقديم</th>
                    <th className="py-3.5 px-4 font-bold text-center">الحالة</th>
                    <th className="py-3.5 px-4 font-bold text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student) => {
                    const isElementaryNoPhone = student.phone?.includes('طالب ابتدائي') || student.phone?.includes('لا يوجد');

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Student Name & Photo */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div 
                              onClick={() => student.photo_url ? setPreviewImage({ url: student.photo_url, title: student.full_name }) : setSelectedStudent(student)}
                              className="w-11 h-11 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                              title="اضغط للمعاينة المكبرة"
                            >
                              {student.photo_url ? (
                                <img
                                  src={student.photo_url}
                                  alt={student.full_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                  <User size={18} />
                                </div>
                              )}
                            </div>
                            <div>
                              <span 
                                onClick={() => setSelectedStudent(student)}
                                className="font-bold text-slate-800 hover:text-sky-600 cursor-pointer block"
                              >
                                {student.full_name}
                              </span>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                                <span className="font-mono">الرقم القومي: {student.national_id || 'غير مسجل'}</span>
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
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-700 block">{student.academic_grade}</span>
                          <span className="text-[11px] text-sky-600 bg-sky-50 px-2 py-0.5 rounded font-semibold inline-block mt-0.5">
                            {student.education_type}
                          </span>
                        </td>

                        {/* School Name & Address */}
                        <td className="py-3.5 px-4">
                          <span className="text-slate-700 text-xs font-semibold block">{student.school_name || 'غير مسجل'}</span>
                          <span className="text-[11px] text-slate-400 block truncate max-w-[160px]">
                            {student.address || 'العنوان غير مسجل'}
                          </span>
                        </td>

                        {/* Phones & Direct WhatsApp */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 font-mono text-xs">
                              <span className="text-slate-500 text-[10px]">الطالب:</span>
                              {isElementaryNoPhone ? (
                                <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-sans font-bold">
                                  طالب بدون هاتف
                                </span>
                              ) : (
                                <>
                                  <span className="font-bold text-slate-800">{student.phone}</span>
                                  <a
                                    href={getDirectWhatsAppUrl(student.phone, `أهلاً بك يا ${student.full_name}، نود إعلامك بشأن استمارة طلبك في أكاديمية أطلس التعليمية.`)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-emerald-600 hover:text-emerald-700 p-0.5"
                                    title="محادثة واتساب"
                                  >
                                    <MessageCircle size={14} />
                                  </a>
                                </>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
                              <span>ولي الأمر:</span>
                              <span className="font-semibold text-slate-700">{student.father_phone}</span>
                              <a
                                href={getDirectWhatsAppUrl(student.father_phone, `السلام عليكم، بخصوص استمارة تسجيل الطالب/ة ${student.full_name} في أكاديمية أطلس.`)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-600 hover:text-emerald-700 p-0.5"
                                title="محادثة ولي الأمر واتساب"
                              >
                                <MessageCircle size={14} />
                              </a>
                            </div>
                          </div>
                        </td>

                        {/* Registration Date/Time */}
                        <td className="py-3.5 px-4">
                          <span className="text-xs font-semibold text-slate-700 block">
                            {formatArabicDateTime(student.created_at)}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          {student.status === 'approved' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={12} />
                              <span>معتمد</span>
                            </span>
                          ) : student.status === 'rejected' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle size={12} />
                              <span>مرفوض</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock size={12} />
                              <span>قيد المراجعة</span>
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* View Full Details */}
                            <button
                              type="button"
                              onClick={() => setSelectedStudent(student)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                              title="عرض كافة التفاصيل"
                            >
                              <Eye size={15} />
                            </button>

                            {/* Print Application */}
                            <button
                              type="button"
                              onClick={() => printStudentApplication(student)}
                              className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 transition-colors cursor-pointer"
                              title="طباعة الاستمارة"
                            >
                              <Printer size={15} />
                            </button>

                            {/* Approve */}
                            {student.status !== 'approved' && (
                              <button
                                type="button"
                                disabled={updatingId === student.id}
                                onClick={() => handleUpdateStatus('student', student.id, 'approved')}
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                                title="اعتماد وقبول"
                              >
                                <CheckCircle2 size={15} />
                              </button>
                            )}

                            {/* Reject */}
                            {student.status !== 'rejected' && (
                              <button
                                type="button"
                                disabled={updatingId === student.id}
                                onClick={() => handleUpdateStatus('student', student.id, 'rejected')}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                                title="رفض الطلب"
                              >
                                <XCircle size={15} />
                              </button>
                            )}

                            {/* Delete */}
                            <button
                              type="button"
                              disabled={updatingId === student.id}
                              onClick={() => handleDeleteRecord('student', student.id, student.full_name)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="حذف الاستمارة"
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
          )}
        </div>
      ) : (
        /* ==================== TEACHERS TABLE ==================== */
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {filteredTeachers.length === 0 ? (
            <div className="p-16 text-center">
              <GraduationCap size={48} className="text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">لا توجد استمارات معلمين مسجلة تطابق البحث</h3>
              <p className="text-slate-400 text-xs mt-1">تأكد من شروط الفلترة أو جرب البحث بكلمات أخرى</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[11px] sm:text-xs">
                    <th className="py-3.5 px-4 font-bold">المعلم</th>
                    <th className="py-3.5 px-4 font-bold">المواد التعليمية</th>
                    <th className="py-3.5 px-4 font-bold">المراحل المستهدفة</th>
                    <th className="py-3.5 px-4 font-bold min-w-[260px]">المجموعات ومواعيد الحصص (مادة كل مجموعة)</th>
                    <th className="py-3.5 px-4 font-bold">فريق المساعدين</th>
                    <th className="py-3.5 px-4 font-bold">أرقام التواصل</th>
                    <th className="py-3.5 px-4 font-bold">تاريخ التقديم</th>
                    <th className="py-3.5 px-4 font-bold text-center">الحالة</th>
                    <th className="py-3.5 px-4 font-bold text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTeachers.map((teacher) => {
                    const assistants = parseAssistantsData(teacher);
                    const groups = parseGroupsData(teacher);
                    const specs = (teacher.specialization || '').split(/[،,]/).map((s) => s.trim()).filter(Boolean);

                    return (
                      <tr key={teacher.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Teacher Name & Photo */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div 
                              onClick={() => teacher.photo_url ? setPreviewImage({ url: teacher.photo_url, title: teacher.full_name }) : setSelectedTeacher(teacher)}
                              className="w-11 h-11 rounded-xl overflow-hidden bg-rose-50 border border-rose-200 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                              title="اضغط للمعاينة المكبرة"
                            >
                              {teacher.photo_url ? (
                                <img
                                  src={teacher.photo_url}
                                  alt={teacher.full_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-rose-400">
                                  <GraduationCap size={18} />
                                </div>
                              )}
                            </div>
                            <div>
                              <span 
                                onClick={() => setSelectedTeacher(teacher)}
                                className="font-bold text-slate-800 hover:text-rose-600 cursor-pointer block"
                              >
                                {teacher.nickname ? `${teacher.nickname}` : teacher.full_name}
                              </span>
                              <span className="text-[11px] text-slate-500 block truncate max-w-[160px]">
                                {teacher.full_name}
                              </span>
                              {teacher.national_id && (
                                <span className="text-[10px] font-mono text-slate-400 block">
                                  {teacher.national_id}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Specialization / Subjects Badges */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {specs.map((s, idx) => (
                              <span key={idx} className="bg-rose-50 text-rose-800 text-[11px] font-bold px-2 py-0.5 rounded-md border border-rose-200">
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Target Grades */}
                        <td className="py-3.5 px-4">
                          <span className="text-slate-600 text-xs block line-clamp-2 max-w-[180px]">
                            {teacher.target_grades || 'غير محدد'}
                          </span>
                        </td>

                        {/* Groups & Scheduling with Subject of Each Group */}
                        <td className="py-3.5 px-4">
                          {groups.length === 0 ? (
                            <span className="text-slate-400 text-xs">لا توجد مواعيد مسجلة</span>
                          ) : (
                            <div className="space-y-1.5 max-w-[280px]">
                              {groups.slice(0, 3).map((grp, idx) => (
                                <div 
                                  key={idx} 
                                  className="p-1.5 rounded-lg bg-purple-50/90 border border-purple-200/80 flex items-center justify-between text-[11px] gap-1.5"
                                >
                                  <div className="flex items-center gap-1 font-semibold text-purple-950 truncate">
                                    <span className="text-purple-600 font-bold">{grp.day}:</span>
                                    <span className="font-mono text-slate-700">{formatTime12H(grp.start_time)}</span>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <span className="font-bold text-purple-800 bg-purple-100/90 px-1.5 py-0.5 rounded text-[10px] border border-purple-300">
                                      مادة: {grp.subject}
                                    </span>
                                    <span className="text-[10px] text-slate-500 hidden sm:inline">
                                      ({grp.grade?.replace('الصف ', '')})
                                    </span>
                                  </div>
                                </div>
                              ))}
                              {groups.length > 3 && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedTeacher(teacher)}
                                  className="text-[11px] text-purple-700 font-bold hover:underline block"
                                >
                                  + {groups.length - 3} مجموعات أخرى (اضغط للعرض)
                                </button>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Assistants Team */}
                        <td className="py-3.5 px-4">
                          {assistants.length === 0 ? (
                            <span className="text-slate-400 text-xs">إدارة شخصية</span>
                          ) : (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                <span>{assistants.length} مساعد مسجل</span>
                              </span>
                              <div className="text-[11px] text-slate-600 truncate max-w-[140px]">
                                {assistants[0]?.name}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Contact & WhatsApp */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 font-mono text-xs">
                              <span className="font-bold text-slate-800">{teacher.phone}</span>
                            </div>
                            {teacher.whatsapp_phone && (
                              <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-700">
                                <span>{teacher.whatsapp_phone}</span>
                                <a
                                  href={getDirectWhatsAppUrl(teacher.whatsapp_phone, `مرحباً بحضرتك يا ${teacher.nickname || teacher.full_name}، نود التواصل معكم من إدارة أكاديمية أطلس.`)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-emerald-600 hover:text-emerald-700 p-0.5"
                                  title="محادثة واتساب مباشرة"
                                >
                                  <MessageCircle size={14} />
                                </a>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Registration Date/Time */}
                        <td className="py-3.5 px-4">
                          <span className="text-xs font-semibold text-slate-700 block">
                            {formatArabicDateTime(teacher.created_at)}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          {teacher.status === 'approved' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={12} />
                              <span>معتمد</span>
                            </span>
                          ) : teacher.status === 'rejected' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle size={12} />
                              <span>مرفوض</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock size={12} />
                              <span>قيد المراجعة</span>
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* View Full Details */}
                            <button
                              type="button"
                              onClick={() => setSelectedTeacher(teacher)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                              title="عرض كافة التفاصيل والجدول"
                            >
                              <Eye size={15} />
                            </button>

                            {/* Print Application */}
                            <button
                              type="button"
                              onClick={() => printTeacherApplication(teacher)}
                              className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors cursor-pointer"
                              title="طباعة استمارة وجدول المعلم"
                            >
                              <Printer size={15} />
                            </button>

                            {/* Approve */}
                            {teacher.status !== 'approved' && (
                              <button
                                type="button"
                                disabled={updatingId === teacher.id}
                                onClick={() => handleUpdateStatus('teacher', teacher.id, 'approved')}
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                                title="اعتماد وقبول"
                              >
                                <CheckCircle2 size={15} />
                              </button>
                            )}

                            {/* Reject */}
                            {teacher.status !== 'rejected' && (
                              <button
                                type="button"
                                disabled={updatingId === teacher.id}
                                onClick={() => handleUpdateStatus('teacher', teacher.id, 'rejected')}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                                title="رفض الطلب"
                              >
                                <XCircle size={15} />
                              </button>
                            )}

                            {/* Delete */}
                            <button
                              type="button"
                              disabled={updatingId === teacher.id}
                              onClick={() => handleDeleteRecord('teacher', teacher.id, teacher.full_name)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="حذف الاستمارة"
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
          )}
        </div>
      )}

      {/* ============================================================
          STUDENT DETAILS MODAL
          ============================================================ */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 p-6 sm:p-8 text-right">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
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
                  <h3 className="text-xl font-black text-slate-800">{selectedStudent.full_name}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs text-slate-600 font-semibold">{selectedStudent.academic_grade}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                      {selectedStudent.education_type}
                    </span>
                    {selectedStudent.gender && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${selectedStudent.gender === 'female' ? 'bg-pink-50 text-pink-700' : 'bg-blue-50 text-blue-700'}`}>
                        {selectedStudent.gender === 'female' ? 'أنثى' : 'ذكر'}
                      </span>
                    )}
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
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body Details Grid */}
            <div className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-xs">رقم الهاتف (الطالب):</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    {selectedStudent.phone?.includes('طالب ابتدائي') || selectedStudent.phone?.includes('لا يوجد') ? (
                      <span className="text-xs font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded">
                        طالب ابتدائي بدون هاتف (التواصل عبر ولي الأمر)
                      </span>
                    ) : (
                      <>
                        <span className="font-bold font-mono text-slate-800">{selectedStudent.phone}</span>
                        <a
                          href={getDirectWhatsAppUrl(selectedStudent.phone, `أهلاً بك يا ${selectedStudent.full_name}`)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-600 hover:underline flex items-center gap-1 text-xs"
                        >
                          <MessageCircle size={14} />
                          <span>واتساب</span>
                        </a>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-xs">الرقم القومي:</span>
                  <span className="font-bold font-mono text-slate-800">{selectedStudent.national_id || 'غير متوفر'}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-xs">تاريخ الميلاد:</span>
                  <span className="font-bold text-slate-800">{selectedStudent.birth_date || 'غير محدد'}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-xs">هاتف ولي الأمر (الأب):</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-bold font-mono text-slate-800">{selectedStudent.father_phone}</span>
                    <a
                      href={getDirectWhatsAppUrl(selectedStudent.father_phone, `السلام عليكم، بخصوص تسجيل الطالب/ة ${selectedStudent.full_name}`)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-600 hover:underline flex items-center gap-1 text-xs"
                    >
                      <MessageCircle size={14} />
                      <span>واتساب</span>
                    </a>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-xs">هاتف الوالدة:</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-bold font-mono text-slate-800">{selectedStudent.mother_phone || 'غير مسجل'}</span>
                    {selectedStudent.mother_phone && (
                      <a
                        href={getDirectWhatsAppUrl(selectedStudent.mother_phone, `السلام عليكم، بخصوص الطالب/ة ${selectedStudent.full_name}`)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 hover:underline flex items-center gap-1 text-xs"
                      >
                        <MessageCircle size={14} />
                        <span>واتساب</span>
                      </a>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-xs">وظيفة / مهنة ولي الأمر:</span>
                  <span className="font-bold text-slate-800">{selectedStudent.parent_job || 'غير مسجل'}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-xs">المدرسة الحالية:</span>
                  <span className="font-bold text-slate-800">{selectedStudent.school_name || 'غير مسجل'}</span>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-slate-400 block text-xs">العنوان بالتفصيل:</span>
                  <span className="font-bold text-slate-800">{selectedStudent.address || 'غير مسجل'}</span>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-slate-400 block text-xs">تاريخ ووقت التقديم (معاد التسجيل):</span>
                  <span className="font-bold text-sky-700">{formatArabicDateTime(selectedStudent.created_at)}</span>
                </div>
              </div>

              {/* Notes */}
              {selectedStudent.notes && (
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs">
                  <span className="font-bold text-amber-900 block mb-1">ملاحظات الطالب / الرغبات:</span>
                  <p className="text-amber-800 whitespace-pre-line">{selectedStudent.notes}</p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {selectedStudent.status !== 'approved' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('student', selectedStudent.id, 'approved')}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <CheckCircle2 size={16} />
                    <span>اعتماد وقبول الطلب</span>
                  </button>
                )}

                {selectedStudent.status !== 'rejected' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('student', selectedStudent.id, 'rejected')}
                    className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <XCircle size={16} />
                    <span>رفض الطلب</span>
                  </button>
                )}

                {selectedStudent.status !== 'pending' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('student', selectedStudent.id, 'pending')}
                    className="px-3 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Clock size={16} />
                    <span>إرجاع لقيد المراجعة</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                إغلاق النافذة
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================
          TEACHER DETAILS MODAL (WITH GROUPS & SUBJECT OF EACH GROUP)
          ============================================================ */}
      {selectedTeacher && (() => {
        const groups = parseGroupsData(selectedTeacher);
        const assistants = parseAssistantsData(selectedTeacher);
        const specs = (selectedTeacher.specialization || '').split(/[،,]/).map((s) => s.trim()).filter(Boolean);
        const targetGrds = (selectedTeacher.target_grades || '').split(/[،,]/).map((g) => g.trim()).filter(Boolean);

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 p-6 sm:p-8 text-right">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
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
                    <h3 className="text-xl font-black text-slate-800">
                      {selectedTeacher.nickname ? `${selectedTeacher.nickname}` : selectedTeacher.full_name}
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold">{selectedTeacher.full_name}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {specs.map((s, idx) => (
                        <span key={idx} className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
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
                      title="اضغط لتكبير الشعار"
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
                    title="طباعة الاستمارة والجدول"
                  >
                    <Printer size={16} />
                    <span className="hidden sm:inline">طباعة</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTeacher(null)}
                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="space-y-5 text-xs sm:text-sm">
                
                {/* General Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-xs">الهاتف الشخصي:</span>
                    <span className="font-bold font-mono text-slate-800">{selectedTeacher.phone}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-xs">رقم الواتساب المعتمد:</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-bold font-mono text-slate-800">{selectedTeacher.whatsapp_phone || selectedTeacher.phone}</span>
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
                    <span className="text-slate-400 block text-xs">الرقم القومي:</span>
                    <span className="font-bold font-mono text-slate-800">{selectedTeacher.national_id || 'غير مسجل'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-xs">كود الطلب المرجعي:</span>
                    <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      {selectedTeacher.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-xs mb-1">المراحل والصفوف الدراسية:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {targetGrds.map((g, idx) => (
                        <span key={idx} className="bg-white border border-slate-200 text-slate-700 font-semibold px-2.5 py-0.5 rounded-lg text-xs">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-xs">تاريخ ووقت استلام الاستمارة:</span>
                    <span className="font-bold text-rose-700">{formatArabicDateTime(selectedTeacher.created_at)}</span>
                  </div>
                </div>

                {/* ============================================================
                    GROUPS & SCHEDULES SECTION (CLEARLY SHOWING SUBJECT PER GROUP)
                    ============================================================ */}
                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-purple-950 flex items-center gap-2 text-xs sm:text-sm">
                      <Clock size={17} className="text-purple-600" />
                      <span>جدول الحصص والمجموعات المقترحة لكل مادة:</span>
                    </h4>
                    <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-300">
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
                            className="p-3.5 rounded-xl bg-white border border-purple-200 shadow-2xs space-y-2"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-100 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-bold">
                                  {idx + 1}
                                </span>
                                <span className="font-bold text-purple-950 text-sm">المجموعة رقم {idx + 1}</span>
                              </div>

                              {/* Group Subject Highlight */}
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
                                <span className="text-slate-400 block text-[11px]">توقيت الحصة:</span>
                                <span className="font-mono font-bold text-slate-800">
                                  من {formatTime12H(grp.start_time, true)} إلى {formatTime12H(grp.end_time, true)}
                                </span>
                              </div>

                              <div>
                                <span className="text-slate-400 block text-[11px]">مدة الحصة:</span>
                                <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded inline-block">
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
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-amber-950 flex items-center gap-2 text-xs sm:text-sm">
                      <Users size={17} className="text-amber-600" />
                      <span>فريق العمل والمساعدين (السكرتارية):</span>
                    </h4>
                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                      {assistants.length} مساعد
                    </span>
                  </div>

                  {assistants.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {assistants.map((asst, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-white border border-amber-200 flex items-center justify-between text-xs shadow-2xs">
                          <div>
                            <span className="font-bold text-slate-800 block">مساعد {idx + 1}: {asst.name}</span>
                            <span className="font-mono text-slate-600 block mt-0.5">{asst.phone}</span>
                          </div>
                          {asst.phone && (
                            <div className="flex items-center gap-1.5">
                              <a
                                href={getDirectWhatsAppUrl(asst.phone, `السلام عليكم أ/ ${asst.name}`)}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center gap-1 text-xs font-semibold"
                                title="محادثة واتساب"
                              >
                                <MessageCircle size={14} />
                                <span>واتساب</span>
                              </a>
                            </div>
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
                          <span>صفحة الفيسبوك</span>
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
                          <span>قناة اليوتيوب</span>
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
                          <span>جروب التليجرام</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes & Hall Requirements */}
                {selectedTeacher.notes && (
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs">
                    <span className="font-bold text-amber-900 block mb-1">ملاحظات ومتطلبات خاصة بالقاعات:</span>
                    <p className="text-amber-800 whitespace-pre-line">{selectedTeacher.notes}</p>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {selectedTeacher.status !== 'approved' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus('teacher', selectedTeacher.id, 'approved')}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <CheckCircle2 size={16} />
                      <span>اعتماد وقبول المعلم</span>
                    </button>
                  )}

                  {selectedTeacher.status !== 'rejected' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus('teacher', selectedTeacher.id, 'rejected')}
                      className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <XCircle size={16} />
                      <span>رفض الطلب</span>
                    </button>
                  )}

                  {selectedTeacher.status !== 'pending' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus('teacher', selectedTeacher.id, 'pending')}
                      className="px-3 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Clock size={16} />
                      <span>إرجاع لقيد المراجعة</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTeacher(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
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
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-4 max-w-xl w-full shadow-2xl border border-slate-200 text-center relative"
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
