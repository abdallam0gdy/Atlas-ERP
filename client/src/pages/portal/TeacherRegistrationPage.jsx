import { useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  UserCheck, 
  User, 
  Phone, 
  BookOpen, 
  GraduationCap, 
  Award, 
  Send, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  Printer,
  Sparkles,
  Users,
  Briefcase,
  Plus,
  Trash2,
  Clock,
  Calendar,
  Layers,
  Fingerprint,
  Image as ImageIcon
} from 'lucide-react';
import ImageUploadField from '../../components/portal/ImageUploadField';

const AVAILABLE_SUBJECTS = [
  'اللغة العربية',
  'اللغة الإنجليزية',
  'اللغة الفرنسية',
  'اللغة الألمانية',
  'اللغة الإيطالية',
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
  'الحاسب الآلي وتكنولوجيا المعلومات',
  'دراسات اجتماعية',
  'العلوم',
];

const ALL_GRADES = [
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

const DAYS_OF_WEEK = [
  'السبت',
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
];

/**
 * تحويل الأرقام العربية المشرقية (٠١٢٣٤٥٦٧٨٩) إلى أرقام قياسية
 */
function normalizeArabicNumbers(str) {
  if (!str) return '';
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(str).replace(/[٠-٩]/g, (w) => arabicNumerals.indexOf(w));
}

/**
 * التحقق من صحة رقم الموبايل المصري
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
    year: y,
    month: m,
    day: d,
    age: currentYear - y,
    inferredGender,
  };
}

/**
 * التحقق من منطقية مواعيد الحصة (وقت البداية ووقت النهاية)
 */
function validateGroupTimes(startTime, endTime) {
  if (!startTime || !endTime) {
    return { valid: false, message: 'يرجى تحديد وقت البداية ووقت النهاية للحصة' };
  }
  
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  
  if (endMinutes <= startMinutes) {
    return { 
      valid: false, 
      message: 'وقت نهاية الحصة يجب أن يكون بعد وقت البداية' 
    };
  }
  
  const duration = endMinutes - startMinutes;
  if (duration < 30) {
    return {
      valid: false,
      message: 'مدة الحصة يجب ألا تقل عن 30 دقيقة'
    };
  }

  if (duration > 360) {
    return {
      valid: false,
      message: 'مدة الحصة لا يمكن أن تتجاوز 6 ساعات'
    };
  }
  
  return { valid: true, duration };
}

export default function TeacherRegistrationPage() {
  const [formData, setFormData] = useState({
    full_name: '',
    nickname: '',
    phone: '',
    whatsapp_phone: '',
    national_id: '',
    photo_url: '',
    logo_url: '',
    specializations: ['اللغة العربية'], // مصفوفة لاختيار أكثر من مادة
    target_grades: ['الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي'], // مصفوفة لاختيار المراحل
    bio: '',
    facebook_link: '',
    youtube_link: '',
    telegram_link: '',
    notes: '',
  });

  // حالة إدارة الحجز الذاتية بدون سكرتارية
  const [hasNoAssistant, setHasNoAssistant] = useState(false);

  // فريق العمل والسكرتارية (الحد الأقصى 3 مساعدين)
  const [assistants, setAssistants] = useState([
    { id: 1, name: '', phone: '' }
  ]);

  // المجموعات ومواعيد الحصص (مجموعة واحدة مبدئياً)
  const [groups, setGroups] = useState([
    {
      id: 1,
      day: 'السبت',
      start_time: '14:00',
      end_time: '16:00',
      grade: 'الصف الأول الثانوي',
      subject: 'اللغة العربية',
    }
  ]);

  // تتبع حالة رفع الصور لمنع الإرسال أثناء الرفع
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  const [isLogoUploading, setIsLogoUploading] = useState(false);

  // حقل إضافة مادة مخصصة غير موجودة بالقائمة
  const [customSubjectInput, setCustomSubjectInput] = useState('');
  const [showCustomSubjectField, setShowCustomSubjectField] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [submittedData, setSubmittedData] = useState(null);

  // استنتاج تاريخ الميلاد والسن للمعلم من الرقم القومي
  const parsedTeacherNid = useMemo(() => {
    return parseEgyptianNationalId(formData.national_id);
  }, [formData.national_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // تبديل اختيار المادة (Multi-select)
  const toggleSubject = (subject) => {
    setFormData((prev) => {
      const exists = prev.specializations.includes(subject);
      const nextSubjects = exists
        ? prev.specializations.filter((s) => s !== subject)
        : [...prev.specializations, subject];
      return { ...prev, specializations: nextSubjects };
    });
  };

  // إضافة مادة مخصصة
  const handleAddCustomSubject = (e) => {
    e.preventDefault();
    const trimmed = customSubjectInput.trim();
    if (!trimmed) return;
    if (!formData.specializations.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        specializations: [...prev.specializations, trimmed],
      }));
    }
    setCustomSubjectInput('');
    setShowCustomSubjectField(false);
  };

  // تبديل اختيار الصف / المرحلة الدراسية (Multi-select)
  const toggleGrade = (grade) => {
    setFormData((prev) => {
      const exists = prev.target_grades.includes(grade);
      const nextGrades = exists
        ? prev.target_grades.filter((g) => g !== grade)
        : [...prev.target_grades, grade];
      return { ...prev, target_grades: nextGrades };
    });
  };

  // أزرار تحديد مرحلة كاملة بضغطة زر
  const selectStageCluster = (stagePrefix) => {
    const stageGrades = ALL_GRADES.filter((g) => g.includes(stagePrefix));
    setFormData((prev) => {
      const allSelected = stageGrades.every((g) => prev.target_grades.includes(g));
      const nextGrades = allSelected
        ? prev.target_grades.filter((g) => !g.includes(stagePrefix))
        : Array.from(new Set([...prev.target_grades, ...stageGrades]));
      return { ...prev, target_grades: nextGrades };
    });
  };

  // إدارة المساعدين والسكرتارية (غير محدد بعدد)
  const handleAssistantChange = (index, field, value) => {
    setAssistants((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addAssistant = () => {
    setAssistants((prev) => [...prev, { id: Date.now(), name: '', phone: '' }]);
  };

  const removeAssistant = (index) => {
    setAssistants((prev) => prev.filter((_, i) => i !== index));
  };

  // إدارة المجموعات
  const addGroup = () => {
    const defaultSubject = formData.specializations.length === 1 
      ? formData.specializations[0] 
      : (formData.specializations[0] || 'المادة الأساسية');

    const defaultGrade = formData.target_grades[0] || ALL_GRADES[9]; // أولى ثانوي افتراضياً

    setGroups((prev) => [
      ...prev,
      {
        id: Date.now(),
        day: 'السبت',
        start_time: '14:00',
        end_time: '16:00',
        grade: defaultGrade,
        subject: defaultSubject,
      },
    ]);
  };

  const handleGroupChange = (id, field, value) => {
    setGroups((prev) =>
      prev.map((grp) => (grp.id === id ? { ...grp, [field]: value } : grp))
    );
  };

  const removeGroup = (id) => {
    if (groups.length <= 1) {
      setErrorMessage('يلزم الإبقاء على مجموعة وموعد حصة واحد على الأقل في الاستمارة');
      return;
    }
    setGroups((prev) => prev.filter((grp) => grp.id !== id));
  };

  // إرسال الاستمارة مع التحقق الصارم من كافة البيانات الإجبارية
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    // 0. التحقق من اكتمال رفع الصور
    if (isPhotoUploading || isLogoUploading) {
      setErrorMessage('جاري رفع الصور حالياً، يرجى الانتظار ثوانٍ معدودة حتى يكتمل الرفع إلى الخادم');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 1. الاسم بالكامل (ثلاثي أو رباعي)
    const nameParts = formData.full_name.trim().split(/\s+/).filter(Boolean);
    if (nameParts.length < 3) {
      setErrorMessage('يرجى كتابة اسم المعلم ثلاثي أو رباعي بالكامل (3 كلمات على الأقل)');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 2. اسم الشهرة أو اللقب
    if (!formData.nickname.trim()) {
      setErrorMessage('يرجى كتابة اسم الشهرة أو اللقب (كما يظهر للطلاب، مثل: مستر / أحمد عبد الله)');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 3. رقم الهاتف الشخصي
    const cleanPhone = cleanEgyptianPhone(formData.phone);
    if (!isValidEgyptianPhone(cleanPhone)) {
      setErrorMessage('يرجى إدخال رقم هاتف محمول صحيح للمعلم (11 رقماً يبدأ بـ 010 أو 011 أو 012 أو 015)');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 4. رقم الواتساب
    const cleanWhatsapp = cleanEgyptianPhone(formData.whatsapp_phone);
    if (!isValidEgyptianPhone(cleanWhatsapp)) {
      setErrorMessage('يرجى إدخال رقم واتساب صحيح للتواصل (11 رقماً يبدأ بـ 01)');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 5. الرقم القومي للمعلم
    const cleanNid = normalizeArabicNumbers(formData.national_id.trim());
    if (!/^[23]\d{13}$/.test(cleanNid)) {
      setErrorMessage('الرقم القومي للمعلم مطلوب ويجب أن يتكون من 14 رقماً ويبدأ بـ 2 أو 3');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const nidInfo = parseEgyptianNationalId(cleanNid);
    if (!nidInfo) {
      setErrorMessage('الرقم القومي غير صالح، يرجى مراجعة الأرقام (تاريخ الميلاد غير مطابق)');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (nidInfo.age < 20) {
      setErrorMessage(`الرقم القومي المدخل يشير إلى عمر (${nidInfo.age} سنة)، يجب أن يكون المعلم بعمر 20 سنة فأكثر`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 6. الصورة الشخصية للمعلم
    if (!formData.photo_url) {
      setErrorMessage('يرجى رفع الصورة الشخصية للمعلم (إجبارية لإتمام التسجيل)');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 7. المواد التي يقوم بتدريسها
    if (formData.specializations.length === 0) {
      setErrorMessage('يرجى اختيار مادة واحدة على الأقل من قائمة المواد');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 8. المراحل والصفوف الدراسية
    if (formData.target_grades.length === 0) {
      setErrorMessage('يرجى اختيار صف دراسي واحد على الأقل من قائمة المراحل');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 9. فريق العمل والسكرتارية
    let validAssistants = [];
    if (!hasNoAssistant) {
      if (assistants.length === 0 || (!assistants[0].name.trim() && !assistants[0].phone.trim())) {
        setErrorMessage('يرجى إدخال بيانات السكرتير/المساعد الأول، أو تحديد خيار (أدير الحجز والتواصل بنفسي)');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      for (let i = 0; i < assistants.length; i++) {
        const a = assistants[i];
        const aName = a.name.trim();
        const aPhone = cleanEgyptianPhone(a.phone);

        if (i === 0 || aName || aPhone) {
          if (!aName) {
            setErrorMessage(`يرجى كتابة اسم المساعد رقم ${i + 1}`);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
          }
          if (!isValidEgyptianPhone(aPhone)) {
            setErrorMessage(`رقم هاتف المساعد رقم ${i + 1} غير صحيح (يجب أن يكون 11 رقماً يبدأ بـ 01)`);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
          }
          validAssistants.push({
            id: a.id || i + 1,
            name: aName,
            phone: aPhone,
          });
        }
      }
    }

    // 10. المجموعات ومواعيد الحصص
    if (groups.length === 0) {
      setErrorMessage('يرجى إضافة مجموعة وموعد حصة واحد على الأقل');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    for (let i = 0; i < groups.length; i++) {
      const grp = groups[i];
      if (!grp.day) {
        setErrorMessage(`يرجى تحديد يوم الأسبوع للمجموعة رقم ${i + 1}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const timeValidation = validateGroupTimes(grp.start_time, grp.end_time);
      if (!timeValidation.valid) {
        setErrorMessage(`خطأ في توقيت المجموعة رقم ${i + 1}: ${timeValidation.message}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (!grp.grade) {
        setErrorMessage(`يرجى تحديد الصف الدراسي للمجموعة رقم ${i + 1}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const effectiveSubject = formData.specializations.length === 1 
        ? formData.specializations[0] 
        : (grp.subject || '').trim();
      if (!effectiveSubject) {
        setErrorMessage(`يرجى تحديد مادة المجموعة رقم ${i + 1}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    // 11. النبذة التعريفية وسنوات الخبرة
    if (formData.bio.trim().length < 10) {
      setErrorMessage('يرجى كتابة نبذة تعريفية وخبراتك السابقة (10 أحرف على الأقل)');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    try {
      // توليد معرف UUID فريد من جهة العميل لضمان العمل تحت صلاحيات RLS بأمان
      const teacherId = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : `tch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // تجهيز المواد كسلسلة نصية
      const specializationString = formData.specializations.join(' ، ');

      // تجهيز المراحل كسلسلة نصية
      const targetGradesString = formData.target_grades.join(' ، ');

      const payload = {
        id: teacherId,
        full_name: formData.full_name.trim(),
        nickname: formData.nickname.trim(),
        phone: cleanPhone,
        whatsapp_phone: cleanWhatsapp,
        national_id: cleanNid,
        photo_url: formData.photo_url,
        logo_url: formData.logo_url || null,
        specialization: specializationString,
        target_grades: targetGradesString,
        assistant_name: validAssistants[0]?.name || (hasNoAssistant ? 'إدارة شخصية بدون سكرتارية' : null),
        assistant_phone: validAssistants[0]?.phone || null,
        assistants_data: validAssistants.length > 0 ? validAssistants : null,
        groups_data: groups,
        bio: formData.bio.trim(),
        facebook_link: formData.facebook_link.trim() || null,
        youtube_link: formData.youtube_link.trim() || null,
        telegram_link: formData.telegram_link.trim() || null,
        notes: formData.notes.trim() || null,
        status: 'pending',
        synced_to_local_server: false,
      };

      let { error } = await supabase
        .from('online_teachers')
        .insert([payload]);

      // معالجة مرنة في حال كانت أعمدة الصور أو المجموعات غير موجودة بعد بسوبابيز
      if (error && (error.message?.includes('column') || error.message?.includes('schema cache'))) {
        const fallbackPayload = { ...payload };
        const extraNotes = [];

        if (fallbackPayload.photo_url) {
          extraNotes.push(`[الصورة الشخصية]: ${fallbackPayload.photo_url}`);
          delete fallbackPayload.photo_url;
        }
        if (fallbackPayload.logo_url) {
          extraNotes.push(`[شعار المعلم]: ${fallbackPayload.logo_url}`);
          delete fallbackPayload.logo_url;
        }
        if (fallbackPayload.assistants_data) {
          extraNotes.push(`[بيانات المساعدين]: ${JSON.stringify(fallbackPayload.assistants_data)}`);
          delete fallbackPayload.assistants_data;
        }
        if (fallbackPayload.groups_data) {
          extraNotes.push(`[المجموعات المقترحة]: ${JSON.stringify(fallbackPayload.groups_data)}`);
          delete fallbackPayload.groups_data;
        }

        if (extraNotes.length > 0) {
          fallbackPayload.notes = (fallbackPayload.notes ? fallbackPayload.notes + '\n\n' : '') + extraNotes.join('\n');
        }

        const retry = await supabase.from('online_teachers').insert([fallbackPayload]);
        if (retry.error) throw retry.error;
        error = null;
      } else if (error) {
        console.error('Supabase teacher insert error:', error);
        throw error;
      }

      setSubmittedData({
        ...payload,
        specializationsArray: formData.specializations,
        targetGradesArray: formData.target_grades,
        assistantsList: validAssistants,
        groupsList: groups,
        id: teacherId,
        created_at: new Date().toLocaleDateString('ar-EG'),
      });
    } catch (err) {
      console.error(err);
      setErrorMessage(
        err.message || 'حدث خطأ أثناء إرسال الاستمارة — يرجى التأكد من الاتصال بالإنترنت والمحاولة مجدداً'
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
          <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-rose-500 p-1 bg-white shadow-lg mx-auto mb-5">
            <img 
              src={submittedData.photo_url} 
              alt="صورة المعلم" 
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
        ) : (
          <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-rose-500/20">
            <CheckCircle2 size={44} />
          </div>
        )}

        <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 text-xs font-bold px-3 py-1 rounded-full border border-rose-200 mb-3">
          <Sparkles size={13} />
          تم استلام استمارة الانضمام بنجاح
        </span>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-2">
          أهلاً ومرحباً بحضرتك في أكاديمية أطلس! 🌟
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm max-w-lg mx-auto mb-8">
          يسعدنا ويشرفنا انضمامكم لنخبة كبار معلمين أكاديمية أطلس التعليمية. تم حفظ بياناتكم وسيقوم المدير التنفيذي بالتواصل مع سيادتكم لتنسيق المواعيد والقاعات وجدول الحصص.
        </p>

        {/* Teacher Summary Card */}
        <div className="max-w-2xl mx-auto bg-slate-50 rounded-2xl p-6 border border-slate-200 text-right mb-8 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
            <span className="text-xs text-slate-500 font-medium">رقم الطلب المرجعي:</span>
            <span className="font-mono font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded text-xs">
              {submittedData.id.slice(0, 8).toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs sm:text-sm">
            <div className="flex justify-between py-1 border-b border-slate-200/60 sm:border-0">
              <span className="text-slate-500">الاسم:</span>
              <span className="font-bold text-slate-800">
                {submittedData.nickname ? `${submittedData.nickname} (${submittedData.full_name})` : submittedData.full_name}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60 sm:border-0">
              <span className="text-slate-500">المواد التعليمية:</span>
              <span className="font-bold text-slate-800">{submittedData.specialization}</span>
            </div>
            {submittedData.phone && (
              <div className="flex justify-between py-1 border-b border-slate-200/60 sm:border-0">
                <span className="text-slate-500">رقم الهاتف:</span>
                <span className="font-mono text-slate-800">{submittedData.phone}</span>
              </div>
            )}
            {submittedData.groupsList?.length > 0 && (
              <div className="flex justify-between py-1 border-b border-slate-200/60 sm:border-0">
                <span className="text-slate-500">المجموعات المقترحة:</span>
                <span className="font-bold text-slate-800">{submittedData.groupsList.length} مجموعة</span>
              </div>
            )}
            {submittedData.assistantsList?.length > 0 && (
              <div className="flex justify-between py-1 border-b border-slate-200/60 sm:border-0">
                <span className="text-slate-500">فريق المساعدين:</span>
                <span className="font-bold text-slate-800">{submittedData.assistantsList.length} مساعد</span>
              </div>
            )}
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
            <span>طباعة ملخص الاستمارة</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSubmittedData(null);
              setFormData({
                full_name: '',
                nickname: '',
                phone: '',
                whatsapp_phone: '',
                national_id: '',
                photo_url: '',
                logo_url: '',
                specializations: ['اللغة العربية'],
                target_grades: ['الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي'],
                bio: '',
                facebook_link: '',
                youtube_link: '',
                telegram_link: '',
                notes: '',
              });
              setAssistants([{ id: 1, name: '', phone: '' }]);
              setGroups([]);
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
    <div className="bg-white rounded-3xl p-5 sm:p-8 lg:p-10 shadow-2xl border border-slate-100">
      
      {/* Title & Introduction */}
      <div className="text-center pb-6 mb-8 border-b border-slate-100">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 mb-3">
          <UserCheck size={28} />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-800">
          استمارة انضمام عضو هيئة تدريس
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm mt-1.5 max-w-lg mx-auto">
          انضم لنخبة أساتذة ومعلمي أكاديمية أطلس التعليمية (كافة البيانات بالاستمارة إجبارية لاعتماد الملف التعريفي وجدول الحصص)
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center gap-3 animate-shake">
          <AlertCircle size={20} className="shrink-0 text-rose-500" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          
          {/* ============================================================
              RIGHT COLUMN (lg:col-span-7): PERSONAL, SUBJECTS, GRADES
              ============================================================ */}
          <div className="lg:col-span-7 space-y-7">
            
            {/* SECTION 1: PERSONAL & PROFESSIONAL INFO (MANDATORY) */}
            <div className="p-5 sm:p-7 rounded-3xl bg-slate-50/70 border border-slate-200/90 shadow-2xs">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200">
                <User size={18} className="text-rose-600" />
                <h3 className="text-sm sm:text-base font-bold text-slate-800">1. البيانات الشخصية والمهنية <span className="text-rose-500">*</span></h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                    الاسم بالكامل ثلاثي أو رباعي <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                    placeholder="مثال: أحمد عبد الله محمود"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all bg-white"
                  />
                </div>

                {/* Nickname / Title */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                    اسم الشهرة أو اللقب (للطلاب) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nickname"
                    value={formData.nickname}
                    onChange={handleChange}
                    required
                    placeholder="مثال: مستر / أحمد عبد الله"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all bg-white"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                    رقم الهاتف الشخصي (موبايل) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="010xxxxxxxx"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all bg-white"
                  />
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                    رقم الواتساب للتواصل وإرسال الجداول <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="whatsapp_phone"
                    value={formData.whatsapp_phone}
                    onChange={handleChange}
                    required
                    placeholder="010xxxxxxxx"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all bg-white"
                  />
                </div>

                {/* National ID */}
                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                    الرقم القومي للمعلم (14 رقماً) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="national_id"
                    value={formData.national_id}
                    onChange={handleChange}
                    maxLength={14}
                    required
                    placeholder="14 رقماً يبدأ بـ 2 أو 3"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all bg-white"
                  />

                  {/* Decoded National ID info preview */}
                  {parsedTeacherNid && (
                    <div className="mt-2.5 p-3 rounded-xl bg-rose-50/70 border border-rose-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-rose-800 font-bold">
                        <Fingerprint size={16} className="text-rose-600" />
                        <span>تاريخ الميلاد المستنتج:</span>
                        <span className="font-mono text-rose-900 bg-white px-2 py-0.5 rounded border border-rose-200">
                          {parsedTeacherNid.formattedArabic}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600 font-medium">السن التقديري:</span>
                        <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-rose-200">
                          {parsedTeacherNid.age} سنة
                        </span>
                        <span className="text-slate-600 font-medium">النوع:</span>
                        <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-rose-200">
                          {parsedTeacherNid.inferredGender === 'male' ? 'ذكر' : 'أنثى'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Photo & Logo Uploads */}
                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <ImageUploadField
                      label="الصورة الشخصية للمعلم"
                      description="صورة شخصية رسمية واضحة للملف التعريفي وجدول الحصص"
                      badgeText="مطلوبة *"
                      value={formData.photo_url}
                      onChange={(url) => setFormData((prev) => ({ ...prev, photo_url: url }))}
                      onUploadingChange={setIsPhotoUploading}
                      required={true}
                    />
                  </div>

                  <div>
                    <ImageUploadField
                      label="شعار أو لوجو المعلم"
                      description="الشعار أو الهوية البصرية الخاصة بكم لوضعها على المذكرات"
                      badgeText="إن وجد"
                      value={formData.logo_url}
                      onChange={(url) => setFormData((prev) => ({ ...prev, logo_url: url }))}
                      onUploadingChange={setIsLogoUploading}
                      required={false}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: SUBJECTS (MULTI-SELECT CHIPS) */}
            <div className="p-5 sm:p-7 rounded-3xl bg-slate-50/70 border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <BookOpen size={18} className="text-sky-600" />
                  <h3 className="text-sm sm:text-base font-bold text-slate-800">
                    2. المواد التي تقوم بتدريسها <span className="text-rose-500">*</span>
                  </h3>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  المحدد: <strong className="text-rose-600">{formData.specializations.length}</strong> مادة
                </span>
              </div>

              <p className="text-xs text-slate-500 mb-3.5">
                اضغط على اسم المادة لتحديدها (تضيء المادة باللون الأحمر عند اختيارها):
              </p>

              {/* Subjects Chips Grid */}
              <div className="flex flex-wrap gap-2 mb-4">
                {AVAILABLE_SUBJECTS.map((subject) => {
                  const isSelected = formData.specializations.includes(subject);
                  return (
                    <button
                      key={subject}
                      type="button"
                      onClick={() => toggleSubject(subject)}
                      className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-600/30 ring-2 ring-rose-200'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {isSelected && <span className="ml-1.5 font-bold">✓</span>}
                      <span>{subject}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Subject Addition */}
              {!showCustomSubjectField ? (
                <button
                  type="button"
                  onClick={() => setShowCustomSubjectField(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-800 py-1.5 px-3 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                  <span>إضافة مادة أخرى غير مدرجة</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 max-w-sm mt-2">
                  <input
                    type="text"
                    value={customSubjectInput}
                    onChange={(e) => setCustomSubjectInput(e.target.value)}
                    placeholder="اكتب اسم المادة هنا..."
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSubject}
                    className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    إضافة
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCustomSubjectField(false)}
                    className="px-2.5 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-xs cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              )}
            </div>

            {/* SECTION 3: GRADES & STAGES (SELECT BOXES) */}
            <div className="p-5 sm:p-7 rounded-3xl bg-slate-50/70 border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <GraduationCap size={18} className="text-emerald-600" />
                  <h3 className="text-sm sm:text-base font-bold text-slate-800">
                    3. المراحل والصفوف الدراسية <span className="text-rose-500">*</span>
                  </h3>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  المحدد: <strong className="text-emerald-600">{formData.target_grades.length}</strong> صف
                </span>
              </div>

              {/* Quick Clusters */}
              <div className="flex flex-wrap items-center gap-2 mb-3.5 text-xs">
                <span className="text-slate-400 text-[11px]">تحديد سريع:</span>
                <button
                  type="button"
                  onClick={() => selectStageCluster('الثانوي')}
                  className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium transition-colors cursor-pointer"
                >
                  كل المرحلة الثانوية
                </button>
                <button
                  type="button"
                  onClick={() => selectStageCluster('الإعدادي')}
                  className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium transition-colors cursor-pointer"
                >
                  كل المرحلة الإعدادية
                </button>
                <button
                  type="button"
                  onClick={() => selectStageCluster('الابتدائي')}
                  className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 font-medium transition-colors cursor-pointer"
                >
                  كل المرحلة الابتدائية
                </button>
              </div>

              {/* Grades Chips Grid */}
              <div className="flex flex-wrap gap-2">
                {ALL_GRADES.map((grade) => {
                  const isSelected = formData.target_grades.includes(grade);
                  return (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => toggleGrade(grade)}
                      className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-sky-600 text-white border-sky-600 shadow-sm shadow-sky-600/30 ring-2 ring-sky-200'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {isSelected && <span className="ml-1.5 font-bold">✓</span>}
                      <span>{grade}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* ============================================================
              LEFT COLUMN (lg:col-span-5): ASSISTANTS, GROUPS, BIO, SUBMIT
              ============================================================ */}
          <div className="lg:col-span-5 space-y-7">
            
            {/* SECTION 4: ASSISTANTS & TEAM (UNLIMITED ASSISTANTS) */}
            <div className="p-5 sm:p-7 rounded-3xl bg-slate-50/70 border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-amber-600" />
                  <h3 className="text-sm sm:text-base font-bold text-slate-800">
                    4. فريق العمل والسكرتارية <span className="text-rose-500">*</span>
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-slate-400">
                  غير محدد بعدد معين
                </span>
              </div>

              {/* Checkbox for self-management */}
              <div className="mb-4 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/90 flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm font-bold text-amber-950">
                  <input
                    type="checkbox"
                    checked={hasNoAssistant}
                    onChange={(e) => setHasNoAssistant(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <span>لا يوجد فريق عمل أو سكرتارية (أدير الحجز بنفسي)</span>
                </label>
              </div>

              {!hasNoAssistant && (
                <>
                  <div className="space-y-3">
                    {assistants.map((assistant, index) => (
                      <div 
                        key={assistant.id || index}
                        className="p-4 rounded-2xl bg-white border border-slate-200/90 relative shadow-2xs"
                      >
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[11px] flex items-center justify-center font-bold">
                              {index + 1}
                            </span>
                            <span>المساعد / السكرتير {index + 1} {index === 0 && <span className="text-rose-500">*</span>}</span>
                          </span>

                          {assistants.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeAssistant(index)}
                              className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 p-1 hover:bg-rose-50 rounded cursor-pointer"
                            >
                              <Trash2 size={13} />
                              <span>حذف</span>
                            </button>
                          )}
                        </div>

                        <div className="space-y-2.5">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                              اسم المساعد {index === 0 && <span className="text-rose-500">*</span>}
                            </label>
                            <input
                              type="text"
                              value={assistant.name}
                              onChange={(e) => handleAssistantChange(index, 'name', e.target.value)}
                              placeholder="مثال: أ/ محمد هاني"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                              رقم هاتف المساعد {index === 0 && <span className="text-rose-500">*</span>}
                            </label>
                            <input
                              type="tel"
                              value={assistant.phone}
                              onChange={(e) => handleAssistantChange(index, 'phone', e.target.value)}
                              placeholder="011xxxxxxxx"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addAssistant}
                    className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>إضافة مساعد جديد</span>
                  </button>
                </>
              )}
            </div>

            {/* SECTION 5: GROUPS & SESSIONS SCHEDULING (MANDATORY) */}
            <div className="p-5 sm:p-7 rounded-3xl bg-purple-50/40 border border-purple-200/80 shadow-2xs">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-purple-200/70">
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-purple-600" />
                  <h3 className="text-sm sm:text-base font-bold text-slate-800">
                    5. المجموعات ومواعيد الحصص <span className="text-rose-500">*</span>
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={addGroup}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 px-3 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                  <span>إضافة مجموعة</span>
                </button>
              </div>

              <div className="space-y-3.5">
                {groups.map((group, idx) => (
                  <div
                    key={group.id}
                    className="p-4 rounded-2xl bg-white border border-purple-200/90 relative text-right shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-purple-200 text-purple-800 text-[11px] flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <span>المجموعة رقم {idx + 1}</span>
                      </span>

                      {groups.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeGroup(group.id)}
                          className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 p-1 hover:bg-rose-50 rounded cursor-pointer"
                        >
                          <Trash2 size={13} />
                          <span>حذف</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* 1. Day of the week */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          اليوم في الأسبوع <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={group.day}
                          onChange={(e) => handleGroupChange(group.id, 'day', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                        >
                          {DAYS_OF_WEEK.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>

                      {/* 4. Grade / Stage */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          المرحلة / الصف <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={group.grade}
                          onChange={(e) => handleGroupChange(group.id, 'grade', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                        >
                          {(formData.target_grades.length > 0 ? formData.target_grades : ALL_GRADES).map((g) => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>

                      {/* 2. Start Time */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          وقت البداية <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="time"
                          value={group.start_time}
                          onChange={(e) => handleGroupChange(group.id, 'start_time', e.target.value)}
                          required
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-center"
                        />
                      </div>

                      {/* 3. End Time */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          وقت النهاية <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="time"
                          value={group.end_time}
                          onChange={(e) => handleGroupChange(group.id, 'end_time', e.target.value)}
                          required
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-center"
                        />
                      </div>

                      {/* 5. Subject */}
                      <div className="sm:col-span-2 mt-1">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          مادة المجموعة <span className="text-rose-500">*</span>
                        </label>
                        {formData.specializations.length === 1 ? (
                          <div className="p-2 rounded-xl bg-purple-100/80 border border-purple-200 text-purple-900 text-xs font-bold flex items-center justify-between">
                            <span>المادة معتمدة: <strong>{formData.specializations[0]}</strong></span>
                            <span className="text-[10px] text-purple-600 bg-white px-2 py-0.5 rounded-full font-bold">معتمدة</span>
                          </div>
                        ) : formData.specializations.length > 1 ? (
                          <select
                            value={group.subject}
                            onChange={(e) => handleGroupChange(group.id, 'subject', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white font-medium"
                          >
                            <option value="">-- اختر مادة المجموعة من المواد التي حددتها --</option>
                            {formData.specializations.map((sub) => (
                              <option key={sub} value={sub}>{sub}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={group.subject}
                            onChange={(e) => handleGroupChange(group.id, 'subject', e.target.value)}
                            placeholder="اكتب اسم المادة لهذه المجموعة..."
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={addGroup}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-white hover:bg-purple-50 border border-purple-300 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>إضافة مجموعة أخرى</span>
                  </button>
                </div>
              </div>
            </div>

            {/* SECTION 6: BIO, SOCIAL & NOTES */}
            <div className="p-5 sm:p-7 rounded-3xl bg-slate-50/70 border border-slate-200/90 shadow-2xs">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200">
                <Briefcase size={18} className="text-slate-600" />
                <h3 className="text-sm sm:text-base font-bold text-slate-800">
                  6. النبذة والمنصات <span className="text-rose-500">*</span>
                </h3>
              </div>

              <div className="space-y-3.5">
                {/* Bio (Mandatory) */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                    نبذة تعريفية وخبرات سابقة <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    required
                    rows={3}
                    placeholder="سنوات الخبرة، المراكز السابقة، نبذة عن أسلوب التدريس..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all resize-none bg-white"
                  />
                </div>

                {/* Social Links */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      الفيسبوك <span className="text-slate-400 font-normal">(إن وجد)</span>
                    </label>
                    <input
                      type="url"
                      name="facebook_link"
                      value={formData.facebook_link}
                      onChange={handleChange}
                      placeholder="facebook.com/..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white text-left"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      اليوتيوب <span className="text-slate-400 font-normal">(إن وجد)</span>
                    </label>
                    <input
                      type="url"
                      name="youtube_link"
                      value={formData.youtube_link}
                      onChange={handleChange}
                      placeholder="youtube.com/..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white text-left"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      التليجرام <span className="text-slate-400 font-normal">(إن وجد)</span>
                    </label>
                    <input
                      type="url"
                      name="telegram_link"
                      value={formData.telegram_link}
                      onChange={handleChange}
                      placeholder="t.me/..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white text-left"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    متطلبات القاعات أو ملاحظات إضافية <span className="text-slate-400 font-normal">(اختياري)</span>
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={2}
                    placeholder="سعة القاعات المفضلة، شاشات عرض، أجهزة صوتية، إلخ..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all resize-none bg-white"
                  />
                </div>
              </div>
            </div>

            {/* SUBMIT BUTTON CARD */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-[#1F102F] text-white shadow-xl border border-slate-800">
              <button
                type="submit"
                disabled={isSubmitting || isPhotoUploading || isLogoUploading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-rose-600/30 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>جاري إرسال الاستمارة وحفظ البيانات...</span>
                  </>
                ) : isPhotoUploading || isLogoUploading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>جاري رفع الصور إلى الخادم...</span>
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    <span>تأكيد وإرسال استمارة انضمام المعلم</span>
                  </>
                )}
              </button>
              
              <p className="text-center text-slate-400 text-xs mt-3">
                بالضغط على إرسال، تؤكد صحة البيانات المسجلة لاعتماد جدول الحصص والملف التعريفي الخاص بكم
              </p>
            </div>

          </div>

        </div>

      </form>

    </div>
  );
}
