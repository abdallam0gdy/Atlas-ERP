import { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import ImageUpload from './ImageUpload';
import {
  X, User, Phone, BookOpen, GraduationCap,
  Sparkles, Check, Loader2, Calendar, MapPin, CreditCard, HeartHandshake
} from 'lucide-react';

export default function StudentModal({ isOpen, onClose, onSuccess, initialData = null }) {
  const isEdit = Boolean(initialData?.id);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    parent_phone: '',
    parent_name: '',
    father_phone: '',
    mother_phone: '',
    gender: 'male',
    national_id: '',
    date_of_birth: '',
    photo_url: '',
    address: '',
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
        father_phone: initialData.father_phone || '',
        mother_phone: initialData.mother_phone || '',
        gender: initialData.gender || 'male',
        national_id: initialData.national_id || '',
        date_of_birth: initialData.date_of_birth ? initialData.date_of_birth.slice(0, 10) : '',
        photo_url: initialData.photo_url || '',
        address: initialData.address || '',
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
        father_phone: '',
        mother_phone: '',
        gender: 'male',
        national_id: '',
        date_of_birth: '',
        photo_url: '',
        address: '',
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
      const payload = {
        ...formData,
        parent_phone: formData.parent_phone || formData.father_phone || formData.mother_phone || null,
        parent_name: formData.parent_name || 'ولي أمر الطالب',
        date_of_birth: formData.date_of_birth || null,
      };

      if (isEdit) {
        const { data } = await api.put(`/students/${initialData.id}`, payload);
        toast.success(data.message || 'تم تحديث بيانات الطالب بنجاح');
      } else {
        const { data } = await api.post('/students', payload);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" dir="rtl">
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
                {isEdit ? `تحديث الملف الشخصي ومعلومات الطالب` : 'توليد كود السنتر والباركود تلقائياً'}
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
          {/* Section 1: Photo & Gender */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200">
            <ImageUpload
              value={formData.photo_url}
              onChange={(url) => setFormData({ ...formData, photo_url: url })}
              category="students"
              label="الصورة الشخصية للطالب"
              shape="circle"
              size={84}
              hint="صورة واضحة لاستخدامها في كارنيه الطالب وشاشة الحضور الذكي"
            />
          </div>

          {/* Section 2: Personal Identity */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <User size={16} className="text-sky-500" />
              البيانات الشخصية والأساسية
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

              {/* Gender */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  النوع (الجنس) <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: 'male' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      formData.gender === 'male'
                        ? 'bg-blue-50 border-blue-500 text-blue-800 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>👦 ذكر</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: 'female' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      formData.gender === 'female'
                        ? 'bg-pink-50 border-pink-500 text-pink-800 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>👧 أنثى</span>
                  </button>
                </div>
              </div>

              {/* National ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  الرقم القومي (اختياري)
                </label>
                <div className="relative">
                  <CreditCard size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    maxLength={14}
                    placeholder="14 رقم"
                    value={formData.national_id}
                    onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                    className="atlas-input pr-9 font-mono"
                  />
                </div>
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  تاريخ الميلاد
                </label>
                <div className="relative">
                  <Calendar size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="atlas-input pr-9"
                  />
                </div>
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
            </div>
          </div>

          {/* Section 3: Family Contacts */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <HeartHandshake size={16} className="text-sky-500" />
              بيانات وأرقام أولياء الأمور
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Father Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  رقم تليفون الأب
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="010..."
                    value={formData.father_phone}
                    onChange={(e) => setFormData({ ...formData, father_phone: e.target.value })}
                    className="atlas-input pr-9 font-mono"
                  />
                </div>
              </div>

              {/* Mother Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  رقم تليفون الأم
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="011..."
                    value={formData.mother_phone}
                    onChange={(e) => setFormData({ ...formData, mother_phone: e.target.value })}
                    className="atlas-input pr-9 font-mono"
                  />
                </div>
              </div>

              {/* Parent Contact Person */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  اسم ولي الأمر المعتمد
                </label>
                <input
                  type="text"
                  placeholder="مثال: الأب / الأم / الأخ"
                  value={formData.parent_name}
                  onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                  className="atlas-input"
                />
              </div>

              {/* Primary Parent Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  رقم ولي الأمر الأساسي للطوارئ
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="012..."
                    value={formData.parent_phone}
                    onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                    className="atlas-input pr-9 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Academic & Classification */}
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
                  onChange={(e) => setFormData({ ...formData, grade_id: e.target.value })}
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

          {/* Section 5: Address & Notes */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                العنوان السكني
              </label>
              <div className="relative">
                <MapPin size={16} className="absolute right-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="المدينة / المنطقة / الشارع"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="atlas-input pr-9"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ملاحظات إضافية
              </label>
              <textarea
                rows={2}
                placeholder="أي تفاصيل خاصة بالطالب..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="atlas-input resize-none"
              />
            </div>
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
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="atlas-btn atlas-btn-outline"
            disabled={isSubmitting}
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="atlas-btn atlas-btn-primary flex items-center gap-2"
            style={{ background: '#0C3C82' }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Check size={16} />
                {isEdit ? 'حفظ التعديلات' : 'تسجيل الطالب'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
