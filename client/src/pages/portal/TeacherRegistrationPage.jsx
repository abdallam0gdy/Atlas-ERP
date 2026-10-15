import { useState, useMemo, useRef, useEffect } from 'react';
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
  Sparkles,
  Users,
  Briefcase,
  Plus,
  Trash2,
  Clock,
  Calendar,
  Layers,
  Fingerprint,
  Image as ImageIcon,
  Check,
  FileText,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Search,
  X
} from 'lucide-react';
import ImageUploadField from '../../components/portal/ImageUploadField';
import TurnstileWidget from '../../components/portal/TurnstileWidget';

const SUBJECT_CATEGORIES = [
  {
    id: 'languages',
    title: 'اللغات والآداب',
    icon: '🌐',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    subjects: [
      'اللغة العربية',
      'اللغة الإنجليزية',
      'اللغة الفرنسية',
      'اللغة الألمانية',
      'اللغة الإيطالية',
    ],
  },
  {
    id: 'sciences',
    title: 'العلوم الطبيعية والتطبيقية',
    icon: '🔬',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    subjects: [
      'الفيزياء',
      'الكيمياء',
      'الأحياء',
      'الجيولوجيا وعلوم البيئة',
      'العلوم المتكاملة (Integrated Science)',
      'العلوم (ابتدائي وإعدادي)',
      'Science (العلوم لغات)',
    ],
  },
  {
    id: 'math',
    title: 'الرياضيات والإحصاء',
    icon: '📐',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    subjects: [
      'الرياضيات (بحتة وتطبيقية)',
      'Math (الرياضيات لغات)',
    ],
  },
  {
    id: 'humanities',
    title: 'المواد الأدبية والعلوم الاجتماعية',
    icon: '📚',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    subjects: [
      'التاريخ',
      'الجغرافيا',
      'الفلسفة والمنطق',
      'علم النفس والاجتماع',
      'الدراسات الاجتماعية',
    ],
  },
  {
    id: 'technology',
    title: 'الحاسب الآلي والبرمجة وICT',
    icon: '💻',
    badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    subjects: [
      'تكنولوجيا المعلومات والاتصالات ICT',
      'البرمجة وعلوم الحاسب',
    ],
  },
  {
    id: 'azhar',
    title: 'العلوم الشرعية والأزهرية والتربية الدينية',
    icon: '🕌',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
    subjects: [
      'العلوم الشرعية والأزهرية',
      'الفقه والأصول',
      'التفسير والحديث',
      'التوحيد والسيرة',
      'التربية الدينية الإسلامية',
      'التربية الدينية المسيحية',
    ],
  },
];

const AVAILABLE_SUBJECTS = SUBJECT_CATEGORIES.flatMap((c) => c.subjects);

const ALL_GRADES = [
  'الصف الأول الثانوي',
  'الصف الثاني الثانوي',
  'الصف الثالث الثانوي (شهادة)',
  'الصف الأول الإعدادي',
  'الصف الثاني الإعدادي',
  'الصف الثالث الإعدادي (شهادة)',
  'الصف الرابع الابتدائي',
  'الصف الخامس الابتدائي',
  'الصف السادس الابتدائي',
];

const DAYS_OF_WEEK = [
  'السبت',
  'الأحد',
  'الاثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
];

const STEPS = [
  { id: 1, title: 'البيانات الشخصية والمهنية', subtitle: 'الاسم، الهواتف، الصورة واللوجو', icon: User },
  { id: 2, title: 'المواد والمراحل الدراسية', subtitle: 'التخصصات والصفوف التعليمية', icon: BookOpen },
  { id: 3, title: 'فريق العمل والسكرتارية', subtitle: 'إدارة المساعدين (غير محدد بعدد)', icon: Users },
  { id: 4, title: 'المجموعات ومواعيد الحصص', subtitle: 'جدول وأوقات الحصص المقترحة', icon: Clock },
  { id: 5, title: 'السيرة الذاتية والمراجعة', subtitle: 'النبذة، المنصات، وتأكيد الاستمارة', icon: FileText },
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

function containsSuspiciousPayload(str) {
  if (!str) return false;
  const s = String(str).toLowerCase();
  const dangerousPatterns = [
    /--/,
    /\/\*/,
    /\*\//,
    /\bunion\s+select\b/i,
    /\bselect\b.*\bfrom\b/i,
    /\binsert\s+into\b/i,
    /\bdrop\s+table\b/i,
    /\bdrop\s+database\b/i,
    /\btruncate\s+table\b/i,
    /\bdelete\s+from\b/i,
    /\balter\s+table\b/i,
    /\bexec(\s|\()+/i,
    /<script\b/i,
    /javascript:/i,
    /onerror\s*=/i,
    /onload\s*=/i,
    /<\/?(script|iframe|object|embed|style)/i
  ];
  return dangerousPatterns.some((pattern) => pattern.test(s));
}

function sanitizeInputText(str, maxLength = 250) {
  if (str === null || str === undefined) return '';
  let s = String(str);
  s = s.replace(/<[^>]*>?/gm, '');
  s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  s = s.replace(/javascript\s*:/gi, '');
  s = s.replace(/data\s*:/gi, '');
  s = s.replace(/vbscript\s*:/gi, '');
  s = s.trim().replace(/\s+/g, ' ');
  if (maxLength && s.length > maxLength) {
    s = s.slice(0, maxLength);
  }
  return s;
}

function isValidArabicPersonName(name) {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return false;
  return /^[\u0600-\u06FFa-zA-Z\s]{4,90}$/.test(trimmed);
}

function isValidFacebookUrl(url) {
  if (!url || !url.trim()) return true;
  const trimmed = url.trim();
  const fbRegex = /^(https?:\/\/)?(www\.|m\.)?(facebook\.com|fb\.com|fb\.me)\/[A-Za-z0-9_.\-%/?=&]+$/i;
  return fbRegex.test(trimmed);
}

function isValidYoutubeUrl(url) {
  if (!url || !url.trim()) return true;
  const trimmed = url.trim();
  const ytRegex = /^(https?:\/\/)?(www\.|m\.)?(youtube\.com\/(c\/|channel\/|user\/|@)?[A-Za-z0-9_.\-%/?=&]+|youtu\.be\/[A-Za-z0-9_\-]+)$/i;
  return ytRegex.test(trimmed);
}

function isValidTelegramUrl(url) {
  if (!url || !url.trim()) return true;
  const trimmed = url.trim();
  const tgRegex = /^((https?:\/\/)?(www\.)?(t\.me|telegram\.me)\/[A-Za-z0-9_]+|@[A-Za-z0-9_]{4,32})$/i;
  return tgRegex.test(trimmed);
}

function formatSocialUrl(url, type) {
  if (!url || !url.trim()) return null;
  let trimmed = url.trim();
  if (type === 'telegram' && trimmed.startsWith('@')) {
    return `https://t.me/${trimmed.substring(1)}`;
  }
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    trimmed = 'https://' + trimmed;
  }
  return trimmed;
}

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
  
  const hours = Math.floor(duration / 60);
  const mins = duration % 60;
  let durationArabic = '';
  if (hours > 0 && mins > 0) {
    durationArabic = `${hours} ساعة و ${mins} دقيقة`;
  } else if (hours === 1) {
    durationArabic = 'ساعة واحدة';
  } else if (hours === 2) {
    durationArabic = 'ساعتان';
  } else if (hours > 2) {
    durationArabic = `${hours} ساعات`;
  } else {
    durationArabic = `${mins} دقيقة`;
  }

  return { valid: true, duration, durationArabic };
}

const TEACHER_DRAFT_KEY = 'atlas_teacher_registration_draft';

export default function TeacherRegistrationPage() {
  const [currentStep, setCurrentStep] = useState(() => {
    try {
      const savedStep = parseInt(localStorage.getItem('atlas_teacher_draft_step'), 10);
      return savedStep >= 1 && savedStep <= 5 ? savedStep : 1;
    } catch (e) {
      return 1;
    }
  });

  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem(TEACHER_DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          full_name: parsed.full_name || '',
          nickname: parsed.nickname || '',
          phone: parsed.phone || '',
          whatsapp_phone: parsed.whatsapp_phone || '',
          national_id: parsed.national_id || '',
          photo_url: parsed.photo_url || '',
          logo_url: parsed.logo_url || '',
          specializations: Array.isArray(parsed.specializations) && parsed.specializations.length > 0 
            ? parsed.specializations 
            : ['اللغة العربية'],
          target_grades: Array.isArray(parsed.target_grades) && parsed.target_grades.length > 0
            ? parsed.target_grades
            : ['الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي (شهادة)'],
          bio: parsed.bio || '',
          facebook_link: parsed.facebook_link || '',
          youtube_link: parsed.youtube_link || '',
          telegram_link: parsed.telegram_link || '',
          notes: parsed.notes || '',
        };
      }
    } catch (e) {}
    return {
      full_name: '',
      nickname: '',
      phone: '',
      whatsapp_phone: '',
      national_id: '',
      photo_url: '',
      logo_url: '',
      specializations: ['اللغة العربية'],
      target_grades: ['الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي (شهادة)'],
      bio: '',
      facebook_link: '',
      youtube_link: '',
      telegram_link: '',
      notes: '',
    };
  });

  const [hasNoAssistant, setHasNoAssistant] = useState(() => {
    try {
      return localStorage.getItem('atlas_teacher_has_no_assistant') === 'true';
    } catch (e) {
      return false;
    }
  });

  const [assistants, setAssistants] = useState(() => {
    try {
      const saved = localStorage.getItem('atlas_teacher_assistants');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [{ id: 1, name: '', phone: '' }];
  });

  const [groups, setGroups] = useState(() => {
    try {
      const saved = localStorage.getItem('atlas_teacher_groups');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      {
        id: 1,
        day: 'السبت',
        start_time: '14:00',
        end_time: '16:00',
        grade: 'الصف الأول الثانوي',
        subject: 'اللغة العربية',
      }
    ];
  });

  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  const [isLogoUploading, setIsLogoUploading] = useState(false);

  const [customSubjectInput, setCustomSubjectInput] = useState('');
  const [showCustomSubjectField, setShowCustomSubjectField] = useState(false);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [activeSubjectTab, setActiveSubjectTab] = useState('all');

  const customSubjects = useMemo(() => {
    return formData.specializations.filter(
      (sub) => !AVAILABLE_SUBJECTS.includes(sub)
    );
  }, [formData.specializations]);

  const filteredCategories = useMemo(() => {
    const query = subjectSearch.trim().toLowerCase();
    
    return SUBJECT_CATEGORIES.map((cat) => {
      if (activeSubjectTab !== 'all' && activeSubjectTab !== cat.id && !query) {
        return null;
      }
      
      const matchingSubjects = cat.subjects.filter((sub) => {
        if (!query) return true;
        return sub.toLowerCase().includes(query);
      });

      if (matchingSubjects.length === 0) return null;

      return {
        ...cat,
        subjects: matchingSubjects,
      };
    }).filter(Boolean);
  }, [subjectSearch, activeSubjectTab]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [submittedData, setSubmittedData] = useState(null);

  // Bot Protection & Cloudflare Turnstile States
  const [turnstileToken, setTurnstileToken] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const mountTimeRef = useRef(Date.now());
  const turnstileRef = useRef(null);

  const resetTurnstile = () => {
    setTurnstileToken('');
    try {
      turnstileRef.current?.reset();
    } catch (e) {}
  };

  // Auto-save draft to localStorage whenever fields change
  useEffect(() => {
    if (!submittedData) {
      try {
        localStorage.setItem(TEACHER_DRAFT_KEY, JSON.stringify(formData));
        localStorage.setItem('atlas_teacher_assistants', JSON.stringify(assistants));
        localStorage.setItem('atlas_teacher_groups', JSON.stringify(groups));
        localStorage.setItem('atlas_teacher_has_no_assistant', String(hasNoAssistant));
        localStorage.setItem('atlas_teacher_draft_step', String(currentStep));
      } catch (e) {}
    }
  }, [formData, assistants, groups, hasNoAssistant, currentStep, submittedData]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(TEACHER_DRAFT_KEY);
      localStorage.removeItem('atlas_teacher_assistants');
      localStorage.removeItem('atlas_teacher_groups');
      localStorage.removeItem('atlas_teacher_has_no_assistant');
      localStorage.removeItem('atlas_teacher_draft_step');
    } catch (e) {}
  };

  const parsedTeacherNid = useMemo(() => {
    return parseEgyptianNationalId(formData.national_id);
  }, [formData.national_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleSubject = (subject) => {
    setFormData((prev) => {
      const exists = prev.specializations.includes(subject);
      const nextSubjects = exists
        ? prev.specializations.filter((s) => s !== subject)
        : [...prev.specializations, subject];
      return { ...prev, specializations: nextSubjects };
    });
  };

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

  const toggleGrade = (grade) => {
    setFormData((prev) => {
      const exists = prev.target_grades.includes(grade);
      const nextGrades = exists
        ? prev.target_grades.filter((g) => g !== grade)
        : [...prev.target_grades, grade];
      return { ...prev, target_grades: nextGrades };
    });
  };

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

  // مساعدين غير محدودين
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
    if (assistants.length <= 1) return;
    setAssistants((prev) => prev.filter((_, idx) => idx !== index));
  };

  // المجموعات
  const handleGroupChange = (id, field, value) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === id ? { ...g, [field]: value } : g))
    );
  };

  const addGroup = () => {
    const nextSubject = formData.specializations[0] || '';
    const nextGrade = formData.target_grades[0] || 'الصف الأول الثانوي';
    setGroups((prev) => [
      ...prev,
      {
        id: Date.now(),
        day: 'الأحد',
        start_time: '16:00',
        end_time: '18:00',
        grade: nextGrade,
        subject: nextSubject,
      }
    ]);
  };

  const removeGroup = (id) => {
    if (groups.length <= 1) return;
    setGroups((prev) => prev.filter((g) => g.id !== id));
  };

  // التحقق من صحة بيانات الخطوة الحالية
  const validateStep = (step) => {
    setErrorMessage(null);

    if (step === 1) {
      if (containsSuspiciousPayload(formData.full_name) || containsSuspiciousPayload(formData.nickname)) {
        setErrorMessage('تم رصد رموز أو مدخلات غير آمنة في بيانات المعلم. يرجى إدخال نصوص عادية فقط.');
        return false;
      }
      if (!isValidArabicPersonName(formData.full_name)) {
        setErrorMessage('يرجى إدخال اسم المعلم بالكامل باللغة العربية (الاسم ثنائي أو ثلاثي أو رباعي بدون أرقام أو رموز)');
        return false;
      }
      if (!formData.nickname.trim() || formData.nickname.trim().length < 2) {
        setErrorMessage('يرجى إدخال اسم الشهرة أو اللقب للطلاب (مثال: مستر / أحمد عبد الله)');
        return false;
      }
      const cleanPhone = cleanEgyptianPhone(formData.phone);
      if (!isValidRealEgyptianPhone(cleanPhone)) {
        setErrorMessage('يرجى إدخال رقم هاتف شخصي مصري حقيقي وصحيح (010, 011, 012, 015) وتجنب الأرقام المتكررة أو الوهمية');
        return false;
      }
      const cleanWhatsapp = cleanEgyptianPhone(formData.whatsapp_phone);
      if (!isValidRealEgyptianPhone(cleanWhatsapp)) {
        setErrorMessage('يرجى إدخال رقم واتساب مصري حقيقي وصحيح للتواصل وتجنب الأرقام المتكررة أو الوهمية');
        return false;
      }
      const cleanNid = normalizeArabicNumbers(formData.national_id.trim());
      if (!parseEgyptianNationalId(cleanNid)) {
        setErrorMessage('يرجى إدخال رقم قومي مصري صحيح مكون من 14 رقماً ويبدأ بـ 2 أو 3');
        return false;
      }
      if (!formData.photo_url) {
        setErrorMessage('يرجى رفع الصورة الشخصية للمعلم لاعتماد الملف التعريفي');
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (formData.specializations.length === 0) {
        setErrorMessage('يرجى اختيار مادة تعليمية واحدة على الأقل تدرسها بالأكاديمية');
        return false;
      }
      if (formData.target_grades.length === 0) {
        setErrorMessage('يرجى اختيار مرحلة أو صف دراسي واحد على الأقل');
        return false;
      }
      return true;
    }

    if (step === 3) {
      if (!hasNoAssistant) {
        if (assistants.length === 0) {
          setErrorMessage('يرجى إضافة بيانات مساعد واحد على الأقل، أو تحديد خيار "أدير الحجز بنفسي"');
          return false;
        }
        const teacherPhone = cleanEgyptianPhone(formData.phone);
        const teacherWhatsapp = cleanEgyptianPhone(formData.whatsapp_phone);
        for (let i = 0; i < assistants.length; i++) {
          const a = assistants[i];
          const aName = (a.name || '').trim();
          const aPhone = cleanEgyptianPhone(a.phone);

          if (containsSuspiciousPayload(aName)) {
            setErrorMessage('تم رصد مدخلات أو رموز غير آمنة في اسم المساعد');
            return false;
          }

          if (aPhone && (aPhone === teacherPhone || aPhone === teacherWhatsapp)) {
            setErrorMessage(`رقم هاتف المساعد رقم ${i + 1} لا يمكن أن يكون هو نفسه رقم هاتف المعلم أو رقم الواتساب الخاص به`);
            return false;
          }

          if (i === 0) {
            if (!aName) {
              setErrorMessage('يرجى إدخال اسم المساعد الأول / السكرتير الرئيسي');
              return false;
            }
            if (!isValidRealEgyptianPhone(aPhone)) {
              setErrorMessage('يرجى إدخال رقم هاتف محمول مصري حقيقي وصحيح للمساعد الأول');
              return false;
            }
          } else {
            if (aName && !isValidRealEgyptianPhone(aPhone)) {
              setErrorMessage(`يرجى إدخال رقم هاتف مصري حقيقي وصحيح للمساعد رقم ${i + 1}`);
              return false;
            }
            if (!aName && aPhone) {
              setErrorMessage(`يرجى إدخال اسم المساعد رقم ${i + 1}`);
              return false;
            }
          }
        }
      }
      return true;
    }

    if (step === 4) {
      if (groups.length === 0) {
        setErrorMessage('يرجى إضافة مجموعة وموعد حصة واحد على الأقل');
        return false;
      }
      for (let i = 0; i < groups.length; i++) {
        const grp = groups[i];
        if (!grp.day) {
          setErrorMessage(`يرجى تحديد يوم الأسبوع للمجموعة رقم ${i + 1}`);
          return false;
        }
        const timeVal = validateGroupTimes(grp.start_time, grp.end_time);
        if (!timeVal.valid) {
          setErrorMessage(`خطأ في توقيت المجموعة رقم ${i + 1}: ${timeVal.message}`);
          return false;
        }
        if (!grp.grade) {
          setErrorMessage(`يرجى تحديد الصف الدراسي للمجموعة رقم ${i + 1}`);
          return false;
        }
        const effSubj = formData.specializations.length === 1 
          ? formData.specializations[0] 
          : (grp.subject || '').trim();
        if (!effSubj) {
          setErrorMessage(`يرجى تحديد مادة المجموعة رقم ${i + 1}`);
          return false;
        }
      }
      return true;
    }

    if (step === 5) {
      if (containsSuspiciousPayload(formData.bio) || containsSuspiciousPayload(formData.notes)) {
        setErrorMessage('تم رصد رموز أو وسوم غير آمنة في النبذة التعريفية أو الملاحظات');
        return false;
      }
      if (formData.bio.trim().length < 10) {
        setErrorMessage('يرجى كتابة نبذة تعريفية وخبراتك السابقة (10 أحرف على الأقل)');
        return false;
      }
      if (!isValidFacebookUrl(formData.facebook_link)) {
        setErrorMessage('رابط الفيسبوك غير صحيح. يرجى إدخال رابط صالح لصفحة أو حساب فيسبوك (مثال: facebook.com/username)');
        return false;
      }
      if (!isValidYoutubeUrl(formData.youtube_link)) {
        setErrorMessage('رابط اليوتيوب غير صحيح. يرجى إدخال رابط صالح لقناة يوتيوب (مثال: youtube.com/@username)');
        return false;
      }
      if (!isValidTelegramUrl(formData.telegram_link)) {
        setErrorMessage('رابط أو معرف التليجرام غير صحيح. يرجى إدخال رابط أو معرف صالح (مثال: t.me/username أو @username)');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setErrorMessage(null);
      setCurrentStep((prev) => Math.min(5, prev + 1));
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

  // إرسال الاستمارة
  const handleSubmit = async (e) => {
    e.preventDefault();

    // فخ الروبوتات والسبام
    if (honeypot) {
      console.warn('Bot trap activated');
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setErrorMessage('تعذر معالجة الطلب، يرجى المحاولة لاحقاً');
      }, 1000);
      return;
    }

    const timeElapsed = Date.now() - mountTimeRef.current;
    if (timeElapsed < 5000) {
      setErrorMessage('تم ملء النموذج بسرعة غير طبيعية، يرجى التأني وإعادة المحاولة');
      return;
    }

    if (!turnstileToken) {
      setErrorMessage('يرجى إكمال التحقق الأمني من كلاودفير (Cloudflare Turnstile) أسفل الصفحة قبل إرسال الاستمارة');
      setCurrentStep(5);
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      return;
    }

    // Verify turnstile token with backend
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
      const verifyRes = await fetch(`${apiBase}/verify-turnstile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: turnstileToken }),
      });
      const verifyData = await verifyRes.json().catch(() => ({}));
      if (!verifyRes.ok || !verifyData.success) {
        resetTurnstile();
        setErrorMessage(verifyData.message || 'فشل التحقق الأمني من كلاودفير (Turnstile)، يرجى إعادة المحاولة');
        return;
      }
    } catch (err) {
      console.warn('Backend Turnstile verification check skipped (direct):', err);
    }

    // التحقق من كافة الخطوات
    for (let s = 1; s <= 5; s++) {
      if (!validateStep(s)) {
        setCurrentStep(s);
        window.scrollTo({ top: 100, behavior: 'smooth' });
        return;
      }
    }

    const cleanPhone = cleanEgyptianPhone(formData.phone);
    const cleanWhatsapp = cleanEgyptianPhone(formData.whatsapp_phone);
    const cleanNid = normalizeArabicNumbers(formData.national_id.trim());

    let validAssistants = [];
    if (!hasNoAssistant) {
      for (let i = 0; i < assistants.length; i++) {
        const a = assistants[i];
        const aName = sanitizeInputText(a.name, 100);
        const aPhone = cleanEgyptianPhone(a.phone);
        if (aName && aPhone && isValidRealEgyptianPhone(aPhone)) {
          validAssistants.push({
            id: a.id || i + 1,
            name: aName,
            phone: aPhone,
          });
        }
      }
    }

    setIsSubmitting(true);

    try {
      // التحقق من عدم وجود تسجيل مسبق للمعلم بنفس الرقم القومي أو الهاتف
      const { data: existingTeacher } = await supabase
        .from('online_teachers')
        .select('id, full_name, phone, national_id')
        .or(`national_id.eq.${cleanNid},phone.eq.${cleanPhone}`)
        .limit(1);

      if (existingTeacher && existingTeacher.length > 0) {
        const isSameNid = existingTeacher[0].national_id === cleanNid;
        resetTurnstile();
        setErrorMessage(
          isSameNid 
            ? 'تم تسجيل استمارة انضمام مسبقاً بهذا الرقم القومي.' 
            : 'رقم هاتف المعلم مسجل بالفعل في استمارة سابقة.'
        );
        setIsSubmitting(false);
        return;
      }

      const teacherId = generateUUID();

      const specializationString = formData.specializations.join(' ، ');
      const targetGradesString = formData.target_grades.join(' ، ');

      const sanitizedGroups = groups.map((g) => ({
        ...g,
        subject: (g.subject && formData.specializations.includes(g.subject))
          ? g.subject
          : (formData.specializations[0] || ''),
      }));

      const payload = {
        id: teacherId,
        full_name: sanitizeInputText(formData.full_name, 100),
        nickname: sanitizeInputText(formData.nickname, 60),
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
        groups_data: sanitizedGroups,
        bio: sanitizeInputText(formData.bio, 1000),
        facebook_link: formatSocialUrl(formData.facebook_link, 'facebook'),
        youtube_link: formatSocialUrl(formData.youtube_link, 'youtube'),
        telegram_link: formatSocialUrl(formData.telegram_link, 'telegram'),
        notes: sanitizeInputText(formData.notes, 500) || null,
        status: 'pending',
        synced_to_local_server: false,
      };

      let { error } = await supabase
        .from('online_teachers')
        .insert([payload]);

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

      clearDraft();

      setSubmittedData({
        ...payload,
        specializationsArray: formData.specializations,
        targetGradesArray: formData.target_grades,
        assistantsList: validAssistants,
        groupsList: sanitizedGroups,
        id: teacherId,
        created_at: new Date().toLocaleDateString('ar-EG'),
      });
    } catch (err) {
      console.error(err);
      resetTurnstile();
      setErrorMessage(
        err.message || 'حدث خطأ أثناء إرسال الاستمارة — يرجى التأكد من الاتصال بالإنترنت والمحاولة مجدداً'
      );
      window.scrollTo({ top: 100, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // شاشة النجاح
  if (submittedData) {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-100 text-center animate-fade-in-up max-w-4xl mx-auto">
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
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => {
              clearDraft();
              setSubmittedData(null);
              setCurrentStep(1);
              setTurnstileToken('');
              setHasNoAssistant(false);
              setFormData({
                full_name: '',
                nickname: '',
                phone: '',
                whatsapp_phone: '',
                national_id: '',
                photo_url: '',
                logo_url: '',
                specializations: ['اللغة العربية'],
                target_grades: ['الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي (شهادة)'],
                bio: '',
                facebook_link: '',
                youtube_link: '',
                telegram_link: '',
                notes: '',
              });
              setAssistants([{ id: 1, name: '', phone: '' }]);
              setGroups([
                {
                  id: 1,
                  day: 'السبت',
                  start_time: '14:00',
                  end_time: '16:00',
                  grade: 'الصف الأول الثانوي',
                  subject: 'اللغة العربية',
                }
              ]);
            }}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
          >
            <UserCheck size={18} />
            <span>تسجيل استمارة جديدة</span>
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
          <span className="text-rose-600">الخطوة {currentStep} من {STEPS.length}</span>
          <span className="text-slate-800 font-extrabold">{STEPS[currentStep - 1].title}</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-300"
            style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
          />
        </div>
        {/* Step Circles */}
        <div className="flex justify-between mt-3 px-1">
          {STEPS.map((step) => {
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
                    ? 'bg-rose-600 text-white ring-4 ring-rose-100' 
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
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shadow-inner">
                <UserCheck size={24} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-rose-600 tracking-wider">استمارة الكادر التعليمي</span>
                <h3 className="text-base font-black text-slate-800">خطوات الانضمام والاعتماد</h3>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1.5">
                <span>نسبة إنجاز الاستمارة</span>
                <span className="font-mono text-rose-600 font-bold">{Math.round((currentStep / STEPS.length) * 100)}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
                <div 
                  className="h-full bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Step List Items */}
            <nav className="space-y-2">
              {STEPS.map((step) => {
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
                        ? 'bg-gradient-to-r from-rose-50 to-amber-50/40 border border-rose-200 text-slate-900 shadow-sm'
                        : isDone
                        ? 'hover:bg-slate-50 text-slate-700'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                      isDone 
                        ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                        : isCurrent
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-200'
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      {isDone ? <Check size={16} /> : <StepIcon size={16} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold truncate ${isCurrent ? 'text-rose-700 font-black' : isDone ? 'text-slate-800' : 'text-slate-500'}`}>
                          {step.title}
                        </span>
                        {isDone && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                            مكتمل
                          </span>
                        )}
                        {isCurrent && (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded-md animate-pulse">
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

          {/* Support Card */}
          <div className="bg-gradient-to-br from-slate-900 to-[#1e1429] text-white rounded-3xl p-5 shadow-lg border border-white/10 text-xs space-y-2.5">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <Sparkles size={16} />
              <span>تحتاج مساعدة أو تنسيق مسبق؟</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              فريق إدارة شؤون هيئة التدريس متاح على مدار الساعة لتسهيل إجراءات التسجيل وتجهيز القاعات.
            </p>
            <div className="pt-1 flex items-center justify-between text-[11px] text-white/70 border-t border-white/10">
              <span>هاتف الدعم: 01016083050</span>
              <span className="font-mono text-emerald-400">متاح الآن</span>
            </div>
          </div>
        </aside>

        {/* MAIN WORKSPACE FORM (lg:col-span-8) */}
        <main className="lg:col-span-8">
          <div className="bg-white rounded-3xl p-6 sm:p-9 shadow-xl border border-slate-100">
            
            {/* Step Header */}
            <div className="flex items-center gap-3.5 pb-6 mb-7 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shadow-inner">
                {(() => {
                  const CurrentIcon = STEPS[currentStep - 1].icon;
                  return <CurrentIcon size={24} />;
                })()}
              </div>
              <div>
                <span className="text-xs font-bold text-rose-600">الخطوة {currentStep} من {STEPS.length}</span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-800">
                  {STEPS[currentStep - 1].title}
                </h2>
                <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                  {STEPS[currentStep - 1].subtitle}
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
                  STEP 1: PERSONAL & PROFESSIONAL INFO
                  ============================================================ */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
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
                      <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
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

                    {/* Personal Phone */}
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
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
                      <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
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
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs sm:text-sm font-bold text-slate-700">
                          الرقم القومي للمعلم (14 رقماً) <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Fingerprint size={12} className="text-rose-600" />
                          <span>14 رقماً يبدأ بـ 2 أو 3</span>
                        </span>
                      </div>
                      <input
                        type="text"
                        name="national_id"
                        value={formData.national_id}
                        onChange={handleChange}
                        required
                        maxLength={14}
                        placeholder="مثال: 29001010101234"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all bg-white"
                      />

                      {parsedTeacherNid && (
                        <div className="mt-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                          <Calendar size={14} className="text-emerald-600 shrink-0" />
                          <span>
                            تاريخ الميلاد: <strong>{parsedTeacherNid.formattedArabic}</strong>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Teacher Photo */}
                    <div className="sm:col-span-2">
                      <ImageUploadField
                        label="الصورة الشخصية للمعلم"
                        description="يرجى رفع صورة شخصية واضحة ورسمية لإدراجها في الكارنيه والملف التعريفي للأكاديمية"
                        badgeText="صورة رسمية مطلوبة"
                        value={formData.photo_url}
                        onChange={(url) => setFormData((prev) => ({ ...prev, photo_url: url }))}
                        onUploadingChange={setIsPhotoUploading}
                        required={true}
                        isWhiteBackground={false}
                      />
                    </div>

                    {/* Teacher Logo */}
                    <div className="sm:col-span-2">
                      <ImageUploadField
                        label="لوجو أو شعار المعلم (إن وجد)"
                        description="شعار البراند التعليمي الخاص بكم لوضعه على المذكرات والجدول والشاشات الإلكترونية"
                        badgeText="اختياري"
                        value={formData.logo_url}
                        onChange={(url) => setFormData((prev) => ({ ...prev, logo_url: url }))}
                        onUploadingChange={setIsLogoUploading}
                        required={false}
                        isWhiteBackground={false}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================
                  STEP 2: SUBJECTS & GRADES
                  ============================================================ */}
              {currentStep === 2 && (
                <div className="space-y-7 animate-fade-in">
                  
                  {/* Section A: Specializations */}
                  <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                      <div>
                        <div className="flex items-center gap-2">
                          <BookOpen className="text-rose-600" size={18} />
                          <label className="text-sm font-extrabold text-slate-800">
                            المواد التعليمية والتخصصات المعتمدة <span className="text-rose-500">*</span>
                          </label>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          اختر مادة أو أكثر من الأقسام التالية — يمكنك البحث السريع لتحديد مادتك فوراً:
                        </p>
                      </div>
                      <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100 self-start sm:self-auto shrink-0">
                        المحدد: {formData.specializations.length} مادة
                      </span>
                    </div>

                    {/* Selected Subjects Chips Bar */}
                    {formData.specializations.length > 0 ? (
                      <div className="p-3 bg-white rounded-2xl border border-rose-100 shadow-xs">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-slate-600">
                            المواد التي تم تحديدها لملفك التدريسي:
                          </span>
                          <span className="text-[10px] text-slate-400">اضغط ✕ لإلغاء أي مادة</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {formData.specializations.map((sub) => (
                            <span
                              key={sub}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-rose-50 to-amber-50 text-rose-700 border border-rose-200 text-xs font-bold shadow-2xs"
                            >
                              <span>{sub}</span>
                              <button
                                type="button"
                                onClick={() => toggleSubject(sub)}
                                className="w-4 h-4 rounded-full hover:bg-rose-200/60 flex items-center justify-center text-rose-600 cursor-pointer"
                                title="إلغاء المادة"
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200/60 text-xs text-amber-800 flex items-center gap-2">
                        <AlertCircle size={15} className="shrink-0 text-amber-600" />
                        <span>يرجى اختيار مادة واحدة على الأقل من القوائم بالأسفل للاعتماد.</span>
                      </div>
                    )}

                    {/* Quick Search & Category Tabs */}
                    <div className="space-y-3">
                      {/* Search Input */}
                      <div className="relative">
                        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          value={subjectSearch}
                          onChange={(e) => setSubjectSearch(e.target.value)}
                          placeholder="ابحث عن مادتك بسرعة... (مثال: فيزياء، لغة فرنسية، Math، ICT، فقه)"
                          className="w-full pr-10 pl-10 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white shadow-2xs"
                        />
                        {subjectSearch && (
                          <button
                            type="button"
                            onClick={() => setSubjectSearch('')}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      {/* Category Filter Pills */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                        <button
                          type="button"
                          onClick={() => setActiveSubjectTab('all')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                            activeSubjectTab === 'all'
                              ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          جميع الأقسام ({AVAILABLE_SUBJECTS.length})
                        </button>
                        {SUBJECT_CATEGORIES.map((cat) => {
                          const isActive = activeSubjectTab === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setActiveSubjectTab(cat.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                                isActive
                                  ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                              }`}
                            >
                              <span>{cat.icon}</span>
                              <span>{cat.title}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Categories and Subject Buttons */}
                    <div className="space-y-4">
                      {filteredCategories.length > 0 ? (
                        filteredCategories.map((cat) => (
                          <div
                            key={cat.id}
                            className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs transition-all"
                          >
                            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                              <div className="flex items-center gap-2">
                                <span className="text-base">{cat.icon}</span>
                                <h4 className="text-xs sm:text-sm font-extrabold text-slate-800">
                                  {cat.title}
                                </h4>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${cat.badgeClass}`}>
                                {cat.subjects.length} مادة
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {cat.subjects.map((sub) => {
                                const isSelected = formData.specializations.includes(sub);
                                return (
                                  <button
                                    key={sub}
                                    type="button"
                                    onClick={() => toggleSubject(sub)}
                                    className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                                      isSelected
                                        ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white border-rose-600 shadow-md shadow-rose-600/20 ring-2 ring-rose-200 font-bold'
                                        : 'bg-slate-50/70 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                                    }`}
                                  >
                                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${isSelected ? 'bg-white text-rose-600 font-black' : 'bg-slate-200 text-slate-500'}`}>
                                      {isSelected ? '✓' : '+'}
                                    </span>
                                    <span>{sub}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                          لا توجد مواد مطابقة لكلمة البحث "{subjectSearch}". يمكنك إضافتها كمادة مخصصة بالأسفل.
                        </div>
                      )}

                      {/* Display Custom Subjects if any */}
                      {customSubjects.length > 0 && (
                        <div className="bg-white rounded-2xl p-4 border border-dashed border-rose-200 shadow-2xs">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-rose-700">مواد مخصصة إضافية تمت إضافتها:</span>
                            <span className="text-[10px] text-slate-400">مخصصة من قبلك</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {customSubjects.map((sub) => (
                              <button
                                key={sub}
                                type="button"
                                onClick={() => toggleSubject(sub)}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 text-white border border-rose-600 flex items-center gap-1.5 shadow-xs cursor-pointer"
                              >
                                <span>✓</span>
                                <span>{sub}</span>
                                <span className="opacity-70 hover:opacity-100 text-white mr-1">✕</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Custom Subject Addition */}
                    <div className="pt-2 border-t border-slate-200/60">
                      {!showCustomSubjectField ? (
                        <button
                          type="button"
                          onClick={() => setShowCustomSubjectField(true)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:text-rose-800 bg-white border border-rose-200 hover:border-rose-300 px-3.5 py-2 rounded-xl transition-all shadow-2xs cursor-pointer"
                        >
                          <Plus size={14} />
                          <span>إضافة مادة تعليمية أخرى غير موجودة بالقائمة</span>
                        </button>
                      ) : (
                        <div className="flex gap-2 max-w-md mt-2">
                          <input
                            type="text"
                            value={customSubjectInput}
                            onChange={(e) => setCustomSubjectInput(e.target.value)}
                            placeholder="اسم المادة المخصصة..."
                            className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white shadow-2xs"
                          />
                          <button
                            type="button"
                            onClick={handleAddCustomSubject}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-sm"
                          >
                            إضافة
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowCustomSubjectField(false)}
                            className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                          >
                            إلغاء
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section B: Target Grades */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-bold text-slate-800">
                        الصفوف والمراحل الدراسية <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100">
                        المحدد: {formData.target_grades.length} صف
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">
                      حدد الصفوف التي تدرس لها داخل قاعات الأكاديمية:
                    </p>

                    {/* Quick Stage Selectors */}
                    <div className="flex flex-wrap gap-2 mb-4 text-xs">
                      <button
                        type="button"
                        onClick={() => selectStageCluster('الثانوي')}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold transition-colors cursor-pointer"
                      >
                        + كل المرحلة الثانوية
                      </button>
                      <button
                        type="button"
                        onClick={() => selectStageCluster('الإعدادي')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold transition-colors cursor-pointer"
                      >
                        + كل المرحلة الإعدادية
                      </button>
                      <button
                        type="button"
                        onClick={() => selectStageCluster('الابتدائي')}
                        className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold transition-colors cursor-pointer"
                      >
                        + كل المرحلة الابتدائية
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      {ALL_GRADES.map((grade) => {
                        const isSelected = formData.target_grades.includes(grade);
                        return (
                          <button
                            key={grade}
                            type="button"
                            onClick={() => toggleGrade(grade)}
                            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-600/30 ring-2 ring-sky-200'
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
              )}

              {/* ============================================================
                  STEP 3: ASSISTANTS & TEAM (UNLIMITED ASSISTANTS)
                  ============================================================ */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Self Management Toggle */}
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                    <label className="flex items-center gap-3 cursor-pointer text-xs sm:text-sm font-bold text-amber-950">
                      <input
                        type="checkbox"
                        checked={hasNoAssistant}
                        onChange={(e) => setHasNoAssistant(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                      <span>لا يوجد فريق عمل أو سكرتارية (أدير الحجز والتواصل بنفسي)</span>
                    </label>
                  </div>

                  {!hasNoAssistant && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-600">
                          قائمة المساعدين والسكرتارية (يمكن إضافة أي عدد بدون حد أقصى)
                        </span>
                        <span className="text-xs font-semibold text-amber-700 bg-amber-100/70 px-2.5 py-0.5 rounded-full">
                          {assistants.length} مساعد مسجل
                        </span>
                      </div>

                      <div className="space-y-4">
                        {assistants.map((assistant, index) => (
                          <div 
                            key={assistant.id || index}
                            className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 relative shadow-2xs"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs flex items-center justify-center font-bold">
                                  {index + 1}
                                </span>
                                <span>المساعد / السكرتير {index + 1} {index === 0 && <span className="text-rose-500">*</span>}</span>
                              </span>

                              {assistants.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeAssistant(index)}
                                  className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 px-2.5 py-1 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Trash2 size={14} />
                                  <span>حذف المساعد</span>
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
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
                                <label className="block text-xs font-bold text-slate-700 mb-1">
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
                        className="w-full py-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border-2 border-dashed border-amber-300 text-amber-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <Plus size={16} />
                        <span>إضافة مساعد جديد في فريق العمل</span>
                      </button>
                    </div>
                  )}

                </div>
              )}

              {/* ============================================================
                  STEP 4: GROUPS & SCHEDULES
                  ============================================================ */}
              {currentStep === 4 && (
                <div className="space-y-6 animate-fade-in">
                  
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">جدول المجموعات ومواعيد الحصص الأسبوعية</h4>
                      <p className="text-xs text-slate-500">حدد مواعيد الحصص والقاعات المقترحة لكل صف دراسي</p>
                    </div>
                    <button
                      type="button"
                      onClick={addGroup}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 px-3.5 py-2 rounded-xl shadow-sm transition-colors cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>إضافة مجموعة</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {groups.map((group, idx) => {
                      const timeVal = validateGroupTimes(group.start_time, group.end_time);
                      return (
                        <div
                          key={group.id}
                          className="p-5 rounded-2xl bg-purple-50/40 border border-purple-200/90 relative text-right shadow-2xs"
                        >
                          <div className="flex items-center justify-between mb-4 pb-2 border-b border-purple-100">
                            <span className="text-xs font-bold text-purple-900 flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-purple-200 text-purple-800 text-xs flex items-center justify-center font-bold">
                                {idx + 1}
                              </span>
                              <span>المجموعة رقم {idx + 1}</span>
                              {formData.specializations.length === 1 && (
                                <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200">
                                  مادة: {formData.specializations[0]}
                                </span>
                              )}
                              {formData.specializations.length > 1 && group.subject && (
                                <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200">
                                  مادة: {group.subject}
                                </span>
                              )}
                            </span>

                            {groups.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeGroup(group.id)}
                                className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 px-2.5 py-1 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 size={14} />
                                <span>حذف المجموعة</span>
                              </button>
                            )}
                          </div>

                          <div className={`grid grid-cols-1 sm:grid-cols-2 ${formData.specializations.length > 1 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-3.5`}>
                            {/* Subject Selector (If multiple specializations exist) */}
                            {formData.specializations.length > 1 && (
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                  مادة المجموعة <span className="text-rose-500">*</span>
                                </label>
                                <select
                                  value={group.subject && formData.specializations.includes(group.subject) ? group.subject : formData.specializations[0] || ''}
                                  onChange={(e) => handleGroupChange(group.id, 'subject', e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl border border-purple-300 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-purple-950 shadow-2xs cursor-pointer"
                                  required
                                >
                                  {formData.specializations.map((sub) => (
                                    <option key={sub} value={sub}>{sub}</option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {/* Grade */}
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">الصف الدراسي <span className="text-rose-500">*</span></label>
                              <select
                                value={group.grade}
                                onChange={(e) => handleGroupChange(group.id, 'grade', e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                              >
                                {formData.target_grades.map((grd) => (
                                  <option key={grd} value={grd}>{grd}</option>
                                ))}
                              </select>
                            </div>

                            {/* Day */}
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">اليوم <span className="text-rose-500">*</span></label>
                              <select
                                value={group.day}
                                onChange={(e) => handleGroupChange(group.id, 'day', e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                              >
                                {DAYS_OF_WEEK.map((d) => (
                                  <option key={d} value={d}>{d}</option>
                                ))}
                              </select>
                            </div>

                            {/* Start Time */}
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">وقت البداية <span className="text-rose-500">*</span></label>
                              <input
                                type="time"
                                value={group.start_time}
                                onChange={(e) => handleGroupChange(group.id, 'start_time', e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                              />
                            </div>

                            {/* End Time */}
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">وقت النهاية <span className="text-rose-500">*</span></label>
                              <input
                                type="time"
                                value={group.end_time}
                                onChange={(e) => handleGroupChange(group.id, 'end_time', e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                              />
                            </div>
                          </div>

                          {/* Calculated Duration */}
                          {timeVal.valid && (
                            <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-purple-700 bg-purple-100/70 px-2.5 py-1 rounded-lg">
                              <Clock size={12} />
                              <span>مدة الحصة: {timeVal.durationArabic}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={addGroup}
                    className="w-full py-3 rounded-2xl bg-purple-50 hover:bg-purple-100 border-2 border-dashed border-purple-300 text-purple-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Plus size={16} />
                    <span>إضافة موعد أو مجموعة أخرى</span>
                  </button>

                </div>
              )}

              {/* ============================================================
                  STEP 5: BIO, PLATFORMS & FINAL REVIEW
                  ============================================================ */}
              {currentStep === 5 && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Bio */}
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
                      النبذة التعريفية وسنوات الخبرة <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      required
                      rows={3}
                      placeholder="اكتب نبذة مختصرة عن مؤهلاتك العلمية، سنوات الخبرة، المدارس أو المنصات التي عملت بها..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none bg-white"
                    />
                  </div>

                  {/* Social Links */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        صفحة الفيسبوك <span className="text-slate-400 font-normal">(اختياري)</span>
                      </label>
                      <input
                        type="url"
                        name="facebook_link"
                        value={formData.facebook_link}
                        onChange={handleChange}
                        placeholder="https://facebook.com/..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        قناة اليوتيوب <span className="text-slate-400 font-normal">(اختياري)</span>
                      </label>
                      <input
                        type="url"
                        name="youtube_link"
                        value={formData.youtube_link}
                        onChange={handleChange}
                        placeholder="https://youtube.com/@..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        قناة أو جروب التليجرام <span className="text-slate-400 font-normal">(اختياري)</span>
                      </label>
                      <input
                        type="url"
                        name="telegram_link"
                        value={formData.telegram_link}
                        onChange={handleChange}
                        placeholder="https://t.me/..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ملاحظات أو متطلبات خاصة بالقاعات <span className="text-slate-400 font-normal">(اختياري)</span>
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={2}
                      placeholder="مثال: الحاجة لشاشات سمارت، سعة قاعة معينة، تجهيزات صوتية..."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none bg-white"
                    />
                  </div>

                  {/* Comprehensive Review Card */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <span className="font-bold text-slate-800 text-sm">ملخص الاستمارة قبل التأكيد النهائي:</span>
                      <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded">جاهز للإرسال</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                      <div><strong>اسم المعلم:</strong> {formData.full_name} ({formData.nickname})</div>
                      <div><strong>الهاتف:</strong> {formData.phone}</div>
                      <div><strong>المواد:</strong> {formData.specializations.join(' ، ')}</div>
                      <div><strong>المراحل:</strong> {formData.target_grades.join(' ، ')}</div>
                      <div><strong>المساعدين:</strong> {hasNoAssistant ? 'إدارة ذاتية' : `${assistants.length} مساعد`}</div>
                      <div><strong>المجموعات المقترحة:</strong> {groups.length} مجموعة</div>
                    </div>
                  </div>

                  {/* Bot Honeypot Input (Invisible) */}
                  <div className="hidden" aria-hidden="true" style={{ display: 'none' }}>
                    <input
                      type="text"
                      name="bot_trap_field"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>

                  {/* Cloudflare Turnstile: التحقق الأمني الذكي */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>التحقق الأمني الذكي من Cloudflare</span>
                      <span className="text-[11px] text-slate-400 font-normal">Cloudflare Turnstile Protected</span>
                    </div>
                    <TurnstileWidget
                      ref={turnstileRef}
                      onVerify={(token) => setTurnstileToken(token)}
                      onExpire={() => setTurnstileToken('')}
                      onError={() => setTurnstileToken('')}
                    />
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

                {currentStep < 5 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
                  >
                    <span>المتابعة للخطوة التالية</span>
                    <ChevronLeft size={18} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || isPhotoUploading || isLogoUploading}
                    className="px-8 py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-700 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-extrabold text-sm sm:text-base flex items-center gap-2.5 shadow-xl shadow-rose-600/30 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>جاري إرسال الاستمارة والاعتماد...</span>
                      </>
                    ) : isPhotoUploading || isLogoUploading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>جاري رفع الصور...</span>
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        <span>تأكيد وإرسال استمارة المعلم رسمياً</span>
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
