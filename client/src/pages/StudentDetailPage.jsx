import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import StudentModal from '../components/StudentModal';
import {
  ArrowRight, User, Phone, BookOpen, GraduationCap,
  Calendar, Clock, CheckCircle2, AlertTriangle, Printer,
  Edit, ShieldCheck, Loader2, Sparkles, Coins
} from 'lucide-react';

export default function StudentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [printingSticker, setPrintingSticker] = useState(false);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/students/${id}`);
      setStudent(data.data.student);
      setEnrollments(data.data.enrollments || []);
      setSubscriptions(data.data.subscriptions || []);
      setAttendance(data.data.attendance || []);
    } catch (err) {
      toast.error('تعذر تحميل بيانات الطالب');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [id]);

  const formatSchedule = (schedule) => {
    if (!schedule || !Array.isArray(schedule) || schedule.length === 0) return 'بدون موعد محدد';
    const dayMap = {
      saturday: 'السبت', sunday: 'الأحد', monday: 'الاثنين',
      tuesday: 'الثلاثاء', wednesday: 'الأربعاء', thursday: 'الخميس', friday: 'الجمعة',
    };
    return schedule.map((s) => `${dayMap[s.day] || s.day} (${s.start_time})`).join(' ، ');
  };

  const handlePrintSticker = async () => {
    if (!student?.id) return;
    setPrintingSticker(true);
    try {
      const res = await api.get(`/students/${student.id}/print-sticker`, {
        responseType: 'text',
      });
      const printWin = window.open('', '_blank', 'width=450,height=300');
      if (printWin) {
        printWin.document.open();
        printWin.document.write(res.data);
        printWin.document.close();
      } else {
        toast.error('تم حظر النافذة المنبثقة، يرجى السماح بالنوافذ المنبثقة لطباعة استيكر الـ QR');
      }
    } catch (err) {
      toast.error('تعذر تجهيز استيكر الـ QR للطباعة');
    } finally {
      setPrintingSticker(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={36} className="animate-spin text-sky-600" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500 mb-4">لم يتم العثور على الطالب</p>
        <Link to="/students" className="atlas-btn atlas-btn-outline">
          العودة لقائمة الطلاب
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <button
          onClick={() => navigate('/students')}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowRight size={18} />
          العودة لقائمة الطلاب
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="atlas-btn atlas-btn-outline text-xs py-2"
          >
            <Edit size={16} />
            تعديل البيانات
          </button>
          <button
            onClick={handlePrintSticker}
            disabled={printingSticker}
            className="atlas-btn atlas-btn-primary text-xs py-2"
          >
            {printingSticker ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
            طباعة استيكر الـ QR
          </button>
        </div>
      </div>

      {/* Hero Student Profile Card */}
      <div className="atlas-card p-6 lg:p-8 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-extrabold text-3xl shadow-lg flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #0C3C82 0%, #1a5ab8 100%)' }}
            >
              {student.full_name?.[0] || 'ط'}
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-black text-slate-900">
                  {student.full_name}
                </h1>
                {student.student_code && (
                  <span className="text-sm font-mono font-bold px-2.5 py-1 rounded-lg bg-sky-100 text-sky-800 border border-sky-200">
                    كود السنتر: #{student.student_code}
                  </span>
                )}
                <span className={`atlas-badge ${student.is_active ? 'atlas-badge-success' : 'atlas-badge-error'}`}>
                  {student.is_active ? 'نشط' : 'معطل'}
                </span>
              </div>

              <div className="flex items-center gap-3 mt-2 flex-wrap text-sm text-slate-600">
                <span className="flex items-center gap-1 font-medium">
                  <GraduationCap size={16} className="text-sky-600" />
                  {student.grade_name}
                </span>

                <span>•</span>

                <code className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded border">
                  {student.barcode_id}
                </code>

                <span>•</span>

                <span className="atlas-badge bg-blue-100 text-blue-800">
                  {student.education_type === 'LANGUAGES' ? '🌐 تجريبي / لغات' : '🏛️ حكومي / عربي'}
                </span>

                <span>•</span>

                <span className={`atlas-badge ${student.enrollment_type === 'PRIVATE' ? 'atlas-badge-warning' : 'atlas-badge-success'}`}>
                  {student.enrollment_type === 'PRIVATE' ? '👤 برايفت مدرس' : '🏫 باقة سنتر'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Contact Box */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-sm sm:w-72">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">موبايل الطالب:</span>
              {student.phone ? (
                <a href={`tel:${student.phone}`} className="font-mono font-bold text-sky-700 hover:underline">
                  {student.phone}
                </a>
              ) : (
                <span className="text-xs text-slate-400">غير مسجل</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">موبايل ولي الأمر:</span>
              {student.parent_phone ? (
                <a href={`tel:${student.parent_phone}`} className="font-mono font-bold text-sky-700 hover:underline">
                  {student.parent_phone}
                </a>
              ) : (
                <span className="text-xs text-slate-400">غير مسجل</span>
              )}
            </div>
            {student.parent_name && (
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>اسم ولي الأمر:</span>
                <span className="font-semibold text-slate-800">{student.parent_name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Groups & Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrolled Groups (المواد والمدرسين المشترك معهم) */}
        <div className="atlas-card p-6 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen size={20} className="text-sky-600" />
              المجموعات والمدرسين المسجل بها ({enrollments.length})
            </h2>
            <Link
              to="/subscriptions"
              className="text-xs font-bold text-[#0C3C82] hover:underline flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-xl border border-blue-200 transition-colors"
            >
              <Coins size={13} />
              <span>إدارة المجموعات والاشتراكات</span>
            </Link>
          </div>

          {enrollments.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <BookOpen size={36} className="mx-auto mb-2 opacity-40 text-[#0C3C82]" />
              <p className="text-sm font-bold text-slate-700">الطالب غير مسجل في أي مجموعة بعد</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                يتم قيد الطلاب في المجموعات وتحديد باقات الحصص وتحصيلها حصرياً عبر صفحة <strong>اشتراكات الطلاب والحصص</strong>.
              </p>
              <Link
                to="/subscriptions"
                className="atlas-btn atlas-btn-primary text-xs mt-4 inline-flex items-center gap-1.5"
              >
                <Coins size={14} />
                <span>الانتقال لصفحة الاشتراكات لتسجيل الطالب</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {enrollments.map((group) => (
                <div
                  key={group.id}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all bg-white"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ background: group.subject_color || '#0EA5E9' }}
                        />
                        <h3 className="font-bold text-slate-900 text-sm">
                          {group.subject_name} — {group.teacher_name}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 font-medium">
                        {group.group_name_ar || group.group_name}
                      </p>
                      <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1 font-medium">
                        <Calendar size={13} />
                        {formatSchedule(group.schedule)}
                      </p>
                    </div>

                    <div className="text-left">
                      <p className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100 font-mono">
                        {group.price_per_month} ج/شهر
                      </p>
                      <span className="text-[11px] text-emerald-600 font-bold block mt-1.5">
                        نشط ومسجل
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attendance History (سجل الحضور الأخير) */}
        <div className="atlas-card p-6 animate-fade-in-up" style={{ animationDelay: '160ms' }}>
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Clock size={20} className="text-emerald-600" />
              سجل الحضور الأخير ({attendance.length})
            </h2>
            <span className="text-xs text-slate-400 font-medium">آخر 30 حصة</span>
          </div>

          {attendance.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Clock size={36} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">لم يسجل الطالب أي حضور حتى الآن</p>
              <p className="text-xs text-slate-400 mt-1">
                سيتحدث هذا السجل تلقائياً فور مسح كارت الطالب على بوابة الحضور
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {attendance.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      log.payment_status === 'paid' ? 'bg-emerald-500' :
                      log.payment_status === 'free' ? 'bg-cyan-500' : 'bg-amber-500'
                    }`} />
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {log.subject_name || log.group_name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {log.teacher_name} • {new Date(log.session_date).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                  </div>

                  <div className="text-left">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      log.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                      log.payment_status === 'free' ? 'bg-cyan-100 text-cyan-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {log.payment_status === 'paid' ? '✅ مدفوع' :
                       log.payment_status === 'free' ? '🎁 مجاني' : '⚠️ معلق'}
                    </span>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {new Date(log.scan_timestamp).toLocaleTimeString('ar-EG', {
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Student Modal */}
      <StudentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchStudentData}
        initialData={student}
      />
    </div>
  );
}
