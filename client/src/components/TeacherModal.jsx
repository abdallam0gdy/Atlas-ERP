import { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  X, User, Phone, Mail, BookOpen,
  Percent, Coins, Loader2, StickyNote, Check, Sparkles
} from 'lucide-react';

export default function TeacherModal({ isOpen, onClose, onSuccess, initialData = null }) {
  const isEdit = Boolean(initialData?.id);

  const [subjectsList, setSubjectsList] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    full_name_ar: '',
    phone: '',
    email: '',
    specialization: '',
    subject_id: '',
    subject_ids: [],
    revenue_split_type: 'percentage',
    revenue_split_percent: 80,
    fixed_rate_per_student: 0,
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load master subjects
  useEffect(() => {
    if (!isOpen) return;
    const fetchSubjects = async () => {
      try {
        setLoadingSubjects(true);
        const { data } = await api.get('/master/subjects');
        setSubjectsList(data.data || []);
      } catch (err) {
        console.error('Failed to load subjects:', err);
      } finally {
        setLoadingSubjects(false);
      }
    };
    fetchSubjects();
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      const sIds = initialData.subject_ids && initialData.subject_ids.length > 0
        ? initialData.subject_ids
        : (initialData.subject_id ? [initialData.subject_id] : (initialData.subjects?.map(s => s.id) || []));

      setFormData({
        full_name: initialData.full_name || '',
        full_name_ar: initialData.full_name_ar || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        specialization: initialData.specialization || '',
        subject_id: initialData.subject_id || (sIds[0] || ''),
        subject_ids: sIds,
        revenue_split_type: initialData.revenue_split_type || 'percentage',
        revenue_split_percent: initialData.revenue_split_percent ?? 80,
        fixed_rate_per_student: initialData.fixed_rate_per_student ?? 0,
        notes: initialData.notes || '',
      });
    } else {
      setFormData({
        full_name: '',
        full_name_ar: '',
        phone: '',
        email: '',
        specialization: '',
        subject_id: '',
        subject_ids: [],
        revenue_split_type: 'percentage',
        revenue_split_percent: 80,
        fixed_rate_per_student: 0,
        notes: '',
      });
    }
  }, [initialData, isOpen]);

  // Handle subject toggle
  const toggleSubject = (subjectId) => {
    setFormData((prev) => {
      const exists = prev.subject_ids.includes(subjectId);
      let updatedIds;
      if (exists) {
        updatedIds = prev.subject_ids.filter((id) => id !== subjectId);
      } else {
        updatedIds = [...prev.subject_ids, subjectId];
      }

      // Update primary subject_id
      const newPrimary = updatedIds.length > 0 ? (updatedIds.includes(prev.subject_id) ? prev.subject_id : updatedIds[0]) : '';

      // Auto update specialization text
      const selectedNames = subjectsList
        .filter((s) => updatedIds.includes(s.id))
        .map((s) => s.name_ar)
        .join(' ، ');

      return {
        ...prev,
        subject_ids: updatedIds,
        subject_id: newPrimary,
        specialization: selectedNames || prev.specialization,
      };
    });
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.full_name.trim()) {
      toast.error('يرجى إدخال اسم المدرس');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit) {
        const { data } = await api.put(`/teachers/${initialData.id}`, formData);
        toast.success(data.message || 'تم تحديث بيانات المدرس بنجاح');
      } else {
        const { data } = await api.post('/teachers', formData);
        toast.success(data.message || 'تم إضافة المدرس بنجاح');
      }
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'حدث خطأ أثناء حفظ بيانات المدرس';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const splitTypeOptions = [
    { value: 'percentage', label: '📊 نسبة مئوية', desc: 'المدرس يأخذ نسبة من التحصيل' },
    { value: 'fixed', label: '💵 مبلغ ثابت', desc: 'مبلغ ثابت لكل طالب حاضر' },
  ];

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
                {isEdit ? 'تعديل بيانات المدرس' : 'إضافة مدرس جديد'}
              </h2>
              <p className="text-white/70 text-xs mt-0.5">
                {isEdit ? 'تحديث البيانات الشخصية والمالية' : 'تسجيل مدرس جديد وتحديد نظام المحاسبة'}
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
          {/* Section 1: Personal Info */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <User size={16} className="text-sky-500" />
              البيانات الشخصية
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  اسم المدرس <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: أ/ أحمد محمود"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="atlas-input"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  رقم الموبايل
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="01012345678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="atlas-input pr-9 font-mono"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    placeholder="teacher@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="atlas-input pr-9"
                  />
                </div>
              </div>

              {/* Subject Selection Box & Badges */}
              <div className="sm:col-span-2 space-y-3 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 flex items-center gap-2">
                    <BookOpen size={16} className="text-sky-600" />
                    المادة الدراسية للمدرس <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    {formData.subject_ids.length > 0 ? `${formData.subject_ids.length} مادة مختارة` : 'اختر مادة أو أكثر'}
                  </span>
                </div>

                {/* Main Stylish Select Dropdown */}
                <div className="relative">
                  <select
                    value={formData.subject_id}
                    onChange={(e) => {
                      const sId = e.target.value;
                      if (!sId) return;
                      if (!formData.subject_ids.includes(sId)) {
                        toggleSubject(sId);
                      } else {
                        setFormData((prev) => ({ ...prev, subject_id: sId }));
                      }
                    }}
                    className="atlas-input appearance-none bg-white cursor-pointer pr-4 pl-10 font-medium text-slate-800"
                  >
                    <option value="">-- اضغط لاختيار مادة من قائمة المواد --</option>
                    {subjectsList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name_ar} {s.name_en ? `(${s.name_en})` : ''}
                      </option>
                    ))}
                  </select>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <BookOpen size={16} />
                  </div>
                </div>

                {/* Quick Subject Chips / Badges Grid */}
                <div>
                  <p className="text-[11px] text-slate-500 mb-2">أو انقر لاختيار المادة / المواد مباشرة:</p>
                  <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
                    {loadingSubjects ? (
                      <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                        <Loader2 size={14} className="animate-spin" /> جاري تحميل المواد الدراسية...
                      </div>
                    ) : (
                      subjectsList.map((s) => {
                        const isSelected = formData.subject_ids.includes(s.id);
                        return (
                          <button
                            type="button"
                            key={s.id}
                            onClick={() => toggleSubject(s.id)}
                            className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                              isSelected
                                ? 'bg-white shadow-sm ring-2'
                                : 'bg-white/80 hover:bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                            style={{
                              borderColor: isSelected ? s.color || '#0C3C82' : undefined,
                              boxShadow: isSelected ? `0 0 0 1px ${s.color || '#0C3C82'}` : undefined,
                            }}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform group-hover:scale-125"
                              style={{ backgroundColor: s.color || '#0C3C82' }}
                            />
                            <span>{s.name_ar}</span>
                            {isSelected && (
                              <span
                                className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px]"
                                style={{ backgroundColor: s.color || '#0C3C82' }}
                              >
                                <Check size={11} strokeWidth={3} />
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Synchronized Specialization Text (editable if needed) */}
                <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 flex-shrink-0">وصف التخصص:</span>
                  <input
                    type="text"
                    placeholder="مثال: رياضيات، لغة عربية"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="text-xs bg-transparent border-b border-dashed border-slate-300 focus:border-sky-500 focus:outline-none px-1 py-0.5 flex-1 font-medium text-slate-700"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Financial Configuration */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Coins size={16} className="text-sky-500" />
              نظام المحاسبة المالي مع السنتر
            </h3>

            {/* Revenue Split Type Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {splitTypeOptions.map((opt) => {
                const isSelected = formData.revenue_split_type === opt.value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => setFormData({ ...formData, revenue_split_type: opt.value })}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/70 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-sm font-bold text-slate-900">{opt.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* Percentage Input */}
            {formData.revenue_split_type === 'percentage' && (
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100">
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  نسبة المدرس من التحصيل (%)
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Percent size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={formData.revenue_split_percent}
                      onChange={(e) => setFormData({ ...formData, revenue_split_percent: Number(e.target.value) })}
                      className="atlas-input pr-9 font-mono text-center"
                    />
                  </div>
                  <div className="text-xs text-slate-600 bg-white px-3 py-2 rounded-lg border border-slate-200 flex-shrink-0">
                    حصة السنتر: <strong className="text-red-600">{100 - (formData.revenue_split_percent || 0)}%</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Fixed Rate Input */}
            {formData.revenue_split_type === 'fixed' && (
              <div className="p-4 rounded-xl bg-green-50/60 border border-green-100">
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  المبلغ الثابت لكل طالب حاضر (ج.م)
                </label>
                <div className="relative">
                  <Coins size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={formData.fixed_rate_per_student}
                    onChange={(e) => setFormData({ ...formData, fixed_rate_per_student: Number(e.target.value) })}
                    className="atlas-input pr-9 font-mono text-center"
                    placeholder="40"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  💡 المدرس يحصل على هذا المبلغ عن كل طالب يحضر الحصة، والباقي من سعر الحصة يذهب للسنتر.
                </p>
              </div>
            )}
          </div>

          {/* Section 3: Notes */}
          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ملاحظات إضافية
            </label>
            <textarea
              rows={2}
              placeholder="أي ملاحظات خاصة بالمدرس..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="atlas-input resize-none"
            />
          </div>
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
              'حفظ وتسجيل المدرس'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
