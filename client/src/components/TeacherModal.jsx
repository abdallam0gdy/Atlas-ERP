import { useState, useEffect, useMemo } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import ImageUpload from './ImageUpload';
import {
  X, User, Phone, Mail, BookOpen,
  Percent, Coins, Loader2, StickyNote, Check, Sparkles,
  Share2, Shield, Calendar, CreditCard, Award, Search,
  CheckSquare, Square
} from 'lucide-react';

let cachedSubjects = null;

export default function TeacherModal({
  isOpen,
  onClose,
  onSuccess,
  initialData = null,
  subjects: propSubjects = null,
}) {
  const isEdit = Boolean(initialData?.id);

  const [subjectsList, setSubjectsList] = useState(
    propSubjects || cachedSubjects || []
  );
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [subjectSearch, setSubjectSearch] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    full_name_ar: '',
    aka: '',
    phone: '',
    email: '',
    gender: 'male',
    national_id: '',
    date_of_birth: '',
    specialization: '',
    subject_id: '',
    subject_ids: [],
    revenue_split_type: 'percentage',
    revenue_split_percent: 80,
    fixed_rate_per_student: 0,
    bio: '',
    secretary_name: '',
    secretary_phone: '',
    photo_url: '',
    logo_url: '',
    social_links: {
      facebook: '',
      youtube: '',
      telegram: '',
      whatsapp: '',
    },
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load master subjects (cached for instant modal opening on low-end devices)
  useEffect(() => {
    if (!isOpen) return;

    if (propSubjects && propSubjects.length > 0) {
      setSubjectsList(propSubjects);
      cachedSubjects = propSubjects;
      return;
    }

    if (cachedSubjects && cachedSubjects.length > 0) {
      setSubjectsList(cachedSubjects);
      return;
    }

    const fetchSubjects = async () => {
      try {
        setLoadingSubjects(true);
        const { data } = await api.get('/master/subjects');
        const list = data.data || [];
        cachedSubjects = list;
        setSubjectsList(list);
      } catch (err) {
        console.error('Failed to load subjects:', err);
      } finally {
        setLoadingSubjects(false);
      }
    };
    fetchSubjects();
  }, [isOpen, propSubjects]);

  useEffect(() => {
    if (initialData) {
      const sIds =
        initialData.subject_ids && initialData.subject_ids.length > 0
          ? initialData.subject_ids
          : initialData.subject_id
          ? [initialData.subject_id]
          : initialData.subjects?.map((s) => s.id) || [];

      let social = { facebook: '', youtube: '', telegram: '', whatsapp: '' };
      if (initialData.social_links) {
        try {
          social =
            typeof initialData.social_links === 'string'
              ? JSON.parse(initialData.social_links)
              : initialData.social_links;
        } catch {
          social = { facebook: '', youtube: '', telegram: '', whatsapp: '' };
        }
      }

      setFormData({
        full_name: initialData.full_name || '',
        full_name_ar: initialData.full_name_ar || '',
        aka: initialData.aka || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        gender: initialData.gender || 'male',
        national_id: initialData.national_id || '',
        date_of_birth: initialData.date_of_birth
          ? initialData.date_of_birth.slice(0, 10)
          : '',
        specialization: initialData.specialization || '',
        subject_id: initialData.subject_id || sIds[0] || '',
        subject_ids: sIds,
        revenue_split_type: initialData.revenue_split_type || 'percentage',
        revenue_split_percent: initialData.revenue_split_percent ?? 80,
        fixed_rate_per_student: initialData.fixed_rate_per_student ?? 0,
        bio: initialData.bio || '',
        secretary_name: initialData.secretary_name || '',
        secretary_phone: initialData.secretary_phone || '',
        photo_url: initialData.photo_url || '',
        logo_url: initialData.logo_url || '',
        social_links: {
          facebook: social.facebook || '',
          youtube: social.youtube || '',
          telegram: social.telegram || '',
          whatsapp: social.whatsapp || '',
        },
        notes: initialData.notes || '',
      });
    } else {
      setFormData({
        full_name: '',
        full_name_ar: '',
        aka: '',
        phone: '',
        email: '',
        gender: 'male',
        national_id: '',
        date_of_birth: '',
        specialization: '',
        subject_id: '',
        subject_ids: [],
        revenue_split_type: 'percentage',
        revenue_split_percent: 80,
        fixed_rate_per_student: 0,
        bio: '',
        secretary_name: '',
        secretary_phone: '',
        photo_url: '',
        logo_url: '',
        social_links: {
          facebook: '',
          youtube: '',
          telegram: '',
          whatsapp: '',
        },
        notes: '',
      });
    }
    setSubjectSearch('');
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

      const newPrimary =
        updatedIds.length > 0
          ? updatedIds.includes(prev.subject_id)
            ? prev.subject_id
            : updatedIds[0]
          : '';

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

  const handleSelectAllSubjects = () => {
    const allIds = subjectsList.map((s) => s.id);
    const allNames = subjectsList.map((s) => s.name_ar).join(' ، ');
    setFormData((prev) => ({
      ...prev,
      subject_ids: allIds,
      subject_id: allIds[0] || '',
      specialization: allNames,
    }));
  };

  const handleClearAllSubjects = () => {
    setFormData((prev) => ({
      ...prev,
      subject_ids: [],
      subject_id: '',
      specialization: '',
    }));
  };

  const filteredSubjects = useMemo(() => {
    if (!subjectSearch.trim()) return subjectsList;
    const q = subjectSearch.trim().toLowerCase();
    return subjectsList.filter((s) =>
      (s.name_ar || '').toLowerCase().includes(q) ||
      (s.name_en || '').toLowerCase().includes(q)
    );
  }, [subjectsList, subjectSearch]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.full_name.trim()) {
      toast.error('يرجى إدخال اسم المدرس');
      return;
    }

    if (formData.subject_ids.length === 0) {
      toast.error('يرجى اختيار مادة دراسية واحدة على الأقل');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        phone: formData.phone && formData.phone.trim() ? formData.phone.trim() : null,
        secretary_phone:
          formData.secretary_phone && formData.secretary_phone.trim()
            ? formData.secretary_phone.trim()
            : null,
        date_of_birth: formData.date_of_birth || null,
        email: formData.email && formData.email.trim() ? formData.email.trim() : null,
        revenue_split_percent: Number(formData.revenue_split_percent) || 0,
        fixed_rate_per_student: Number(formData.fixed_rate_per_student) || 0,
      };

      if (isEdit) {
        const { data } = await api.put(`/teachers/${initialData.id}`, payload);
        toast.success(data.message || 'تم تحديث بيانات المدرس بنجاح');
      } else {
        const { data } = await api.post('/teachers', payload);
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50"
      dir="rtl"
    >
      <div
        className="bg-white rounded-2xl shadow-lg border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-100"
          style={{ background: '#0C3C82' }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 text-white">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {isEdit ? 'تعديل ملف المدرس' : 'إضافة مدرس جديد'}
              </h2>
              <p className="text-white/70 text-xs mt-0.5">
                إدارة بيانات المدرس، الصور، اللوجو، المواد المسندة، والنسب المالية
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Section 1: Photos & Logos */}
          <div className="p-3.5 sm:p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <ImageUpload
              value={formData.photo_url}
              onChange={(url) => setFormData({ ...formData, photo_url: url })}
              category="teachers"
              label="صورة المدرس الشخصية"
              shape="circle"
              size={80}
              hint="صورة بروفايل عالية الجودة للمدرس تظهر في الكروت والتقارير"
            />
            <ImageUpload
              value={formData.logo_url}
              onChange={(url) => setFormData({ ...formData, logo_url: url })}
              category="logos"
              label="لوجو / شعار المدرس"
              shape="rounded"
              size={80}
              hint="شعار براند المدرس للطباعة على الملازم وكروت الحضور"
            />
          </div>

          {/* Section 2: Identity & Basic Details */}
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <User size={15} className="text-sky-600" />
              <span>البيانات الأساسية والشخصية</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  اسم المدرس بالكامل <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: أ/ محمد أحمد علي"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="atlas-input text-xs sm:text-sm"
                />
              </div>

              {/* AKA (اسم الشهرة) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  اسم الشهرة / اللقب <span className="text-slate-400 font-normal">(اختياري)</span>
                </label>
                <div className="relative">
                  <Award
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="مثال: أ/ الباشا / القيصر"
                    value={formData.aka}
                    onChange={(e) => setFormData({ ...formData, aka: e.target.value })}
                    className="atlas-input pr-9 text-xs sm:text-sm"
                  />
                </div>
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
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      formData.gender === 'male'
                        ? 'bg-blue-50 border-blue-500 text-blue-800 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>👨 أستاذ (ذكر)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: 'female' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      formData.gender === 'female'
                        ? 'bg-pink-50 border-pink-500 text-pink-800 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>👩 أستاذة (أنثى)</span>
                  </button>
                </div>
              </div>

              {/* Phone (OPTIONAL - NO RESTRICTION) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  رقم هاتف المدرس <span className="text-slate-400 font-normal">(اختياري)</span>
                </label>
                <div className="relative">
                  <Phone
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="tel"
                    placeholder="01012345678 (اختياري)"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="atlas-input pr-9 font-mono text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* National ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  الرقم القومي <span className="text-slate-400 font-normal">(اختياري)</span>
                </label>
                <div className="relative">
                  <CreditCard
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    maxLength={14}
                    placeholder="14 رقم"
                    value={formData.national_id}
                    onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                    className="atlas-input pr-9 font-mono text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  البريد الإلكتروني <span className="text-slate-400 font-normal">(اختياري)</span>
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="email"
                    placeholder="teacher@example.com (اختياري)"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="atlas-input pr-9 font-mono text-xs sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Secretariat Info (السكرتارية) */}
          <div className="pt-3.5 border-t border-slate-100">
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 mb-2.5 flex items-center gap-2">
              <Shield size={15} className="text-emerald-600" />
              <span>بيانات السكرتارية والمساعدين (اختياري)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  اسم السكرتير/ة الرئيسي
                </label>
                <input
                  type="text"
                  placeholder="مثال: أستاذ عمر (المساعد)"
                  value={formData.secretary_name}
                  onChange={(e) => setFormData({ ...formData, secretary_name: e.target.value })}
                  className="atlas-input text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  رقم تليفون السكرتارية
                </label>
                <div className="relative">
                  <Phone
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="tel"
                    placeholder="012..."
                    value={formData.secretary_phone}
                    onChange={(e) =>
                      setFormData({ ...formData, secretary_phone: e.target.value })
                    }
                    className="atlas-input pr-9 font-mono text-xs sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Subjects Assignment with Quick Search & Selection */}
          <div className="pt-3.5 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
                <BookOpen size={15} className="text-sky-600" />
                <span>المواد الدراسية المسندة للمدرس</span>
                <span className="text-red-500">*</span>
                <span className="text-xs font-bold text-sky-700 mr-1">
                  ({formData.subject_ids.length} محددة)
                </span>
              </h3>

              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleSelectAllSubjects}
                  className="text-sky-700 hover:underline font-semibold cursor-pointer"
                >
                  تحديد الكل
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={handleClearAllSubjects}
                  className="text-slate-500 hover:underline font-semibold cursor-pointer"
                >
                  إلغاء التحديد
                </button>
              </div>
            </div>

            {/* Quick search inside subjects list */}
            {subjectsList.length > 6 && (
              <div className="relative mb-2">
                <Search
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={subjectSearch}
                  onChange={(e) => setSubjectSearch(e.target.value)}
                  placeholder="ابحث عن مادة..."
                  className="w-full pr-8 pl-3 py-1.5 text-xs rounded-lg border border-slate-200 outline-none focus:border-sky-500"
                />
              </div>
            )}

            {loadingSubjects ? (
              <div className="p-4 flex items-center justify-center text-slate-400">
                <Loader2 size={18} className="animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                {filteredSubjects.map((subject) => {
                  const isSelected = formData.subject_ids.includes(subject.id);
                  return (
                    <button
                      key={subject.id}
                      type="button"
                      onClick={() => toggleSubject(subject.id)}
                      className={`p-2 rounded-lg border text-right transition-all flex items-center justify-between text-xs font-bold cursor-pointer ${
                        isSelected
                          ? 'bg-white border-[#0C3C82] text-[#0C3C82] shadow-2xs'
                          : 'bg-white/80 border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span className="truncate">{subject.name_ar}</span>
                      {isSelected ? (
                        <CheckSquare size={14} className="text-[#0C3C82] shrink-0" />
                      ) : (
                        <Square size={14} className="text-slate-300 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 5: Financial Split & Revenue Settings */}
          <div className="pt-3.5 border-t border-slate-100 space-y-3">
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
              <Coins size={15} className="text-amber-600" />
              <span>نظام المحاسبة والنسب المالية</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Split Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  طريقة المحاسبة
                </label>
                <select
                  value={formData.revenue_split_type}
                  onChange={(e) =>
                    setFormData({ ...formData, revenue_split_type: e.target.value })
                  }
                  className="atlas-input text-xs sm:text-sm"
                >
                  <option value="percentage">نسبة مئوية من التحصيل (%)</option>
                  <option value="fixed">مبلغ ثابت لكل طالب (ج.م)</option>
                  <option value="hybrid">نظام مركب (نسبة + ثابت)</option>
                </select>
              </div>

              {/* Percentage */}
              {(formData.revenue_split_type === 'percentage' ||
                formData.revenue_split_type === 'hybrid') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    نسبة المدرس (%)
                  </label>
                  <div className="relative">
                    <Percent
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={formData.revenue_split_percent}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          revenue_split_percent: Number(e.target.value),
                        })
                      }
                      className="atlas-input pr-8 text-xs sm:text-sm font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Fixed Rate */}
              {(formData.revenue_split_type === 'fixed' ||
                formData.revenue_split_type === 'hybrid') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    المبلغ الثابت لكل طالب (ج.م)
                  </label>
                  <div className="relative">
                    <Coins
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="number"
                      min={0}
                      value={formData.fixed_rate_per_student}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fixed_rate_per_student: Number(e.target.value),
                        })
                      }
                      className="atlas-input pr-8 text-xs sm:text-sm font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Split Preview Banner */}
            {formData.revenue_split_type === 'percentage' && (
              <div className="p-2.5 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-between text-xs">
                <span className="text-sky-900 font-semibold">توزيع التحصيل التلقائي:</span>
                <span className="font-bold text-[#0C3C82]">
                  {formData.revenue_split_percent}% للمدرس | {100 - (formData.revenue_split_percent || 0)}% للسنتر
                </span>
              </div>
            )}
          </div>

          {/* Section 6: Bio & Notes */}
          <div className="pt-3.5 border-t border-slate-100 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                نبذة تعريفية عن المدرس (اختياري)
              </label>
              <textarea
                rows={2}
                placeholder="سنوات الخبرة، الدرجة العلمية، أسلوب الشرح..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="atlas-input resize-none text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ملاحظات إدارية داخلية (اختياري)
              </label>
              <textarea
                rows={2}
                placeholder="أي ملاحظات خاصة بالإدارة..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="atlas-input resize-none text-xs sm:text-sm"
              />
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2.5 px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="atlas-btn atlas-btn-outline text-xs sm:text-sm cursor-pointer"
            disabled={isSubmitting}
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="atlas-btn atlas-btn-primary flex items-center gap-1.5 text-xs sm:text-sm cursor-pointer"
            style={{ background: '#0C3C82' }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <>
                <Check size={15} />
                <span>{isEdit ? 'حفظ التعديلات' : 'إضافة المدرس'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
