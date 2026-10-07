import { useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  GraduationCap, 
  User, 
  Phone, 
  School, 
  Send, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  Printer,
  Sparkles,
  Calendar,
  Fingerprint
} from 'lucide-react';
import ImageUploadField from '../../components/portal/ImageUploadField';

const ACADEMIC_GRADES = [
  'الصف الأول الابتدائي',
  'الصف الثاني الابتدائي',
  'الصف الثالث الابتدائي',
  'الصف الرابع الابتدائي',
  'الصف الخامس الابتدائي',
  'الصف السادس الابتدائي',
  'الصف الأول الإعدادي',
  'الصف الثاني الإعدادي',
  'الصف الثالث الإعدادي',
  'الصف الأول الثانوي',
  'الصف الثاني الثانوي',
  'الصف الثالث الثانوي',
];

/**
 * تنظيف وتحويل الأرقام العربية/المشرقية (٠١٢٣٤٥٦٧٨٩) إلى أرقام إنجليزية قياسية
 */
function normalizeArabicNumbers(str) {
  if (!str) return '';
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(str).replace(/[٠-٩]/g, (w) => arabicNumerals.indexOf(w));
}

/**
 * التحقق من صحة رقم الهاتف المحمول المصري
 * (010, 011, 012, 015 متبوعة بـ 8 أرقام)
 */
function isValidEgyptianPhone(phone) {
  if (!phone) return false;
  const clean = normalizeArabicNumbers(String(phone).replace(/[\s\-\+]/g, ''));
  return /^01[0125]\d{8}$/.test(clean) || /^201[0125]\d{8}$/.test(clean);
}

function cleanEgyptianPhone(phone) {
  if (!phone) return '';
  let clean = normalizeArabicNumbers(String(phone).replace(/[\s\-\+]/g, ''));
  if (clean.startsWith('20') && clean.length === 12) {
    clean = '0' + clean.slice(2);
  }
  return clean;
}

/**
 * دالة استنتاج تاريخ الميلاد والنوع من الرقم القومي المصري (14 رقماً)
 * القرن: 2 (1900-1999)، 3 (2000-2099)
 * خانات 2-3: السنة، 4-5: الشهر، 6-7: اليوم
 */
function parseEgyptianNationalId(nid) {
  if (!nid) return null;
  const clean = normalizeArabicNumbers(String(nid).trim());
  if (!/^[23]\d{13}$/.test(clean)) return null;

  const century = clean[0] === '3' ? '20' : '19';
  const year = century + clean.slice(1, 3);
  const month = clean.slice(3, 5);
  const day = clean.slice(5, 7);

  const m = parseInt(month, 10);
  const d = parseInt(day, 10);
  const y = parseInt(year, 10);

  if (m < 1 || m > 12) return null;
  if (d < 1 || d > 31) return null;
  const currentYear = new Date().getFullYear();
  if (y < 1920 || y > currentYear) return null;

  const genderDigit = parseInt(clean[12], 10);
  const inferredGender = genderDigit % 2 !== 0 ? 'male' : 'female';

  return {
    clean,
    birthDate: `${year}-${month}-${day}`,
    formattedArabic: `${day} / ${month} / ${year}`,
    year,
    month,
    day,
    age: currentYear - y,
    inferredGender,
  };
}

export default function StudentRegistrationPage() {
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    photo_url: '',
    father_phone: '',
    mother_phone: '',
    parent_job: '',
    academic_grade: '', // فارغ إجبارياً لإلزام الطالب بالاختيار
    education_type: '', // فارغ إجبارياً لإلزام الطالب بالاختيار
    school_name: '',
    gender: 'male',
    national_id: '',
    address: '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [submittedData, setSubmittedData] = useState(null);

  // استنتاج تاريخ الميلاد تلقائياً وبشكل فوري عند كتابة الرقم القومي
  const parsedNid = useMemo(() => {
    return parseEgyptianNationalId(formData.national_id);
  }, [formData.national_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    // 0. التحقق من انتهاء رفع الصورة
    if (isPhotoUploading) {
      setErrorMessage('جاري رفع الصورة الشخصية حالياً، يرجى الانتظار ثوانٍ معدودة حتى يكتمل الرفع');
      return;
    }

    // 1. التحقق من اسم الطالب
    if (formData.full_name.trim().split(/\s+/).filter(Boolean).length < 3) {
      setErrorMessage('يرجى كتابة اسم الطالب ثلاثي أو رباعي بالكامل (3 كلمات على الأقل)');
      return;
    }

    // 2. التحقق من الصورة الشخصية
    if (!formData.photo_url) {
      setErrorMessage('يرجى رفع الصورة الشخصية للطالب بخلفية بيضاء');
      return;
    }

    // 3. التحقق من رقم هاتف الطالب
    const cleanPhone = cleanEgyptianPhone(formData.phone);
    if (!isValidEgyptianPhone(cleanPhone)) {
      setErrorMessage('يرجى إدخال رقم هاتف محمول صحيح للطالب (11 رقماً يبدأ بـ 010 أو 011 أو 012 أو 015)');
      return;
    }

    // 4. التحقق من الرقم القومي واستنتاج تاريخ الميلاد
    const cleanNid = normalizeArabicNumbers(formData.national_id.trim());
    if (!/^[23]\d{13}$/.test(cleanNid)) {
      setErrorMessage('الرقم القومي مطلوب ويجب أن يتكون من 14 رقماً ويبدأ بـ 2 أو 3');
      return;
    }

    const nidInfo = parseEgyptianNationalId(cleanNid);
    if (!nidInfo) {
      setErrorMessage('الرقم القومي غير صالح، يرجى مراجعة الأرقام (تاريخ الميلاد غير مطابق)');
      return;
    }

    // 5. التحقق من العنوان
    if (!formData.address.trim()) {
      setErrorMessage('يرجى إدخال العنوان أو المنطقة السكنية');
      return;
    }

    // 6. التحقق من هواتف أولياء الأمور
    const cleanFatherPhone = cleanEgyptianPhone(formData.father_phone);
    if (!isValidEgyptianPhone(cleanFatherPhone)) {
      setErrorMessage('يرجى كتابة رقم هاتف ولي الأمر (الأب) بشكل صحيح (11 رقماً يبدأ بـ 01)');
      return;
    }

    // منع الطالب من وضع رقمه الشخصي كهاتف لولي الأمر
    if (cleanPhone === cleanFatherPhone) {
      setErrorMessage('رقم هاتف ولي الأمر (الأب) يجب أن يكون مختلفاً عن رقم هاتف الطالب لضمان التواصل المباشر مع الأسرة');
      return;
    }

    const cleanMotherPhone = cleanEgyptianPhone(formData.mother_phone);
    if (!isValidEgyptianPhone(cleanMotherPhone)) {
      setErrorMessage('يرجى كتابة رقم هاتف الأم بشكل صحيح (11 رقماً يبدأ بـ 01)');
      return;
    }

    // 7. التحقق من وظيفة ولي الأمر
    if (!formData.parent_job.trim()) {
      setErrorMessage('يرجى كتابة وظيفة ولي الأمر');
      return;
    }

    // 8. التحقق من المسار التعليمي
    if (!formData.academic_grade) {
      setErrorMessage('يرجى اختيار الصف الدراسي من القائمة');
      return;
    }

    if (!formData.education_type) {
      setErrorMessage('يرجى اختيار نوع التعليم من القائمة');
      return;
    }

    // 9. التحقق من اسم المدرسة
    if (!formData.school_name.trim()) {
      setErrorMessage('يرجى كتابة اسم المدرسة المقيد بها الطالب');
      return;
    }

    setIsSubmitting(true);

    try {
      // توليد معرف UUID فريد من جهة العميل لضمان العمل تحت صلاحيات RLS بأمان
      const studentId = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : `std_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const payload = {
        id: studentId,
        full_name: formData.full_name.trim(),
        phone: cleanPhone,
        photo_url: formData.photo_url || null,
        father_phone: cleanFatherPhone,
        mother_phone: cleanMotherPhone,
        parent_job: formData.parent_job.trim(),
        academic_grade: formData.academic_grade,
        education_type: formData.education_type,
        school_name: formData.school_name.trim(),
        gender: formData.gender,
        national_id: cleanNid,
        birth_date: nidInfo.birthDate, // مستنتج تلقائياً من الرقم القومي
        address: formData.address.trim(),
        desired_subjects: null, // تم إلغاء اختيار المواد/المدرسين
        notes: formData.notes.trim() || null,
        status: 'pending',
        synced_to_local_server: false,
      };

      let { error } = await supabase
        .from('online_students')
        .insert([payload]);

      // مرونة هندسية في حال لم تكن خانة photo_url مضافة بعد في سوبابيز
      if (error && (error.message?.includes('photo_url') || error.message?.includes('schema cache'))) {
        const fallbackPayload = { ...payload };
        if (fallbackPayload.photo_url) {
          fallbackPayload.notes = (fallbackPayload.notes ? fallbackPayload.notes + '\n' : '') + `[رابط الصورة الشخصية]: ${fallbackPayload.photo_url}`;
          delete fallbackPayload.photo_url;
        }
        const retry = await supabase.from('online_students').insert([fallbackPayload]);
        if (retry.error) throw retry.error;
        error = null;
      } else if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      setSubmittedData({
        ...payload,
        birth_date_arabic: nidInfo.formattedArabic,
        id: studentId,
        created_at: new Date().toLocaleDateString('ar-EG'),
      });
    } catch (err) {
      console.error(err);
      setErrorMessage(
        err.message || 'حدث خطأ أثناء إرسال البيانات — تأكد من الاتصال بالإنترنت وحاول مرة أخرى'
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
        {submittedData.photo_url ? (
          <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-emerald-500 p-1 bg-white shadow-lg mx-auto mb-5">
            <img 
              src={submittedData.photo_url} 
              alt="صورة الطالب" 
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
        ) : (
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/20">
            <CheckCircle2 size={44} />
          </div>
        )}

        <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 mb-3">
          <Sparkles size={13} />
          تم استلام استمارة التسجيل بنجاح
        </span>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-2">
          أهلاً بك في أكاديمية أطلس التعليمية! 🎉
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm max-w-lg mx-auto mb-8">
          تم تسجيل بياناتك بنجاح على النظام، وسيتم مراجعة الطلب من إدارة الأكاديمية والتواصل معك فوراً لتأكيد المواعيد وتسليم كود الطالب.
        </p>

        {/* Registration Summary Card */}
        <div className="max-w-2xl mx-auto bg-slate-50 rounded-2xl p-6 border border-slate-200 text-right mb-8 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
            <span className="text-xs text-slate-500 font-medium">رقم الطلب المرجعي:</span>
            <span className="font-mono font-bold text-sky-700 bg-sky-100 px-2.5 py-0.5 rounded text-xs">
              {submittedData.id.slice(0, 8).toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs sm:text-sm">
            <div className="flex justify-between py-1 border-b border-slate-200/60 sm:border-0">
              <span className="text-slate-500">اسم الطالب:</span>
              <span className="font-bold text-slate-800">{submittedData.full_name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60 sm:border-0">
              <span className="text-slate-500">الصف الدراسي:</span>
              <span className="font-bold text-slate-800">{submittedData.academic_grade}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60 sm:border-0">
              <span className="text-slate-500">نوع التعليم:</span>
              <span className="font-bold text-slate-800">{submittedData.education_type}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60 sm:border-0">
              <span className="text-slate-500">تاريخ الميلاد (مستنتج):</span>
              <span className="font-bold text-slate-800">{submittedData.birth_date_arabic}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60 sm:border-0">
              <span className="text-slate-500">المدرسة:</span>
              <span className="font-bold text-slate-800">{submittedData.school_name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60 sm:border-0">
              <span className="text-slate-500">هاتف الطالب:</span>
              <span className="font-mono text-slate-800">{submittedData.phone}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60 sm:border-0">
              <span className="text-slate-500">هاتف ولي الأمر (الأب):</span>
              <span className="font-mono text-slate-800">{submittedData.father_phone}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60 sm:border-0">
              <span className="text-slate-500">هاتف الأم:</span>
              <span className="font-mono text-slate-800">{submittedData.mother_phone}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Printer size={16} />
            <span>طباعة إيصال التقديم</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSubmittedData(null);
              setFormData({
                full_name: '',
                phone: '',
                photo_url: '',
                father_phone: '',
                mother_phone: '',
                parent_job: '',
                academic_grade: '',
                education_type: '',
                school_name: '',
                gender: 'male',
                national_id: '',
                address: '',
                notes: '',
              });
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-sky-600/30 cursor-pointer"
          >
            <GraduationCap size={16} />
            <span>تسجيل طالب آخر</span>
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // FORM SCREEN
  // ============================================================
  return (
    <div className="bg-white rounded-3xl p-5 sm:p-8 lg:p-10 shadow-2xl border border-slate-100">
      
      {/* Form Title & Introduction */}
      <div className="text-center pb-6 mb-8 border-b border-slate-100">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 mb-3">
          <GraduationCap size={28} />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-800">
          استمارة تسجيل وحجز طالب جديد
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm mt-1.5 max-w-lg mx-auto">
          يرجى إدخال كافة البيانات بدقة لضمان تسجيلك في المجموعات وحفظ مقعدك الدراسي في أكاديمية أطلس التعليمية
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center gap-3">
          <AlertCircle size={20} className="shrink-0 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          
          {/* ============================================================
              RIGHT COLUMN (lg:col-span-6): STUDENT BASIC INFO & PHOTO
              ============================================================ */}
          <div className="lg:col-span-6 space-y-7">
            
            {/* SECTION 1: STUDENT BASIC INFO */}
            <div className="p-5 sm:p-7 rounded-3xl bg-slate-50/70 border border-slate-200/90 shadow-2xs">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200">
                <User size={18} className="text-sky-600" />
                <h3 className="text-sm sm:text-base font-bold text-slate-800">
                  1. بيانات الطالب الأساسية <span className="text-rose-500">*</span>
                </h3>
              </div>

              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                    اسم الطالب رباعي <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                    placeholder="مثال: محمد أحمد إبراهيم علي"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all bg-white"
                  />
                </div>

                {/* Student Photo */}
                <div>
                  <ImageUploadField
                    label="الصورة الشخصية للطالب (بخلفية بيضاء)"
                    description="يرجى رفع صورة شخصية واضحة للطالب بخلفية بيضاء سادة لاستخراج بطاقة الطالب وكود الحضور الذكي"
                    badgeText="خلفية بيضاء مطلوبة"
                    value={formData.photo_url}
                    onChange={(url) => setFormData((prev) => ({ ...prev, photo_url: url }))}
                    onUploadingChange={setIsPhotoUploading}
                    required={true}
                    isWhiteBackground={true}
                  />
                </div>

                {/* Student Phone & Gender */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                      رقم هاتف الطالب (موبايل) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder="010xxxxxxxx"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                      النوع <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all bg-white"
                    >
                      <option value="male">ذكر (طالب)</option>
                      <option value="female">أنثى (طالبة)</option>
                    </select>
                  </div>
                </div>

                {/* National ID (Required - replaces Birth Date) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700">
                      الرقم القومي للطالب (14 رقماً) <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Fingerprint size={12} className="text-sky-600" />
                      <span>من واقع شهادة الميلاد أو البطاقة</span>
                    </span>
                  </div>
                  <input
                    type="text"
                    name="national_id"
                    value={formData.national_id}
                    onChange={handleChange}
                    required
                    maxLength={14}
                    placeholder="مثال: 30805120101234"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all bg-white"
                  />

                  {/* Automatic Birth Date Recognition Indicator */}
                  {parsedNid ? (
                    <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                      <Calendar size={14} className="text-emerald-600 shrink-0" />
                      <span>
                        تاريخ الميلاد المستنتج تلقائياً: <strong>{parsedNid.formattedArabic}</strong>
                      </span>
                    </div>
                  ) : formData.national_id.length > 0 ? (
                    <p className="text-[11px] text-amber-600 mt-1.5">
                      * يرجى إدخال 14 رقماً بالكامل لاستنتاج تاريخ الميلاد بشكل صحيح.
                    </p>
                  ) : null}
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                    العنوان أو المنطقة السكنية <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    placeholder="مثال: مدينة نصر - الحي السابع - شارع عباس العقاد"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all bg-white"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* ============================================================
              LEFT COLUMN (lg:col-span-6): GUARDIAN, ACADEMIC, SUBMIT
              ============================================================ */}
          <div className="lg:col-span-6 space-y-7">
            
            {/* SECTION 2: GUARDIAN INFO */}
            <div className="p-5 sm:p-7 rounded-3xl bg-slate-50/70 border border-slate-200/90 shadow-2xs">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200">
                <Phone size={18} className="text-emerald-600" />
                <h3 className="text-sm sm:text-base font-bold text-slate-800">
                  2. بيانات ولي الأمر والتواصل <span className="text-rose-500">*</span>
                </h3>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Father Phone */}
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                      هاتف ولي الأمر (الأب) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="father_phone"
                      value={formData.father_phone}
                      onChange={handleChange}
                      required
                      placeholder="011xxxxxxxx"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all bg-white"
                    />
                  </div>

                  {/* Mother Phone */}
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                      هاتف الأم <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="mother_phone"
                      value={formData.mother_phone}
                      onChange={handleChange}
                      required
                      placeholder="012xxxxxxxx"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all bg-white"
                    />
                  </div>
                </div>

                {/* Parent Job */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                    وظيفة ولي الأمر <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="parent_job"
                    value={formData.parent_job}
                    onChange={handleChange}
                    required
                    placeholder="مثال: مهندس / طبيب / معلم / أعمال حرة"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all bg-white"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: ACADEMIC INFO */}
            <div className="p-5 sm:p-7 rounded-3xl bg-slate-50/70 border border-slate-200/90 shadow-2xs">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200">
                <School size={18} className="text-amber-600" />
                <h3 className="text-sm sm:text-base font-bold text-slate-800">
                  3. المسار الدراسي والتعليمي <span className="text-rose-500">*</span>
                </h3>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Academic Grade (Must be chosen explicitly) */}
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                      الصف الدراسي المقيد به <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="academic_grade"
                      value={formData.academic_grade}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all bg-white font-medium"
                    >
                      <option value="" disabled>
                        -- اختر الصف الدراسي --
                      </option>
                      {ACADEMIC_GRADES.map((grade) => (
                        <option key={grade} value={grade}>
                          {grade}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Education Type (Must be chosen explicitly) */}
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                      نوع التعليم <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="education_type"
                      value={formData.education_type}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all bg-white"
                    >
                      <option value="" disabled>
                        -- اختر نوع التعليم --
                      </option>
                      <option value="عام">تعليم عام (حكومي / خاص عربي)</option>
                      <option value="لغات">تجريبي / لغات (Languages)</option>
                      <option value="أزهر">أزهر شريف</option>
                    </select>
                  </div>
                </div>

                {/* School Name */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                    اسم المدرسة الحالية المقيد بها <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="school_name"
                    value={formData.school_name}
                    onChange={handleChange}
                    required
                    placeholder="مثال: مدرسة الحرية الرسمية للغات"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all bg-white"
                  />
                </div>

                {/* Notes (Optional) */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                    ملاحظات أو مواعيد مفضلة <span className="text-slate-400 font-normal">(اختياري)</span>
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={2}
                    placeholder="أي رغبات إضافية تخص المواعيد أو ظروف خاصة..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all resize-none bg-white"
                  />
                </div>
              </div>
            </div>

            {/* SUBMIT BUTTON CARD */}
            <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-slate-50 to-sky-50/50 border border-sky-100 shadow-md">
              <button
                type="submit"
                disabled={isSubmitting || isPhotoUploading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 hover:from-sky-700 hover:to-indigo-800 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-sky-600/30 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>جاري إرسال الاستمارة وتسجيل البيانات...</span>
                  </>
                ) : isPhotoUploading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>جاري رفع الصورة إلى الخادم...</span>
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    <span>تأكيد وإرسال استمارة التسجيل</span>
                  </>
                )}
              </button>

              <div className="mt-3.5 text-center space-y-1">
                <p className="text-slate-500 text-xs font-medium">
                  بالضغط على إرسال، تؤكد صحة البيانات المسجلة لتسليم كود الحضور الخاص بك
                </p>
                <p className="text-[11px] text-sky-600 font-medium">
                  🔒 يتم تشفير وتخزين البيانات مباشرة في قاعدة بيانات أكاديمية أطلس
                </p>
              </div>
            </div>

          </div>

        </div>

      </form>

    </div>
  );
}
