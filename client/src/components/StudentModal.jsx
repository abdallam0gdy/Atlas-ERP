import { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  X, User, Phone, BookOpen, GraduationCap,
  Sparkles, Check, Loader2, Calendar
} from 'lucide-react';

export default function StudentModal({ isOpen, onClose, onSuccess, initialData = null }) {
  const isEdit = Boolean(initialData?.id);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    parent_phone: '',
    parent_name: '',
    grade_id: '',
    education_type: 'PUBLIC',
    enrollment_type: 'PACKAGE',
    notes: '',
  });

  const [grades, setGrades] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load grades
  useEffect(() => {
    if (!isOpen) return;

    api.get('/master/grades').then(({ data }) => setGrades(data.data || []));
  }, [isOpen]);

  // Set initial form data if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        full_name: initialData.full_name || '',
        phone: initialData.phone || '',
        parent_phone: initialData.parent_phone || '',
        parent_name: initialData.parent_name || '',
        grade_id: initialData.grade_id || '',
        education_type: initialData.education_type || 'PUBLIC',
        enrollment_type: initialData.enrollment_type || 'PACKAGE',
        notes: initialData.notes || '',
      });
    } else {
      setFormData({
        full_name: '',
        phone: '',
        parent_phone: '',
        parent_name: '',
        grade_id: '',
        education_type: 'PUBLIC',
        enrollment_type: 'PACKAGE',
        notes: '',
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.full_name.trim()) {
      toast.error('يرجى إدخال اسم الطالب');
      return;
    }
    if (!formData.phone.trim()) {
      toast.error('يرجى إدخال رقم موبايل الطالب');
      return;
    }
    if (!formData.parent_phone.trim()) {
      toast.error('يرجى إدخال رقم ولي الأمر');
      return;
    }
    if (!formData.parent_name.trim()) {
      toast.error('يرجى إدخال اسم ولي الأمر');
      return;
    }
    if (!formData.grade_id) {
      toast.error('يرجى اختيار المرحلة الدراسية');
      return;
    }
    if (!formData.education_type) {
      toast.error('يرجى اختيار نوع التعليم');
      return;
    }
    if (!formData.enrollment_type) {
      toast.error('يرجى اختيار نظام الطالب');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit) {
        const { data } = await api.put(`/students/${initialData.id}`, formData);
        toast.success(data.message || 'تم تحديث بيانات الطالب بنجاح');
      } else {
        const { data } = await api.post('/students', formData);
        toast.success(data.message || 'تم إضافة الطالب بنجاح');
      }

      onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'حدث خطأ أثناء حفظ بيانات الطالب';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100" style={{ background: '#0C3C82' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 text-white">
              <User size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isEdit ? 'تعديل بيانات الطالب' : 'تسجيل طالب جديد'}
              </h2>
              <p className="text-white/70 text-xs mt-0.5">
                {isEdit ? `تحديث الملف الشخصي والمجموعات المشترك بها` : 'توليد كود السنتر والباركود تلقائياً'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Basic Info */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <User size={16} className="text-sky-500" />
              البيانات الشخصية والاتصال
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  اسم الطالب رباعي <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: أحمد محمود علي إبراهيم"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="atlas-input"
                />
              </div>

              {/* Student Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  رقم موبايل الطالب <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="01012345678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="atlas-input pr-9 font-mono"
                  />
                </div>
              </div>

              {/* Parent Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  رقم ولي الأمر <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="01155556666"
                    value={formData.parent_phone}
                    onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                    className="atlas-input pr-9 font-mono"
                  />
                </div>
              </div>

              {/* Parent Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  اسم ولي الأمر <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: محمود علي إبراهيم"
                  value={formData.parent_name}
                  onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                  className="atlas-input"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Academic & Classification */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <GraduationCap size={16} className="text-sky-500" />
              المرحلة ونوع التعليم ونظام الطالب
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Academic Grade */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  المرحلة الدراسية <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.grade_id}
                  onChange={(e) => setFormData({ ...formData, grade_id: e.target.value, group_ids: [] })}
                  className="atlas-input"
                >
                  <option value="">اختر المرحلة...</option>
                  {grades.map((g) => (
                    <option key={g.id} value={g.id}>{g.name_ar}</option>
                  ))}
                </select>
              </div>

              {/* Education Type (حكومي vs لغات) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  نوع التعليم <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.education_type || 'PUBLIC'}
                  onChange={(e) => setFormData({ ...formData, education_type: e.target.value })}
                  className="atlas-input font-medium"
                >
                  <option value="PUBLIC">🏛️ حكومي / عربي</option>
                  <option value="LANGUAGES">🌐 لغات / تجريبي</option>
                </select>
              </div>

              {/* Enrollment Type (Package vs Private) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  نظام الطالب الأساسي <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.enrollment_type || 'PACKAGE'}
                  onChange={(e) => setFormData({ ...formData, enrollment_type: e.target.value })}
                  className="atlas-input font-medium"
                >
                  <option value="PACKAGE">🏫 باقة السنتر (Package)</option>
                  <option value="PRIVATE">👤 برايفت المدرس (Private)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Subscriptions Notice */}
          <div className="pt-4 border-t border-slate-100">
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-start gap-3">
              <div className="p-2 bg-blue-100 text-[#0C3C82] rounded-xl flex-shrink-0 mt-0.5">
                <BookOpen size={18} />
              </div>
              <div className="text-xs">
                <h4 className="font-bold text-[#0C3C82]">تسجيل وقيد الطالب في المجموعات:</h4>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  وفقاً لسياسة النظام المالي، يتم قيد الطالب في المجموعات وتحديد باقات الحصص وتحصيل رسومها حصرياً عبر شاشة <strong>اشتراكات الطلاب والحصص</strong> لضمان تدقيق الإيرادات ورصيد الخزينة.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Notes */}
          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ملاحظات إضافية عن الطالب
            </label>
            <textarea
              rows={2}
              placeholder="أي تفاصيل خاصة بالطالب..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="atlas-input resize-none"
            />
          </div>

          {/* Auto generation info banner */}
          {!isEdit && (
            <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center gap-3 text-xs text-blue-800">
              <Sparkles size={20} className="text-blue-600 flex-shrink-0" />
              <p>
                ⚡ <strong>توليد أوتوماتيكي:</strong> سيقوم النظام تلقائياً بتخصيص كود فريد للطالب في السنتر (مثل: <code className="font-bold">#1004</code>) مع باركود مطابق جاهز للمسح والطباعة.
              </p>
            </div>
          )}
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="atlas-btn atlas-btn-ghost text-sm"
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="atlas-btn atlas-btn-primary text-sm px-6"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                جاري الحفظ...
              </>
            ) : isEdit ? (
              'حفظ التعديلات'
            ) : (
              'حفظ وتسجيل الطالب'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
