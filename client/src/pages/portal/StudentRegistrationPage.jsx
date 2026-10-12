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
  Fingerprint,
  Check,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FileCheck
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

const STUDENT_STEPS = [
  { id: 1, title: 'بيانات الطالب والصورة', subtitle: 'الاسم، الصورة بخلفية بيضاء، والرقم القومي', icon: User },
  { id: 2, title: 'بيانات ولي الأمر', subtitle: 'أرقام هواتف الأب والأم والوظيفة', icon: Phone },
  { id: 3, title: 'المسار الدراسي والمدرسة', subtitle: 'الصف، نوع التعليم، واسم المدرسة', icon: School },
  { id: 4, title: 'المراجعة وتأكيد الحجز', subtitle: 'مراجعة كافة البيانات وتأكيد الطلب', icon: CheckCircle2 },
];

function generateUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function normalizeArabicNumbers(str) {
  if (!str) return '';
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(str).replace(/[٠-٩]/g, (w) => arabicNumerals.indexOf(w));
}

function cleanEgyptianPhone(phone) {
  if (!phone) return '';
  let clean = normalizeArabicNumbers(String(phone).replace(/[\s\-\+]/g, ''));
  if (clean.startsWith('20') && clean.length === 12) {
    clean = '0' + clean.slice(2);
  }
  return clean;
}

function isValidRealEgyptianPhone(phone) {
  if (!phone) return false;
  const clean = cleanEgyptianPhone(phone);

  // 1. يجب أن يكون 11 رقماً ويبدأ بأحد شبكات المحمول المصرية (010, 011, 012, 015)
  if (!/^01[0125]\d{8}$/.test(clean)) {
    return false;
  }

  // 2. منع الأرقام التي تحتوي على أقل من 4 أرقام مميزة (مثل 01200000000 أو 01010101010)
  const uniqueDigits = new Set(clean);
  if (uniqueDigits.size < 4) {
    return false;
  }

  // 3. منع تكرار نفس الرقم 5 مرات متتالية أو أكثر (مثل 01000001234 أو 01299999456)
  if (/(.)\1{4,}/.test(clean)) {
    return false;
  }

  // 4. منع المتتاليات الرقمية الصريحة (مثل 0123456789 أو 01012345678)
  const afterPrefix = clean.slice(3); // 8 أرقام بعد الكود
  const sequentialAsc = '0123456789';
  const sequentialDesc = '9876543210';
  if (sequentialAsc.includes(afterPrefix) || sequentialDesc.includes(afterPrefix)) {
    return false;
  }
  if (
    clean === '01234567890' ||
    clean === '01012345678' ||
    clean === '01123456789' ||
    clean === '01512345678' ||
    clean === '01212345678'
  ) {
    return false;
  }

  return true;
}

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
    year: y,
    month: m,
    day: d,
    age: currentYear - y,
    inferredGender,
  };
}

export default function StudentRegistrationPage() {
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [submittedData, setSubmittedData] = useState(null);

  const parsedNid = useMemo(() => {
    return parseEgyptianNationalId(formData.national_id);
  }, [formData.national_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateStep = (step) => {
    setErrorMessage(null);

    if (step === 1) {
      if (!formData.full_name.trim() || formData.full_name.trim().length < 3) {
        setErrorMessage('يرجى إدخال اسم الطالب رباعي بالكامل (3 أحرف على الأقل)');
        return false;
      }
      if (!formData.photo_url) {
        setErrorMessage('يرجى رفع الصورة الشخصية للطالب بخلفية بيضاء لاستخراج كود الحضور وبطاقة الطالب');
        return false;
      }
      const cleanPhone = cleanEgyptianPhone(formData.phone);
      if (!isValidRealEgyptianPhone(cleanPhone)) {
        setErrorMessage('يرجى إدخال رقم هاتف محمول مصري حقيقي وصحيح للطالب (010, 011, 012, 015) مكون من 11 رقماً وتجنب الأرقام المتكررة أو الوهمية');
        return false;
      }
      const cleanNid = normalizeArabicNumbers(formData.national_id.trim());
      if (!parseEgyptianNationalId(cleanNid)) {
        setErrorMessage('يرجى إدخال رقم قومي مصري صحيح مكون من 14 رقماً ويبدأ بـ 2 أو 3');
        return false;
      }
      if (!formData.address.trim() || formData.address.trim().length < 3) {
        setErrorMessage('يرجى إدخال العنوان أو المنطقة السكنية بالتفصيل');
        return false;
      }
      return true;
    }

    if (step === 2) {
      const cleanStudentPhone = cleanEgyptianPhone(formData.phone);
      const cleanFather = cleanEgyptianPhone(formData.father_phone);
      const cleanMother = cleanEgyptianPhone(formData.mother_phone);

      if (!isValidRealEgyptianPhone(cleanFather)) {
        setErrorMessage('يرجى إدخال رقم هاتف محمول مصري حقيقي وصحيح لولي الأمر (الأب) وتجنب الأرقام المتكررة أو الوهمية');
        return false;
      }
      if (cleanFather === cleanStudentPhone) {
        setErrorMessage('لا يمكن أن يكون رقم هاتف ولي الأمر (الأب) مطابقاً لرقم هاتف الطالب. يجب تسجيل أرقام مختلفة للتواصل ومتابعة ولي الأمر.');
        return false;
      }

      if (!isValidRealEgyptianPhone(cleanMother)) {
        setErrorMessage('يرجى إدخال رقم هاتف محمول مصري حقيقي وصحيح للأم وتجنب الأرقام المتكررة أو الوهمية');
        return false;
      }
      if (cleanMother === cleanStudentPhone) {
        setErrorMessage('لا يمكن أن يكون رقم هاتف الأم مطابقاً لرقم هاتف الطالب. يرجى إدخال رقم والدة الطالب المستقل.');
        return false;
      }
      if (cleanMother === cleanFather) {
        setErrorMessage('لا يمكن أن يكون رقم هاتف الأم مطابقاً لرقم هاتف الأب. يرجى إدخال رقمين مستقلين للوالدين للاتصال في حالات الطوارئ.');
        return false;
      }

      if (!formData.parent_job.trim()) {
        setErrorMessage('يرجى إدخال وظيفة أو مهنة ولي الأمر');
        return false;
      }
      return true;
    }

    if (step === 3) {
      if (!formData.academic_grade) {
        setErrorMessage('يرجى اختيار الصف الدراسي المقيد به الطالب');
        return false;
      }
      if (!formData.education_type) {
        setErrorMessage('يرجى اختيار نوع التعليم (عام، لغات، أزهر)');
        return false;
      }
      if (!formData.school_name.trim()) {
        setErrorMessage('يرجى إدخال اسم المدرسة الحالية المقيد بها الطالب');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setErrorMessage(null);
      setCurrentStep((prev) => Math.min(4, prev + 1));
      window.scrollTo({ top: 100, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    setErrorMessage(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  const handleStepJump = (targetStep) => {
    if (targetStep < currentStep) {
      setErrorMessage(null);
      setCurrentStep(targetStep);
      window.scrollTo({ top: 100, behavior: 'smooth' });
    } else if (targetStep > currentStep) {
      for (let s = currentStep; s < targetStep; s++) {
        if (!validateStep(s)) {
          return;
        }
      }
      setErrorMessage(null);
      setCurrentStep(targetStep);
      window.scrollTo({ top: 100, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    for (let s = 1; s <= 3; s++) {
      if (!validateStep(s)) {
        setCurrentStep(s);
        window.scrollTo({ top: 100, behavior: 'smooth' });
        return;
      }
    }

    const cleanPhone = cleanEgyptianPhone(formData.phone);
    const cleanFather = cleanEgyptianPhone(formData.father_phone);
    const cleanMother = cleanEgyptianPhone(formData.mother_phone);

    if (cleanPhone === cleanFather || cleanPhone === cleanMother || cleanFather === cleanMother) {
      setErrorMessage('يجب أن تكون أرقام هواتف الطالب، وولي الأمر (الأب)، والأم مختلفة تماماً ومستقلة عن بعضها البعض');
      setCurrentStep(2);
      window.scrollTo({ top: 100, behavior: 'smooth' });
      return;
    }

    const nidInfo = parseEgyptianNationalId(formData.national_id);

    setIsSubmitting(true);

    try {
      const studentId = generateUUID();

      const payload = {
        id: studentId,
        full_name: formData.full_name.trim(),
        phone: cleanPhone,
        father_phone: cleanFather,
        mother_phone: cleanMother,
        parent_job: formData.parent_job.trim(),
        academic_grade: formData.academic_grade,
        education_type: formData.education_type,
        school_name: formData.school_name.trim(),
        gender: formData.gender,
        birth_date: nidInfo.birthDate,
        national_id: nidInfo.clean,
        address: formData.address.trim(),
        notes: formData.notes.trim() || null,
        photo_url: formData.photo_url || null,
        status: 'pending',
        synced_to_local_server: false,
      };

      let { error } = await supabase
        .from('online_students')
        .insert([payload]);

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
      window.scrollTo({ top: 100, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS SCREEN
  if (submittedData) {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-100 text-center animate-fade-in-up max-w-4xl mx-auto">
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
              setCurrentStep(1);
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

  return (
    <div className="max-w-7xl mx-auto">
      
      {/* Mobile Top Stepper (< lg) */}
      <div className="lg:hidden mb-6 bg-white rounded-3xl p-4 sm:p-5 shadow-lg border border-slate-100">
        <div className="flex items-center justify-between text-xs font-bold mb-2">
          <span className="text-sky-600">الخطوة {currentStep} من {STUDENT_STEPS.length}</span>
          <span className="text-slate-800 font-extrabold">{STUDENT_STEPS[currentStep - 1].title}</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-sky-500 to-blue-600 transition-all duration-300"
            style={{ width: `${(currentStep / STUDENT_STEPS.length) * 100}%` }}
          />
        </div>
        {/* Step Circles */}
        <div className="flex justify-between mt-3 px-1">
          {STUDENT_STEPS.map((step) => {
            const isDone = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => handleStepJump(step.id)}
                className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                  isDone 
                    ? 'bg-emerald-500 text-white' 
                    : isCurrent 
                    ? 'bg-sky-600 text-white ring-4 ring-sky-100' 
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {isDone ? '✓' : step.id}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* DESKTOP SIDEBAR STEPPER (lg:col-span-4) - STICKY */}
        <aside className="hidden lg:block lg:col-span-4 lg:sticky lg:top-6 space-y-5">
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100">
            <div className="flex items-center gap-3 pb-5 mb-5 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold shadow-inner">
                <GraduationCap size={24} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-sky-600 tracking-wider">استمارة تسجيل الطلاب</span>
                <h3 className="text-base font-black text-slate-800">مراحل التقديم والقبول</h3>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1.5">
                <span>نسبة استكمال الاستمارة</span>
                <span className="font-mono text-sky-600 font-bold">{Math.round((currentStep / STUDENT_STEPS.length) * 100)}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
                <div 
                  className="h-full bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${(currentStep / STUDENT_STEPS.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Step List Items */}
            <nav className="space-y-2">
              {STUDENT_STEPS.map((step) => {
                const isDone = currentStep > step.id;
                const isCurrent = currentStep === step.id;
                const StepIcon = step.icon;

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => handleStepJump(step.id)}
                    className={`w-full text-right p-3.5 rounded-2xl transition-all flex items-center gap-3.5 cursor-pointer ${
                      isCurrent 
                        ? 'bg-gradient-to-r from-sky-50 to-blue-50/50 border border-sky-200 text-slate-900 shadow-sm'
                        : isDone
                        ? 'hover:bg-slate-50 text-slate-700'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                      isDone 
                        ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                        : isCurrent
                        ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 ring-2 ring-sky-200'
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      {isDone ? <Check size={16} /> : <StepIcon size={16} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold truncate ${isCurrent ? 'text-sky-700 font-black' : isDone ? 'text-slate-800' : 'text-slate-500'}`}>
                          {step.title}
                        </span>
                        {isDone && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                            مكتمل
                          </span>
                        )}
                        {isCurrent && (
                          <span className="text-[10px] font-bold text-sky-600 bg-sky-100 px-1.5 py-0.5 rounded-md animate-pulse">
                            الحالية
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {step.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Student Help Card */}
          <div className="bg-gradient-to-br from-[#071E40] to-[#0C3C82] text-white rounded-3xl p-5 shadow-lg border border-white/10 text-xs space-y-2.5">
            <div className="flex items-center gap-2 text-sky-300 font-bold">
              <Sparkles size={16} />
              <span>مساعدة في حجز المجموعات</span>
            </div>
            <p className="text-sky-100 leading-relaxed text-[11px]">
              للاستفسار عن أسماء المدرسين والمواعيد وقاعات الحضور، يسعدنا تواصلكم مع شؤون الطلاب.
            </p>
            <div className="pt-1 flex items-center justify-between text-[11px] text-white/80 border-t border-white/10">
              <span>شؤون الطلاب: 01288817183</span>
              <span className="font-mono text-emerald-400">متاح الآن</span>
            </div>
          </div>
        </aside>

        {/* MAIN WORKSPACE FORM (lg:col-span-8) */}
        <main className="lg:col-span-8">
          <div className="bg-white rounded-3xl p-6 sm:p-9 shadow-xl border border-slate-100">
            
            {/* Step Header */}
            <div className="flex items-center gap-3.5 pb-6 mb-7 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold shadow-inner">
                {(() => {
                  const CurrentIcon = STUDENT_STEPS[currentStep - 1].icon;
                  return <CurrentIcon size={24} />;
                })()}
              </div>
              <div>
                <span className="text-xs font-bold text-sky-600">الخطوة {currentStep} من {STUDENT_STEPS.length}</span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-800">
                  {STUDENT_STEPS[currentStep - 1].title}
                </h2>
                <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                  {STUDENT_STEPS[currentStep - 1].subtitle}
                </p>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center gap-3 animate-shake">
                <AlertCircle size={20} className="shrink-0 text-rose-500" />
                <span className="font-semibold">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              
              {/* ============================================================
                  STEP 1: STUDENT BASIC INFO & PHOTO
                  ============================================================ */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Full Name */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
                        اسم الطالب رباعي بالكامل <span className="text-rose-500">*</span>
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
                    <div className="sm:col-span-2">
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

                    {/* Student Phone */}
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
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

                    {/* Gender */}
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
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

                    {/* National ID */}
                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs sm:text-sm font-bold text-slate-700">
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

                      {parsedNid ? (
                        <div className="mt-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                          <Calendar size={14} className="text-emerald-600 shrink-0" />
                          <span>
                            تاريخ الميلاد المستنتج: <strong>{parsedNid.formattedArabic}</strong> — السن التقريبي: <strong>{parsedNid.age} سنة</strong>
                          </span>
                        </div>
                      ) : formData.national_id.length > 0 ? (
                        <p className="text-[11px] text-amber-600 mt-1.5">
                          * يرجى إدخال 14 رقماً بالكامل لاستنتاج تاريخ الميلاد والسن بدقة.
                        </p>
                      ) : null}
                    </div>

                    {/* Address */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
                        العنوان أو المنطقة السكنية بالتفصيل <span className="text-rose-500">*</span>
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
              )}

              {/* ============================================================
                  STEP 2: GUARDIAN INFO
                  ============================================================ */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 leading-relaxed">
                    <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>تنبيه هام للقبول:</strong> يرجى إدخال أرقام هواتف محمول حقيقية وصحيحة لكل من الأب والأم، ويشترط أن تكون <strong>أرقاماً مستقلة ومختلفة تماماً عن رقم الطالب وعن بعضهما</strong> لضمان التواصل ومتابعة ولي الأمر.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Father Phone */}
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
                        هاتف ولي الأمر (الأب) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="father_phone"
                        value={formData.father_phone}
                        onChange={handleChange}
                        required
                        placeholder="011xxxxxxxx"
                        className={`w-full px-4 py-3 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 transition-all bg-white ${
                          formData.father_phone && cleanEgyptianPhone(formData.father_phone) === cleanEgyptianPhone(formData.phone)
                            ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20'
                            : 'border-slate-200 focus:ring-sky-500'
                        }`}
                      />
                      {formData.father_phone && cleanEgyptianPhone(formData.father_phone) === cleanEgyptianPhone(formData.phone) && (
                        <p className="text-[11px] text-rose-600 mt-1.5 font-bold flex items-center gap-1">
                          <AlertCircle size={12} className="shrink-0" />
                          <span>رقم هاتف الأب لا يمكن أن يكون مطابقاً لرقم الطالب!</span>
                        </p>
                      )}
                    </div>

                    {/* Mother Phone */}
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
                        هاتف الأم للتواصل والمتابعة <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="mother_phone"
                        value={formData.mother_phone}
                        onChange={handleChange}
                        required
                        placeholder="012xxxxxxxx"
                        className={`w-full px-4 py-3 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 transition-all bg-white ${
                          formData.mother_phone && (
                            cleanEgyptianPhone(formData.mother_phone) === cleanEgyptianPhone(formData.phone) ||
                            cleanEgyptianPhone(formData.mother_phone) === cleanEgyptianPhone(formData.father_phone)
                          )
                            ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20'
                            : 'border-slate-200 focus:ring-sky-500'
                        }`}
                      />
                      {formData.mother_phone && cleanEgyptianPhone(formData.mother_phone) === cleanEgyptianPhone(formData.phone) && (
                        <p className="text-[11px] text-rose-600 mt-1.5 font-bold flex items-center gap-1">
                          <AlertCircle size={12} className="shrink-0" />
                          <span>رقم هاتف الأم لا يمكن أن يكون مطابقاً لرقم الطالب!</span>
                        </p>
                      )}
                      {formData.mother_phone && formData.father_phone && cleanEgyptianPhone(formData.mother_phone) === cleanEgyptianPhone(formData.father_phone) && (
                        <p className="text-[11px] text-rose-600 mt-1.5 font-bold flex items-center gap-1">
                          <AlertCircle size={12} className="shrink-0" />
                          <span>رقم هاتف الأم لا يمكن أن يكون مطابقاً لرقم هاتف الأب!</span>
                        </p>
                      )}
                    </div>

                    {/* Parent Job */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
                        وظيفة أو مهنة ولي الأمر <span className="text-rose-500">*</span>
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
              )}

              {/* ============================================================
                  STEP 3: ACADEMIC INFO
                  ============================================================ */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Academic Grade */}
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
                        الصف الدراسي المقيد به الطالب <span className="text-rose-500">*</span>
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

                    {/* Education Type */}
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
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

                    {/* School Name */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
                        اسم المدرسة الحالية المقيد بها الطالب <span className="text-rose-500">*</span>
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

                    {/* Notes */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
                        ملاحظات أو مواعيد مفضلة <span className="text-slate-400 font-normal">(اختياري)</span>
                      </label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows={2}
                        placeholder="أي رغبات إضافية تخص المواعيد، أو أسماء مدرسين محددين ترغب في الحجز معهم..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all resize-none bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================
                  STEP 4: REVIEW & CONFIRM
                  ============================================================ */}
              {currentStep === 4 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="p-5 rounded-2xl bg-sky-50/60 border border-sky-200 text-right">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-sky-200">
                      <span className="font-extrabold text-slate-800 text-sm">مراجعة بيانات استمارة الطالب:</span>
                      <span className="text-sky-700 font-bold bg-sky-100 px-2.5 py-0.5 rounded text-xs">مراجعة نهائية</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs sm:text-sm">
                      <div className="flex justify-between py-1 border-b border-sky-100 sm:border-0">
                        <span className="text-slate-500">اسم الطالب:</span>
                        <span className="font-bold text-slate-800">{formData.full_name}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-sky-100 sm:border-0">
                        <span className="text-slate-500">الصف الدراسي:</span>
                        <span className="font-bold text-slate-800">{formData.academic_grade}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-sky-100 sm:border-0">
                        <span className="text-slate-500">نوع التعليم:</span>
                        <span className="font-bold text-slate-800">{formData.education_type}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-sky-100 sm:border-0">
                        <span className="text-slate-500">تاريخ الميلاد المستنتج:</span>
                        <span className="font-bold text-slate-800">{parsedNid?.formattedArabic || 'غير محدد'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-sky-100 sm:border-0">
                        <span className="text-slate-500">المدرسة:</span>
                        <span className="font-bold text-slate-800">{formData.school_name}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-sky-100 sm:border-0">
                        <span className="text-slate-500">هاتف الطالب:</span>
                        <span className="font-mono text-slate-800">{formData.phone}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-sky-100 sm:border-0">
                        <span className="text-slate-500">هاتف الأب:</span>
                        <span className="font-mono text-slate-800">{formData.father_phone}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-sky-100 sm:border-0">
                        <span className="text-slate-500">هاتف الأم:</span>
                        <span className="font-mono text-slate-800">{formData.mother_phone}</span>
                      </div>
                      <div className="sm:col-span-2 flex justify-between py-1 border-b border-sky-100 sm:border-0">
                        <span className="text-slate-500">العنوان السكني:</span>
                        <span className="font-bold text-slate-800">{formData.address}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                    <p className="font-bold text-slate-800">📌 إشعار تأكيد الحجز:</p>
                    <p>بالضغط على تأكيد وإرسال الاستمارة، يتم إنشاء ملف الطالب فورياً في قاعدة بيانات أكاديمية أطلس، وسيتم التواصل معكم لتسليم كود الحضور وبطاقة الطالب الذكية.</p>
                  </div>
                </div>
              )}

              {/* Navigation Action Buttons Bar */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <ChevronRight size={18} />
                    <span>الخطوة السابقة</span>
                  </button>
                ) : (
                  <div />
                )}

                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-sky-600/30 transition-all cursor-pointer"
                  >
                    <span>المتابعة للخطوة التالية</span>
                    <ChevronLeft size={18} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || isPhotoUploading}
                    className="px-8 py-4 rounded-2xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 hover:from-sky-700 hover:to-indigo-800 text-white font-extrabold text-sm sm:text-base flex items-center gap-2.5 shadow-xl shadow-sky-600/30 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>جاري إرسال الاستمارة وتسجيل الطالب...</span>
                      </>
                    ) : isPhotoUploading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>جاري رفع الصورة إلى الخادم...</span>
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        <span>تأكيد وإرسال استمارة التسجيل نهائياً</span>
                      </>
                    )}
                  </button>
                )}
              </div>

            </form>

          </div>
        </main>

      </div>

    </div>
  );
}
