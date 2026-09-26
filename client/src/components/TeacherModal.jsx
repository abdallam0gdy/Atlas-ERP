import { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import ImageUpload from './ImageUpload';
import {
  X, User, Phone, Mail, BookOpen,
  Percent, Coins, Loader2, StickyNote, Check, Sparkles,
  Share2, Shield, Calendar, CreditCard, Award, MessageCircle
} from 'lucide-react';

export default function TeacherModal({ isOpen, onClose, onSuccess, initialData = null }) {
  const isEdit = Boolean(initialData?.id);

  const [subjectsList, setSubjectsList] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

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

      let social = { facebook: '', youtube: '', telegram: '', whatsapp: '' };
      if (initialData.social_links) {
        try {
          social = typeof initialData.social_links === 'string'
            ? JSON.parse(initialData.social_links)
            : initialData.social_links;
        } catch (e) {
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
        date_of_birth: initialData.date_of_birth ? initialData.date_of_birth.slice(0, 10) : '',
        specialization: initialData.specialization || '',
        subject_id: initialData.subject_id || (sIds[0] || ''),
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

      const newPrimary = updatedIds.length > 0 ? (updatedIds.includes(prev.subject_id) ? prev.subject_id : updatedIds[0]) : '';

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
    if (!formData.phone.trim()) {
      toast.error('يرجى إدخال رقم هاتف المدرس');
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
        date_of_birth: formData.date_of_birth || null,
        email: formData.email || null,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-fade-in-up"
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
                {isEdit ? 'تعديل ملف المدرس' : 'إضافة مدرس جديد'}
              </h2>
              <p className="text-white/70 text-xs mt-0.5">
                إدارة بيانات المدرس، الصور، اللوجو، السكرتارية، والنسب المالية
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
          {/* Section 1: Photos & Logos */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
            <ImageUpload
              value={formData.photo_url}
              onChange={(url) => setFormData({ ...formData, photo_url: url })}
              category="teachers"
              label="صورة المدرس الشخصية"
              shape="circle"
              size={84}
              hint="صورة بروفايل عالية الجودة للمدرس تظهر في الكروت والتقارير"
            />
            <ImageUpload
              value={formData.logo_url}
              onChange={(url) => setFormData({ ...formData, logo_url: url })}
              category="logos"
              label="لوجو / شعار المدرس"
              shape="rounded"
              size={84}
              hint="شعار براند المدرس للطباعة على الملازم وكروت الحضور"
            />
          </div>

          {/* Section 2: Identity & Basic Details */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <User size={16} className="text-sky-500" />
              البيانات الشخصية والتعريفية
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  اسم المدرس بالكامل <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: محمد أحمد علي"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="atlas-input"
                />
              </div>

              {/* AKA (اسم الشهرة) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  اسم الشهرة / اللقب
                </label>
                <div className="relative">
                  <Award size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="مثال: مستر أحمد الباشا / القيصر"
                    value={formData.aka}
                    onChange={(e) => setFormData({ ...formData, aka: e.target.value })}
                    className="atlas-input pr-9"
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
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      formData.gender === 'male'
                        ? 'bg-blue-50 border-blue-500 text-blue-800 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>👨 أستاذ (ذكر)</span>
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
                    <span>👩 أستاذة (أنثى)</span>
                  </button>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  رقم هاتف المدرس <span className="text-red-500">*</span>
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

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  البريد الإلكتروني (اختياري)
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    placeholder="teacher@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="atlas-input pr-9 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Secretariat Info (السكرتارية) */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Shield size={16} className="text-emerald-600" />
              بيانات السكرتارية والمساعدين
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  اسم السكرتير/ة الرئيسي
                </label>
                <input
                  type="text"
                  placeholder="مثال: أستاذ عمر (المساعد)"
                  value={formData.secretary_name}
                  onChange={(e) => setFormData({ ...formData, secretary_name: e.target.value })}
                  className="atlas-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  رقم تليفون السكرتارية
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="012..."
                    value={formData.secretary_phone}
                    onChange={(e) => setFormData({ ...formData, secretary_phone: e.target.value })}
                    className="atlas-input pr-9 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Subjects Assignment */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
              <BookOpen size={16} className="text-sky-500" />
              المواد الدراسية المسندة للمدرس <span className="text-red-500">*</span>
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              حدد مادة واحدة أو أكثر. عند إنشاء أي مجموعة جديدة لهذا المدرس سيتم حصر اختيار المواد في هذه القائمة فقط.
            </p>

            {loadingSubjects ? (
              <div className="p-4 flex items-center justify-center text-slate-400">
                <Loader2 size={20} className="animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-2 bg-slate-50/70 border border-slate-200 rounded-2xl">
                {subjectsList.map((subject) => {
                  const isSelected = formData.subject_ids.includes(subject.id);
                  return (
                    <button
                      key={subject.id}
                      type="button"
                      onClick={() => toggleSubject(subject.id)}
                      className={`p-2.5 rounded-xl border text-right transition-all flex items-center justify-between text-xs font-bold ${
                        isSelected
                          ? 'bg-white border-[#0C3C82] text-[#0C3C82] shadow-xs'
                          : 'bg-white/60 border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span className="truncate">{subject.name_ar}</span>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-[#0C3C82] text-white flex items-center justify-center flex-shrink-0">
                          <Check size={12} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>


          {/* Section 6: Bio & Social Links */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Share2 size={16} className="text-sky-500" />
              النبذة التعريفية وروابط التواصل الاجتماعي
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                نبذة عن المدرس وتاريخه التعليمي
              </label>
              <textarea
                rows={2}
                placeholder="مؤهلات، سنوات الخبرة، أسلوب التدريس..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="atlas-input resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  صفحة الفيسبوك (Facebook)
                </label>
                <input
                  type="url"
                  placeholder="https://facebook.com/..."
                  value={formData.social_links.facebook}
                  onChange={(e) => setFormData({
                    ...formData,
                    social_links: { ...formData.social_links, facebook: e.target.value }
                  })}
                  className="atlas-input text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  قناة اليوتيوب (YouTube)
                </label>
                <input
                  type="url"
                  placeholder="https://youtube.com/..."
                  value={formData.social_links.youtube}
                  onChange={(e) => setFormData({
                    ...formData,
                    social_links: { ...formData.social_links, youtube: e.target.value }
                  })}
                  className="atlas-input text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  قناة التليجرام (Telegram)
                </label>
                <input
                  type="text"
                  placeholder="https://t.me/..."
                  value={formData.social_links.telegram}
                  onChange={(e) => setFormData({
                    ...formData,
                    social_links: { ...formData.social_links, telegram: e.target.value }
                  })}
                  className="atlas-input text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  واتساب المدرس / السكرتارية
                </label>
                <input
                  type="text"
                  placeholder="https://wa.me/201..."
                  value={formData.social_links.whatsapp}
                  onChange={(e) => setFormData({
                    ...formData,
                    social_links: { ...formData.social_links, whatsapp: e.target.value }
                  })}
                  className="atlas-input text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 7: General Notes */}
          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ملاحظات إدارية
            </label>
            <textarea
              rows={2}
              placeholder="أي ملاحظات داخلية خاصة بإدارة السنتر..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="atlas-input resize-none"
            />
          </div>
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
                {isEdit ? 'حفظ التعديلات' : 'إضافة المدرس'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
