/**
 * Atlas ERP — Official 2026 Teachers, Subjects, Groups & Package Links Seeder
 *
 * Usage:
 *   Local DB:  node server/src/db/seed_schedule_2026.js
 */

const path = require('path');
try {
  require(path.resolve(__dirname, '../../node_modules/dotenv')).config({
    path: path.resolve(__dirname, '../../.env'),
  });
} catch {
  // fallback to default env in db.js
}

const db = require('../config/db');

// ============================================================================
// 1. REQUIRED SUBJECTS DEFINITIONS
// ============================================================================
const REQUIRED_SUBJECTS = [
  { key: 'ARABIC', name_ar: 'اللغة العربية', name_en: 'Arabic', color: '#16a34a', education_type: 'both' },
  { key: 'SHARIA', name_ar: 'العلوم الشرعية والأزهرية', name_en: 'Islamic Sharia', color: '#059669', education_type: 'azhar' },
  { key: 'RELIGION', name_ar: 'التربية الدينية', name_en: 'Religious Education', color: '#10b981', education_type: 'general' },
  { key: 'ENGLISH', name_ar: 'اللغة الإنجليزية', name_en: 'English', color: '#2563eb', education_type: 'both' },
  { key: 'FRENCH', name_ar: 'اللغة الفرنسية', name_en: 'French', color: '#9333ea', education_type: 'both' },
  { key: 'MATH_AR', name_ar: 'الرياضيات', name_en: 'Mathematics', color: '#d97706', education_type: 'both' },
  { key: 'MATH_EN', name_ar: 'Math (الرياضيات لغات)', name_en: 'Math', color: '#ea580c', education_type: 'general' },
  { key: 'SCIENCE_AR', name_ar: 'العلوم', name_en: 'Science (AR)', color: '#0891b2', education_type: 'both' },
  { key: 'SCIENCE_EN', name_ar: 'Science (العلوم لغات)', name_en: 'Science', color: '#0284c7', education_type: 'general' },
  { key: 'INTEGRATED_SCI_AR', name_ar: 'العلوم المتكاملة', name_en: 'Integrated Science (AR)', color: '#0e7490', education_type: 'general' },
  { key: 'INTEGRATED_SCI_EN', name_ar: 'Integrated Science (العلوم المتكاملة لغات)', name_en: 'Integrated Science', color: '#0284c7', education_type: 'general' },
  { key: 'SOCIAL', name_ar: 'الدراسات الاجتماعية', name_en: 'Social Studies', color: '#ca8a04', education_type: 'both' },
  { key: 'HISTORY', name_ar: 'التاريخ', name_en: 'History', color: '#b45309', education_type: 'both' },
  { key: 'IT_AR', name_ar: 'تكنولوجيا المعلومات', name_en: 'Information Technology', color: '#6d28d9', education_type: 'general' },
  { key: 'ICT_EN', name_ar: 'تكنولوجيا المعلومات والاتصالات ICT', name_en: 'ICT', color: '#7c3aed', education_type: 'general' },
  { key: 'PROGRAMMING', name_ar: 'البرمجة وعلوم الحاسب', name_en: 'Programming & CS', color: '#0d9488', education_type: 'general' },
  { key: 'PHILOSOPHY', name_ar: 'الفلسفة والمنطق', name_en: 'Philosophy & Logic', color: '#4f46e5', education_type: 'both' },
  { key: 'PHYSICS', name_ar: 'الفيزياء', name_en: 'Physics', color: '#0284c7', education_type: 'both' },
  { key: 'BIOLOGY', name_ar: 'الأحياء', name_en: 'Biology', color: '#15803d', education_type: 'both' },
  { key: 'GEOGRAPHY', name_ar: 'الجغرافيا', name_en: 'Geography', color: '#b45309', education_type: 'both' },
];

// ============================================================================
// 2. 49 TEACHERS DEFINITIONS (42 PACKAGE + 7 ADDITIONAL PRIVATE)
// ============================================================================
const TEACHERS_LIST = [
  // --- اللغة العربية ---
  { num: 1, full_name: 'ا/ مروان', gender: 'male', specialization: 'اللغة العربية', subjectKeys: ['ARABIC'] },
  { num: 2, full_name: 'ميس/ دنيا', gender: 'female', specialization: 'اللغة العربية', subjectKeys: ['ARABIC'] },
  { num: 3, full_name: 'ا/ محمد صلاح عربي', gender: 'male', specialization: 'اللغة العربية', subjectKeys: ['ARABIC'] },
  { num: 4, full_name: 'ميس/ ياسمين حسن', gender: 'female', specialization: 'اللغة العربية والشرعي (أزهر)', subjectKeys: ['ARABIC', 'SHARIA'] },
  { num: 5, full_name: 'ا/ الغزالي', gender: 'male', specialization: 'اللغة العربية', subjectKeys: ['ARABIC'] },

  // --- الشرعي والتربية الدينية ---
  { num: 6, full_name: 'ا/ الاء محمد', gender: 'female', specialization: 'العلوم الشرعية والأزهرية', subjectKeys: ['SHARIA'] },
  { num: 7, full_name: 'ا/ اسلام جمال', gender: 'male', specialization: 'العلوم الشرعية والأزهرية', subjectKeys: ['SHARIA'] },
  { num: 8, full_name: 'ا/ صفية', gender: 'female', specialization: 'التربية الدينية', subjectKeys: ['RELIGION'] },

  // --- اللغة الإنجليزية ---
  { num: 9, full_name: 'ميس/ الاء علاء', gender: 'female', specialization: 'اللغة الإنجليزية', subjectKeys: ['ENGLISH'] },
  { num: 10, full_name: 'ا/ سالي', gender: 'female', specialization: 'اللغة الإنجليزية', subjectKeys: ['ENGLISH'] },
  { num: 11, full_name: 'ا/ محمد علاء', gender: 'male', specialization: 'اللغة الإنجليزية', subjectKeys: ['ENGLISH'] },
  { num: 12, full_name: 'ا/ صبحي محمد', gender: 'male', specialization: 'اللغة الإنجليزية', subjectKeys: ['ENGLISH'] },
  { num: 13, full_name: 'ا/ الشاذلي', gender: 'male', specialization: 'اللغة الإنجليزية', subjectKeys: ['ENGLISH'] },
  { num: 14, full_name: 'ا/ ادهم ابو الصفا', gender: 'male', specialization: 'اللغة الإنجليزية', subjectKeys: ['ENGLISH'] },

  // --- اللغة الفرنسية ---
  { num: 15, full_name: 'مسيو/ خالد النصيري', gender: 'male', specialization: 'اللغة الفرنسية', subjectKeys: ['FRENCH'] },

  // --- الرياضيات و Math ---
  { num: 16, full_name: 'ا/ احمد محمود', gender: 'male', specialization: 'الرياضيات', subjectKeys: ['MATH_AR'] },
  { num: 17, full_name: 'ا/ ادهم هاني', gender: 'male', specialization: 'الرياضيات', subjectKeys: ['MATH_AR'] },
  { num: 18, full_name: 'ا/ محمد بكير', gender: 'male', specialization: 'الرياضيات', subjectKeys: ['MATH_AR'] },
  { num: 19, full_name: 'ا/ محمد عادل', gender: 'male', specialization: 'الرياضيات', subjectKeys: ['MATH_AR'] },
  { num: 20, full_name: 'ا/ محمد يوسف', gender: 'male', specialization: 'الرياضيات', subjectKeys: ['MATH_AR'] },
  { num: 21, full_name: 'ميس/ اسماء', gender: 'female', specialization: 'Math (الرياضيات لغات)', subjectKeys: ['MATH_EN'] },
  { num: 22, full_name: 'ا/ احمد نبيل', gender: 'male', specialization: 'Math (الرياضيات لغات)', subjectKeys: ['MATH_EN'] },
  { num: 23, full_name: 'ا/ محمود الرفاعي', gender: 'male', specialization: 'Math (الرياضيات لغات)', subjectKeys: ['MATH_EN'] },
  { num: 24, full_name: 'ا/ عمر جمال', gender: 'male', specialization: 'Math (الرياضيات لغات)', subjectKeys: ['MATH_EN'] },

  // --- العلوم و Science ---
  { num: 25, full_name: 'ا/ حازم', gender: 'male', specialization: 'العلوم', subjectKeys: ['SCIENCE_AR'] },
  { num: 26, full_name: 'ا/ احمد عثمان', gender: 'male', specialization: 'العلوم', subjectKeys: ['SCIENCE_AR'] },
  { num: 27, full_name: 'ميس/ اية ادم', gender: 'female', specialization: 'العلوم والعلوم المتكاملة', subjectKeys: ['SCIENCE_AR', 'INTEGRATED_SCI_AR'] },
  { num: 28, full_name: 'ا/ احمد عبد الله', gender: 'male', specialization: 'العلوم', subjectKeys: ['SCIENCE_AR'] },
  { num: 29, full_name: 'ميس/ ايناس', gender: 'female', specialization: 'Science (العلوم لغات)', subjectKeys: ['SCIENCE_EN'] },
  { num: 30, full_name: 'ا/ ادهم امبابي', gender: 'male', specialization: 'Science (العلوم لغات)', subjectKeys: ['SCIENCE_EN'] },
  { num: 31, full_name: 'ا/ اسلام عبد الجليل', gender: 'male', specialization: 'Science (العلوم لغات)', subjectKeys: ['SCIENCE_EN'] },
  { num: 32, full_name: 'ا/ محمد العربي', gender: 'male', specialization: 'Science & Bio & Integrated Science', subjectKeys: ['SCIENCE_EN', 'INTEGRATED_SCI_EN', 'BIOLOGY'] },

  // --- الدراسات الاجتماعية والتاريخ والجغرافيا ---
  { num: 33, full_name: 'ميس/ شيماء', gender: 'female', specialization: 'الدراسات الاجتماعية', subjectKeys: ['SOCIAL'] },
  { num: 34, full_name: 'ا/ محمود رشاد', gender: 'male', specialization: 'الدراسات الاجتماعية', subjectKeys: ['SOCIAL'] },
  { num: 35, full_name: 'ا/ محمد سعيد دراسات', gender: 'male', specialization: 'الدراسات الاجتماعية', subjectKeys: ['SOCIAL'] },
  { num: 36, full_name: 'ا/ محمود طارق', gender: 'male', specialization: 'الدراسات الاجتماعية والجغرافيا', subjectKeys: ['SOCIAL', 'GEOGRAPHY'] },
  { num: 37, full_name: 'ا/ ايمن سليمان', gender: 'male', specialization: 'التاريخ', subjectKeys: ['HISTORY'] },

  // --- التكنولوجيا و ICT والبرمجة ---
  { num: 38, full_name: 'ميس/ هبة', gender: 'female', specialization: 'تكنولوجيا المعلومات', subjectKeys: ['IT_AR'] },
  { num: 39, full_name: 'ميس/ نهلة', gender: 'female', specialization: 'ICT (لغات)', subjectKeys: ['ICT_EN'] },
  { num: 40, full_name: 'ا/ محمد عاشور', gender: 'male', specialization: 'البرمجة وعلوم الحاسب', subjectKeys: ['PROGRAMMING'] },

  // --- الفلسفة ---
  { num: 41, full_name: 'ا/ محمد صلاح فلسفة', gender: 'male', specialization: 'الفلسفة والمنطق', subjectKeys: ['PHILOSOPHY'] },
  { num: 42, full_name: 'ا/ علي فؤاد', gender: 'male', specialization: 'الفلسفة والمنطق', subjectKeys: ['PHILOSOPHY'] },

  // --- مدرسون إضافيون (جدول البرايفت) ---
  { num: 43, full_name: 'ا/ محمد سعيد انجليزي', gender: 'male', specialization: 'اللغة الإنجليزية', subjectKeys: ['ENGLISH'] },
  { num: 44, full_name: 'ا/ محمد علام انجليزي', gender: 'male', specialization: 'اللغة الإنجليزية', subjectKeys: ['ENGLISH'] },
  { num: 45, full_name: 'ا/ الزنكلوني', gender: 'male', specialization: 'اللغة العربية', subjectKeys: ['ARABIC'] },
  { num: 46, full_name: 'ا/ اسلام موسى', gender: 'male', specialization: 'الدراسات الاجتماعية', subjectKeys: ['SOCIAL'] },
  { num: 47, full_name: 'ميس/ اميرة انجليزي', gender: 'female', specialization: 'اللغة الإنجليزية', subjectKeys: ['ENGLISH'] },
  { num: 48, full_name: 'ميس/ ياسمين ماث', gender: 'female', specialization: 'Math (الرياضيات لغات)', subjectKeys: ['MATH_EN'] },
  { num: 49, full_name: 'ا/ محمد سالم', gender: 'male', specialization: 'الفيزياء (Physics)', subjectKeys: ['PHYSICS'] },
];

// ============================================================================
// 3. GROUPS & TIMETABLES BY GRADE (ALL LINKED TO PACKAGES)
// ============================================================================
// packages: ['PUBLIC', 'LANGUAGES'] | ['PUBLIC'] | ['LANGUAGES']
const GROUPS_LIST = [
  {
    gradeOrder: 4,
    subjectKey: "ARABIC",
    teacherNum: 1,
    name: "اللغة العربية - ا/ مروان",
    packages: ["PUBLIC","LANGUAGES"],
    schedule: [{"day":"saturday","start_time":"16:00","end_time":"17:00"},{"day":"tuesday","start_time":"17:00","end_time":"18:00"}],
  },
  {
    gradeOrder: 4,
    subjectKey: "ARABIC",
    teacherNum: 2,
    name: "اللغة العربية - ميس/ دنيا",
    packages: ["PUBLIC","LANGUAGES"],
    schedule: [{"day":"saturday","start_time":"16:00","end_time":"17:00"},{"day":"tuesday","start_time":"17:00","end_time":"18:00"}],
  },
  {
    gradeOrder: 4,
    subjectKey: "ENGLISH",
    teacherNum: 9,
    name: "اللغة الانجليزية - ميس/ الاء علاء",
    packages: ["PUBLIC","LANGUAGES"],
    schedule: [{"day":"friday","start_time":"14:00","end_time":"15:00"},{"day":"saturday","start_time":"17:00","end_time":"19:00"}],
  },
  {
    gradeOrder: 4,
    subjectKey: "MATH_AR",
    teacherNum: 16,
    name: "الرياضيات - ا/ احمد محمود",
    packages: ["PUBLIC"],
    schedule: [{"day":"sunday","start_time":"16:00","end_time":"17:00"},{"day":"wednesday","start_time":"16:00","end_time":"17:00"}],
  },
  {
    gradeOrder: 4,
    subjectKey: "MATH_AR",
    teacherNum: 17,
    name: "الرياضيات - ا/ ادهم هاني",
    packages: ["PUBLIC"],
    schedule: [{"day":"sunday","start_time":"16:00","end_time":"17:00"},{"day":"wednesday","start_time":"16:00","end_time":"17:00"}],
  },
  {
    gradeOrder: 4,
    subjectKey: "MATH_EN",
    teacherNum: 21,
    name: "Math (لغات) - ميس/ اسماء",
    packages: ["LANGUAGES"],
    schedule: [{"day":"monday","start_time":"15:00","end_time":"16:30"}],
  },
  {
    gradeOrder: 4,
    subjectKey: "MATH_EN",
    teacherNum: 22,
    name: "Math (لغات) - ا/ احمد نبيل",
    packages: ["LANGUAGES"],
    schedule: [{"day":"wednesday","start_time":"17:00","end_time":"18:30"}],
  },
  {
    gradeOrder: 4,
    subjectKey: "SCIENCE_AR",
    teacherNum: 25,
    name: "العلوم - ا/ حازم",
    packages: ["PUBLIC"],
    schedule: [{"day":"sunday","start_time":"17:00","end_time":"18:00"},{"day":"wednesday","start_time":"17:00","end_time":"18:00"}],
  },
  {
    gradeOrder: 4,
    subjectKey: "SCIENCE_AR",
    teacherNum: 26,
    name: "العلوم - ا/ احمد عثمان",
    packages: ["PUBLIC"],
    schedule: [{"day":"monday","start_time":"18:00","end_time":"19:00"},{"day":"thursday","start_time":"17:00","end_time":"18:00"}],
  },
  {
    gradeOrder: 4,
    subjectKey: "SCIENCE_EN",
    teacherNum: 29,
    name: "Science (لغات) - ميس/ ايناس",
    packages: ["LANGUAGES"],
    price_per_month: 160,
    schedule: [{"day":"sunday","start_time":"17:00","end_time":"18:30"}],
  },
  {
    gradeOrder: 4,
    subjectKey: "SCIENCE_EN",
    teacherNum: 30,
    name: "Science (لغات) - ا/ ادهم امبابي",
    packages: ["LANGUAGES"],
    schedule: [{"day":"sunday","start_time":"15:00","end_time":"16:30"}],
  },
  {
    gradeOrder: 4,
    subjectKey: "SOCIAL",
    teacherNum: 33,
    name: "الدراسات الاجتماعية - ميس/ شيماء",
    packages: ["PUBLIC","LANGUAGES"],
    schedule: [{"day":"monday","start_time":"17:00","end_time":"18:00"},{"day":"thursday","start_time":"18:00","end_time":"19:00"}],
  },
  {
    gradeOrder: 4,
    subjectKey: "SOCIAL",
    teacherNum: 34,
    name: "الدراسات الاجتماعية - ا/ محمود رشاد",
    packages: ["PUBLIC","LANGUAGES"],
    schedule: [{"day":"monday","start_time":"17:00","end_time":"18:00"},{"day":"thursday","start_time":"18:00","end_time":"19:00"}],
  },
  {
    gradeOrder: 4,
    subjectKey: "IT_AR",
    teacherNum: 38,
    name: "تكنولوجيا المعلومات (عربي) - ميس/ هبة",
    packages: ["PUBLIC"],
    schedule: [{"day":"tuesday","start_time":"19:00","end_time":"20:00"}],
  },
  {
    gradeOrder: 4,
    subjectKey: "ICT_EN",
    teacherNum: 39,
    name: "ICT (لغات) - ميس/ نهلة",
    packages: ["LANGUAGES"],
    price_per_month: 160,
    schedule: [{"day":"tuesday","start_time":"16:00","end_time":"17:00"}],
  },
  {
    gradeOrder: 4,
    subjectKey: "RELIGION",
    teacherNum: 8,
    name: "التربية الدينية - ا/ صفية",
    packages: ["PUBLIC","LANGUAGES"],
    schedule: [{"day":"tuesday","start_time":"18:00","end_time":"19:00"}],
  },
  {
    gradeOrder: 5,
    subjectKey: "ARABIC",
    teacherNum: 1,
    name: "اللغة العربية - ا/ مروان",
    packages: ["PUBLIC","LANGUAGES"],
    price_per_month: 100,
    schedule: [{"day":"saturday","start_time":"17:00","end_time":"18:00"},{"day":"tuesday","start_time":"18:00","end_time":"19:00"}],
  },
  {
    gradeOrder: 5,
    subjectKey: "ARABIC",
    teacherNum: 2,
    name: "اللغة العربية - ميس/ دنيا",
    packages: ["PUBLIC","LANGUAGES"],
    schedule: [{"day":"saturday","start_time":"17:00","end_time":"18:00"},{"day":"tuesday","start_time":"18:00","end_time":"19:00"}],
  },
  {
    gradeOrder: 5,
    subjectKey: "ENGLISH",
    teacherNum: 9,
    name: "اللغة الانجليزية - ميس/ الاء علاء",
    packages: ["PUBLIC","LANGUAGES"],
    schedule: [{"day":"friday","start_time":"15:00","end_time":"16:00"},{"day":"saturday","start_time":"15:00","end_time":"17:00"}],
  },
  {
    gradeOrder: 5,
    subjectKey: "ENGLISH",
    teacherNum: 10,
    name: "اللغة الانجليزية - ا/ سالي",
    packages: ["PUBLIC","LANGUAGES"],
    schedule: [{"day":"monday","start_time":"18:00","end_time":"19:00"},{"day":"thursday","start_time":"18:30","end_time":"19:30"}],
  },
  {
    gradeOrder: 5,
    subjectKey: "MATH_AR",
    teacherNum: 16,
    name: "الرياضيات - ا/ احمد محمود",
    packages: ["PUBLIC"],
    schedule: [{"day":"sunday","start_time":"17:00","end_time":"18:00"},{"day":"wednesday","start_time":"17:00","end_time":"18:00"}],
  },
  {
    gradeOrder: 5,
    subjectKey: "MATH_AR",
    teacherNum: 17,
    name: "الرياضيات - ا/ ادهم هاني",
    packages: ["PUBLIC"],
    schedule: [{"day":"sunday","start_time":"17:00","end_time":"18:00"},{"day":"wednesday","start_time":"17:00","end_time":"18:00"}],
  },
  {
    gradeOrder: 5,
    subjectKey: "MATH_EN",
    teacherNum: 21,
    name: "Math (لغات) - ميس/ اسماء",
    packages: ["LANGUAGES"],
    price_per_month: 40,
    schedule: [{"day":"wednesday","start_time":"17:00","end_time":"18:30"}],
  },
  {
    gradeOrder: 5,
    subjectKey: "MATH_EN",
    teacherNum: 22,
    name: "Math (لغات) - ا/ احمد نبيل",
    packages: ["LANGUAGES"],
    schedule: [{"day":"wednesday","start_time":"19:00","end_time":"20:30"}],
  },
  {
    gradeOrder: 5,
    subjectKey: "SCIENCE_AR",
    teacherNum: 25,
    name: "العلوم - ا/ حازم",
    packages: ["PUBLIC"],
    price_per_month: 150,
    schedule: [{"day":"sunday","start_time":"18:00","end_time":"19:00"},{"day":"wednesday","start_time":"18:00","end_time":"19:00"}],
  },
  {
    gradeOrder: 5,
    subjectKey: "SCIENCE_AR",
    teacherNum: 26,
    name: "العلوم - ا/ احمد عثمان",
    packages: ["PUBLIC"],
    schedule: [{"day":"monday","start_time":"20:00","end_time":"21:00"},{"day":"thursday","start_time":"20:00","end_time":"21:00"}],
  },
  {
    gradeOrder: 5,
    subjectKey: "SCIENCE_EN",
    teacherNum: 29,
    name: "Science (لغات) - ميس/ ايناس",
    packages: ["LANGUAGES"],
    price_per_month: 160,
    schedule: [{"day":"sunday","start_time":"19:00","end_time":"20:30"}],
  },
  {
    gradeOrder: 5,
    subjectKey: "SCIENCE_EN",
    teacherNum: 30,
    name: "Science (لغات) - ا/ ادهم امبابي",
    packages: ["LANGUAGES"],
    schedule: [{"day":"sunday","start_time":"17:00","end_time":"18:30"}],
  },
  {
    gradeOrder: 5,
    subjectKey: "SOCIAL",
    teacherNum: 33,
    name: "الدراسات الاجتماعية - ميس/ شيماء",
    packages: ["PUBLIC","LANGUAGES"],
    schedule: [{"day":"monday","start_time":"19:00","end_time":"20:00"},{"day":"thursday","start_time":"17:00","end_time":"18:00"}],
  },
  {
    gradeOrder: 5,
    subjectKey: "SOCIAL",
    teacherNum: 34,
    name: "الدراسات الاجتماعية - ا/ محمود رشاد",
    packages: ["PUBLIC","LANGUAGES"],
    schedule: [{"day":"monday","start_time":"19:00","end_time":"20:00"},{"day":"thursday","start_time":"17:00","end_time":"18:00"}],
  },
  {
    gradeOrder: 5,
    subjectKey: "IT_AR",
    teacherNum: 38,
    name: "تكنولوجيا المعلومات (عربي) - ميس/ هبة",
    packages: ["PUBLIC"],
    schedule: [{"day":"tuesday","start_time":"17:00","end_time":"18:00"}],
  },
  {
    gradeOrder: 5,
    subjectKey: "ICT_EN",
    teacherNum: 39,
    name: "ICT (لغات) - ميس/ نهلة",
    packages: ["LANGUAGES"],
    price_per_month: 160,
    schedule: [{"day":"tuesday","start_time":"17:00","end_time":"18:00"}],
  },
  {
    gradeOrder: 5,
    subjectKey: "RELIGION",
    teacherNum: 8,
    name: "التربية الدينية - ا/ صفية",
    packages: ["PUBLIC","LANGUAGES"],
    schedule: [{"day":"tuesday","start_time":"19:00","end_time":"20:00"}],
  },
  {
    gradeOrder: 6,
    subjectKey: "ARABIC",
    teacherNum: 1,
    name: "اللغة العربية - ا/ مروان",
    packages: ["PUBLIC","LANGUAGES"],
    schedule: [{"day":"saturday","start_time":"18:00","end_time":"19:00"},{"day":"tuesday","start_time":"19:00","end_time":"20:00"}],
  },
  {
    gradeOrder: 6,
    subjectKey: "ARABIC",
    teacherNum: 2,
    name: "اللغة العربية - ميس/ دنيا",
    packages: ["PUBLIC","LANGUAGES"],
    schedule: [{"day":"saturday","start_time":"18:00","end_time":"19:00"},{"day":"tuesday","start_time":"19:00","end_time":"20:00"}],
  },
  {
    gradeOrder: 6,
    subjectKey: "ENGLISH",
    teacherNum: 9,
    name: "اللغة الانجليزية - ميس/ الاء علاء",
    packages: ["PUBLIC","LANGUAGES"],
    schedule: [{"day":"friday","start_time":"16:00","end_time":"17:00"},{"day":"saturday","start_time":"19:00","end_time":"21:00"}],
  },
  {
    gradeOrder: 6,
    subjectKey: "ENGLISH",
    teacherNum: 10,
    name: "اللغة الانجليزية - ا/ سالي",
    packages: ["PUBLIC","LANGUAGES"],
    schedule: [{"day":"monday","start_time":"19:00","end_time":"20:00"},{"day":"thursday","start_time":"20:00","end_time":"21:00"}],
  },
  {
    gradeOrder: 6,
    subjectKey: "MATH_AR",
    teacherNum: 16,
    name: "الرياضيات - ا/ احمد محمود",
    packages: ["PUBLIC"],
    schedule: [{"day":"sunday","start_time":"18:00","end_time":"19:00"},{"day":"wednesday","start_time":"18:00","end_time":"19:00"}],
  },
  {
    gradeOrder: 6,
    subjectKey: "MATH_AR",
    teacherNum: 17,
    name: "الرياضيات - ا/ ادهم هاني",
    packages: ["PUBLIC"],
    schedule: [{"day":"sunday","start_time":"18:00","end_time":"19:00"},{"day":"wednesday","start_time":"18:00","end_time":"19:00"}],
  },
  {
    gradeOrder: 6,
    subjectKey: "MATH_EN",
    teacherNum: 21,
    name: "Math (لغات) - ميس/ اسماء",
    packages: ["LANGUAGES"],
    price_per_month: 40,
    schedule: [{"day":"wednesday","start_time":"15:00","end_time":"16:30"}],
  },
  {
    gradeOrder: 6,
    subjectKey: "MATH_EN",
    teacherNum: 22,
    name: "Math (لغات) - ا/ احمد نبيل",
    packages: ["LANGUAGES"],
    schedule: [{"day":"sunday","start_time":"19:00","end_time":"20:30"}],
  },
  {
    gradeOrder: 6,
    subjectKey: "SCIENCE_AR",
    teacherNum: 25,
    name: "العلوم - ا/ حازم",
    packages: ["PUBLIC"],
    price_per_month: 150,
    schedule: [{"day":"sunday","start_time":"19:00","end_time":"20:00"},{"day":"wednesday","start_time":"19:00","end_time":"20:00"}],
  },
  {
    gradeOrder: 6,
    subjectKey: "SCIENCE_AR",
    teacherNum: 26,
    name: "العلوم - ا/ احمد عثمان",
    packages: ["PUBLIC"],
    schedule: [{"day":"monday","start_time":"17:00","end_time":"18:00"},{"day":"thursday","start_time":"18:00","end_time":"19:00"}],
  },
  {
    gradeOrder: 6,
    subjectKey: "SCIENCE_EN",
    teacherNum: 29,
    name: "Science (لغات) - ميس/ ايناس",
    packages: ["LANGUAGES"],
    price_per_month: 160,
    schedule: [{"day":"thursday","start_time":"17:00","end_time":"18:30"}],
  },
  {
    gradeOrder: 6,
    subjectKey: "SOCIAL",
    teacherNum: 33,
    name: "الدراسات الاجتماعية - ميس/ شيماء",
    packages: ["PUBLIC","LANGUAGES"],
    schedule: [{"day":"monday","start_time":"18:00","end_time":"19:00"},{"day":"thursday","start_time":"19:00","end_time":"20:00"}],
  },
  {
    gradeOrder: 6,
    subjectKey: "SOCIAL",
    teacherNum: 34,
    name: "الدراسات الاجتماعية - ا/ محمود رشاد",
    packages: ["PUBLIC","LANGUAGES"],
    schedule: [{"day":"monday","start_time":"18:00","end_time":"19:00"},{"day":"thursday","start_time":"19:00","end_time":"20:00"}],
  },
  {
    gradeOrder: 6,
    subjectKey: "IT_AR",
    teacherNum: 38,
    name: "تكنولوجيا المعلومات (عربي) - ميس/ هبة",
    packages: ["PUBLIC"],
    schedule: [{"day":"tuesday","start_time":"20:00","end_time":"21:00"}],
  },
  {
    gradeOrder: 6,
    subjectKey: "ICT_EN",
    teacherNum: 39,
    name: "ICT (لغات) - ميس/ نهلة",
    packages: ["LANGUAGES"],
    price_per_month: 160,
    schedule: [{"day":"tuesday","start_time":"20:00","end_time":"21:00"}],
  },
  {
    gradeOrder: 6,
    subjectKey: "RELIGION",
    teacherNum: 8,
    name: "التربية الدينية (عام) - ا/ صفية",
    packages: ["PUBLIC","LANGUAGES"],
    schedule: [{"day":"wednesday","start_time":"17:00","end_time":"18:00"}],
  },
  {
    gradeOrder: 7,
    subjectKey: "ARABIC",
    teacherNum: 3,
    name: "اللغة العربية (عام) - ا/ محمد صلاح عربي",
    packages: ["PUBLIC","LANGUAGES"],
    schedule: [{"day":"sunday","start_time":"18:30","end_time":"19:30"},{"day":"wednesday","start_time":"18:30","end_time":"19:30"}],
  },
  {
    gradeOrder: 7,
    subjectKey: "ARABIC",
    teacherNum: 4,
    name: "اللغة العربية (أزهر) - ميس/ ياسمين حسن",
    packages: ["PUBLIC"],
    schedule: [{"day":"thursday","start_time":"16:00","end_time":"17:30"}],
  },
  {
    gradeOrder: 7,
    subjectKey: "SHARIA",
    teacherNum: 6,
    name: "الشرعي (أزهر) - ا/ الاء محمد",
    packages: ["PUBLIC"],
    schedule: [{"day":"friday","start_time":"09:00","end_time":"10:00"}],
  },
  {
    gradeOrder: 7,
    subjectKey: "ENGLISH",
    teacherNum: 11,
    name: "اللغة الانجليزية (عام) - ا/ محمد علاء",
    packages: ["PUBLIC"],
    price_per_month: 210,
    schedule: [{"day":"saturday","start_time":"18:00","end_time":"19:00"},{"day":"tuesday","start_time":"18:00","end_time":"19:00"}],
  },
  {
    gradeOrder: 7,
    subjectKey: "ENGLISH",
    teacherNum: 11,
    name: "اللغة الانجليزية (لغات) - ا/ محمد علاء",
    packages: ["LANGUAGES"],
    schedule: [{"day":"friday","start_time":"10:00","end_time":"11:00"},{"day":"saturday","start_time":"18:00","end_time":"19:00"},{"day":"tuesday","start_time":"18:00","end_time":"19:00"}],
  },
  {
    gradeOrder: 7,
    subjectKey: "ENGLISH",
    teacherNum: 12,
    name: "اللغة الانجليزية - ا/ صبحي محمد",
    packages: ["PUBLIC","LANGUAGES"],
    schedule: [{"day":"saturday","start_time":"18:00","end_time":"19:00"},{"day":"tuesday","start_time":"18:00","end_time":"19:00"}],
  },
  {
    gradeOrder: 7,
    subjectKey: "FRENCH",
    teacherNum: 15,
    name: "اللغة الفرنسية - مسيو/ خالد النصيري",
    packages: ["PUBLIC","LANGUAGES"],
    schedule: [{"day":"tuesday","start_time":"20:00","end_time":"21:00"}],
  },
  {
    gradeOrder: 7,
    subjectKey: "MATH_AR",
    teacherNum: 18,
    name: "الرياضيات - ا/ محمد بكير",
    packages: ["PUBLIC"],
    schedule: [{"day":"monday","start_time":"19:00","end_time":"20:00"},{"day":"thursday","start_time":"19:00","end_time":"20:00"}],
  },
  {
    gradeOrder: 7,
    subjectKey: "MATH_AR",
    teacherNum: 19,
    name: "الرياضيات - ا/ محمد عادل",
    packages: ["PUBLIC"],
    schedule: [{"day":"monday","start_time":"19:00","end_time":"20:00"},{"day":"thursday","start_time":"19:00","end_time":"20:00"}],
  },
  {
    gradeOrder: 7,
    subjectKey: "MATH_EN",
    teacherNum: 21,
    name: "Math (لغات) - ميس/ اسماء",
    packages: ["LANGUAGES"],
    price_per_month: 40,
    schedule: [{"day":"monday","start_time":"17:00","end_time":"18:30"}],
  },
  {
    gradeOrder: 7,
    subjectKey: "MATH_EN",
    teacherNum: 22,
    name: "Math (لغات) - ا/ احمد نبيل",
    packages: ["LANGUAGES"],
    schedule: [{"day":"wednesday","start_time":"16:00","end_time":"17:30"}],
  },
  {
    gradeOrder: 7,
    subjectKey: "SCIENCE_AR",
    teacherNum: 27,
    name: "العلوم - ميس/ اية ادم",
    packages: ["PUBLIC"],
    schedule: [{"day":"saturday","start_time":"19:00","end_time":"20:00"},{"day":"tuesday","start_time":"19:00","end_time":"20:00"}],
  },
  {
    gradeOrder: 7,
    subjectKey: "SCIENCE_AR",
    teacherNum: 26,
    name: "العلوم - ا/ احمد عثمان",
    packages: ["PUBLIC"],
    schedule: [{"day":"saturday","start_time":"19:00","end_time":"20:00"},{"day":"tuesday","start_time":"19:00","end_time":"20:00"}],
  },
  {
    gradeOrder: 7,
    subjectKey: "SCIENCE_AR",
    teacherNum: 28,
    name: "العلوم - ا/ احمد عبد الله",
    packages: ["PUBLIC"],
    schedule: [{"day":"saturday","start_time":"19:00","end_time":"20:00"},{"day":"tuesday","start_time":"19:00","end_time":"20:00"}],
  },
  {
    gradeOrder: 7,
    subjectKey: "SCIENCE_EN",
    teacherNum: 31,
    name: "Science (لغات) - ا/ اسلام عبد الجليل",
    packages: ["LANGUAGES"],
    price_per_month: 10,
    schedule: [{"day":"saturday","start_time":"19:00","end_time":"20:30"}],
  },
  {
    gradeOrder: 7,
    subjectKey: "SCIENCE_EN",
    teacherNum: 32,
    name: "Science (لغات) - ا/ محمد العربي",
    packages: ["LANGUAGES"],
    price_per_month: 210,
    schedule: [{"day":"saturday","start_time":"15:00","end_time":"16:30"}],
  },
  {
    gradeOrder: 7,
    subjectKey: "SOCIAL",
    teacherNum: 35,
    name: "الدراسات الاجتماعية - ا/ محمد سعيد دراسات",
    packages: ["PUBLIC","LANGUAGES"],
    schedule: [{"day":"sunday","start_time":"17:30","end_time":"18:30"},{"day":"wednesday","start_time":"17:30","end_time":"18:30"}],
  },
  {
    gradeOrder: 7,
    subjectKey: "SOCIAL",
    teacherNum: 36,
    name: "الدراسات الاجتماعية - ا/ محمود طارق",
    packages: ["PUBLIC","LANGUAGES"],
    schedule: [{"day":"sunday","start_time":"19:30","end_time":"20:30"},{"day":"wednesday","start_time":"19:30","end_time":"20:30"}],
  },
  {
    gradeOrder: 7,
    subjectKey: "ICT_EN",
    teacherNum: 39,
    name: "ICT - ميس/ نهلة",
    packages: ["PUBLIC","LANGUAGES"],
    price_per_month: 160,
    schedule: [{"day":"tuesday","start_time":"19:00","end_time":"20:00"}],
  },
  {
    gradeOrder: 8,
    subjectKey: "ARABIC",
    teacherNum: 3,
    name: "اللغة العربية (عام) - ا/ محمد صلاح عربي",
    packages: ["PUBLIC","LANGUAGES"],
    schedule: [{"day":"sunday","start_time":"17:30","end_time":"18:30"},{"day":"wednesday","start_time":"17:30","end_time":"18:30"}],
  },
  {
    gradeOrder: 8,
    subjectKey: "ARABIC",
    teacherNum: 4,
    name: "اللغة العربية (أزهر) - ميس/ ياسمين حسن",
    packages: ["PUBLIC"],
    schedule: [{"day":"monday","start_time":"18:00","end_time":"19:00"},{"day":"thursday","start_time":"18:00","end_time":"19:00"}],
  },
  {
    gradeOrder: 8,
    subjectKey: "SHARIA",
    teacherNum: 6,
    name: "الشرعي (أزهر) - ا/ الاء محمد",
    packages: ["PUBLIC"],
    schedule: [{"day":"friday","start_time":"10:00","end_time":"11:00"}],
  },
  {
    gradeOrder: 8,
    subjectKey: "ENGLISH",
    teacherNum: 11,
    name: "اللغة الانجليزية (عام) - ا/ محمد علاء",
    packages: ["PUBLIC"],
    price_per_month: 210,
    schedule: [{"day":"saturday","start_time":"17:00","end_time":"18:00"},{"day":"tuesday","start_time":"17:00","end_time":"18:00"}],
  },
  {
    gradeOrder: 8,
    subjectKey: "ENGLISH",
    teacherNum: 11,
    name: "اللغة الانجليزية (لغات) - ا/ محمد علاء",
    packages: ["LANGUAGES"],
    schedule: [{"day":"friday","start_time":"11:00","end_time":"12:00"},{"day":"saturday","start_time":"17:00","end_time":"18:00"},{"day":"tuesday","start_time":"17:00","end_time":"18:00"}],
  },
  {
    gradeOrder: 8,
    subjectKey: "ENGLISH",
    teacherNum: 12,
    name: "اللغة الانجليزية - ا/ صبحي محمد",
    packages: ["PUBLIC","LANGUAGES"],
    schedule: [{"day":"saturday","start_time":"17:00","end_time":"18:00"},{"day":"tuesday","start_time":"17:00","end_time":"18:00"}],
  },
  {
    gradeOrder: 8,
    subjectKey: "FRENCH",
    teacherNum: 15,
    name: "اللغة الفرنسية - مسيو/ خالد النصيري",
    packages: ["PUBLIC","LANGUAGES"],
    schedule: [{"day":"tuesday","start_time":"19:00","end_time":"20:00"}],
  },
  {
    gradeOrder: 8,
    subjectKey: "MATH_AR",
    teacherNum: 19,
    name: "الرياضيات - ا/ محمد عادل",
    packages: ["PUBLIC"],
    schedule: [{"day":"monday","start_time":"20:00","end_time":"21:00"},{"day":"thursday","start_time":"20:00","end_time":"21:00"}],
  },
  {
    gradeOrder: 8,
    subjectKey: "MATH_AR",
    teacherNum: 18,
    name: "الرياضيات - ا/ محمد بكير",
    packages: ["PUBLIC"],
    schedule: [{"day":"monday","start_time":"20:00","end_time":"21:00"},{"day":"thursday","start_time":"20:00","end_time":"21:00"}],
  },
  {
    gradeOrder: 8,
    subjectKey: "MATH_EN",
    teacherNum: 23,
    name: "Math (لغات) - ا/ محمود الرفاعي",
    packages: ["LANGUAGES"],
    price_per_month: 260,
    schedule: [{"day":"wednesday","start_time":"19:00","end_time":"20:30"}],
  },
  {
    gradeOrder: 8,
    subjectKey: "SCIENCE_AR",
    teacherNum: 27,
    name: "العلوم - ميس/ اية ادم",
    packages: ["PUBLIC"],
    schedule: [{"day":"saturday","start_time":"18:00","end_time":"19:00"},{"day":"tuesday","start_time":"18:00","end_time":"19:00"}],
  },
  {
    gradeOrder: 8,
    subjectKey: "SCIENCE_AR",
    teacherNum: 28,
    name: "العلوم - ا/ احمد عبد الله",
    packages: ["PUBLIC"],
    schedule: [{"day":"saturday","start_time":"18:00","end_time":"19:00"},{"day":"tuesday","start_time":"18:00","end_time":"19:00"}],
  },
  {
    gradeOrder: 8,
    subjectKey: "SCIENCE_AR",
    teacherNum: 26,
    name: "العلوم - ا/ احمد عثمان",
    packages: ["PUBLIC"],
    schedule: [{"day":"monday","start_time":"19:00","end_time":"20:00"},{"day":"thursday","start_time":"19:00","end_time":"20:00"}],
  },
  {
    gradeOrder: 8,
    subjectKey: "SCIENCE_EN",
    teacherNum: 31,
    name: "Science (لغات) - ا/ اسلام عبد الجليل",
    packages: ["LANGUAGES"],
    price_per_month: 10,
    schedule: [{"day":"saturday","start_time":"15:00","end_time":"16:30"}],
  },
  {
    gradeOrder: 8,
    subjectKey: "SOCIAL",
    teacherNum: 35,
    name: "الدراسات الاجتماعية - ا/ محمد سعيد دراسات",
    packages: ["PUBLIC","LANGUAGES"],
    schedule: [{"day":"sunday","start_time":"16:30","end_time":"17:30"},{"day":"wednesday","start_time":"16:30","end_time":"17:30"}],
  },
  {
    gradeOrder: 8,
    subjectKey: "SOCIAL",
    teacherNum: 36,
    name: "الدراسات الاجتماعية - ا/ محمود طارق",
    packages: ["PUBLIC","LANGUAGES"],
    schedule: [{"day":"sunday","start_time":"18:30","end_time":"19:30"},{"day":"wednesday","start_time":"18:30","end_time":"19:30"}],
  },
  {
    gradeOrder: 8,
    subjectKey: "ICT_EN",
    teacherNum: 39,
    name: "ICT - ميس/ نهلة",
    packages: ["PUBLIC","LANGUAGES"],
    price_per_month: 160,
    schedule: [{"day":"tuesday","start_time":"18:00","end_time":"19:00"}],
  },
  {
    gradeOrder: 9,
    subjectKey: "ARABIC",
    teacherNum: 3,
    name: "اللغة العربية (عام) - ا/ محمد صلاح عربي",
    packages: ["PUBLIC","LANGUAGES"],
    schedule: [{"day":"sunday","start_time":"16:30","end_time":"17:30"},{"day":"wednesday","start_time":"16:30","end_time":"17:30"}],
  },
  {
    gradeOrder: 9,
    subjectKey: "ARABIC",
    teacherNum: 3,
    name: "اللغة العربية (أزهر) - ا/ محمد صلاح عربي",
    packages: ["PUBLIC"],
    schedule: [{"day":"wednesday","start_time":"14:30","end_time":"16:00"}],
  },
  {
    gradeOrder: 9,
    subjectKey: "SHARIA",
    teacherNum: 7,
    name: "الشرعي (أزهر) - ا/ اسلام جمال",
    packages: ["PUBLIC"],
    schedule: [{"day":"thursday","start_time":"16:00","end_time":"17:30"}],
  },
  {
    gradeOrder: 9,
    subjectKey: "ENGLISH",
    teacherNum: 11,
    name: "اللغة الانجليزية (عام) - ا/ محمد علاء",
    packages: ["PUBLIC"],
    schedule: [{"day":"saturday","start_time":"16:00","end_time":"17:00"},{"day":"tuesday","start_time":"16:00","end_time":"17:00"}],
  },
  {
    gradeOrder: 9,
    subjectKey: "ENGLISH",
    teacherNum: 11,
    name: "اللغة الانجليزية (لغات) - ا/ محمد علاء",
    packages: ["LANGUAGES"],
    schedule: [{"day":"friday","start_time":"12:00","end_time":"13:00"},{"day":"saturday","start_time":"16:00","end_time":"17:00"},{"day":"tuesday","start_time":"16:00","end_time":"17:00"}],
  },
  {
    gradeOrder: 9,
    subjectKey: "ENGLISH",
    teacherNum: 12,
    name: "اللغة الانجليزية - ا/ صبحي محمد",
    packages: ["PUBLIC","LANGUAGES"],
    schedule: [{"day":"saturday","start_time":"16:00","end_time":"17:00"},{"day":"tuesday","start_time":"16:00","end_time":"17:00"}],
  },
  {
    gradeOrder: 9,
    subjectKey: "FRENCH",
    teacherNum: 15,
    name: "اللغة الفرنسية - مسيو/ خالد النصيري",
    packages: ["PUBLIC","LANGUAGES"],
    schedule: [{"day":"saturday","start_time":"15:00","end_time":"16:00"}],
  },
  {
    gradeOrder: 9,
    subjectKey: "MATH_AR",
    teacherNum: 19,
    name: "الرياضيات - ا/ محمد عادل",
    packages: ["PUBLIC"],
    schedule: [{"day":"monday","start_time":"18:00","end_time":"19:00"},{"day":"thursday","start_time":"18:00","end_time":"19:00"}],
  },
  {
    gradeOrder: 9,
    subjectKey: "MATH_AR",
    teacherNum: 18,
    name: "الرياضيات - ا/ محمد بكير",
    packages: ["PUBLIC"],
    schedule: [{"day":"monday","start_time":"18:00","end_time":"19:00"},{"day":"thursday","start_time":"18:00","end_time":"19:00"}],
  },
  {
    gradeOrder: 9,
    subjectKey: "MATH_EN",
    teacherNum: 23,
    name: "Math (لغات) - ا/ محمود الرفاعي",
    packages: ["LANGUAGES"],
    schedule: [{"day":"wednesday","start_time":"13:30","end_time":"15:00"}],
  },
  {
    gradeOrder: 9,
    subjectKey: "SCIENCE_AR",
    teacherNum: 27,
    name: "العلوم - ميس/ اية ادم",
    packages: ["PUBLIC"],
    schedule: [{"day":"saturday","start_time":"17:00","end_time":"18:00"},{"day":"tuesday","start_time":"17:00","end_time":"18:00"}],
  },
  {
    gradeOrder: 9,
    subjectKey: "SCIENCE_AR",
    teacherNum: 28,
    name: "العلوم - ا/ احمد عبد الله",
    packages: ["PUBLIC"],
    schedule: [{"day":"saturday","start_time":"17:00","end_time":"18:00"},{"day":"tuesday","start_time":"17:00","end_time":"18:00"}],
  },
  {
    gradeOrder: 9,
    subjectKey: "SCIENCE_EN",
    teacherNum: 31,
    name: "Science (لغات) - ا/ اسلام عبد الجليل",
    packages: ["LANGUAGES"],
    schedule: [{"day":"saturday","start_time":"17:00","end_time":"18:30"}],
  },
  {
    gradeOrder: 9,
    subjectKey: "SCIENCE_EN",
    teacherNum: 32,
    name: "Science (لغات) - ا/ محمد العربي",
    packages: ["LANGUAGES"],
    schedule: [{"day":"thursday","start_time":"15:00","end_time":"17:00"}],
  },
  {
    gradeOrder: 9,
    subjectKey: "SOCIAL",
    teacherNum: 35,
    name: "الدراسات الاجتماعية (عام) - ا/ محمد سعيد دراسات",
    packages: ["PUBLIC","LANGUAGES"],
    schedule: [{"day":"sunday","start_time":"15:30","end_time":"16:30"},{"day":"wednesday","start_time":"15:30","end_time":"16:30"}],
  },
  {
    gradeOrder: 9,
    subjectKey: "SOCIAL",
    teacherNum: 36,
    name: "الدراسات الاجتماعية (عام) - ا/ محمود طارق",
    packages: ["PUBLIC","LANGUAGES"],
    schedule: [{"day":"sunday","start_time":"17:30","end_time":"18:30"},{"day":"wednesday","start_time":"17:30","end_time":"18:30"}],
  },
  {
    gradeOrder: 9,
    subjectKey: "ICT_EN",
    teacherNum: 39,
    name: "ICT - ميس/ نهلة",
    packages: ["PUBLIC","LANGUAGES"],
    schedule: [{"day":"tuesday","start_time":"15:00","end_time":"16:00"}],
  },
  {
    gradeOrder: 10,
    subjectKey: "ARABIC",
    teacherNum: 5,
    name: "اللغة العربية - ا/ الغزالي",
    packages: ["PUBLIC","LANGUAGES"],
    price_per_month: 160,
    schedule: [{"day":"tuesday","start_time":"17:00","end_time":"19:00"}],
  },
  {
    gradeOrder: 10,
    subjectKey: "ENGLISH",
    teacherNum: 13,
    name: "اللغة الانجليزية - ا/ الشاذلي",
    packages: ["PUBLIC","LANGUAGES"],
    price_per_month: 210,
    schedule: [{"day":"sunday","start_time":"17:00","end_time":"19:00"}],
  },
  {
    gradeOrder: 10,
    subjectKey: "ENGLISH",
    teacherNum: 14,
    name: "اللغة الانجليزية - ا/ ادهم ابو الصفا",
    packages: ["PUBLIC","LANGUAGES"],
    price_per_month: 260,
    schedule: [{"day":"tuesday","start_time":"19:00","end_time":"21:00"}],
  },
  {
    gradeOrder: 10,
    subjectKey: "ENGLISH",
    teacherNum: 12,
    name: "اللغة الانجليزية - ا/ صبحي محمد",
    packages: ["PUBLIC","LANGUAGES"],
    price_per_month: 210,
    schedule: [{"day":"tuesday","start_time":"19:00","end_time":"21:00"}],
  },
  {
    gradeOrder: 10,
    subjectKey: "FRENCH",
    teacherNum: 15,
    name: "اللغة الفرنسية - مسيو/ خالد النصيري",
    packages: ["PUBLIC","LANGUAGES"],
    price_per_month: 210,
    schedule: [{"day":"monday","start_time":"19:00","end_time":"21:00"}],
  },
  {
    gradeOrder: 10,
    subjectKey: "MATH_AR",
    teacherNum: 20,
    name: "الرياضيات - ا/ محمد يوسف",
    packages: ["PUBLIC"],
    schedule: [{"day":"wednesday","start_time":"19:00","end_time":"21:00"}],
  },
  {
    gradeOrder: 10,
    subjectKey: "MATH_EN",
    teacherNum: 24,
    name: "Math (لغات) - ا/ عمر جمال",
    packages: ["LANGUAGES"],
    schedule: [{"day":"thursday","start_time":"17:00","end_time":"19:00"}],
  },
  {
    gradeOrder: 10,
    subjectKey: "INTEGRATED_SCI_AR",
    teacherNum: 27,
    name: "العلوم المتكاملة (عربي) - ميس/ اية ادم",
    packages: ["PUBLIC"],
    price_per_month: 240,
    schedule: [{"day":"wednesday","start_time":"17:00","end_time":"19:00"}],
  },
  {
    gradeOrder: 10,
    subjectKey: "INTEGRATED_SCI_EN",
    teacherNum: 32,
    name: "Integrated Science (لغات) - ا/ محمد العربي",
    packages: ["LANGUAGES"],
    price_per_month: 310,
    schedule: [{"day":"wednesday","start_time":"17:00","end_time":"19:00"}],
  },
  {
    gradeOrder: 10,
    subjectKey: "PROGRAMMING",
    teacherNum: 40,
    name: "البرمجة (لغات) - ا/ محمد عاشور",
    packages: ["LANGUAGES"],
    price_per_month: 210,
    schedule: [{"day":"monday","start_time":"17:00","end_time":"19:00"}],
  },
  {
    gradeOrder: 10,
    subjectKey: "PROGRAMMING",
    teacherNum: 40,
    name: "البرمجة (عربي) - ا/ محمد عاشور",
    packages: ["PUBLIC"],
    schedule: [{"day":"thursday","start_time":"17:00","end_time":"19:00"}],
  },
  {
    gradeOrder: 10,
    subjectKey: "PHILOSOPHY",
    teacherNum: 41,
    name: "الفلسفة والمنطق - ا/ محمد صلاح فلسفة",
    packages: ["PUBLIC","LANGUAGES"],
    price_per_month: 210,
    schedule: [{"day":"saturday","start_time":"19:00","end_time":"21:00"}],
  },
  {
    gradeOrder: 10,
    subjectKey: "PHILOSOPHY",
    teacherNum: 42,
    name: "الفلسفة والمنطق - ا/ علي فؤاد",
    packages: ["PUBLIC","LANGUAGES"],
    schedule: [{"day":"saturday","start_time":"19:00","end_time":"21:00"}],
  },
  {
    gradeOrder: 10,
    subjectKey: "HISTORY",
    teacherNum: 37,
    name: "التاريخ - ا/ ايمن سليمان",
    packages: ["PUBLIC","LANGUAGES"],
    price_per_month: 250,
    schedule: [{"day":"thursday","start_time":"19:00","end_time":"21:00"}],
  },
];

// ============================================================================
// 4. PRIVATE GROUPS & TIMETABLES (is_private = true, NOT in package_groups)
// ============================================================================
const PRIVATE_GROUPS_LIST = [
  {
    gradeOrder: 8,
    subjectKey: "ENGLISH",
    teacherNum: 12,
    name: "اللغة الانجليزية (برايفت - الجمعة) - ا/ صبحي محمد",
    price_per_month: 210,
    price_per_session: 0,
    schedule: [{"day":"friday","start_time":"12:00","end_time":"13:30"}],
  },
  {
    gradeOrder: 11,
    subjectKey: "ENGLISH",
    teacherNum: 11,
    name: "اللغة الانجليزية (2 ث بكالوريا - برايفت - السبت 8:00) - ا/ محمد علاء",
    price_per_month: 310,
    price_per_session: 0,
    schedule: [{"day":"saturday","start_time":"08:00","end_time":"10:00"}],
  },
  {
    gradeOrder: 11,
    subjectKey: "ENGLISH",
    teacherNum: 11,
    name: "اللغة الانجليزية (2 ث عام - برايفت - السبت 12:00 ظ) - ا/ محمد علاء",
    price_per_month: 260,
    price_per_session: 0,
    schedule: [{"day":"saturday","start_time":"12:00","end_time":"14:00"}],
  },
  {
    gradeOrder: 10,
    subjectKey: "ENGLISH",
    teacherNum: 11,
    name: "اللغة الانجليزية (برايفت - السبت 2:00 ظ) - ا/ محمد علاء",
    price_per_month: 240,
    price_per_session: 0,
    schedule: [{"day":"saturday","start_time":"14:00","end_time":"16:00"}],
  },
  {
    gradeOrder: 11,
    subjectKey: "ENGLISH",
    teacherNum: 43,
    name: "اللغة الانجليزية (برايفت - السبت 8:00) - ا/ محمد سعيد انجليزي",
    price_per_month: 310,
    price_per_session: 0,
    schedule: [{"day":"saturday","start_time":"08:00","end_time":"10:00"}],
  },
  {
    gradeOrder: 12,
    subjectKey: "ENGLISH",
    teacherNum: 43,
    name: "اللغة الانجليزية (برايفت - السبت 1:00 ظ) - ا/ محمد سعيد انجليزي",
    price_per_month: 310,
    price_per_session: 0,
    schedule: [{"day":"saturday","start_time":"13:00","end_time":"15:00"}],
  },
  {
    gradeOrder: 12,
    subjectKey: "BIOLOGY",
    teacherNum: 32,
    name: "أحياء (Bio - 3 ث - برايفت - السبت 10:00 ص) - ا/ محمد العربي",
    price_per_month: 550,
    price_per_session: 0,
    schedule: [{"day":"saturday","start_time":"10:00","end_time":"12:00"}],
  },
  {
    gradeOrder: 8,
    subjectKey: "ARABIC",
    teacherNum: 45,
    name: "اللغة العربية (برايفت) - ا/ الزنكلوني",
    price_per_month: 160,
    price_per_session: 0,
    schedule: [{"day":"saturday","start_time":"13:30","end_time":"15:00"}],
  },
  {
    gradeOrder: 9,
    subjectKey: "ARABIC",
    teacherNum: 45,
    name: "اللغة العربية (برايفت) - ا/ الزنكلوني",
    price_per_month: 170,
    price_per_session: 0,
    schedule: [{"day":"saturday","start_time":"12:00","end_time":"13:30"}],
  },
  {
    gradeOrder: 10,
    subjectKey: "ARABIC",
    teacherNum: 3,
    name: "اللغة العربية (برايفت) - ا/ محمد صلاح عربي",
    price_per_month: 190,
    price_per_session: 0,
    schedule: [{"day":"saturday","start_time":"10:00","end_time":"12:00"}],
  },
  {
    gradeOrder: 12,
    subjectKey: "ENGLISH",
    teacherNum: 44,
    name: "اللغة الانجليزية (برايفت - السبت 1:00 ظ) - ا/ محمد علام انجليزي",
    price_per_month: 310,
    price_per_session: 0,
    schedule: [{"day":"saturday","start_time":"13:00","end_time":"15:00"}],
  },
  {
    gradeOrder: 12,
    subjectKey: "SHARIA",
    teacherNum: 7,
    name: "الشرعي (أزهر - برايفت - 8 حصص) - ا/ اسلام جمال",
    price_per_month: 330,
    price_per_session: 0,
    schedule: [{"day":"saturday","start_time":"15:00","end_time":"16:30"},{"day":"tuesday","start_time":"15:00","end_time":"16:30"}],
  },
  {
    gradeOrder: 7,
    subjectKey: "ARABIC",
    teacherNum: 1,
    name: "اللغة العربية (برايفت) - ا/ مروان",
    price_per_month: 100,
    price_per_session: 0,
    schedule: [{"day":"saturday","start_time":"13:30","end_time":"15:00"}],
  },
  {
    gradeOrder: 4,
    subjectKey: "ARABIC",
    teacherNum: 1,
    name: "اللغة العربية (برايفت - 8 حصص) - ا/ مروان",
    price_per_month: 100,
    price_per_session: 0,
    schedule: [{"day":"saturday","start_time":"18:00","end_time":"19:00"},{"day":"tuesday","start_time":"17:00","end_time":"18:00"}],
  },
  {
    gradeOrder: 9,
    subjectKey: "SCIENCE_EN",
    teacherNum: 31,
    name: "Science (برايفت) - ا/ اسلام عبد الجليل",
    price_per_month: 10,
    price_per_session: 0,
    schedule: [{"day":"saturday","start_time":"16:30","end_time":"18:00"}],
  },
  {
    gradeOrder: 4,
    subjectKey: "SOCIAL",
    teacherNum: 46,
    name: "الدراسات الاجتماعية (برايفت - السبت 1:00 ظ) - ا/ اسلام موسى",
    price_per_month: 35,
    price_per_session: 0,
    schedule: [{"day":"saturday","start_time":"13:00","end_time":"14:00"}],
  },
  {
    gradeOrder: 6,
    subjectKey: "SOCIAL",
    teacherNum: 46,
    name: "الدراسات الاجتماعية (برايفت - السبت 3:00 ع) - ا/ اسلام موسى",
    price_per_month: 35,
    price_per_session: 0,
    schedule: [{"day":"saturday","start_time":"15:00","end_time":"16:00"}],
  },
  {
    gradeOrder: 10,
    subjectKey: "SOCIAL",
    teacherNum: 46,
    name: "الدراسات الاجتماعية (برايفت - السبت 5:00 م) - ا/ اسلام موسى",
    price_per_month: 35,
    price_per_session: 0,
    schedule: [{"day":"saturday","start_time":"17:00","end_time":"18:30"}],
  },
  {
    gradeOrder: 11,
    subjectKey: "PHILOSOPHY",
    teacherNum: 41,
    name: "الفلسفة والمنطق (برايفت) - ا/ محمد صلاح فلسفة",
    price_per_month: 310,
    price_per_session: 0,
    schedule: [{"day":"saturday","start_time":"17:30","end_time":"19:00"}],
  },
  {
    gradeOrder: 8,
    subjectKey: "SOCIAL",
    teacherNum: 35,
    name: "الدراسات الاجتماعية (برايفت - 8 حصص) - ا/ محمد سعيد دراسات",
    price_per_month: 170,
    price_per_session: 0,
    schedule: [{"day":"saturday","start_time":"18:30","end_time":"19:30"},{"day":"tuesday","start_time":"18:30","end_time":"19:30"}],
  },
  {
    gradeOrder: 7,
    subjectKey: "SOCIAL",
    teacherNum: 35,
    name: "الدراسات الاجتماعية (برايفت - 8 حصص - سبت وثلاثاء) - ا/ محمد سعيد دراسات",
    price_per_month: 170,
    price_per_session: 0,
    schedule: [{"day":"saturday","start_time":"20:00","end_time":"21:00"},{"day":"tuesday","start_time":"19:30","end_time":"20:30"}],
  },
  {
    gradeOrder: 11,
    subjectKey: "PROGRAMMING",
    teacherNum: 40,
    name: "البرمجة (2 ث عربي - برايفت) - ا/ محمد عاشور",
    price_per_month: 325,
    price_per_session: 0,
    schedule: [{"day":"sunday","start_time":"10:00","end_time":"12:00"}],
  },
  {
    gradeOrder: 10,
    subjectKey: "PROGRAMMING",
    teacherNum: 40,
    name: "البرمجة (1 ث لغات - برايفت - الأحد 12:00 ظ) - ا/ محمد عاشور",
    price_per_month: 385,
    price_per_session: 0,
    schedule: [{"day":"sunday","start_time":"12:00","end_time":"14:00"}],
  },
  {
    gradeOrder: 12,
    subjectKey: "ENGLISH",
    teacherNum: 47,
    name: "اللغة الانجليزية (3 ث - برايفت - الأحد 12:00 ظ) - ميس/ اميرة انجليزي",
    price_per_month: 400,
    price_per_session: 0,
    schedule: [{"day":"sunday","start_time":"12:00","end_time":"14:00"}],
  },
  {
    gradeOrder: 10,
    subjectKey: "ENGLISH",
    teacherNum: 47,
    name: "اللغة الانجليزية (برايفت - الأحد 3:00 ع) - ميس/ اميرة انجليزي",
    price_per_month: 400,
    price_per_session: 0,
    schedule: [{"day":"sunday","start_time":"15:00","end_time":"17:00"}],
  },
  {
    gradeOrder: 12,
    subjectKey: "ENGLISH",
    teacherNum: 13,
    name: "اللغة الانجليزية (3 ث - برايفت - الأحد 1:00 ظ) - ا/ الشاذلي",
    price_per_month: 310,
    price_per_session: 0,
    schedule: [{"day":"sunday","start_time":"13:00","end_time":"15:00"}],
  },
  {
    gradeOrder: 10,
    subjectKey: "ENGLISH",
    teacherNum: 44,
    name: "اللغة الانجليزية (برايفت - الأحد 3:30 ع) - ا/ محمد علام انجليزي",
    price_per_month: 220,
    price_per_session: 0,
    schedule: [{"day":"sunday","start_time":"15:30","end_time":"17:30"}],
  },
  {
    gradeOrder: 10,
    subjectKey: "ENGLISH",
    teacherNum: 43,
    name: "اللغة الانجليزية (برايفت - الأحد 7:00 م) - ا/ محمد سعيد انجليزي",
    price_per_month: 230,
    price_per_session: 0,
    schedule: [{"day":"sunday","start_time":"19:00","end_time":"21:00"}],
  },
  {
    gradeOrder: 4,
    subjectKey: "SCIENCE_AR",
    teacherNum: 25,
    name: "العلوم (برايفت) - ا/ حازم",
    price_per_month: 150,
    price_per_session: 0,
    schedule: [{"day":"sunday","start_time":"17:00","end_time":"18:00"}],
  },
  {
    gradeOrder: 7,
    subjectKey: "ARABIC",
    teacherNum: 2,
    name: "اللغة العربية (برايفت) - ميس/ دنيا",
    price_per_month: 170,
    price_per_session: 0,
    schedule: [{"day":"sunday","start_time":"20:00","end_time":"21:00"},{"day":"tuesday","start_time":"20:00","end_time":"21:00"}],
  },
  {
    gradeOrder: 12,
    subjectKey: "ENGLISH",
    teacherNum: 11,
    name: "اللغة الانجليزية (3 ث - برايفت - الاثنين 8:30 ص) - ا/ محمد علاء",
    price_per_month: 310,
    price_per_session: 0,
    schedule: [{"day":"monday","start_time":"08:30","end_time":"10:30"}],
  },
  {
    gradeOrder: 12,
    subjectKey: "ENGLISH",
    teacherNum: 47,
    name: "اللغة الانجليزية (3 ث - برايفت - الاثنين 10:00 ص) - ميس/ اميرة انجليزي",
    price_per_month: 400,
    price_per_session: 0,
    schedule: [{"day":"monday","start_time":"10:00","end_time":"12:00"}],
  },
  {
    gradeOrder: 11,
    subjectKey: "ENGLISH",
    teacherNum: 44,
    name: "اللغة الانجليزية (برايفت - الاثنين 12:30 ظ) - ا/ محمد علام انجليزي",
    price_per_month: 310,
    price_per_session: 0,
    schedule: [{"day":"monday","start_time":"12:30","end_time":"14:30"}],
  },
  {
    gradeOrder: 4,
    subjectKey: "MATH_EN",
    teacherNum: 48,
    name: "Math (برايفت - الاثنين 12:30 ظ) - ميس/ ياسمين ماث",
    price_per_month: 35,
    price_per_session: 0,
    schedule: [{"day":"monday","start_time":"12:30","end_time":"14:00"}],
  },
  {
    gradeOrder: 9,
    subjectKey: "SOCIAL",
    teacherNum: 35,
    name: "الدراسات الاجتماعية (برايفت - 8 حصص) - ا/ محمد سعيد دراسات",
    price_per_month: 170,
    price_per_session: 0,
    schedule: [{"day":"monday","start_time":"13:30","end_time":"14:30"},{"day":"thursday","start_time":"13:30","end_time":"14:30"}],
  },
  {
    gradeOrder: 7,
    subjectKey: "SOCIAL",
    teacherNum: 35,
    name: "الدراسات الاجتماعية (برايفت - الاثنين 6:00 م) - ا/ محمد سعيد دراسات",
    price_per_month: 210,
    price_per_session: 0,
    schedule: [{"day":"monday","start_time":"18:00","end_time":"19:30"}],
  },
  {
    gradeOrder: 6,
    subjectKey: "SOCIAL",
    teacherNum: 46,
    name: "الدراسات الاجتماعية (برايفت - الاثنين 3:00 ع) - ا/ اسلام موسى",
    price_per_month: 35,
    price_per_session: 0,
    schedule: [{"day":"monday","start_time":"15:00","end_time":"16:00"}],
  },
  {
    gradeOrder: 7,
    subjectKey: "SOCIAL",
    teacherNum: 46,
    name: "الدراسات الاجتماعية (برايفت - الاثنين 5:00 م) - ا/ اسلام موسى",
    price_per_month: 35,
    price_per_session: 0,
    schedule: [{"day":"monday","start_time":"17:00","end_time":"18:00"}],
  },
  {
    gradeOrder: 9,
    subjectKey: "SCIENCE_AR",
    teacherNum: 25,
    name: "العلوم (3 ع - برايفت - الاثنين 7:00 م) - ا/ حازم",
    price_per_month: 190,
    price_per_session: 0,
    schedule: [{"day":"monday","start_time":"19:00","end_time":"20:30"}],
  },
  {
    gradeOrder: 4,
    subjectKey: "SOCIAL",
    teacherNum: 34,
    name: "الدراسات الاجتماعية (برايفت) - ا/ محمود رشاد",
    price_per_month: 180,
    price_per_session: 0,
    schedule: [{"day":"monday","start_time":"17:00","end_time":"18:00"},{"day":"thursday","start_time":"17:00","end_time":"18:00"}],
  },
  {
    gradeOrder: 12,
    subjectKey: "ARABIC",
    teacherNum: 5,
    name: "اللغة العربية (3 ث - برايفت - الثلاثاء 8:00 ص) - ا/ الغزالي",
    price_per_month: 310,
    price_per_session: 0,
    schedule: [{"day":"tuesday","start_time":"08:00","end_time":"10:00"}],
  },
  {
    gradeOrder: 11,
    subjectKey: "ARABIC",
    teacherNum: 5,
    name: "اللغة العربية (2 ث - برايفت - الثلاثاء 12:00 ظ) - ا/ الغزالي",
    price_per_month: 310,
    price_per_session: 0,
    schedule: [{"day":"tuesday","start_time":"12:00","end_time":"14:00"}],
  },
  {
    gradeOrder: 9,
    subjectKey: "ENGLISH",
    teacherNum: 11,
    name: "اللغة الانجليزية (برايفت - الثلاثاء 12:00 ظ) - ا/ محمد علاء",
    price_per_month: 210,
    price_per_session: 0,
    schedule: [{"day":"tuesday","start_time":"12:00","end_time":"13:30"}],
  },
  {
    gradeOrder: 11,
    subjectKey: "ENGLISH",
    teacherNum: 14,
    name: "اللغة الانجليزية (برايفت - الثلاثاء 12:00 ظ) - ا/ ادهم ابو الصفا",
    price_per_month: 320,
    price_per_session: 0,
    schedule: [{"day":"tuesday","start_time":"12:00","end_time":"14:00"}],
  },
  {
    gradeOrder: 12,
    subjectKey: "ENGLISH",
    teacherNum: 14,
    name: "اللغة الانجليزية (برايفت - الثلاثاء 3:00 ع) - ا/ ادهم ابو الصفا",
    price_per_month: 330,
    price_per_session: 0,
    schedule: [{"day":"tuesday","start_time":"15:00","end_time":"17:00"}],
  },
  {
    gradeOrder: 12,
    subjectKey: "ENGLISH",
    teacherNum: 14,
    name: "اللغة الانجليزية (برايفت - الثلاثاء 5:00 م) - ا/ ادهم ابو الصفا",
    price_per_month: 330,
    price_per_session: 0,
    schedule: [{"day":"tuesday","start_time":"17:00","end_time":"19:00"}],
  },
  {
    gradeOrder: 11,
    subjectKey: "ENGLISH",
    teacherNum: 47,
    name: "اللغة الانجليزية (برايفت - الثلاثاء 12:00 ظ) - ميس/ اميرة انجليزي",
    price_per_month: 400,
    price_per_session: 0,
    schedule: [{"day":"tuesday","start_time":"12:00","end_time":"14:00"}],
  },
  {
    gradeOrder: 2,
    subjectKey: "MATH_EN",
    teacherNum: 48,
    name: "Math (برايفت - الثلاثاء 12:00 ظ) - ميس/ ياسمين ماث",
    price_per_month: 35,
    price_per_session: 0,
    schedule: [{"day":"tuesday","start_time":"12:00","end_time":"13:30"}],
  },
  {
    gradeOrder: 6,
    subjectKey: "MATH_EN",
    teacherNum: 48,
    name: "Math (برايفت - الثلاثاء 2:00 ظ) - ميس/ ياسمين ماث",
    price_per_month: 35,
    price_per_session: 0,
    schedule: [{"day":"tuesday","start_time":"14:00","end_time":"15:30"}],
  },
  {
    gradeOrder: 7,
    subjectKey: "MATH_EN",
    teacherNum: 48,
    name: "Math (برايفت - الثلاثاء 5:00 م) - ميس/ ياسمين ماث",
    price_per_month: 35,
    price_per_session: 0,
    schedule: [{"day":"tuesday","start_time":"17:00","end_time":"18:30"}],
  },
  {
    gradeOrder: 6,
    subjectKey: "SOCIAL",
    teacherNum: 46,
    name: "الدراسات الاجتماعية (برايفت - الثلاثاء 1:00 ظ) - ا/ اسلام موسى",
    price_per_month: 35,
    price_per_session: 0,
    schedule: [{"day":"tuesday","start_time":"13:00","end_time":"14:00"}],
  },
  {
    gradeOrder: 5,
    subjectKey: "SOCIAL",
    teacherNum: 46,
    name: "الدراسات الاجتماعية (برايفت - الثلاثاء 3:00 ع) - ا/ اسلام موسى",
    price_per_month: 35,
    price_per_session: 0,
    schedule: [{"day":"tuesday","start_time":"15:00","end_time":"16:00"}],
  },
  {
    gradeOrder: 8,
    subjectKey: "SOCIAL",
    teacherNum: 46,
    name: "الدراسات الاجتماعية (برايفت - الثلاثاء 5:00 م) - ا/ اسلام موسى",
    price_per_month: 35,
    price_per_session: 0,
    schedule: [{"day":"tuesday","start_time":"17:00","end_time":"18:00"}],
  },
  {
    gradeOrder: 12,
    subjectKey: "SCIENCE_EN",
    teacherNum: 32,
    name: "Science / Bio (3 ث برايفت - الأربعاء 10:00 ص) - ا/ محمد العربي",
    price_per_month: 550,
    price_per_session: 0,
    schedule: [{"day":"wednesday","start_time":"10:00","end_time":"12:00"}],
  },
  {
    gradeOrder: 12,
    subjectKey: "GEOGRAPHY",
    teacherNum: 36,
    name: "الجغرافيا (برايفت - الأربعاء 1:30 ظ) - ا/ محمود طارق",
    price_per_month: 310,
    price_per_session: 0,
    schedule: [{"day":"wednesday","start_time":"13:30","end_time":"15:30"}],
  },
  {
    gradeOrder: 3,
    subjectKey: "MATH_EN",
    teacherNum: 48,
    name: "Math (3 ب - برايفت - الأربعاء 12:00 ظ) - ميس/ ياسمين ماث",
    price_per_month: 35,
    price_per_session: 0,
    schedule: [{"day":"wednesday","start_time":"12:00","end_time":"13:30"}],
  },
  {
    gradeOrder: 2,
    subjectKey: "MATH_EN",
    teacherNum: 48,
    name: "Math (برايفت - الأربعاء 4:30 ع) - ميس/ ياسمين ماث",
    price_per_month: 35,
    price_per_session: 0,
    schedule: [{"day":"wednesday","start_time":"16:30","end_time":"18:00"}],
  },
  {
    gradeOrder: 11,
    subjectKey: "ENGLISH",
    teacherNum: 47,
    name: "اللغة الانجليزية (2 ث بكالوريا - برايفت - الأربعاء 12:30 ظ) - ميس/ اميرة انجليزي",
    price_per_month: 400,
    price_per_session: 0,
    schedule: [{"day":"wednesday","start_time":"12:30","end_time":"14:30"}],
  },
  {
    gradeOrder: 4,
    subjectKey: "SOCIAL",
    teacherNum: 46,
    name: "الدراسات الاجتماعية (برايفت - الأربعاء 1:00 ظ) - ا/ اسلام موسى",
    price_per_month: 35,
    price_per_session: 0,
    schedule: [{"day":"wednesday","start_time":"13:00","end_time":"14:00"}],
  },
  {
    gradeOrder: 9,
    subjectKey: "SOCIAL",
    teacherNum: 46,
    name: "الدراسات الاجتماعية (3 ع - برايفت - الأربعاء 3:00 ع) - ا/ اسلام موسى",
    price_per_month: 35,
    price_per_session: 0,
    schedule: [{"day":"wednesday","start_time":"15:00","end_time":"16:00"}],
  },
  {
    gradeOrder: 7,
    subjectKey: "SOCIAL",
    teacherNum: 46,
    name: "الدراسات الاجتماعية (برايفت - الأربعاء 5:00 م) - ا/ اسلام موسى",
    price_per_month: 35,
    price_per_session: 0,
    schedule: [{"day":"wednesday","start_time":"17:00","end_time":"18:00"}],
  },
  {
    gradeOrder: 11,
    subjectKey: "ENGLISH",
    teacherNum: 13,
    name: "اللغة الانجليزية (برايفت - الأربعاء 1:00 ظ) - ا/ الشاذلي",
    price_per_month: 310,
    price_per_session: 0,
    schedule: [{"day":"wednesday","start_time":"13:00","end_time":"15:00"}],
  },
  {
    gradeOrder: 9,
    subjectKey: "ENGLISH",
    teacherNum: 43,
    name: "اللغة الانجليزية (برايفت - الأربعاء 4:00 ع) - ا/ محمد سعيد انجليزي",
    price_per_month: 210,
    price_per_session: 0,
    schedule: [{"day":"wednesday","start_time":"16:00","end_time":"17:30"}],
  },
  {
    gradeOrder: 9,
    subjectKey: "SCIENCE_AR",
    teacherNum: 25,
    name: "العلوم (برايفت) - ا/ حازم",
    price_per_month: 190,
    price_per_session: 0,
    schedule: [{"day":"thursday","start_time":"19:30","end_time":"21:00"}],
  },
  {
    gradeOrder: 8,
    subjectKey: "ENGLISH",
    teacherNum: 43,
    name: "اللغة الانجليزية (2 ع - برايفت - الخميس 6:00 م) - ا/ محمد سعيد انجليزي",
    price_per_month: 210,
    price_per_session: 0,
    schedule: [{"day":"thursday","start_time":"18:00","end_time":"19:30"}],
  },
  {
    gradeOrder: 11,
    subjectKey: "PHYSICS",
    teacherNum: 49,
    name: "الفيزياء / Physics (برايفت - الخميس 2:30 ظ) - ا/ محمد سالم",
    price_per_month: 450,
    price_per_session: 0,
    schedule: [{"day":"thursday","start_time":"14:30","end_time":"16:30"}],
  },
  {
    gradeOrder: 5,
    subjectKey: "SOCIAL",
    teacherNum: 46,
    name: "الدراسات الاجتماعية (برايفت - الخميس 3:00 ع) - ا/ اسلام موسى",
    price_per_month: 35,
    price_per_session: 0,
    schedule: [{"day":"thursday","start_time":"15:00","end_time":"16:00"}],
  },
  {
    gradeOrder: 7,
    subjectKey: "SOCIAL",
    teacherNum: 46,
    name: "الدراسات الاجتماعية (برايفت - الخميس 5:00 م) - ا/ اسلام موسى",
    price_per_month: 35,
    price_per_session: 0,
    schedule: [{"day":"thursday","start_time":"17:00","end_time":"18:00"}],
  },
  {
    gradeOrder: 9,
    subjectKey: "SCIENCE_EN",
    teacherNum: 32,
    name: "Science (برايفت - الخميس 3:00 ع - الحصة 70 ج) - ا/ محمد العربي",
    price_per_month: 280,
    price_per_session: 70,
    schedule: [{"day":"thursday","start_time":"15:00","end_time":"16:30"}],
  },
  {
    gradeOrder: 8,
    subjectKey: "SHARIA",
    teacherNum: 4,
    name: "الشرعي (أزهر - برايفت) - ميس/ ياسمين حسن",
    price_per_month: 210,
    price_per_session: 0,
    schedule: [{"day":"thursday","start_time":"18:00","end_time":"19:30"}],
  },
  {
    gradeOrder: 7,
    subjectKey: "SHARIA",
    teacherNum: 4,
    name: "الشرعي (أزهر - برايفت) - ميس/ ياسمين حسن",
    price_per_month: 160,
    price_per_session: 0,
    schedule: [{"day":"thursday","start_time":"16:00","end_time":"17:30"}],
  },
];

async function runSeed() {
  const client = await db.getClient();
  try {
    console.log('🚀 بدء تنفيذ أوامر تجهيز المواد، حسابات الـ 42 مدرساً، والمجموعات وربطها بالباكدجات...');
    await client.query('BEGIN');

    // ------------------------------------------------------------------------
    // 1. Load Academic Grades
    // ------------------------------------------------------------------------
    const gradesRes = await client.query('SELECT id, name_ar, grade_order FROM academic_grades ORDER BY grade_order');
    const gradesByOrder = new Map();
    for (const g of gradesRes.rows) {
      gradesByOrder.set(Number(g.grade_order), g);
    }
    console.log(`✅ تم قراءة ${gradesRes.rows.length} مرحلة دراسية.`);

    // ------------------------------------------------------------------------
    // 2. Ensure Subjects Exist
    // ------------------------------------------------------------------------
    const existingSubRes = await client.query('SELECT id, name_ar, name_en, color FROM subjects');
    const subjectByName = new Map();
    for (const s of existingSubRes.rows) {
      subjectByName.set(s.name_ar.trim(), s);
    }

    const subjectIdByKey = new Map();
    for (const reqSub of REQUIRED_SUBJECTS) {
      let found = subjectByName.get(reqSub.name_ar);
      // Fallback for Integrated Science if previously named 'العلوم المتكاملة (Integrated Science)'
      if (!found && reqSub.key === 'INTEGRATED_SCI_AR') {
        const legacy = subjectByName.get('العلوم المتكاملة (Integrated Science)');
        if (legacy) {
          const upd = await client.query(
            `UPDATE subjects SET name_ar = $1, name_en = $2, color = $3 WHERE id = $4 RETURNING *`,
            [reqSub.name_ar, reqSub.name_en, reqSub.color, legacy.id]
          );
          found = upd.rows[0];
        }
      }
      if (!found) {
        const ins = await client.query(
          `INSERT INTO subjects (name_ar, name_en, color, education_type, is_active)
           VALUES ($1, $2, $3, $4, true)
           RETURNING *`,
          [reqSub.name_ar, reqSub.name_en, reqSub.color, reqSub.education_type]
        );
        found = ins.rows[0];
        console.log(`   ➕ تم إنشاء مادة جديدة: ${found.name_ar}`);
      }
      subjectIdByKey.set(reqSub.key, found.id);
    }
    console.log(`✅ تم التحقق من جميع المواد الدراسية (${subjectIdByKey.size} مادة).`);

    // ------------------------------------------------------------------------
    // 3. Upsert All Teachers (Unified: normalize all 'مستر/' and 'أ/' to 'ا/', and remove hamzas [أإآ])
    // ------------------------------------------------------------------------
    await client.query(`
      UPDATE teachers
      SET full_name = regexp_replace(regexp_replace(regexp_replace(regexp_replace(full_name, 'مستر/', 'ا/', 'g'), 'أ', 'ا', 'g'), 'إ', 'ا', 'g'), 'آ', 'ا', 'g'),
          full_name_ar = regexp_replace(regexp_replace(regexp_replace(regexp_replace(full_name_ar, 'مستر/', 'ا/', 'g'), 'أ', 'ا', 'g'), 'إ', 'ا', 'g'), 'آ', 'ا', 'g')
      WHERE full_name ~ '[أإآ]|مستر/|^أ/' OR full_name_ar ~ '[أإآ]|مستر/|^أ/';
    `);

    await client.query(`
      UPDATE groups
      SET name = regexp_replace(regexp_replace(regexp_replace(regexp_replace(name, 'مستر/', 'ا/', 'g'), 'أ', 'ا', 'g'), 'إ', 'ا', 'g'), 'آ', 'ا', 'g'),
          name_ar = regexp_replace(regexp_replace(regexp_replace(regexp_replace(name_ar, 'مستر/', 'ا/', 'g'), 'أ', 'ا', 'g'), 'إ', 'ا', 'g'), 'آ', 'ا', 'g')
      WHERE name ~ '[أإآ]|مستر/|أ/' OR name_ar ~ '[أإآ]|مستر/|أ/';
    `);

    const existingTeachersRes = await client.query('SELECT id, full_name FROM teachers');
    const norm = (s) => (s || '').replace(/مستر\//g, 'ا/').replace(/^[أا]\//g, 'ا/').replace(/[أإآ]/g, 'ا').trim();
    const teacherByName = new Map();
    for (const t of existingTeachersRes.rows) {
      teacherByName.set(norm(t.full_name), t);
    }

    const teacherIdByNum = new Map();
    let teachersCreated = 0;
    let teachersUpdated = 0;

    for (const tDef of TEACHERS_LIST) {
      const subjectIds = tDef.subjectKeys.map((k) => subjectIdByKey.get(k)).filter(Boolean);
      const primarySubjectId = subjectIds[0] || null;
      const existing = teacherByName.get(norm(tDef.full_name));

      if (existing) {
        await client.query(
          `UPDATE teachers
           SET full_name_ar = $1, gender = $2, specialization = $3,
               subject_id = $4, subject_ids = $5, is_active = true, updated_at = NOW()
           WHERE id = $6`,
          [tDef.full_name, tDef.gender, tDef.specialization, primarySubjectId, subjectIds, existing.id]
        );
        teacherIdByNum.set(tDef.num, existing.id);
        teachersUpdated++;
      } else {
        const ins = await client.query(
          `INSERT INTO teachers (
             full_name, full_name_ar, gender, specialization,
             subject_id, subject_ids, revenue_split_percent, revenue_split_type, is_active
           ) VALUES ($1, $2, $3, $4, $5, $6, 0, 'percentage', true)
           RETURNING id`,
          [tDef.full_name, tDef.full_name, tDef.gender, tDef.specialization, primarySubjectId, subjectIds]
        );
        teacherIdByNum.set(tDef.num, ins.rows[0].id);
        teachersCreated++;
      }
    }
    console.log(`✅ حسابات المدرسين جاهزة: (${teachersCreated} جديد، ${teachersUpdated} محدث — الإجمالي: ${TEACHERS_LIST.length} مدرس).`);

    // ------------------------------------------------------------------------
    // 4. Ensure Grade Packages Exist (PUBLIC & LANGUAGES for grades 4..10)
    // ------------------------------------------------------------------------
    const pkgRes = await client.query('SELECT id, grade_id, education_type, name FROM grade_packages');
    const packageMap = new Map(); // `${grade_id}_${education_type}` -> id
    for (const p of pkgRes.rows) {
      packageMap.set(`${p.grade_id}_${p.education_type}`, p.id);
    }

    for (const gradeOrder of [4, 5, 6, 7, 8, 9, 10]) {
      const grade = gradesByOrder.get(gradeOrder);
      if (!grade) continue;

      for (const eduType of ['PUBLIC', 'LANGUAGES']) {
        const key = `${grade.id}_${eduType}`;
        if (!packageMap.has(key)) {
          const pkgName = `${grade.name_ar} - ${eduType === 'LANGUAGES' ? 'لغات / تجريبي' : 'حكومي / عربي'}`;
          const defaultPrice = gradeOrder <= 6 ? 300 : gradeOrder <= 9 ? 450 : 600;
          const insPkg = await client.query(
            `INSERT INTO grade_packages (name, grade_id, education_type, package_price, single_subject_price, is_active)
             VALUES ($1, $2, $3, $4, 100, true)
             RETURNING id`,
            [pkgName, grade.id, eduType, defaultPrice]
          );
          packageMap.set(key, insPkg.rows[0].id);
        }
      }
    }
    console.log(`✅ تم التحقق من باكدجات المراحل الدراسية (عربي / لغات).`);

    // ------------------------------------------------------------------------
    // 4.5. Deduplicate and Merge Redundant Groups (Package & Private)
    // ------------------------------------------------------------------------
    console.log('🔄 فحص ودمج أي مجموعات مكررة في نفس الموعد ونفس المدرس...');
    let mergedDupsCount = 0;
    while (true) {
      const duplicates = await client.query(`
        SELECT g1.id as primary_id, g2.id as dup_id, g2.price_per_month as dup_price_month, g2.price_per_session as dup_price_session
        FROM groups g1
        JOIN groups g2 ON g1.teacher_id = g2.teacher_id
                      AND g1.grade_id = g2.grade_id
                      AND g1.subject_id = g2.subject_id
                      AND g1.schedule::text = g2.schedule::text
                      AND g1.id < g2.id
        LIMIT 100
      `);

      if (duplicates.rows.length === 0) break;

      for (const dup of duplicates.rows) {
        // 1. Re-link packages
        await client.query(`
          INSERT INTO package_groups (package_id, group_id)
          SELECT package_id, $1 FROM package_groups WHERE group_id = $2
          ON CONFLICT (package_id, group_id) DO NOTHING
        `, [dup.primary_id, dup.dup_id]);
        await client.query(`DELETE FROM package_groups WHERE group_id = $1`, [dup.dup_id]);

        // 2. Re-point subscriptions
        await client.query(`UPDATE student_subscriptions SET group_id = $1 WHERE group_id = $2`, [dup.primary_id, dup.dup_id]);

        // 3. Re-point enrollments
        await client.query(`
          UPDATE group_enrollments 
          SET group_id = $1 
          WHERE group_id = $2
            AND student_id NOT IN (SELECT student_id FROM group_enrollments WHERE group_id = $1)
        `, [dup.primary_id, dup.dup_id]);
        await client.query(`DELETE FROM group_enrollments WHERE group_id = $1`, [dup.dup_id]);

        // 4. Re-point attendance logs & booklet reservations
        await client.query(`UPDATE attendance_logs SET group_id = $1 WHERE group_id = $2`, [dup.primary_id, dup.dup_id]);
        await client.query(`UPDATE booklet_reservations SET group_id = $1 WHERE group_id = $2`, [dup.primary_id, dup.dup_id]);

        // 5. Transfer pricing
        const pMonth = Number(dup.dup_price_month || 0);
        const pSession = Number(dup.dup_price_session || 0);
        if (pMonth > 0 || pSession > 0) {
          await client.query(`
            UPDATE groups 
            SET price_per_month = GREATEST(price_per_month, $1),
                price_per_session = GREATEST(price_per_session, $2)
            WHERE id = $3
          `, [pMonth, pSession, dup.primary_id]);
        }

        // 6. Delete duplicate
        await client.query(`DELETE FROM groups WHERE id = $1`, [dup.dup_id]);
        mergedDupsCount++;
      }
    }
    if (mergedDupsCount > 0) {
      console.log(`✅ تم دمج وحذف ${mergedDupsCount} مجموعة مكررة بنجاح بدون فقدان أي بيانات!`);
    }

    // ------------------------------------------------------------------------
    // 5. Upsert Groups & Link All to Grade Packages (package_groups)
    // ------------------------------------------------------------------------
    let groupsCreated = 0;
    let groupsUpdated = 0;
    let packageLinksCount = 0;

    for (const gDef of GROUPS_LIST) {
      const grade = gradesByOrder.get(gDef.gradeOrder);
      const subjectId = subjectIdByKey.get(gDef.subjectKey);
      const teacherId = teacherIdByNum.get(gDef.teacherNum);

      if (!grade || !subjectId || !teacherId) {
        throw new Error(`بيانات غير مكتملة للمجموعة: ${gDef.name}`);
      }

      const priceMonth = Number(gDef.price_per_month || 0);
      const priceSession = Number(gDef.price_per_session || 0);

      // Check if group already exists for this grade, subject, teacher, and name (or matching schedule)
      const existGrp = await client.query(
        `SELECT id FROM groups 
         WHERE grade_id = $1 AND teacher_id = $2 AND subject_id = $3 
           AND (name = $4 OR schedule::text = $5)
         ORDER BY (name = $4) DESC, id ASC LIMIT 1`,
        [grade.id, teacherId, subjectId, gDef.name, JSON.stringify(gDef.schedule)]
      );

      let groupId;
      if (existGrp.rows.length > 0) {
        groupId = existGrp.rows[0].id;
        await client.query(
          `UPDATE groups
           SET name_ar = $1, schedule = $2, status = 'active',
               price_per_month = CASE WHEN $3 > 0 THEN $3 ELSE price_per_month END,
               price_per_session = CASE WHEN $4 > 0 THEN $4 ELSE price_per_session END,
               package_teacher_ratio = 0, package_center_ratio = 100,
               private_teacher_ratio = 75, private_center_ratio = 25,
               max_students = 9999, updated_at = NOW()
           WHERE id = $5`,
          [gDef.name, JSON.stringify(gDef.schedule), priceMonth, priceSession, groupId]
        );
        groupsUpdated++;
      } else {
        const insGrp = await client.query(
          `INSERT INTO groups (
             name, name_ar, teacher_id, subject_id, grade_id,
             schedule, price_per_month, price_per_session, max_students,
             package_teacher_ratio, package_center_ratio, private_teacher_ratio, private_center_ratio, status
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 9999, 0, 100, 75, 25, 'active')
           RETURNING id`,
          [gDef.name, gDef.name, teacherId, subjectId, grade.id, JSON.stringify(gDef.schedule), priceMonth, priceSession]
        );
        groupId = insGrp.rows[0].id;
        groupsCreated++;
      }

      // Link group to target packages (PUBLIC / LANGUAGES)
      for (const eduType of gDef.packages) {
        const pkgId = packageMap.get(`${grade.id}_${eduType}`);
        if (pkgId) {
          await client.query(
            `INSERT INTO package_groups (package_id, group_id)
             VALUES ($1, $2)
             ON CONFLICT (package_id, group_id) DO NOTHING`,
            [pkgId, groupId]
          );
          packageLinksCount++;
        }
      }
    }

    // ------------------------------------------------------------------------
    // 6. Upsert Private Groups (NOT in package_groups, with monthly/session prices)
    // ------------------------------------------------------------------------
    // Clean up previously seeded private groups that have 0 enrollments so that
    // modified schedules/grades/names do not leave orphaned duplicates.
    await client.query(`
      DELETE FROM groups g
      WHERE NOT EXISTS (SELECT 1 FROM package_groups pg WHERE pg.group_id = g.id)
        AND NOT EXISTS (SELECT 1 FROM group_enrollments ge WHERE ge.group_id = g.id)
    `);

    let privateCreated = 0;
    let privateUpdated = 0;

    for (const pDef of PRIVATE_GROUPS_LIST) {
      const grade = gradesByOrder.get(pDef.gradeOrder);
      const subjectId = subjectIdByKey.get(pDef.subjectKey);
      const teacherId = teacherIdByNum.get(pDef.teacherNum);

      if (!grade || !subjectId || !teacherId) {
        throw new Error(`بيانات غير مكتملة للمجموعة البرايفت: ${pDef.name}`);
      }

      const existGrp = await client.query(
        `SELECT id FROM groups 
         WHERE grade_id = $1 AND teacher_id = $2 AND subject_id = $3 
           AND (name = $4 OR schedule::text = $5)
         ORDER BY (name = $4) DESC, id ASC LIMIT 1`,
        [grade.id, teacherId, subjectId, pDef.name, JSON.stringify(pDef.schedule)]
      );

      const priceMonth = Number(pDef.price_per_month || 0);
      const priceSession = Number(pDef.price_per_session || 0);

      let groupId;
      if (existGrp.rows.length > 0) {
        groupId = existGrp.rows[0].id;
        await client.query(
          `UPDATE groups
           SET name_ar = $1, schedule = $2, status = 'active',
               price_per_month = $3, price_per_session = $4,
               package_teacher_ratio = 0, package_center_ratio = 100,
               private_teacher_ratio = 75, private_center_ratio = 25,
               max_students = 9999, updated_at = NOW()
           WHERE id = $5`,
          [pDef.name, JSON.stringify(pDef.schedule), priceMonth, priceSession, groupId]
        );
        privateUpdated++;
      } else {
        const insGrp = await client.query(
          `INSERT INTO groups (
             name, name_ar, teacher_id, subject_id, grade_id,
             schedule, price_per_month, price_per_session, max_students,
             package_teacher_ratio, package_center_ratio, private_teacher_ratio, private_center_ratio, status
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 9999, 0, 100, 75, 25, 'active')
           RETURNING id`,
          [
            pDef.name,
            pDef.name,
            teacherId,
            subjectId,
            grade.id,
            JSON.stringify(pDef.schedule),
            priceMonth,
            priceSession,
          ]
        );
        groupId = insGrp.rows[0].id;
        privateCreated++;
      }

      // Ensure private group is strictly NOT in package_groups (so is_private = true)
      await client.query(`DELETE FROM package_groups WHERE group_id = $1`, [groupId]);
    }

    await client.query('COMMIT');
    console.log('══════════════════════════════════════════════════════════════════');
    console.log('🎉 تم تنفيذ جميع الأوامر بنجاح بدون أي أخطاء!');
    console.log(`👨‍🏫 إجمالي المدرسين: ${TEACHERS_LIST.length} مدرس (${teachersCreated} جديد، ${teachersUpdated} محدث)`);
    console.log(`📦 مجموعات الباكدج: ${GROUPS_LIST.length} مجموعة (${groupsCreated} جديدة، ${groupsUpdated} محدثة — ${packageLinksCount} ربط باكدج)`);
    console.log(`💎 مجموعات البرايفت: ${PRIVATE_GROUPS_LIST.length} مجموعة (${privateCreated} جديدة، ${privateUpdated} محدثة)`);
    console.log(`📚 إجمالي المجموعات في السيستم: ${GROUPS_LIST.length + PRIVATE_GROUPS_LIST.length} مجموعة`);
    console.log('══════════════════════════════════════════════════════════════════');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ حدث خطأ أثناء التنفيذ وتم التراجع (Rollback):', err);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

runSeed();
