import { useState, useEffect, useMemo } from 'react';
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
  Info
} from 'lucide-react';

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
  const [subjectFilter, setSubjectFilter] = useState('all');

  // Selected item for modal
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

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

  // Quick WhatsApp Link Generator
  const getWhatsAppLink = (phone, text) => {
    if (!phone) return '#';
    let clean = String(phone).replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '2' + clean;
    return `https://wa.me/${clean}?text=${encodeURIComponent(text || '')}`;
  };

  // Format Arabic Date & Time
  const formatDateTime = (dateStr) => {
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

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((item) => {
      // Status Filter
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;

      // Grade Filter
      if (gradeFilter !== 'all' && item.academic_grade !== gradeFilter) return false;

      // Education Type Filter
      if (educationTypeFilter !== 'all' && item.education_type !== educationTypeFilter) return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.full_name?.toLowerCase().includes(q);
        const matchesPhone = item.phone?.includes(q);
        const matchesFather = item.father_phone?.includes(q);
        const matchesNid = item.national_id?.includes(q);
        const matchesSchool = item.school_name?.toLowerCase().includes(q);
        return matchesName || matchesPhone || matchesFather || matchesNid || matchesSchool;
      }

      return true;
    });
  }, [students, statusFilter, gradeFilter, educationTypeFilter, searchQuery]);

  // Filtered Teachers
  const filteredTeachers = useMemo(() => {
    return teachers.filter((item) => {
      // Status Filter
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;

      // Subject Filter
      if (subjectFilter !== 'all' && !item.specialization?.includes(subjectFilter)) return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.full_name?.toLowerCase().includes(q);
        const matchesNick = item.nickname?.toLowerCase().includes(q);
        const matchesPhone = item.phone?.includes(q);
        const matchesWhatsapp = item.whatsapp_phone?.includes(q);
        const matchesSpecialization = item.specialization?.toLowerCase().includes(q);
        return matchesName || matchesNick || matchesPhone || matchesWhatsapp || matchesSpecialization;
      }

      return true;
    });
  }, [teachers, statusFilter, subjectFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const studentPending = students.filter((s) => s.status === 'pending').length;
    const studentApproved = students.filter((s) => s.status === 'approved').length;
    const teacherPending = teachers.filter((t) => t.status === 'pending').length;
    const teacherApproved = teachers.filter((t) => t.status === 'approved').length;

    const latestStudent = students[0];
    const latestTeacher = teachers[0];

    return {
      totalStudents: students.length,
      studentPending,
      studentApproved,
      totalTeachers: teachers.length,
      teacherPending,
      teacherApproved,
      totalApproved: studentApproved + teacherApproved,
      latestDate: latestStudent?.created_at || latestTeacher?.created_at,
    };
  }, [students, teachers]);

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
            متابعة فورية لطلبات التقديم السحابية، مراجعة وتدقيق البيانات، اعتماد الطلبات والتواصل المباشر عبر واتساب
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

        {/* Latest Activity */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-1">أحدث طلب مسجل</span>
            <span className="text-xs font-bold text-slate-700 block mt-1 line-clamp-1">
              {formatDateTime(stats.latestDate)}
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded inline-block mt-2">
              مزامنة حية من Supabase
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Clock size={24} />
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
          }}
          className={`pb-3 px-5 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'teachers'
              ? 'border-rose-600 text-rose-700 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <GraduationCap size={18} />
          <span>استمارات المعلمين</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700">
            {teachers.length}
          </span>
          {stats.teacherPending > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500" title="يوجد طلبات جديدة" />
          )}
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute right-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'students'
                ? 'ابحث باسم الطالب، رقم هاتف الطالب أو الأب، الرقم القومي، المدرسة...'
                : 'ابحث باسم المعلم، اللقب، رقم الهاتف، أو المادة...'
            }
            className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
          />
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white font-medium"
          >
            <option value="all">كافة الحالات</option>
            <option value="pending">⏳ قيد المراجعة</option>
            <option value="approved">✓ معتمد ومقبول</option>
            <option value="rejected">✕ مرفوض</option>
          </select>
        </div>

        {/* Grade Filter (For Students) */}
        {activeTab === 'students' && (
          <div className="w-full md:w-auto">
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white font-medium"
            >
              <option value="all">كافة الصفوف الدراسية</option>
              <option value="الصف الأول الثانوي">أولى ثانوي</option>
              <option value="الصف الثاني الثانوي">تانية ثانوي</option>
              <option value="الصف الثالث الثانوي">تالتة ثانوي</option>
              <option value="الصف الأول الإعدادي">أولى إعدادي</option>
              <option value="الصف الثاني الإعدادي">تانية إعدادي</option>
              <option value="الصف الثالث الإعدادي">تالتة إعدادي</option>
            </select>
          </div>
        )}

        {/* Education Type Filter (For Students) */}
        {activeTab === 'students' && (
          <div className="w-full md:w-auto">
            <select
              value={educationTypeFilter}
              onChange={(e) => setEducationTypeFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white font-medium"
            >
              <option value="all">كافة أنواع التعليم</option>
              <option value="عام">تعليم عام</option>
              <option value="لغات">تجريبي / لغات</option>
              <option value="أزهر">أزهر شريف</option>
            </select>
          </div>
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
                    <th className="py-3.5 px-4 font-bold">المدرسة</th>
                    <th className="py-3.5 px-4 font-bold">أرقام التواصل</th>
                    <th className="py-3.5 px-4 font-bold">معاد وتاريخ التقديم</th>
                    <th className="py-3.5 px-4 font-bold text-center">الحالة</th>
                    <th className="py-3.5 px-4 font-bold text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student) => {
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Student Name & Photo */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div 
                              onClick={() => setSelectedStudent(student)}
                              className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
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
                              <span className="text-[11px] text-slate-400 font-mono">
                                الرقم القومي: {student.national_id || 'غير مسجل'}
                              </span>
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

                        {/* School Name */}
                        <td className="py-3.5 px-4">
                          <span className="text-slate-600 text-xs block">{student.school_name}</span>
                          <span className="text-[11px] text-slate-400 block truncate max-w-[150px]">
                            {student.address}
                          </span>
                        </td>

                        {/* Phones & Direct WhatsApp */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 font-mono text-xs">
                              <span className="text-slate-500 text-[10px]">الطالب:</span>
                              <span className="font-bold text-slate-800">{student.phone}</span>
                              <a
                                href={getWhatsAppLink(student.phone, `أهلاً بك يا ${student.full_name}، نود إعلامك بشأن طلبك في أكاديمية أطلس التعليمية.`)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-600 hover:text-emerald-700 p-0.5"
                                title="محادثة واتساب"
                              >
                                <MessageCircle size={13} />
                              </a>
                            </div>

                            <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
                              <span>ولي الأمر:</span>
                              <span>{student.father_phone}</span>
                              <a
                                href={getWhatsAppLink(student.father_phone, `السلام عليكم، بخصوص تسجيل الطالب/ة ${student.full_name} في أكاديمية أطلس.`)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-600 hover:text-emerald-700 p-0.5"
                                title="محادثة الأب واتساب"
                              >
                                <MessageCircle size={13} />
                              </a>
                            </div>
                          </div>
                        </td>

                        {/* Registration Date/Time */}
                        <td className="py-3.5 px-4">
                          <span className="text-xs font-semibold text-slate-700 block">
                            {formatDateTime(student.created_at)}
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
                    <th className="py-3.5 px-4 font-bold">فريق العمل والمجموعات</th>
                    <th className="py-3.5 px-4 font-bold">أرقام التواصل</th>
                    <th className="py-3.5 px-4 font-bold">معاد وتاريخ التقديم</th>
                    <th className="py-3.5 px-4 font-bold text-center">الحالة</th>
                    <th className="py-3.5 px-4 font-bold text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTeachers.map((teacher) => {
                    const assistantsCount = Array.isArray(teacher.assistants_data) 
                      ? teacher.assistants_data.length 
                      : (teacher.assistant_name ? 1 : 0);
                    const groupsCount = Array.isArray(teacher.groups_data) ? teacher.groups_data.length : 0;

                    return (
                      <tr key={teacher.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Teacher Name & Photo */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div 
                              onClick={() => setSelectedTeacher(teacher)}
                              className="w-10 h-10 rounded-xl overflow-hidden bg-rose-50 border border-rose-200 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
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
                              <span className="text-[11px] text-slate-400 block truncate max-w-[160px]">
                                {teacher.full_name}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Specialization / Subjects */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-800 text-xs block">
                            {teacher.specialization}
                          </span>
                        </td>

                        {/* Target Grades */}
                        <td className="py-3.5 px-4">
                          <span className="text-slate-600 text-xs block line-clamp-2 max-w-[200px]">
                            {teacher.target_grades}
                          </span>
                        </td>

                        {/* Assistants & Groups Counts */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              <span>المساعدين: {assistantsCount}</span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 mr-1.5">
                              <span>المجموعات: {groupsCount}</span>
                            </span>
                          </div>
                        </td>

                        {/* Contact & WhatsApp */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 font-mono text-xs">
                              <span className="font-bold text-slate-800">{teacher.phone}</span>
                            </div>
                            {teacher.whatsapp_phone && (
                              <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-700">
                                <span>واتساب: {teacher.whatsapp_phone}</span>
                                <a
                                  href={getWhatsAppLink(teacher.whatsapp_phone, `مرحباً بحضرتك يا ${teacher.nickname || teacher.full_name}، نود التواصل معكم من إدارة أكاديمية أطلس.`)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-emerald-600 hover:text-emerald-700 p-0.5"
                                  title="محادثة واتساب مباشرة"
                                >
                                  <MessageCircle size={13} />
                                </a>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Registration Date/Time */}
                        <td className="py-3.5 px-4">
                          <span className="text-xs font-semibold text-slate-700 block">
                            {formatDateTime(teacher.created_at)}
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
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 p-6 sm:p-8 text-right">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                {selectedStudent.photo_url ? (
                  <img
                    src={selectedStudent.photo_url}
                    alt={selectedStudent.full_name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-sky-500 shadow-sm"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                    <User size={28} />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-black text-slate-800">{selectedStudent.full_name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500">{selectedStudent.academic_grade}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded">
                      {selectedStudent.education_type}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body Details Grid */}
            <div className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-xs">رقم الهاتف (الطالب):</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-bold font-mono text-slate-800">{selectedStudent.phone}</span>
                    <a
                      href={getWhatsAppLink(selectedStudent.phone, `أهلاً بك يا ${selectedStudent.full_name}`)}
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
                  <span className="text-slate-400 block text-xs">الرقم القومي:</span>
                  <span className="font-bold font-mono text-slate-800">{selectedStudent.national_id || 'غير متوفر'}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-xs">هاتف ولي الأمر (الأب):</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-bold font-mono text-slate-800">{selectedStudent.father_phone}</span>
                    <a
                      href={getWhatsAppLink(selectedStudent.father_phone, `السلام عليكم، بخصوص تسجيل الطالب/ة ${selectedStudent.full_name}`)}
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
                  <span className="text-slate-400 block text-xs">هاتف الأم:</span>
                  <span className="font-bold font-mono text-slate-800">{selectedStudent.mother_phone || 'غير مسجل'}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-xs">وظيفة ولي الأمر:</span>
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
                  <span className="font-bold text-sky-700">{formatDateTime(selectedStudent.created_at)}</span>
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
          TEACHER DETAILS MODAL
          ============================================================ */}
      {selectedTeacher && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 p-6 sm:p-8 text-right">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                {selectedTeacher.photo_url ? (
                  <img
                    src={selectedTeacher.photo_url}
                    alt={selectedTeacher.full_name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-rose-500 shadow-sm"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                    <GraduationCap size={32} />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-black text-slate-800">
                    {selectedTeacher.nickname || selectedTeacher.full_name}
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold">{selectedTeacher.full_name}</p>
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded inline-block mt-1">
                    {selectedTeacher.specialization}
                  </span>
                </div>
              </div>

              {selectedTeacher.logo_url && (
                <div className="w-14 h-14 rounded-2xl p-1 border border-slate-200 bg-white shadow-xs shrink-0">
                  <img
                    src={selectedTeacher.logo_url}
                    alt="شعار المعلم"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>

            {/* Modal Content */}
            <div className="space-y-5 text-xs sm:text-sm">
              
              {/* General Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-xs">الهاتف الشخصي:</span>
                  <span className="font-bold font-mono text-slate-800">{selectedTeacher.phone}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-xs">رقم الواتساب:</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-bold font-mono text-slate-800">{selectedTeacher.whatsapp_phone}</span>
                    <a
                      href={getWhatsAppLink(selectedTeacher.whatsapp_phone, `مرحباً بحضرتك يا ${selectedTeacher.nickname || selectedTeacher.full_name}`)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-600 hover:underline flex items-center gap-1 text-xs"
                    >
                      <MessageCircle size={13} />
                      <span>محادثة واتساب</span>
                    </a>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-xs">الرقم القومي:</span>
                  <span className="font-bold font-mono text-slate-800">{selectedTeacher.national_id || 'غير مسجل'}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-xs">المراحل والصفوف:</span>
                  <span className="font-bold text-slate-800">{selectedTeacher.target_grades}</span>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-slate-400 block text-xs">معاد وتاريخ التقديم:</span>
                  <span className="font-bold text-rose-700">{formatDateTime(selectedTeacher.created_at)}</span>
                </div>
              </div>

              {/* Groups & Scheduling Table */}
              <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200">
                <h4 className="font-bold text-purple-900 mb-2.5 flex items-center gap-1.5 text-xs sm:text-sm">
                  <Clock size={16} />
                  <span>جدول الحصص والمجموعات المقترحة:</span>
                </h4>

                {Array.isArray(selectedTeacher.groups_data) && selectedTeacher.groups_data.length > 0 ? (
                  <div className="space-y-2">
                    {selectedTeacher.groups_data.map((grp, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-white border border-purple-100 flex flex-wrap items-center justify-between text-xs gap-2">
                        <span className="font-bold text-purple-950">المجموعة {idx + 1}: يوم {grp.day}</span>
                        <span className="font-mono text-slate-700">من {grp.start_time} إلى {grp.end_time}</span>
                        <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-semibold">{grp.grade}</span>
                        <span className="text-slate-600">{grp.subject}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-purple-700">لا توجد مواعيد محددة مسجلة</p>
                )}
              </div>

              {/* Assistants Team */}
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200">
                <h4 className="font-bold text-amber-900 mb-2.5 flex items-center gap-1.5 text-xs sm:text-sm">
                  <Users size={16} />
                  <span>فريق العمل والمساعدين:</span>
                </h4>

                {Array.isArray(selectedTeacher.assistants_data) && selectedTeacher.assistants_data.length > 0 ? (
                  <div className="space-y-2">
                    {selectedTeacher.assistants_data.map((asst, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-white border border-amber-100 flex items-center justify-between text-xs">
                        <span className="font-bold text-amber-950">مساعد {idx + 1}: {asst.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-700">{asst.phone}</span>
                          <a
                            href={getWhatsAppLink(asst.phone, `السلام عليكم أ/ ${asst.name}`)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-600 hover:text-emerald-700"
                          >
                            <MessageCircle size={14} />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-amber-800">{selectedTeacher.assistant_name || 'إدارة شخصية بدون سكرتارية'}</p>
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
                <div className="flex flex-wrap gap-2 text-xs">
                  {selectedTeacher.facebook_link && (
                    <a
                      href={selectedTeacher.facebook_link}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 font-bold flex items-center gap-1.5 hover:bg-blue-100"
                    >
                      <ExternalLink size={12} />
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
                      <ExternalLink size={12} />
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
                      <ExternalLink size={12} />
                      <span>جروب التليجرام</span>
                    </a>
                  )}
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
      )}

    </div>
  );
}
