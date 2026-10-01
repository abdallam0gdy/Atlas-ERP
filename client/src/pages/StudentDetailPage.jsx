import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import StudentModal from '../components/StudentModal';
import {
  ArrowRight, User, Phone, BookOpen, GraduationCap,
  Calendar, Clock, CheckCircle2, AlertTriangle, Printer,
  Edit, ShieldCheck, Loader2, Sparkles, Coins, Trash2
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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [printingSticker, setPrintingSticker] = useState(false);

  const handleDelete = async () => {
    if (!student) return;
    setIsDeleting(true);
    try {
      const { data } = await api.delete(`/students/${id}`);
      toast.success(data.message || 'تم حذف الطالب بنجاح');
      navigate('/students');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'فشل حذف الطالب');
    } finally {
      setIsDeleting(false);
    }
  };

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

  const handleExcuseAttendance = async (logId, studentName) => {
    const reason = window.prompt(`أدخل سبب قبول العذر للطالب ${studentName || ''}:`, 'ظرف طارئ / عذر مقبول');
    if (reason === null) return;
    try {
      const { data } = await api.post(`/attendance/${logId}/excuse`, { reason: reason.trim() || 'عذر مقبول' });
      toast.success(data.message || 'تم قبول العذر واسترداد الحصة المخصومة بنجاح');
      fetchStudentData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل قبول العذر');
    }
  };

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
            onClick={() => setIsDeleteModalOpen(true)}
            className="atlas-btn text-xs py-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 transition-all cursor-pointer"
            title="حذف الطالب نهائياً من المنظومة"
          >
            <Trash2 size={16} />
            حذف الطالب
          </button>
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
            {/* Avatar with Photo Support */}
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-extrabold text-3xl shadow-lg flex-shrink-0 overflow-hidden border-2 border-slate-200"
              style={{ background: 'linear-gradient(135deg, #0C3C82 0%, #1a5ab8 100%)' }}
            >
              {student.photo_url ? (
                <img
                  src={student.photo_url}
                  alt={student.full_name}
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
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-black text-slate-900">
                  {student.full_name}
                </h1>
                {student.gender && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    student.gender === 'female' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {student.gender === 'female' ? '👧 أنثى' : '👦 ذكر'}
                  </span>
                )}
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

                {student.national_id && (
                  <>
                    <span>•</span>
                    <span className="text-xs text-slate-500 font-mono">
                      الرقم القومي: {student.national_id}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Contact Box */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-sm sm:w-80">
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
            {student.father_phone && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">هاتف الأب:</span>
                <a href={`tel:${student.father_phone}`} className="font-mono font-bold text-sky-700 hover:underline">
                  {student.father_phone}
                </a>
              </div>
            )}
            {student.mother_phone && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">هاتف الأم:</span>
                <a href={`tel:${student.mother_phone}`} className="font-mono font-bold text-sky-700 hover:underline">
                  {student.mother_phone}
                </a>
              </div>
            )}
            {student.parent_phone && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">رقم ولي الأمر:</span>
                <a href={`tel:${student.parent_phone}`} className="font-mono font-bold text-sky-700 hover:underline">
                  {student.parent_phone}
                </a>
              </div>
            )}
            {student.parent_name && (
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>اسم ولي الأمر:</span>
                <span className="font-semibold text-slate-800">{student.parent_name}</span>
              </div>
            )}
            {student.address && (
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-200/60">
                <span>العنوان:</span>
                <span className="font-medium text-slate-700 truncate max-w-[180px]">{student.address}</span>
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
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      log.status === 'absent' ? 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)]' :
                      log.status === 'excused' ? 'bg-purple-500' :
                      log.payment_status === 'paid' ? 'bg-emerald-500' :
                      log.payment_status === 'free' ? 'bg-cyan-500' : 'bg-amber-500'
                    }`} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {log.subject_name || log.group_name_ar || log.group_name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {log.teacher_name && `${log.teacher_name} • `}{new Date(log.session_date).toLocaleDateString('ar-EG')}
                      </p>
                      {log.notes && (
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs" title={log.notes}>
                          {log.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-left shrink-0 flex flex-col items-end">
                    {log.status === 'absent' ? (
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          log.payment_status === 'paid'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {log.payment_status === 'paid' ? '❌ غائب (مخصومة)' : '⚠️ غائب (غير مسدد)'}
                        </span>
                        <button
                          onClick={() => handleExcuseAttendance(log.id, student?.full_name)}
                          className="text-[10px] text-amber-700 hover:text-amber-800 underline font-semibold cursor-pointer"
                          title="قبول عذر الطالب واسترداد الحصة المخصومة"
                        >
                          قبول عذر واسترداد
                        </button>
                      </div>
                    ) : log.status === 'excused' ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                        🕊️ معذور (مستردة)
                      </span>
                    ) : (
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        log.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                        log.payment_status === 'free' ? 'bg-cyan-100 text-cyan-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {log.payment_status === 'paid' ? '✅ حاضر (مدفوع)' :
                         log.payment_status === 'free' ? '🎁 مجاني' : '⚠️ معلق'}
                      </span>
                    )}
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

      {/* Delete Student Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-scale-up">
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={30} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                تأكيد حذف الطالب نهائياً
              </h3>
              <p className="text-slate-500 text-xs mb-4">
                هل أنت متأكد من رغبتك في حذف هذا الطالب؟ لا يمكن التراجع عن هذه الخطوة.
              </p>

              {/* Student info box */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-right mb-4 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">اسم الطالب:</span>
                  <span className="font-bold text-slate-800">{student.full_name}</span>
                </div>
                {student.student_code && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">كود الطالب:</span>
                    <span className="font-mono font-bold text-sky-700">#{student.student_code}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">باركود البطاقة:</span>
                  <span className="font-mono text-slate-700">{student.barcode_id}</span>
                </div>
                {student.grade_name && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">المرحلة الدراسية:</span>
                    <span className="text-slate-700">{student.grade_name}</span>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs text-right leading-relaxed mb-5 flex items-start gap-2">
                <AlertTriangle size={16} className="shrink-0 mt-0.5 text-rose-600" />
                <span>
                  <strong>تنبيه هام:</strong> سيتم حذف كافة اشتراكات الطالب، سجلات الحضور، والمدفوعات المرتبطة به بشكل نهائي.
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 px-4 rounded-xl font-bold text-white text-sm bg-rose-600 hover:bg-rose-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-rose-600/20 cursor-pointer"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>جاري الحذف...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      <span>تأكيد الحذف</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isDeleting}
                  className="py-2.5 px-4 rounded-xl font-semibold text-slate-700 text-sm bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
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
