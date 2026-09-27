import { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  CalendarX, AlertTriangle, Users, User,
  Calendar, Clock, RotateCcw, X, Loader2, CheckCircle2,
  ListFilter, ShieldAlert, Sparkles
} from 'lucide-react';

export default function CancelSessionModal({ isOpen, onClose, onSessionCancelled }) {
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'history'
  const [cancelType, setCancelType] = useState('group'); // 'group' | 'teacher'

  const [sessionDate, setSessionDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedGradeId, setSelectedGradeId] = useState('');
  const [reason, setReason] = useState('اعتذار المدرس');
  const [customReason, setCustomReason] = useState('');

  // Masters
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [grades, setGrades] = useState([]);
  const [cancelledHistory, setCancelledHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Quick preset reasons
  const presetReasons = [
    'اعتذار المدرس',
    'ظرف طارئ للمدرس',
    'إجازة رسمية',
    'امتحانات مدرسية',
    'صيانة بالقاعة / السنتر',
    'أخرى (تحديد سبب مخصص)'
  ];

  useEffect(() => {
    if (isOpen) {
      loadMasters();
      loadCancelledHistory();
    }
  }, [isOpen]);

  const loadMasters = async () => {
    try {
      const [gRes, tRes, grRes] = await Promise.all([
        api.get('/groups'),
        api.get('/teachers'),
        api.get('/master/grades'),
      ]);
      setGroups(gRes.data?.data || []);
      setTeachers(tRes.data?.data || []);
      setGrades(grRes.data?.data || []);
    } catch (err) {
      console.error('Failed to load masters:', err);
    }
  };

  const loadCancelledHistory = async () => {
    try {
      setLoadingHistory(true);
      const { data } = await api.get('/attendance/cancelled-sessions');
      setCancelledHistory(data?.data || []);
    } catch (err) {
      console.error('Failed to load cancelled history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Filter groups by selected grade
  const filteredGroups = groups.filter((g) => {
    if (selectedGradeId && g.grade_id !== selectedGradeId) return false;
    return true;
  });

  const finalReason = reason === 'أخرى (تحديد سبب مخصص)' ? customReason.trim() || 'سبب غير محدد' : reason;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!sessionDate) {
      toast.error('يرجى اختيار تاريخ الحصة');
      return;
    }

    if (cancelType === 'group' && !selectedGroupId) {
      toast.error('يرجى اختيار المجموعة المراد إلغاء حصتها');
      return;
    }

    if (cancelType === 'teacher' && !selectedTeacherId) {
      toast.error('يرجى اختيار المدرس لإلغاء جميع حصصه في هذا اليوم');
      return;
    }

    try {
      setSubmitting(true);

      if (cancelType === 'group') {
        const { data } = await api.post('/attendance/cancel-session', {
          group_id: selectedGroupId,
          session_date: sessionDate,
          reason: finalReason,
        });
        toast.success(data.message || 'تم إلغاء الحصة بنجاح وحماية أرصدة الطلاب', { duration: 6000 });
      } else {
        const { data } = await api.post('/attendance/cancel-teacher-sessions', {
          teacher_id: selectedTeacherId,
          session_date: sessionDate,
          reason: finalReason,
        });
        toast.success(data.message || 'تم إلغاء جميع حصص المدرس بنجاح', { duration: 6000 });
      }

      await loadCancelledHistory();
      if (onSessionCancelled) onSessionCancelled();
      setActiveTab('history');
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل إلغاء الحصة');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUncancel = async (id, groupName) => {
    if (!window.confirm(`هل أنت متأكد من التراجع عن إلغاء حصة (${groupName || ''}) واستئنافها؟`)) {
      return;
    }

    try {
      const { data } = await api.delete(`/attendance/cancelled-sessions/${id}`);
      toast.success(data.message || 'تم استئناف الحصة بنجاح');
      await loadCancelledHistory();
      if (onSessionCancelled) onSessionCancelled();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل التراجع عن الإلغاء');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in" style={{ direction: 'rtl' }}>
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-l from-rose-500/10 via-amber-500/10 to-transparent border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
              <CalendarX size={26} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                إلغاء حصة / اعتذار مدرس
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                تأمين عدم خصم الحصص أو احتساب غياب على الطلاب المسجلين
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 bg-slate-50/60 p-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('new')}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'new'
                ? 'bg-white text-rose-600 shadow-sm border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            تسجيل إلغاء حصة
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white text-rose-600 shadow-sm border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>سجل الحصص الملغاة</span>
            {cancelledHistory.length > 0 && (
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-rose-100 text-rose-700">
                {cancelledHistory.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {activeTab === 'new' ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Info Alert */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/70 text-amber-900 text-xs sm:text-sm leading-relaxed flex items-start gap-3">
                <ShieldAlert size={20} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">حماية آلية لأرصدة الطلاب:</span> بمجرد إلغاء الحصة، يمنع النظام احتساب أي غياب أو خصم على الطلاب، وفي حال تم خصم حصص مسبقاً لهذا اليوم، يتم استردادها تلقائياً إلى رصيد اشتراك الطلاب فوراً.
                </div>
              </div>

              {/* Cancel Type Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">نوع الإلغاء:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCancelType('group')}
                    className={`p-3 rounded-2xl border text-right transition-all flex items-center gap-2.5 cursor-pointer ${
                      cancelType === 'group'
                        ? 'border-rose-500 bg-rose-50/50 text-rose-900 font-bold shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Users size={18} className={cancelType === 'group' ? 'text-rose-600' : 'text-slate-400'} />
                    <div>
                      <p className="text-xs sm:text-sm">إلغاء مجموعة محددة</p>
                      <p className="text-[11px] opacity-75 font-normal">مجموعة دراسية بعينها</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCancelType('teacher')}
                    className={`p-3 rounded-2xl border text-right transition-all flex items-center gap-2.5 cursor-pointer ${
                      cancelType === 'teacher'
                        ? 'border-rose-500 bg-rose-50/50 text-rose-900 font-bold shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <User size={18} className={cancelType === 'teacher' ? 'text-rose-600' : 'text-slate-400'} />
                    <div>
                      <p className="text-xs sm:text-sm">إلغاء لجميع مجموعات المدرس</p>
                      <p className="text-[11px] opacity-75 font-normal">اعتذار المدرس عن يوم كامل</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Date Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Calendar size={15} className="text-slate-400" />
                  <span>تاريخ الحصة الملغاة:</span>
                </label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-sm font-semibold outline-none"
                />
              </div>

              {/* Target Selection */}
              {cancelType === 'group' ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">تصفية بالمرحلة (اختياري):</label>
                      <select
                        value={selectedGradeId}
                        onChange={(e) => setSelectedGradeId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none"
                      >
                        <option value="">جميع المراحل</option>
                        {grades.map((gr) => (
                          <option key={gr.id} value={gr.id}>{gr.name_ar}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">المجموعة الدراسية: *</label>
                      <select
                        value={selectedGroupId}
                        onChange={(e) => setSelectedGroupId(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-rose-500 text-xs sm:text-sm font-semibold outline-none"
                      >
                        <option value="">اختر المجموعة...</option>
                        {filteredGroups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name_ar || g.name} {g.teacher_name ? `(${g.teacher_name})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <User size={15} className="text-slate-400" />
                    <span>المدرس المعتذر: *</span>
                  </label>
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-rose-500 text-sm font-semibold outline-none"
                  >
                    <option value="">اختر المدرس...</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name} ({t.subject_name || 'بدون مادة'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Reason Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">سبب الإلغاء:</label>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {presetReasons.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setReason(preset)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        reason === preset
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                {reason === 'أخرى (تحديد سبب مخصص)' && (
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="اكتب سبب إلغاء الحصة بالتفصيل..."
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-rose-500 text-sm outline-none"
                  />
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold shadow-lg shadow-rose-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>جاري معالجة الإلغاء...</span>
                    </>
                  ) : (
                    <>
                      <CalendarX size={18} />
                      <span>تأكيد إلغاء الحصة وحماية الطلاب</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </form>
          ) : (
            /* Cancelled Sessions History Tab */
            <div className="space-y-3">
              {loadingHistory ? (
                <div className="text-center py-12 text-slate-400">
                  <Loader2 size={32} className="animate-spin mx-auto mb-2 text-rose-500" />
                  <p className="text-xs">جاري تحميل سجل الحصص الملغاة...</p>
                </div>
              ) : cancelledHistory.length === 0 ? (
                <div className="text-center py-16 text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <CheckCircle2 size={36} className="mx-auto text-emerald-500 mb-2 opacity-80" />
                  <p className="text-sm font-bold text-slate-700">لا توجد حصص ملغاة حالياً</p>
                  <p className="text-xs text-slate-400 mt-1">جميع الحصص والمجموعات مجدولة وتعمل بشكل طبيعي</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                  {cancelledHistory.map((item) => (
                    <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {item.group_name_ar || item.group_name}
                          </h4>
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-100 text-rose-700 shrink-0">
                            ملغاة
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                          <span>المدرس: {item.teacher_name || '—'}</span>
                          <span>•</span>
                          <span>المادة: {item.subject_name || '—'}</span>
                          <span>•</span>
                          <span className="font-mono font-semibold text-slate-700">
                            {new Date(item.session_date).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric' })}
                          </span>
                        </p>
                        <p className="text-xs text-rose-600/90 font-medium mt-1">
                          السبب: {item.reason || 'اعتذار المدرس'}
                        </p>
                      </div>

                      <div className="shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUncancel(item.id, item.group_name_ar || item.group_name)}
                          className="px-3 py-1.5 rounded-xl border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          title="استئناف جدول هذه الحصة والتراجع عن الإلغاء"
                        >
                          <RotateCcw size={14} />
                          <span>استعادة الحصة</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
