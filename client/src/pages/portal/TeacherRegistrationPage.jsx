import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  UserCheck, 
  User, 
  Phone, 
  BookOpen, 
  Award, 
  Send, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  Printer,
  Sparkles,
  Users,
  Briefcase
} from 'lucide-react';

const COMMON_SUBJECTS = [
  'اللغة العربية',
  'اللغة الإنجليزية',
  'اللغة الفرنسية',
  'الرياضيات (بحتة وتطبيقية)',
  'الفيزياء',
  'الكيمياء',
  'الأحياء',
  'الجيولوجيا وعلوم البيئة',
  'التاريخ',
  'الجغرافيا',
  'الفلسفة والمنطق',
  'علم النفس والاجتماع',
  'العلوم المتكاملة',
  'مادة أخرى',
];

export default function TeacherRegistrationPage() {
  const [formData, setFormData] = useState({
    full_name: '',
    nickname: '',
    phone: '',
    whatsapp_phone: '',
    national_id: '',
    specialization: 'اللغة العربية',
    target_grades: 'المرحلة الثانوية بالكامل (أولى، ثانية، ثالثة ثانوي)',
    assistant_name: '',
    assistant_phone: '',
    expected_students_count: '',
    bio: '',
    facebook_link: '',
    youtube_link: '',
    telegram_link: '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [submittedData, setSubmittedData] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (formData.full_name.trim().split(' ').length < 2) {
      setErrorMessage('يرجى كتابة الاسم ثلاثي أو رباعي على الأقل');
      return;
    }

    const cleanPhone = formData.phone.trim();
    if (cleanPhone.length < 10) {
      setErrorMessage('يرجى التأكد من كتابة رقم الهاتف الشخصي بشكل صحيح');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        full_name: formData.full_name.trim(),
        nickname: formData.nickname.trim() || null,
        phone: cleanPhone,
        whatsapp_phone: formData.whatsapp_phone.trim() || null,
        national_id: formData.national_id.trim() || null,
        specialization: formData.specialization,
        target_grades: formData.target_grades.trim() || null,
        assistant_name: formData.assistant_name.trim() || null,
        assistant_phone: formData.assistant_phone.trim() || null,
        expected_students_count: formData.expected_students_count ? parseInt(formData.expected_students_count, 10) : null,
        bio: formData.bio.trim() || null,
        facebook_link: formData.facebook_link.trim() || null,
        youtube_link: formData.youtube_link.trim() || null,
        telegram_link: formData.telegram_link.trim() || null,
        notes: formData.notes.trim() || null,
        status: 'pending',
        synced_to_local_server: false,
      };

      const { data, error } = await supabase
        .from('online_teachers')
        .insert([payload])
        .select();

      if (error) {
        console.error('Supabase teacher insert error:', error);
        throw error;
      }

      setSubmittedData({
        ...payload,
        id: data?.[0]?.id || `TCH-${Math.floor(1000 + Math.random() * 9000)}`,
        created_at: new Date().toLocaleDateString('ar-EG'),
      });
    } catch (err) {
      console.error(err);
      setErrorMessage(
        err.message || 'حدث خطأ أثناء إرسال الاستمارة — يرجى التأكد من الاتصال بالإنترنت والمحاولة مجدداً'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================
  // SUCCESS SCREEN
  // ============================================================
  if (submittedData) {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-100 text-center animate-fade-in-up">
        <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-rose-500/20">
          <CheckCircle2 size={44} />
        </div>

        <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 text-xs font-bold px-3 py-1 rounded-full border border-rose-200 mb-3">
          <Sparkles size={13} />
          تم استلام طلب الانضمام بنجاح
        </span>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-2">
          أهلاً ومرحباً بحضرتك في سنتر أطلس! 🌟
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm max-w-lg mx-auto mb-8">
          يسعدنا ويشرفنا انضمامكم لنخبة كبار معلمين سنتر أطلس. تم تسجيل بياناتكم وسيقوم المدير التنفيذي بالتواصل مع سيادتكم لتنسيق المواعيد والقاعات وجدول الحصص.
        </p>

        {/* Teacher Summary Card */}
        <div className="max-w-md mx-auto bg-slate-50 rounded-2xl p-5 border border-slate-200 text-right mb-8 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
            <span className="text-xs text-slate-500 font-medium">رقم الطلب المرجعي:</span>
            <span className="font-mono font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded text-xs">
              {submittedData.id.slice(0, 8).toUpperCase()}
            </span>
          </div>

          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">الاسم:</span>
              <span className="font-bold text-slate-800">
                {submittedData.nickname ? `${submittedData.nickname} (${submittedData.full_name})` : submittedData.full_name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">المادة التعليمية:</span>
              <span className="font-bold text-slate-800">{submittedData.specialization}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">رقم الهاتف الشخصي:</span>
              <span className="font-mono text-slate-800">{submittedData.phone}</span>
            </div>
            {submittedData.assistant_phone && (
              <div className="flex justify-between">
                <span className="text-slate-500">هاتف السكرتارية:</span>
                <span className="font-mono text-slate-800">{submittedData.assistant_phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => window.print()}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Printer size={16} />
            <span>طباعة ملخص الاستمارة</span>
          </button>

          <button
            onClick={() => {
              setSubmittedData(null);
              setFormData({
                full_name: '',
                nickname: '',
                phone: '',
                whatsapp_phone: '',
                national_id: '',
                specialization: 'اللغة العربية',
                target_grades: 'المرحلة الثانوية بالكامل (أولى، ثانية، ثالثة ثانوي)',
                assistant_name: '',
                assistant_phone: '',
                expected_students_count: '',
                bio: '',
                facebook_link: '',
                youtube_link: '',
                telegram_link: '',
                notes: '',
              });
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-rose-600/30 cursor-pointer"
          >
            <UserCheck size={16} />
            <span>تسجيل استمارة جديدة</span>
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // FORM SCREEN
  // ============================================================
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-100">
      
      {/* Title & Introduction */}
      <div className="text-center pb-6 mb-8 border-b border-slate-100">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 mb-3">
          <UserCheck size={28} />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-800">
          استمارة انضمام عضو هيئة تدريس
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm mt-1.5 max-w-lg mx-auto">
          انضم لنخبة أساتذة ومعلمي سنتر أطلس التعليمي واستفد من أحدث القاعات المجهزة ومنظومة الإدارة والمتابعة الإلكترونية المتكاملة
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center gap-3">
          <AlertCircle size={20} className="shrink-0 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* ============================================================
            SECTION 1: PERSONAL & PROFESSIONAL INFO
            ============================================================ */}
        <div>
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <User size={18} className="text-rose-600" />
            <h3 className="text-sm sm:text-base font-bold text-slate-800">1. البيانات الشخصية والمهنية</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                الاسم بالكامل <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                placeholder="مثال: أحمد عبد الله محمود"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Nickname / Title */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                اسم الشهرة أو اللقب (كما يظهر للطلاب)
              </label>
              <input
                type="text"
                name="nickname"
                value={formData.nickname}
                onChange={handleChange}
                placeholder="مثال: مستر / أحمد عبد الله"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                رقم الهاتف الشخصي <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="010xxxxxxxx"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
              />
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                رقم الواتساب للتواصل
              </label>
              <input
                type="tel"
                name="whatsapp_phone"
                value={formData.whatsapp_phone}
                onChange={handleChange}
                placeholder="010xxxxxxxx"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
              />
            </div>

            {/* National ID */}
            <div className="sm:col-span-2">
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                الرقم القومي (اختياري)
              </label>
              <input
                type="text"
                name="national_id"
                value={formData.national_id}
                onChange={handleChange}
                placeholder="14 رقم"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* ============================================================
            SECTION 2: SUBJECT & GRADES
            ============================================================ */}
        <div>
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <BookOpen size={18} className="text-sky-600" />
            <h3 className="text-sm sm:text-base font-bold text-slate-800">2. المادة والصفوف المستهدفة</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Specialization / Subject */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                المادة التعليمية الأساسية <span className="text-rose-500">*</span>
              </label>
              <select
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all bg-white font-medium"
              >
                {COMMON_SUBJECTS.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            {/* Expected Students Count */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                العدد المتوقع للطلاب بالموسم (تقريبي)
              </label>
              <input
                type="number"
                name="expected_students_count"
                value={formData.expected_students_count}
                onChange={handleChange}
                placeholder="مثال: 150"
                min="0"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Target Grades */}
            <div className="sm:col-span-2">
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                المراحل والصفوف المستهدفة <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="target_grades"
                value={formData.target_grades}
                onChange={handleChange}
                required
                placeholder="مثال: أولى وثانية وثالثة ثانوي عام ولغات"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* ============================================================
            SECTION 3: ASSISTANT / SECRETARY INFO
            ============================================================ */}
        <div>
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <Users size={18} className="text-emerald-600" />
            <h3 className="text-sm sm:text-base font-bold text-slate-800">3. فريق العمل والسكرتارية (مسؤول الحجز)</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Assistant Name */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                اسم السكرتير أو المساعد المسؤول
              </label>
              <input
                type="text"
                name="assistant_name"
                value={formData.assistant_name}
                onChange={handleChange}
                placeholder="مثال: أ/ محمود"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Assistant Phone */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                هاتف السكرتير للتواصل والتنسيق
              </label>
              <input
                type="tel"
                name="assistant_phone"
                value={formData.assistant_phone}
                onChange={handleChange}
                placeholder="011xxxxxxxx"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* ============================================================
            SECTION 4: BIO & SOCIAL LINKS
            ============================================================ */}
        <div>
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <Briefcase size={18} className="text-amber-600" />
            <h3 className="text-sm sm:text-base font-bold text-slate-800">4. السيرة الذاتية وروابط المنصات</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Facebook Link */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                صفحة الفيسبوك (Facebook)
              </label>
              <input
                type="url"
                name="facebook_link"
                value={formData.facebook_link}
                onChange={handleChange}
                placeholder="https://facebook.com/..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all text-left"
                dir="ltr"
              />
            </div>

            {/* YouTube Link */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                قناة اليوتيوب (YouTube)
              </label>
              <input
                type="url"
                name="youtube_link"
                value={formData.youtube_link}
                onChange={handleChange}
                placeholder="https://youtube.com/..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all text-left"
                dir="ltr"
              />
            </div>

            {/* Telegram Link */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                قناة أو جروب التليجرام
              </label>
              <input
                type="url"
                name="telegram_link"
                value={formData.telegram_link}
                onChange={handleChange}
                placeholder="https://t.me/..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all text-left"
                dir="ltr"
              />
            </div>

            {/* Bio */}
            <div className="sm:col-span-3">
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                نبذة تعريفية وخبرات سابقة
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={2}
                placeholder="سنوات الخبرة، المدارس أو المراكز السابقة، أي تفاصيل إضافية..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            {/* Room / Schedule Notes */}
            <div className="sm:col-span-3">
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                متطلبات القاعات أو المواعيد المفضلة
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={2}
                placeholder="الأيام المفضلة، سعة القاعة المطلوبة، شاشات عرض، إلخ..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-rose-600/30 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>جاري إرسال الاستمارة وتسجيل البيانات...</span>
              </>
            ) : (
              <>
                <Send size={18} />
                <span>تأكيد وإرسال استمارة انضمام المعلم</span>
              </>
            )}
          </button>
          
          <p className="text-center text-slate-400 text-xs mt-3">
            سيتم مراجعة طلبكم والتواصل هاتفياً من قِبل الإدارة لتنسيق الجداول والقاعات
          </p>
        </div>

      </form>

    </div>
  );
}
