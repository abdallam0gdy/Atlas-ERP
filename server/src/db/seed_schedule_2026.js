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
  // ==========================================================================
  // المرحلة: الصف الرابع الابتدائي (gradeOrder: 4)
  // ==========================================================================
  {
    gradeOrder: 4,
    subjectKey: 'ARABIC',
    teacherNum: 1, // مروان
    name: 'اللغة العربية - ا/ مروان',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'saturday', start_time: '16:00', end_time: '17:00' },
      { day: 'tuesday', start_time: '17:00', end_time: '18:00' },
    ],
  },
  {
    gradeOrder: 4,
    subjectKey: 'ARABIC',
    teacherNum: 2, // دنيا
    name: 'اللغة العربية - ميس/ دنيا',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'saturday', start_time: '16:00', end_time: '17:00' },
      { day: 'tuesday', start_time: '17:00', end_time: '18:00' },
    ],
  },
  {
    gradeOrder: 4,
    subjectKey: 'ENGLISH',
    teacherNum: 9, // آلاء علاء
    name: 'اللغة الانجليزية - ميس/ الاء علاء',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'friday', start_time: '14:00', end_time: '15:00' },
      { day: 'saturday', start_time: '17:00', end_time: '19:00' },
    ],
  },
  {
    gradeOrder: 4,
    subjectKey: 'MATH_AR',
    teacherNum: 16, // أحمد محمود
    name: 'الرياضيات - ا/ احمد محمود',
    packages: ['PUBLIC'],
    schedule: [
      { day: 'sunday', start_time: '16:00', end_time: '17:00' },
      { day: 'wednesday', start_time: '16:00', end_time: '17:00' },
    ],
  },
  {
    gradeOrder: 4,
    subjectKey: 'MATH_AR',
    teacherNum: 17, // أدهم هاني
    name: 'الرياضيات - ا/ ادهم هاني',
    packages: ['PUBLIC'],
    schedule: [
      { day: 'sunday', start_time: '16:00', end_time: '17:00' },
      { day: 'wednesday', start_time: '16:00', end_time: '17:00' },
    ],
  },
  {
    gradeOrder: 4,
    subjectKey: 'MATH_EN',
    teacherNum: 21, // أسماء
    name: 'Math (لغات) - ميس/ اسماء',
    packages: ['LANGUAGES'],
    schedule: [
      { day: 'monday', start_time: '15:00', end_time: '16:30' },
    ],
  },
  {
    gradeOrder: 4,
    subjectKey: 'MATH_EN',
    teacherNum: 22, // أحمد نبيل
    name: 'Math (لغات) - ا/ احمد نبيل',
    packages: ['LANGUAGES'],
    schedule: [
      { day: 'wednesday', start_time: '17:00', end_time: '18:30' },
    ],
  },
  {
    gradeOrder: 4,
    subjectKey: 'SCIENCE_AR',
    teacherNum: 25, // حازم
    name: 'العلوم - ا/ حازم',
    packages: ['PUBLIC'],
    schedule: [
      { day: 'sunday', start_time: '17:00', end_time: '18:00' },
      { day: 'wednesday', start_time: '17:00', end_time: '18:00' },
    ],
  },
  {
    gradeOrder: 4,
    subjectKey: 'SCIENCE_AR',
    teacherNum: 26, // أحمد عثمان
    name: 'العلوم - ا/ احمد عثمان',
    packages: ['PUBLIC'],
    schedule: [
      { day: 'monday', start_time: '18:00', end_time: '19:00' },
      { day: 'thursday', start_time: '17:00', end_time: '18:00' },
    ],
  },
  {
    gradeOrder: 4,
    subjectKey: 'SCIENCE_EN',
    teacherNum: 29, // إيناس
    name: 'Science (لغات) - ميس/ ايناس',
    packages: ['LANGUAGES'],
    schedule: [
      { day: 'sunday', start_time: '17:00', end_time: '18:30' },
    ],
  },
  {
    gradeOrder: 4,
    subjectKey: 'SCIENCE_EN',
    teacherNum: 30, // أدهم إمبابي
    name: 'Science (لغات) - ا/ ادهم امبابي',
    packages: ['LANGUAGES'],
    schedule: [
      { day: 'sunday', start_time: '15:00', end_time: '16:30' },
    ],
  },
  {
    gradeOrder: 4,
    subjectKey: 'SOCIAL',
    teacherNum: 33, // شيماء
    name: 'الدراسات الاجتماعية - ميس/ شيماء',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'monday', start_time: '17:00', end_time: '18:00' },
      { day: 'thursday', start_time: '18:00', end_time: '19:00' },
    ],
  },
  {
    gradeOrder: 4,
    subjectKey: 'SOCIAL',
    teacherNum: 34, // محمود رشاد
    name: 'الدراسات الاجتماعية - ا/ محمود رشاد',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'monday', start_time: '17:00', end_time: '18:00' },
      { day: 'thursday', start_time: '18:00', end_time: '19:00' },
    ],
  },
  {
    gradeOrder: 4,
    subjectKey: 'IT_AR',
    teacherNum: 38, // هبة
    name: 'تكنولوجيا المعلومات (عربي) - ميس/ هبة',
    packages: ['PUBLIC'],
    schedule: [
      { day: 'tuesday', start_time: '19:00', end_time: '20:00' },
    ],
  },
  {
    gradeOrder: 4,
    subjectKey: 'ICT_EN',
    teacherNum: 39, // نهلة
    name: 'ICT (لغات) - ميس/ نهلة',
    packages: ['LANGUAGES'],
    schedule: [
      { day: 'tuesday', start_time: '16:00', end_time: '17:00' },
    ],
  },
  {
    gradeOrder: 4,
    subjectKey: 'RELIGION',
    teacherNum: 8, // صفية
    name: 'التربية الدينية - ا/ صفية',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'tuesday', start_time: '18:00', end_time: '19:00' },
    ],
  },

  // ==========================================================================
  // المرحلة: الصف الخامس الابتدائي (gradeOrder: 5)
  // ==========================================================================
  {
    gradeOrder: 5,
    subjectKey: 'ARABIC',
    teacherNum: 1, // مروان
    name: 'اللغة العربية - ا/ مروان',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'saturday', start_time: '17:00', end_time: '18:00' },
      { day: 'tuesday', start_time: '18:00', end_time: '19:00' },
    ],
  },
  {
    gradeOrder: 5,
    subjectKey: 'ARABIC',
    teacherNum: 2, // دنيا
    name: 'اللغة العربية - ميس/ دنيا',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'saturday', start_time: '17:00', end_time: '18:00' },
      { day: 'tuesday', start_time: '18:00', end_time: '19:00' },
    ],
  },
  {
    gradeOrder: 5,
    subjectKey: 'ENGLISH',
    teacherNum: 9, // آلاء علاء
    name: 'اللغة الانجليزية - ميس/ الاء علاء',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'friday', start_time: '15:00', end_time: '16:00' },
      { day: 'saturday', start_time: '15:00', end_time: '17:00' },
    ],
  },
  {
    gradeOrder: 5,
    subjectKey: 'ENGLISH',
    teacherNum: 10, // سالي
    name: 'اللغة الانجليزية - ا/ سالي',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'monday', start_time: '18:00', end_time: '19:00' },
      { day: 'thursday', start_time: '18:30', end_time: '19:30' },
    ],
  },
  {
    gradeOrder: 5,
    subjectKey: 'MATH_AR',
    teacherNum: 16, // أحمد محمود
    name: 'الرياضيات - ا/ احمد محمود',
    packages: ['PUBLIC'],
    schedule: [
      { day: 'sunday', start_time: '17:00', end_time: '18:00' },
      { day: 'wednesday', start_time: '17:00', end_time: '18:00' },
    ],
  },
  {
    gradeOrder: 5,
    subjectKey: 'MATH_AR',
    teacherNum: 17, // أدهم هاني
    name: 'الرياضيات - ا/ ادهم هاني',
    packages: ['PUBLIC'],
    schedule: [
      { day: 'sunday', start_time: '17:00', end_time: '18:00' },
      { day: 'wednesday', start_time: '17:00', end_time: '18:00' },
    ],
  },
  {
    gradeOrder: 5,
    subjectKey: 'MATH_EN',
    teacherNum: 21, // أسماء
    name: 'Math (لغات) - ميس/ اسماء',
    packages: ['LANGUAGES'],
    schedule: [
      { day: 'wednesday', start_time: '17:00', end_time: '18:30' },
    ],
  },
  {
    gradeOrder: 5,
    subjectKey: 'MATH_EN',
    teacherNum: 22, // أحمد نبيل
    name: 'Math (لغات) - ا/ احمد نبيل',
    packages: ['LANGUAGES'],
    schedule: [
      { day: 'wednesday', start_time: '19:00', end_time: '20:30' },
    ],
  },
  {
    gradeOrder: 5,
    subjectKey: 'SCIENCE_AR',
    teacherNum: 25, // حازم
    name: 'العلوم - ا/ حازم',
    packages: ['PUBLIC'],
    schedule: [
      { day: 'sunday', start_time: '18:00', end_time: '19:00' },
      { day: 'wednesday', start_time: '18:00', end_time: '19:00' },
    ],
  },
  {
    gradeOrder: 5,
    subjectKey: 'SCIENCE_AR',
    teacherNum: 26, // أحمد عثمان
    name: 'العلوم - ا/ احمد عثمان',
    packages: ['PUBLIC'],
    schedule: [
      { day: 'monday', start_time: '20:00', end_time: '21:00' },
      { day: 'thursday', start_time: '20:00', end_time: '21:00' },
    ],
  },
  {
    gradeOrder: 5,
    subjectKey: 'SCIENCE_EN',
    teacherNum: 29, // إيناس
    name: 'Science (لغات) - ميس/ ايناس',
    packages: ['LANGUAGES'],
    schedule: [
      { day: 'sunday', start_time: '19:00', end_time: '20:30' },
    ],
  },
  {
    gradeOrder: 5,
    subjectKey: 'SCIENCE_EN',
    teacherNum: 30, // أدهم إمبابي
    name: 'Science (لغات) - ا/ ادهم امبابي',
    packages: ['LANGUAGES'],
    schedule: [
      { day: 'sunday', start_time: '17:00', end_time: '18:30' },
    ],
  },
  {
    gradeOrder: 5,
    subjectKey: 'SOCIAL',
    teacherNum: 33, // شيماء
    name: 'الدراسات الاجتماعية - ميس/ شيماء',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'monday', start_time: '19:00', end_time: '20:00' },
      { day: 'thursday', start_time: '17:00', end_time: '18:00' },
    ],
  },
  {
    gradeOrder: 5,
    subjectKey: 'SOCIAL',
    teacherNum: 34, // محمود رشاد
    name: 'الدراسات الاجتماعية - ا/ محمود رشاد',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'monday', start_time: '19:00', end_time: '20:00' },
      { day: 'thursday', start_time: '17:00', end_time: '18:00' },
    ],
  },
  {
    gradeOrder: 5,
    subjectKey: 'IT_AR',
    teacherNum: 38, // هبة
    name: 'تكنولوجيا المعلومات (عربي) - ميس/ هبة',
    packages: ['PUBLIC'],
    schedule: [
      { day: 'tuesday', start_time: '17:00', end_time: '18:00' },
    ],
  },
  {
    gradeOrder: 5,
    subjectKey: 'ICT_EN',
    teacherNum: 39, // نهلة
    name: 'ICT (لغات) - ميس/ نهلة',
    packages: ['LANGUAGES'],
    schedule: [
      { day: 'tuesday', start_time: '17:00', end_time: '18:00' },
    ],
  },
  {
    gradeOrder: 5,
    subjectKey: 'RELIGION',
    teacherNum: 8, // صفية
    name: 'التربية الدينية - ا/ صفية',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'tuesday', start_time: '19:00', end_time: '20:00' },
    ],
  },

  // ==========================================================================
  // المرحلة: الصف السادس الابتدائي (gradeOrder: 6)
  // ==========================================================================
  {
    gradeOrder: 6,
    subjectKey: 'ARABIC',
    teacherNum: 1, // مروان
    name: 'اللغة العربية - ا/ مروان',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'saturday', start_time: '18:00', end_time: '19:00' },
      { day: 'tuesday', start_time: '19:00', end_time: '20:00' },
    ],
  },
  {
    gradeOrder: 6,
    subjectKey: 'ARABIC',
    teacherNum: 2, // دنيا
    name: 'اللغة العربية - ميس/ دنيا',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'saturday', start_time: '18:00', end_time: '19:00' },
      { day: 'tuesday', start_time: '19:00', end_time: '20:00' },
    ],
  },
  {
    gradeOrder: 6,
    subjectKey: 'ENGLISH',
    teacherNum: 9, // آلاء علاء
    name: 'اللغة الانجليزية - ميس/ الاء علاء',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'friday', start_time: '16:00', end_time: '17:00' },
      { day: 'saturday', start_time: '19:00', end_time: '21:00' },
    ],
  },
  {
    gradeOrder: 6,
    subjectKey: 'ENGLISH',
    teacherNum: 10, // سالي
    name: 'اللغة الانجليزية - ا/ سالي',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'monday', start_time: '19:00', end_time: '20:00' },
      { day: 'thursday', start_time: '20:00', end_time: '21:00' },
    ],
  },
  {
    gradeOrder: 6,
    subjectKey: 'MATH_AR',
    teacherNum: 16, // أحمد محمود
    name: 'الرياضيات - ا/ احمد محمود',
    packages: ['PUBLIC'],
    schedule: [
      { day: 'sunday', start_time: '18:00', end_time: '19:00' },
      { day: 'wednesday', start_time: '18:00', end_time: '19:00' },
    ],
  },
  {
    gradeOrder: 6,
    subjectKey: 'MATH_AR',
    teacherNum: 17, // أدهم هاني
    name: 'الرياضيات - ا/ ادهم هاني',
    packages: ['PUBLIC'],
    schedule: [
      { day: 'sunday', start_time: '18:00', end_time: '19:00' },
      { day: 'wednesday', start_time: '18:00', end_time: '19:00' },
    ],
  },
  {
    gradeOrder: 6,
    subjectKey: 'MATH_EN',
    teacherNum: 21, // أسماء
    name: 'Math (لغات) - ميس/ اسماء',
    packages: ['LANGUAGES'],
    schedule: [
      { day: 'wednesday', start_time: '15:00', end_time: '16:30' },
    ],
  },
  {
    gradeOrder: 6,
    subjectKey: 'MATH_EN',
    teacherNum: 22, // أحمد نبيل
    name: 'Math (لغات) - ا/ احمد نبيل',
    packages: ['LANGUAGES'],
    schedule: [
      { day: 'sunday', start_time: '19:00', end_time: '20:30' },
    ],
  },
  {
    gradeOrder: 6,
    subjectKey: 'SCIENCE_AR',
    teacherNum: 25, // حازم
    name: 'العلوم - ا/ حازم',
    packages: ['PUBLIC'],
    schedule: [
      { day: 'sunday', start_time: '19:00', end_time: '20:00' },
      { day: 'wednesday', start_time: '19:00', end_time: '20:00' },
    ],
  },
  {
    gradeOrder: 6,
    subjectKey: 'SCIENCE_AR',
    teacherNum: 26, // أحمد عثمان
    name: 'العلوم - ا/ احمد عثمان',
    packages: ['PUBLIC'],
    schedule: [
      { day: 'monday', start_time: '17:00', end_time: '18:00' },
      { day: 'thursday', start_time: '18:00', end_time: '19:00' },
    ],
  },
  {
    gradeOrder: 6,
    subjectKey: 'SCIENCE_EN',
    teacherNum: 29, // إيناس
    name: 'Science (لغات) - ميس/ ايناس',
    packages: ['LANGUAGES'],
    schedule: [
      { day: 'thursday', start_time: '17:00', end_time: '18:30' },
    ],
  },
  {
    gradeOrder: 6,
    subjectKey: 'SOCIAL',
    teacherNum: 33, // شيماء
    name: 'الدراسات الاجتماعية - ميس/ شيماء',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'monday', start_time: '18:00', end_time: '19:00' },
      { day: 'thursday', start_time: '19:00', end_time: '20:00' },
    ],
  },
  {
    gradeOrder: 6,
    subjectKey: 'SOCIAL',
    teacherNum: 34, // محمود رشاد
    name: 'الدراسات الاجتماعية - ا/ محمود رشاد',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'monday', start_time: '18:00', end_time: '19:00' },
      { day: 'thursday', start_time: '19:00', end_time: '20:00' },
    ],
  },
  {
    gradeOrder: 6,
    subjectKey: 'IT_AR',
    teacherNum: 38, // هبة
    name: 'تكنولوجيا المعلومات (عربي) - ميس/ هبة',
    packages: ['PUBLIC'],
    schedule: [
      { day: 'tuesday', start_time: '20:00', end_time: '21:00' },
    ],
  },
  {
    gradeOrder: 6,
    subjectKey: 'ICT_EN',
    teacherNum: 39, // نهلة
    name: 'ICT (لغات) - ميس/ نهلة',
    packages: ['LANGUAGES'],
    schedule: [
      { day: 'tuesday', start_time: '20:00', end_time: '21:00' },
    ],
  },
  {
    gradeOrder: 6,
    subjectKey: 'RELIGION',
    teacherNum: 8, // صفية
    name: 'التربية الدينية (عام) - ا/ صفية',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'wednesday', start_time: '17:00', end_time: '18:00' },
    ],
  },

  // ==========================================================================
  // المرحلة: الصف الأول الإعدادي (gradeOrder: 7)
  // ==========================================================================
  {
    gradeOrder: 7,
    subjectKey: 'ARABIC',
    teacherNum: 3, // محمد صلاح عربي
    name: 'اللغة العربية (عام) - ا/ محمد صلاح عربي',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'sunday', start_time: '18:30', end_time: '19:30' },
      { day: 'wednesday', start_time: '18:30', end_time: '19:30' },
    ],
  },
  {
    gradeOrder: 7,
    subjectKey: 'ARABIC',
    teacherNum: 4, // ياسمين حسن
    name: 'اللغة العربية (أزهر) - ميس/ ياسمين حسن',
    packages: ['PUBLIC'],
    schedule: [
      { day: 'thursday', start_time: '16:00', end_time: '17:30' },
    ],
  },
  {
    gradeOrder: 7,
    subjectKey: 'SHARIA',
    teacherNum: 6, // آلاء محمد
    name: 'الشرعي (أزهر) - ا/ الاء محمد',
    packages: ['PUBLIC'],
    schedule: [
      { day: 'friday', start_time: '09:00', end_time: '10:00' },
    ],
  },
  {
    gradeOrder: 7,
    subjectKey: 'ENGLISH',
    teacherNum: 11, // محمد علاء (عام)
    name: 'اللغة الانجليزية (عام) - ا/ محمد علاء',
    packages: ['PUBLIC'],
    schedule: [
      { day: 'saturday', start_time: '18:00', end_time: '19:00' },
      { day: 'tuesday', start_time: '18:00', end_time: '19:00' },
    ],
  },
  {
    gradeOrder: 7,
    subjectKey: 'ENGLISH',
    teacherNum: 11, // محمد علاء (لغات)
    name: 'اللغة الانجليزية (لغات) - ا/ محمد علاء',
    packages: ['LANGUAGES'],
    schedule: [
      { day: 'friday', start_time: '10:00', end_time: '11:00' },
      { day: 'saturday', start_time: '18:00', end_time: '19:00' },
      { day: 'tuesday', start_time: '18:00', end_time: '19:00' },
    ],
  },
  {
    gradeOrder: 7,
    subjectKey: 'ENGLISH',
    teacherNum: 12, // صبحي محمد
    name: 'اللغة الانجليزية - ا/ صبحي محمد',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'saturday', start_time: '18:00', end_time: '19:00' },
      { day: 'tuesday', start_time: '18:00', end_time: '19:00' },
    ],
  },
  {
    gradeOrder: 7,
    subjectKey: 'FRENCH',
    teacherNum: 15, // خالد النصيري
    name: 'اللغة الفرنسية - مسيو/ خالد النصيري',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'tuesday', start_time: '20:00', end_time: '21:00' },
    ],
  },
  {
    gradeOrder: 7,
    subjectKey: 'MATH_AR',
    teacherNum: 18, // محمد بكير
    name: 'الرياضيات - ا/ محمد بكير',
    packages: ['PUBLIC'],
    schedule: [
      { day: 'monday', start_time: '19:00', end_time: '20:00' },
      { day: 'thursday', start_time: '19:00', end_time: '20:00' },
    ],
  },
  {
    gradeOrder: 7,
    subjectKey: 'MATH_AR',
    teacherNum: 19, // محمد عادل
    name: 'الرياضيات - ا/ محمد عادل',
    packages: ['PUBLIC'],
    schedule: [
      { day: 'monday', start_time: '19:00', end_time: '20:00' },
      { day: 'thursday', start_time: '19:00', end_time: '20:00' },
    ],
  },
  {
    gradeOrder: 7,
    subjectKey: 'MATH_EN',
    teacherNum: 21, // أسماء
    name: 'Math (لغات) - ميس/ اسماء',
    packages: ['LANGUAGES'],
    schedule: [
      { day: 'monday', start_time: '17:00', end_time: '18:30' },
    ],
  },
  {
    gradeOrder: 7,
    subjectKey: 'MATH_EN',
    teacherNum: 22, // أحمد نبيل
    name: 'Math (لغات) - ا/ احمد نبيل',
    packages: ['LANGUAGES'],
    schedule: [
      { day: 'wednesday', start_time: '16:00', end_time: '17:30' },
    ],
  },
  {
    gradeOrder: 7,
    subjectKey: 'SCIENCE_AR',
    teacherNum: 27, // آية آدم
    name: 'العلوم - ميس/ اية ادم',
    packages: ['PUBLIC'],
    schedule: [
      { day: 'saturday', start_time: '19:00', end_time: '20:00' },
      { day: 'tuesday', start_time: '19:00', end_time: '20:00' },
    ],
  },
  {
    gradeOrder: 7,
    subjectKey: 'SCIENCE_AR',
    teacherNum: 26, // أحمد عثمان
    name: 'العلوم - ا/ احمد عثمان',
    packages: ['PUBLIC'],
    schedule: [
      { day: 'saturday', start_time: '19:00', end_time: '20:00' },
      { day: 'tuesday', start_time: '19:00', end_time: '20:00' },
    ],
  },
  {
    gradeOrder: 7,
    subjectKey: 'SCIENCE_AR',
    teacherNum: 28, // أحمد عبد الله
    name: 'العلوم - ا/ احمد عبد الله',
    packages: ['PUBLIC'],
    schedule: [
      { day: 'saturday', start_time: '19:00', end_time: '20:00' },
      { day: 'tuesday', start_time: '19:00', end_time: '20:00' },
    ],
  },
  {
    gradeOrder: 7,
    subjectKey: 'SCIENCE_EN',
    teacherNum: 31, // إسلام عبد الجليل
    name: 'Science (لغات) - ا/ اسلام عبد الجليل',
    packages: ['LANGUAGES'],
    schedule: [
      { day: 'saturday', start_time: '19:00', end_time: '20:30' },
    ],
  },
  {
    gradeOrder: 7,
    subjectKey: 'SCIENCE_EN',
    teacherNum: 32, // محمد العربي
    name: 'Science (لغات) - ا/ محمد العربي',
    packages: ['LANGUAGES'],
    schedule: [
      { day: 'saturday', start_time: '15:00', end_time: '16:30' },
    ],
  },
  {
    gradeOrder: 7,
    subjectKey: 'SOCIAL',
    teacherNum: 35, // محمد سعيد دراسات
    name: 'الدراسات الاجتماعية - ا/ محمد سعيد دراسات',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'sunday', start_time: '17:30', end_time: '18:30' },
      { day: 'wednesday', start_time: '17:30', end_time: '18:30' },
    ],
  },
  {
    gradeOrder: 7,
    subjectKey: 'SOCIAL',
    teacherNum: 36, // محمود طارق
    name: 'الدراسات الاجتماعية - ا/ محمود طارق',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'sunday', start_time: '19:30', end_time: '20:30' },
      { day: 'wednesday', start_time: '19:30', end_time: '20:30' },
    ],
  },
  {
    gradeOrder: 7,
    subjectKey: 'ICT_EN',
    teacherNum: 39, // نهلة
    name: 'ICT - ميس/ نهلة',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'tuesday', start_time: '19:00', end_time: '20:00' },
    ],
  },

  // ==========================================================================
  // المرحلة: الصف الثاني الإعدادي (gradeOrder: 8)
  // ==========================================================================
  {
    gradeOrder: 8,
    subjectKey: 'ARABIC',
    teacherNum: 3, // محمد صلاح عربي
    name: 'اللغة العربية (عام) - ا/ محمد صلاح عربي',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'sunday', start_time: '17:30', end_time: '18:30' },
      { day: 'wednesday', start_time: '17:30', end_time: '18:30' },
    ],
  },
  {
    gradeOrder: 8,
    subjectKey: 'ARABIC',
    teacherNum: 4, // ياسمين حسن
    name: 'اللغة العربية (أزهر) - ميس/ ياسمين حسن',
    packages: ['PUBLIC'],
    schedule: [
      { day: 'monday', start_time: '18:00', end_time: '19:00' },
      { day: 'thursday', start_time: '18:00', end_time: '19:00' },
    ],
  },
  {
    gradeOrder: 8,
    subjectKey: 'SHARIA',
    teacherNum: 6, // آلاء محمد
    name: 'الشرعي (أزهر) - ا/ الاء محمد',
    packages: ['PUBLIC'],
    schedule: [
      { day: 'friday', start_time: '10:00', end_time: '11:00' },
    ],
  },
  {
    gradeOrder: 8,
    subjectKey: 'ENGLISH',
    teacherNum: 11, // محمد علاء (عام)
    name: 'اللغة الانجليزية (عام) - ا/ محمد علاء',
    packages: ['PUBLIC'],
    schedule: [
      { day: 'saturday', start_time: '17:00', end_time: '18:00' },
      { day: 'tuesday', start_time: '17:00', end_time: '18:00' },
    ],
  },
  {
    gradeOrder: 8,
    subjectKey: 'ENGLISH',
    teacherNum: 11, // محمد علاء (لغات)
    name: 'اللغة الانجليزية (لغات) - ا/ محمد علاء',
    packages: ['LANGUAGES'],
    schedule: [
      { day: 'friday', start_time: '11:00', end_time: '12:00' },
      { day: 'saturday', start_time: '17:00', end_time: '18:00' },
      { day: 'tuesday', start_time: '17:00', end_time: '18:00' },
    ],
  },
  {
    gradeOrder: 8,
    subjectKey: 'ENGLISH',
    teacherNum: 12, // صبحي محمد
    name: 'اللغة الانجليزية - ا/ صبحي محمد',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'saturday', start_time: '17:00', end_time: '18:00' },
      { day: 'tuesday', start_time: '17:00', end_time: '18:00' },
    ],
  },
  {
    gradeOrder: 8,
    subjectKey: 'FRENCH',
    teacherNum: 15, // خالد النصيري
    name: 'اللغة الفرنسية - مسيو/ خالد النصيري',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'tuesday', start_time: '19:00', end_time: '20:00' },
    ],
  },
  {
    gradeOrder: 8,
    subjectKey: 'MATH_AR',
    teacherNum: 19, // محمد عادل
    name: 'الرياضيات - ا/ محمد عادل',
    packages: ['PUBLIC'],
    schedule: [
      { day: 'monday', start_time: '20:00', end_time: '21:00' },
      { day: 'thursday', start_time: '20:00', end_time: '21:00' },
    ],
  },
  {
    gradeOrder: 8,
    subjectKey: 'MATH_AR',
    teacherNum: 18, // محمد بكير
    name: 'الرياضيات - ا/ محمد بكير',
    packages: ['PUBLIC'],
    schedule: [
      { day: 'monday', start_time: '20:00', end_time: '21:00' },
      { day: 'thursday', start_time: '20:00', end_time: '21:00' },
    ],
  },
  {
    gradeOrder: 8,
    subjectKey: 'MATH_EN',
    teacherNum: 23, // محمود الرفاعي
    name: 'Math (لغات) - ا/ محمود الرفاعي',
    packages: ['LANGUAGES'],
    schedule: [
      { day: 'wednesday', start_time: '19:00', end_time: '20:30' },
    ],
  },
  {
    gradeOrder: 8,
    subjectKey: 'SCIENCE_AR',
    teacherNum: 27, // آية آدم
    name: 'العلوم - ميس/ اية ادم',
    packages: ['PUBLIC'],
    schedule: [
      { day: 'saturday', start_time: '18:00', end_time: '19:00' },
      { day: 'tuesday', start_time: '18:00', end_time: '19:00' },
    ],
  },
  {
    gradeOrder: 8,
    subjectKey: 'SCIENCE_AR',
    teacherNum: 28, // أحمد عبد الله
    name: 'العلوم - ا/ احمد عبد الله',
    packages: ['PUBLIC'],
    schedule: [
      { day: 'saturday', start_time: '18:00', end_time: '19:00' },
      { day: 'tuesday', start_time: '18:00', end_time: '19:00' },
    ],
  },
  {
    gradeOrder: 8,
    subjectKey: 'SCIENCE_AR',
    teacherNum: 26, // أحمد عثمان
    name: 'العلوم - ا/ احمد عثمان',
    packages: ['PUBLIC'],
    schedule: [
      { day: 'monday', start_time: '19:00', end_time: '20:00' },
      { day: 'thursday', start_time: '19:00', end_time: '20:00' },
    ],
  },
  {
    gradeOrder: 8,
    subjectKey: 'SCIENCE_EN',
    teacherNum: 31, // إسلام عبد الجليل
    name: 'Science (لغات) - ا/ اسلام عبد الجليل',
    packages: ['LANGUAGES'],
    schedule: [
      { day: 'saturday', start_time: '15:00', end_time: '16:30' },
    ],
  },
  {
    gradeOrder: 8,
    subjectKey: 'SOCIAL',
    teacherNum: 35, // محمد سعيد دراسات
    name: 'الدراسات الاجتماعية - ا/ محمد سعيد دراسات',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'sunday', start_time: '16:30', end_time: '17:30' },
      { day: 'wednesday', start_time: '16:30', end_time: '17:30' },
    ],
  },
  {
    gradeOrder: 8,
    subjectKey: 'SOCIAL',
    teacherNum: 36, // محمود طارق
    name: 'الدراسات الاجتماعية - ا/ محمود طارق',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'sunday', start_time: '18:30', end_time: '19:30' },
      { day: 'wednesday', start_time: '18:30', end_time: '19:30' },
    ],
  },
  {
    gradeOrder: 8,
    subjectKey: 'ICT_EN',
    teacherNum: 39, // نهلة
    name: 'ICT - ميس/ نهلة',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'tuesday', start_time: '18:00', end_time: '19:00' },
    ],
  },

  // ==========================================================================
  // المرحلة: الصف الثالث الإعدادي (gradeOrder: 9)
  // ==========================================================================
  {
    gradeOrder: 9,
    subjectKey: 'ARABIC',
    teacherNum: 3, // محمد صلاح عربي
    name: 'اللغة العربية (عام) - ا/ محمد صلاح عربي',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'sunday', start_time: '16:30', end_time: '17:30' },
      { day: 'wednesday', start_time: '16:30', end_time: '17:30' },
    ],
  },
  {
    gradeOrder: 9,
    subjectKey: 'ARABIC',
    teacherNum: 3, // محمد صلاح عربي (أزهر)
    name: 'اللغة العربية (أزهر) - ا/ محمد صلاح عربي',
    packages: ['PUBLIC'],
    schedule: [
      { day: 'wednesday', start_time: '14:30', end_time: '16:00' },
    ],
  },
  {
    gradeOrder: 9,
    subjectKey: 'SHARIA',
    teacherNum: 7, // إسلام جمال
    name: 'الشرعي (أزهر) - ا/ اسلام جمال',
    packages: ['PUBLIC'],
    schedule: [
      { day: 'thursday', start_time: '16:00', end_time: '17:30' },
    ],
  },
  {
    gradeOrder: 9,
    subjectKey: 'ENGLISH',
    teacherNum: 11, // محمد علاء (عام)
    name: 'اللغة الانجليزية (عام) - ا/ محمد علاء',
    packages: ['PUBLIC'],
    schedule: [
      { day: 'saturday', start_time: '16:00', end_time: '17:00' },
      { day: 'tuesday', start_time: '16:00', end_time: '17:00' },
    ],
  },
  {
    gradeOrder: 9,
    subjectKey: 'ENGLISH',
    teacherNum: 11, // محمد علاء (لغات)
    name: 'اللغة الانجليزية (لغات) - ا/ محمد علاء',
    packages: ['LANGUAGES'],
    schedule: [
      { day: 'friday', start_time: '12:00', end_time: '13:00' },
      { day: 'saturday', start_time: '16:00', end_time: '17:00' },
      { day: 'tuesday', start_time: '16:00', end_time: '17:00' },
    ],
  },
  {
    gradeOrder: 9,
    subjectKey: 'ENGLISH',
    teacherNum: 12, // صبحي محمد
    name: 'اللغة الانجليزية - ا/ صبحي محمد',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'saturday', start_time: '16:00', end_time: '17:00' },
      { day: 'tuesday', start_time: '16:00', end_time: '17:00' },
    ],
  },
  {
    gradeOrder: 9,
    subjectKey: 'FRENCH',
    teacherNum: 15, // خالد النصيري
    name: 'اللغة الفرنسية - مسيو/ خالد النصيري',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'saturday', start_time: '15:00', end_time: '16:00' },
    ],
  },
  {
    gradeOrder: 9,
    subjectKey: 'MATH_AR',
    teacherNum: 19, // محمد عادل
    name: 'الرياضيات - ا/ محمد عادل',
    packages: ['PUBLIC'],
    schedule: [
      { day: 'monday', start_time: '18:00', end_time: '19:00' },
      { day: 'thursday', start_time: '18:00', end_time: '19:00' },
    ],
  },
  {
    gradeOrder: 9,
    subjectKey: 'MATH_AR',
    teacherNum: 18, // محمد بكير
    name: 'الرياضيات - ا/ محمد بكير',
    packages: ['PUBLIC'],
    schedule: [
      { day: 'monday', start_time: '18:00', end_time: '19:00' },
      { day: 'thursday', start_time: '18:00', end_time: '19:00' },
    ],
  },
  {
    gradeOrder: 9,
    subjectKey: 'MATH_EN',
    teacherNum: 23, // محمود الرفاعي
    name: 'Math (لغات) - ا/ محمود الرفاعي',
    packages: ['LANGUAGES'],
    schedule: [
      { day: 'wednesday', start_time: '13:30', end_time: '15:00' },
    ],
  },
  {
    gradeOrder: 9,
    subjectKey: 'SCIENCE_AR',
    teacherNum: 27, // آية آدم
    name: 'العلوم - ميس/ اية ادم',
    packages: ['PUBLIC'],
    schedule: [
      { day: 'saturday', start_time: '17:00', end_time: '18:00' },
      { day: 'tuesday', start_time: '17:00', end_time: '18:00' },
    ],
  },
  {
    gradeOrder: 9,
    subjectKey: 'SCIENCE_AR',
    teacherNum: 28, // أحمد عبد الله
    name: 'العلوم - ا/ احمد عبد الله',
    packages: ['PUBLIC'],
    schedule: [
      { day: 'saturday', start_time: '17:00', end_time: '18:00' },
      { day: 'tuesday', start_time: '17:00', end_time: '18:00' },
    ],
  },
  {
    gradeOrder: 9,
    subjectKey: 'SCIENCE_EN',
    teacherNum: 31, // إسلام عبد الجليل
    name: 'Science (لغات) - ا/ اسلام عبد الجليل',
    packages: ['LANGUAGES'],
    schedule: [
      { day: 'saturday', start_time: '17:00', end_time: '18:30' },
    ],
  },
  {
    gradeOrder: 9,
    subjectKey: 'SCIENCE_EN',
    teacherNum: 32, // محمد العربي
    name: 'Science (لغات) - ا/ محمد العربي',
    packages: ['LANGUAGES'],
    schedule: [
      { day: 'thursday', start_time: '15:00', end_time: '17:00' },
    ],
  },
  {
    gradeOrder: 9,
    subjectKey: 'SOCIAL',
    teacherNum: 35, // محمد سعيد دراسات
    name: 'الدراسات الاجتماعية (عام) - ا/ محمد سعيد دراسات',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'sunday', start_time: '15:30', end_time: '16:30' },
      { day: 'wednesday', start_time: '15:30', end_time: '16:30' },
    ],
  },
  {
    gradeOrder: 9,
    subjectKey: 'SOCIAL',
    teacherNum: 36, // محمود طارق
    name: 'الدراسات الاجتماعية (عام) - ا/ محمود طارق',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'sunday', start_time: '17:30', end_time: '18:30' },
      { day: 'wednesday', start_time: '17:30', end_time: '18:30' },
    ],
  },
  {
    gradeOrder: 9,
    subjectKey: 'ICT_EN',
    teacherNum: 39, // نهلة
    name: 'ICT - ميس/ نهلة',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'tuesday', start_time: '15:00', end_time: '16:00' },
    ],
  },

  // ==========================================================================
  // المرحلة: الصف الأول الثانوي (gradeOrder: 10)
  // ==========================================================================
  {
    gradeOrder: 10,
    subjectKey: 'ARABIC',
    teacherNum: 5, // الغزالي
    name: 'اللغة العربية - ا/ الغزالي',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'tuesday', start_time: '17:00', end_time: '19:00' },
    ],
  },
  {
    gradeOrder: 10,
    subjectKey: 'ENGLISH',
    teacherNum: 13, // الشاذلي
    name: 'اللغة الانجليزية - ا/ الشاذلي',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'sunday', start_time: '17:00', end_time: '19:00' },
    ],
  },
  {
    gradeOrder: 10,
    subjectKey: 'ENGLISH',
    teacherNum: 14, // أدهم أبو الصفا
    name: 'اللغة الانجليزية - ا/ ادهم ابو الصفا',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'tuesday', start_time: '19:00', end_time: '21:00' },
    ],
  },
  {
    gradeOrder: 10,
    subjectKey: 'ENGLISH',
    teacherNum: 12, // صبحي محمد
    name: 'اللغة الانجليزية - ا/ صبحي محمد',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'tuesday', start_time: '19:00', end_time: '21:00' },
    ],
  },
  {
    gradeOrder: 10,
    subjectKey: 'FRENCH',
    teacherNum: 15, // خالد النصيري
    name: 'اللغة الفرنسية - مسيو/ خالد النصيري',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'monday', start_time: '19:00', end_time: '21:00' },
    ],
  },
  {
    gradeOrder: 10,
    subjectKey: 'MATH_AR',
    teacherNum: 20, // محمد يوسف
    name: 'الرياضيات - ا/ محمد يوسف',
    packages: ['PUBLIC'],
    schedule: [
      { day: 'wednesday', start_time: '19:00', end_time: '21:00' },
    ],
  },
  {
    gradeOrder: 10,
    subjectKey: 'MATH_EN',
    teacherNum: 24, // عمر جمال
    name: 'Math (لغات) - ا/ عمر جمال',
    packages: ['LANGUAGES'],
    schedule: [
      { day: 'thursday', start_time: '17:00', end_time: '19:00' },
    ],
  },
  {
    gradeOrder: 10,
    subjectKey: 'INTEGRATED_SCI_AR',
    teacherNum: 27, // آية آدم
    name: 'العلوم المتكاملة (عربي) - ميس/ اية ادم',
    packages: ['PUBLIC'],
    schedule: [
      { day: 'wednesday', start_time: '17:00', end_time: '19:00' },
    ],
  },
  {
    gradeOrder: 10,
    subjectKey: 'INTEGRATED_SCI_EN',
    teacherNum: 32, // محمد العربي
    name: 'Integrated Science (لغات) - ا/ محمد العربي',
    packages: ['LANGUAGES'],
    schedule: [
      { day: 'wednesday', start_time: '17:00', end_time: '19:00' },
    ],
  },
  {
    gradeOrder: 10,
    subjectKey: 'PROGRAMMING',
    teacherNum: 40, // محمد عاشور (لغات)
    name: 'البرمجة (لغات) - ا/ محمد عاشور',
    packages: ['LANGUAGES'],
    schedule: [
      { day: 'monday', start_time: '17:00', end_time: '19:00' },
    ],
  },
  {
    gradeOrder: 10,
    subjectKey: 'PROGRAMMING',
    teacherNum: 40, // محمد عاشور (عربي)
    name: 'البرمجة (عربي) - ا/ محمد عاشور',
    packages: ['PUBLIC'],
    schedule: [
      { day: 'thursday', start_time: '17:00', end_time: '19:00' },
    ],
  },
  {
    gradeOrder: 10,
    subjectKey: 'PHILOSOPHY',
    teacherNum: 41, // محمد صلاح فلسفة
    name: 'الفلسفة والمنطق - ا/ محمد صلاح فلسفة',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'saturday', start_time: '19:00', end_time: '21:00' },
    ],
  },
  {
    gradeOrder: 10,
    subjectKey: 'PHILOSOPHY',
    teacherNum: 42, // علي فؤاد
    name: 'الفلسفة والمنطق - ا/ علي فؤاد',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'saturday', start_time: '19:00', end_time: '21:00' },
    ],
  },
  {
    gradeOrder: 10,
    subjectKey: 'HISTORY',
    teacherNum: 37, // أيمن سليمان
    name: 'التاريخ - ا/ ايمن سليمان',
    packages: ['PUBLIC', 'LANGUAGES'],
    schedule: [
      { day: 'thursday', start_time: '19:00', end_time: '21:00' },
    ],
  },
];

// ============================================================================
// 4. PRIVATE GROUPS & TIMETABLES (is_private = true, NOT in package_groups)
// ============================================================================
const PRIVATE_GROUPS_LIST = [
  // ==========================================================================
  // جدول البرايفت - يوم الجمعة
  // ==========================================================================
  {
    gradeOrder: 8, // 2 ع
    subjectKey: 'ENGLISH',
    teacherNum: 12, // صبحي محمد
    name: 'اللغة الانجليزية (برايفت - الجمعة) - ا/ صبحي محمد',
    price_per_month: 210,
    price_per_session: 0,
    schedule: [{ day: 'friday', start_time: '12:00', end_time: '13:30' }],
  },

  // ==========================================================================
  // جدول البرايفت - يوم السبت (+ المجموعات المشتركة سبت وثلاثاء)
  // ==========================================================================
  // --- المدرس: محمد علاء | اللغة الإنجليزية ---
  {
    gradeOrder: 11, // 2 ث بكالوريا
    subjectKey: 'ENGLISH',
    teacherNum: 11, // محمد علاء
    name: 'اللغة الانجليزية (2 ث بكالوريا - برايفت - السبت 8:00) - ا/ محمد علاء',
    price_per_month: 310,
    price_per_session: 0,
    schedule: [{ day: 'saturday', start_time: '08:00', end_time: '10:00' }],
  },
  {
    gradeOrder: 11, // 2 ث عام
    subjectKey: 'ENGLISH',
    teacherNum: 11, // محمد علاء
    name: 'اللغة الانجليزية (2 ث عام - برايفت - السبت 12:00 ظ) - ا/ محمد علاء',
    price_per_month: 260,
    price_per_session: 0,
    schedule: [{ day: 'saturday', start_time: '12:00', end_time: '14:00' }],
  },
  {
    gradeOrder: 7, // 1 ع (سبت وثلاثاء 6:00 مساءً)
    subjectKey: 'ENGLISH',
    teacherNum: 11, // محمد علاء
    name: 'اللغة الانجليزية (برايفت) - ا/ محمد علاء',
    price_per_month: 210,
    price_per_session: 0,
    schedule: [
      { day: 'saturday', start_time: '18:00', end_time: '19:00' },
      { day: 'tuesday', start_time: '18:00', end_time: '19:00' },
    ],
  },
  {
    gradeOrder: 8, // 2 ع (سبت وثلاثاء 5:00 مساءً)
    subjectKey: 'ENGLISH',
    teacherNum: 11, // محمد علاء
    name: 'اللغة الانجليزية (برايفت) - ا/ محمد علاء',
    price_per_month: 210,
    price_per_session: 0,
    schedule: [
      { day: 'saturday', start_time: '17:00', end_time: '18:00' },
      { day: 'tuesday', start_time: '17:00', end_time: '18:00' },
    ],
  },
  {
    gradeOrder: 10, // 1 ث
    subjectKey: 'ENGLISH',
    teacherNum: 11, // محمد علاء
    name: 'اللغة الانجليزية (برايفت - السبت 2:00 ظ) - ا/ محمد علاء',
    price_per_month: 240,
    price_per_session: 0,
    schedule: [{ day: 'saturday', start_time: '14:00', end_time: '16:00' }],
  },

  // --- المدرس: محمد سعيد إنجليزي | اللغة الإنجليزية ---
  {
    gradeOrder: 11, // 2 ث
    subjectKey: 'ENGLISH',
    teacherNum: 43, // محمد سعيد إنجليزي
    name: 'اللغة الانجليزية (برايفت - السبت 8:00) - ا/ محمد سعيد انجليزي',
    price_per_month: 310,
    price_per_session: 0,
    schedule: [{ day: 'saturday', start_time: '08:00', end_time: '10:00' }],
  },
  {
    gradeOrder: 12, // 3 ث
    subjectKey: 'ENGLISH',
    teacherNum: 43, // محمد سعيد إنجليزي
    name: 'اللغة الانجليزية (برايفت - السبت 1:00 ظ) - ا/ محمد سعيد انجليزي',
    price_per_month: 310,
    price_per_session: 0,
    schedule: [{ day: 'saturday', start_time: '13:00', end_time: '15:00' }],
  },

  // --- المدرس: محمد العربي | Bio / Science ---
  {
    gradeOrder: 12, // 3 ث
    subjectKey: 'BIOLOGY',
    teacherNum: 32, // محمد العربي
    name: 'أحياء (Bio - 3 ث - برايفت - السبت 10:00 ص) - ا/ محمد العربي',
    price_per_month: 550,
    price_per_session: 0,
    schedule: [{ day: 'saturday', start_time: '10:00', end_time: '12:00' }],
  },
  {
    gradeOrder: 7, // 1 ع
    subjectKey: 'SCIENCE_EN',
    teacherNum: 32, // محمد العربي
    name: 'Science (برايفت) - ا/ محمد العربي',
    price_per_month: 210,
    price_per_session: 0,
    schedule: [{ day: 'saturday', start_time: '15:00', end_time: '16:30' }],
  },

  // --- المدرس: الزنكلوني | اللغة العربية ---
  {
    gradeOrder: 8, // 2 ع
    subjectKey: 'ARABIC',
    teacherNum: 45, // الزنكلوني
    name: 'اللغة العربية (برايفت) - ا/ الزنكلوني',
    price_per_month: 160,
    price_per_session: 0,
    schedule: [{ day: 'saturday', start_time: '13:30', end_time: '15:00' }],
  },
  {
    gradeOrder: 9, // 3 ع
    subjectKey: 'ARABIC',
    teacherNum: 45, // الزنكلوني
    name: 'اللغة العربية (برايفت) - ا/ الزنكلوني',
    price_per_month: 170,
    price_per_session: 0,
    schedule: [{ day: 'saturday', start_time: '12:00', end_time: '13:30' }],
  },

  // --- المدرس: محمد صلاح عربي | اللغة العربية ---
  {
    gradeOrder: 10, // 1 ث
    subjectKey: 'ARABIC',
    teacherNum: 3, // محمد صلاح عربي
    name: 'اللغة العربية (برايفت) - ا/ محمد صلاح عربي',
    price_per_month: 190,
    price_per_session: 0,
    schedule: [{ day: 'saturday', start_time: '10:00', end_time: '12:00' }],
  },

  // --- المدرس: محمد علام إنجليزي | اللغة الإنجليزية ---
  {
    gradeOrder: 12, // 3 ث
    subjectKey: 'ENGLISH',
    teacherNum: 44, // محمد علام إنجليزي
    name: 'اللغة الانجليزية (برايفت - السبت 1:00 ظ) - ا/ محمد علام انجليزي',
    price_per_month: 310,
    price_per_session: 0,
    schedule: [{ day: 'saturday', start_time: '13:00', end_time: '15:00' }],
  },

  // --- المدرس: إسلام جمال | شرعي (أزهر) ---
  {
    gradeOrder: 12, // 3 ث (حصتين في الأسبوع: السبت 3:00 عصراً + الثلاثاء 3:00 عصراً)
    subjectKey: 'SHARIA',
    teacherNum: 7, // إسلام جمال
    name: 'الشرعي (أزهر - برايفت - 8 حصص) - ا/ اسلام جمال',
    price_per_month: 330,
    price_per_session: 0,
    schedule: [
      { day: 'saturday', start_time: '15:00', end_time: '16:30' },
      { day: 'tuesday', start_time: '15:00', end_time: '16:30' },
    ],
  },

  // --- المدرس: مروان أشرف | اللغة العربية ---
  {
    gradeOrder: 7, // 1 ع
    subjectKey: 'ARABIC',
    teacherNum: 1, // مروان
    name: 'اللغة العربية (برايفت) - ا/ مروان',
    price_per_month: 100,
    price_per_session: 0,
    schedule: [{ day: 'saturday', start_time: '13:30', end_time: '15:00' }],
  },
  {
    gradeOrder: 5, // 5 ب (حصتين في الأسبوع: السبت 5:00 م + الثلاثاء 6:00 م)
    subjectKey: 'ARABIC',
    teacherNum: 1, // مروان
    name: 'اللغة العربية (برايفت - 8 حصص) - ا/ مروان',
    price_per_month: 100,
    price_per_session: 0,
    schedule: [
      { day: 'saturday', start_time: '17:00', end_time: '18:00' },
      { day: 'tuesday', start_time: '18:00', end_time: '19:00' },
    ],
  },
  {
    gradeOrder: 4, // 4 ب (حصتين في الأسبوع: السبت 6:00 م + الثلاثاء 5:00 م)
    subjectKey: 'ARABIC',
    teacherNum: 1, // مروان
    name: 'اللغة العربية (برايفت - 8 حصص) - ا/ مروان',
    price_per_month: 100,
    price_per_session: 0,
    schedule: [
      { day: 'saturday', start_time: '18:00', end_time: '19:00' },
      { day: 'tuesday', start_time: '17:00', end_time: '18:00' },
    ],
  },

  // --- المدرس: إسلام عبد الجليل | Science ---
  {
    gradeOrder: 8, // 2 ع
    subjectKey: 'SCIENCE_EN',
    teacherNum: 31, // إسلام عبد الجليل
    name: 'Science (برايفت) - ا/ اسلام عبد الجليل',
    price_per_month: 10,
    price_per_session: 0,
    schedule: [{ day: 'saturday', start_time: '15:00', end_time: '16:30' }],
  },
  {
    gradeOrder: 9, // 3 ع
    subjectKey: 'SCIENCE_EN',
    teacherNum: 31, // إسلام عبد الجليل
    name: 'Science (برايفت) - ا/ اسلام عبد الجليل',
    price_per_month: 10,
    price_per_session: 0,
    schedule: [{ day: 'saturday', start_time: '16:30', end_time: '18:00' }],
  },
  {
    gradeOrder: 7, // 1 ع
    subjectKey: 'SCIENCE_EN',
    teacherNum: 31, // إسلام عبد الجليل
    name: 'Science (برايفت) - ا/ اسلام عبد الجليل',
    price_per_month: 10,
    price_per_session: 0,
    schedule: [{ day: 'saturday', start_time: '19:00', end_time: '20:30' }],
  },

  // --- المدرس: إسلام موسى | الدراسات الاجتماعية (السبت) ---
  {
    gradeOrder: 4, // 4 ب
    subjectKey: 'SOCIAL',
    teacherNum: 46, // إسلام موسى
    name: 'الدراسات الاجتماعية (برايفت - السبت 1:00 ظ) - ا/ اسلام موسى',
    price_per_month: 35,
    price_per_session: 0,
    schedule: [{ day: 'saturday', start_time: '13:00', end_time: '14:00' }],
  },
  {
    gradeOrder: 6, // 6 ب
    subjectKey: 'SOCIAL',
    teacherNum: 46, // إسلام موسى
    name: 'الدراسات الاجتماعية (برايفت - السبت 3:00 ع) - ا/ اسلام موسى',
    price_per_month: 35,
    price_per_session: 0,
    schedule: [{ day: 'saturday', start_time: '15:00', end_time: '16:00' }],
  },
  {
    gradeOrder: 10, // 1 ث
    subjectKey: 'SOCIAL',
    teacherNum: 46, // إسلام موسى
    name: 'الدراسات الاجتماعية (برايفت - السبت 5:00 م) - ا/ اسلام موسى',
    price_per_month: 35,
    price_per_session: 0,
    schedule: [{ day: 'saturday', start_time: '17:00', end_time: '18:30' }],
  },

  // --- المدرس: محمد صلاح فلسفة | الفلسفة والمنطق ---
  {
    gradeOrder: 11, // 2 ث
    subjectKey: 'PHILOSOPHY',
    teacherNum: 41, // محمد صلاح فلسفة
    name: 'الفلسفة والمنطق (برايفت) - ا/ محمد صلاح فلسفة',
    price_per_month: 310,
    price_per_session: 0,
    schedule: [{ day: 'saturday', start_time: '17:30', end_time: '19:00' }],
  },
  {
    gradeOrder: 10, // 1 ث
    subjectKey: 'PHILOSOPHY',
    teacherNum: 41, // محمد صلاح فلسفة
    name: 'الفلسفة والمنطق (برايفت) - ا/ محمد صلاح فلسفة',
    price_per_month: 210,
    price_per_session: 0,
    schedule: [{ day: 'saturday', start_time: '19:00', end_time: '21:00' }],
  },

  // --- المدرس: محمد سعيد دراسات | الدراسات الاجتماعية (سبت وثلاثاء) ---
  {
    gradeOrder: 8, // 2 ع (حصتين في الأسبوع: السبت 6:30 م + الثلاثاء 6:30 م)
    subjectKey: 'SOCIAL',
    teacherNum: 35, // محمد سعيد دراسات
    name: 'الدراسات الاجتماعية (برايفت - 8 حصص) - ا/ محمد سعيد دراسات',
    price_per_month: 170,
    price_per_session: 0,
    schedule: [
      { day: 'saturday', start_time: '18:30', end_time: '19:30' },
      { day: 'tuesday', start_time: '18:30', end_time: '19:30' },
    ],
  },
  {
    gradeOrder: 7, // 1 ع (حصتين في الأسبوع: السبت 8:00 م + الثلاثاء 7:30 م)
    subjectKey: 'SOCIAL',
    teacherNum: 35, // محمد سعيد دراسات
    name: 'الدراسات الاجتماعية (برايفت - 8 حصص - سبت وثلاثاء) - ا/ محمد سعيد دراسات',
    price_per_month: 170,
    price_per_session: 0,
    schedule: [
      { day: 'saturday', start_time: '20:00', end_time: '21:00' },
      { day: 'tuesday', start_time: '19:30', end_time: '20:30' },
    ],
  },

  // ==========================================================================
  // جدول البرايفت - يوم الأحد
  // ==========================================================================
  // --- المدرس: محمد عاشور | البرمجة ---
  {
    gradeOrder: 11, // 2 ث عربي
    subjectKey: 'PROGRAMMING',
    teacherNum: 40, // محمد عاشور
    name: 'البرمجة (2 ث عربي - برايفت) - ا/ محمد عاشور',
    price_per_month: 325,
    price_per_session: 0,
    schedule: [{ day: 'sunday', start_time: '10:00', end_time: '12:00' }],
  },
  {
    gradeOrder: 10, // 1 ث لغات (الأحد)
    subjectKey: 'PROGRAMMING',
    teacherNum: 40, // محمد عاشور
    name: 'البرمجة (1 ث لغات - برايفت - الأحد 12:00 ظ) - ا/ محمد عاشور',
    price_per_month: 385,
    price_per_session: 0,
    schedule: [{ day: 'sunday', start_time: '12:00', end_time: '14:00' }],
  },

  // --- المدرس: أميرة إنجليزي | اللغة الإنجليزية (الأحد) ---
  {
    gradeOrder: 12, // 3 ث
    subjectKey: 'ENGLISH',
    teacherNum: 47, // أميرة إنجليزي
    name: 'اللغة الانجليزية (3 ث - برايفت - الأحد 12:00 ظ) - ميس/ اميرة انجليزي',
    price_per_month: 400,
    price_per_session: 0,
    schedule: [{ day: 'sunday', start_time: '12:00', end_time: '14:00' }],
  },
  {
    gradeOrder: 10, // 1 ث
    subjectKey: 'ENGLISH',
    teacherNum: 47, // أميرة إنجليزي
    name: 'اللغة الانجليزية (برايفت - الأحد 3:00 ع) - ميس/ اميرة انجليزي',
    price_per_month: 400,
    price_per_session: 0,
    schedule: [{ day: 'sunday', start_time: '15:00', end_time: '17:00' }],
  },

  // --- المدرس: الشاذلي | اللغة الإنجليزية (الأحد) ---
  {
    gradeOrder: 12, // 3 ث
    subjectKey: 'ENGLISH',
    teacherNum: 13, // الشاذلي
    name: 'اللغة الانجليزية (3 ث - برايفت - الأحد 1:00 ظ) - ا/ الشاذلي',
    price_per_month: 310,
    price_per_session: 0,
    schedule: [{ day: 'sunday', start_time: '13:00', end_time: '15:00' }],
  },
  {
    gradeOrder: 10, // 1 ث
    subjectKey: 'ENGLISH',
    teacherNum: 13, // الشاذلي
    name: 'اللغة الانجليزية (برايفت - الأحد 5:00 م) - ا/ الشاذلي',
    price_per_month: 210,
    price_per_session: 0,
    schedule: [{ day: 'sunday', start_time: '17:00', end_time: '19:00' }],
  },

  // --- المدرس: محمد علام إنجليزي | اللغة الإنجليزية (الأحد) ---
  {
    gradeOrder: 10, // 1 ث
    subjectKey: 'ENGLISH',
    teacherNum: 44, // محمد علام إنجليزي
    name: 'اللغة الانجليزية (برايفت - الأحد 3:30 ع) - ا/ محمد علام انجليزي',
    price_per_month: 220,
    price_per_session: 0,
    schedule: [{ day: 'sunday', start_time: '15:30', end_time: '17:30' }],
  },

  // --- المدرس: محمد سعيد إنجليزي | اللغة الإنجليزية (الأحد) ---
  {
    gradeOrder: 10, // 1 ث
    subjectKey: 'ENGLISH',
    teacherNum: 43, // محمد سعيد إنجليزي
    name: 'اللغة الانجليزية (برايفت - الأحد 7:00 م) - ا/ محمد سعيد انجليزي',
    price_per_month: 230,
    price_per_session: 0,
    schedule: [{ day: 'sunday', start_time: '19:00', end_time: '21:00' }],
  },

  // --- المدرس: حازم | العلوم ---
  {
    gradeOrder: 6, // 6 ب (الأحد 7:00 م + الأربعاء 7:00 م)
    subjectKey: 'SCIENCE_AR',
    teacherNum: 25, // حازم
    name: 'العلوم (برايفت) - ا/ حازم',
    price_per_month: 150,
    price_per_session: 0,
    schedule: [
      { day: 'sunday', start_time: '19:00', end_time: '20:00' },
      { day: 'wednesday', start_time: '19:00', end_time: '20:00' },
    ],
  },
  {
    gradeOrder: 5, // 5 ب (الأحد 6:00 م + الأربعاء 6:00 م)
    subjectKey: 'SCIENCE_AR',
    teacherNum: 25, // حازم
    name: 'العلوم (برايفت) - ا/ حازم',
    price_per_month: 150,
    price_per_session: 0,
    schedule: [
      { day: 'sunday', start_time: '18:00', end_time: '19:00' },
      { day: 'wednesday', start_time: '18:00', end_time: '19:00' },
    ],
  },
  {
    gradeOrder: 4, // 4 ب
    subjectKey: 'SCIENCE_AR',
    teacherNum: 25, // حازم
    name: 'العلوم (برايفت) - ا/ حازم',
    price_per_month: 150,
    price_per_session: 0,
    schedule: [{ day: 'sunday', start_time: '17:00', end_time: '18:00' }],
  },

  // --- المدرس: إيناس | Science (الأحد) ---
  {
    gradeOrder: 5, // 5 ب
    subjectKey: 'SCIENCE_EN',
    teacherNum: 29, // إيناس
    name: 'Science (برايفت) - ميس/ ايناس',
    price_per_month: 160,
    price_per_session: 0,
    schedule: [{ day: 'sunday', start_time: '19:00', end_time: '20:30' }],
  },
  {
    gradeOrder: 4, // 4 ب
    subjectKey: 'SCIENCE_EN',
    teacherNum: 29, // إيناس
    name: 'Science (برايفت) - ميس/ ايناس',
    price_per_month: 160,
    price_per_session: 0,
    schedule: [{ day: 'sunday', start_time: '17:00', end_time: '18:30' }],
  },

  // --- المدرس: دنيا | اللغة العربية (الأحد + الثلاثاء) ---
  {
    gradeOrder: 7, // 1 ع
    subjectKey: 'ARABIC',
    teacherNum: 2, // دنيا
    name: 'اللغة العربية (برايفت) - ميس/ دنيا',
    price_per_month: 170,
    price_per_session: 0,
    schedule: [
      { day: 'sunday', start_time: '20:00', end_time: '21:00' },
      { day: 'tuesday', start_time: '20:00', end_time: '21:00' },
    ],
  },

  // ==========================================================================
  // جدول البرايفت - يوم الاثنين
  // ==========================================================================
  // --- المدرس: محمد علاء | اللغة الإنجليزية (الاثنين) ---
  {
    gradeOrder: 12, // 3 ث
    subjectKey: 'ENGLISH',
    teacherNum: 11, // محمد علاء
    name: 'اللغة الانجليزية (3 ث - برايفت - الاثنين 8:30 ص) - ا/ محمد علاء',
    price_per_month: 310,
    price_per_session: 0,
    schedule: [{ day: 'monday', start_time: '08:30', end_time: '10:30' }],
  },

  // --- المدرس: أميرة إنجليزي | اللغة الإنجليزية (الاثنين) ---
  {
    gradeOrder: 12, // 3 ث
    subjectKey: 'ENGLISH',
    teacherNum: 47, // أميرة إنجليزي
    name: 'اللغة الانجليزية (3 ث - برايفت - الاثنين 10:00 ص) - ميس/ اميرة انجليزي',
    price_per_month: 400,
    price_per_session: 0,
    schedule: [{ day: 'monday', start_time: '10:00', end_time: '12:00' }],
  },

  // --- المدرس: محمد علام إنجليزي | اللغة الإنجليزية (الاثنين) ---
  {
    gradeOrder: 11, // 2 ث
    subjectKey: 'ENGLISH',
    teacherNum: 44, // محمد علام إنجليزي
    name: 'اللغة الانجليزية (برايفت - الاثنين 12:30 ظ) - ا/ محمد علام انجليزي',
    price_per_month: 310,
    price_per_session: 0,
    schedule: [{ day: 'monday', start_time: '12:30', end_time: '14:30' }],
  },

  // --- المدرس: ياسمين ماث | Math (الاثنين) ---
  {
    gradeOrder: 4, // 4 ب
    subjectKey: 'MATH_EN',
    teacherNum: 48, // ياسمين ماث
    name: 'Math (برايفت - الاثنين 12:30 ظ) - ميس/ ياسمين ماث',
    price_per_month: 35,
    price_per_session: 0,
    schedule: [{ day: 'monday', start_time: '12:30', end_time: '14:00' }],
  },

  // --- المدرس: محمد سعيد دراسات | الدراسات الاجتماعية (الاثنين والخميس) ---
  {
    gradeOrder: 9, // 3 ع (حصتين في الأسبوع: الاثنين 1:30 ظ + الخميس 1:30 ظ)
    subjectKey: 'SOCIAL',
    teacherNum: 35, // محمد سعيد دراسات
    name: 'الدراسات الاجتماعية (برايفت - 8 حصص) - ا/ محمد سعيد دراسات',
    price_per_month: 170,
    price_per_session: 0,
    schedule: [
      { day: 'monday', start_time: '13:30', end_time: '14:30' },
      { day: 'thursday', start_time: '13:30', end_time: '14:30' },
    ],
  },
  {
    gradeOrder: 7, // 1 ع (الاثنين 6:00 م)
    subjectKey: 'SOCIAL',
    teacherNum: 35, // محمد سعيد دراسات
    name: 'الدراسات الاجتماعية (برايفت - الاثنين 6:00 م) - ا/ محمد سعيد دراسات',
    price_per_month: 210,
    price_per_session: 0,
    schedule: [{ day: 'monday', start_time: '18:00', end_time: '19:30' }],
  },

  // --- المدرس: إسلام موسى | الدراسات الاجتماعية (الاثنين) ---
  {
    gradeOrder: 6, // 6 ب
    subjectKey: 'SOCIAL',
    teacherNum: 46, // إسلام موسى
    name: 'الدراسات الاجتماعية (برايفت - الاثنين 3:00 ع) - ا/ اسلام موسى',
    price_per_month: 35,
    price_per_session: 0,
    schedule: [{ day: 'monday', start_time: '15:00', end_time: '16:00' }],
  },
  {
    gradeOrder: 7, // 1 ع
    subjectKey: 'SOCIAL',
    teacherNum: 46, // إسلام موسى
    name: 'الدراسات الاجتماعية (برايفت - الاثنين 5:00 م) - ا/ اسلام موسى',
    price_per_month: 35,
    price_per_session: 0,
    schedule: [{ day: 'monday', start_time: '17:00', end_time: '18:00' }],
  },

  // --- المدرس: محمد عاشور | البرمجة (الاثنين) ---
  {
    gradeOrder: 10, // 1 ث لغات
    subjectKey: 'PROGRAMMING',
    teacherNum: 40, // محمد عاشور
    name: 'البرمجة (1 ث لغات - برايفت - الاثنين 5:00 م) - ا/ محمد عاشور',
    price_per_month: 210,
    price_per_session: 0,
    schedule: [{ day: 'monday', start_time: '17:00', end_time: '19:00' }],
  },

  // --- المدرس: حازم | العلوم (الاثنين) ---
  {
    gradeOrder: 9, // 3 ع
    subjectKey: 'SCIENCE_AR',
    teacherNum: 25, // حازم
    name: 'العلوم (3 ع - برايفت - الاثنين 7:00 م) - ا/ حازم',
    price_per_month: 190,
    price_per_session: 0,
    schedule: [{ day: 'monday', start_time: '19:00', end_time: '20:30' }],
  },

  // --- المدرس: خالد النصيري | اللغة الفرنسية (الاثنين) ---
  {
    gradeOrder: 10, // 1 ث برايفت
    subjectKey: 'FRENCH',
    teacherNum: 15, // خالد النصيري
    name: 'اللغة الفرنسية (1 ث برايفت) - مسيو/ خالد النصيري',
    price_per_month: 210,
    price_per_session: 0,
    schedule: [{ day: 'monday', start_time: '19:00', end_time: '21:00' }],
  },

  // --- المدرس: محمود رشاد | الدراسات الاجتماعية (الاثنين والخميس) ---
  {
    gradeOrder: 4, // 4 ب
    subjectKey: 'SOCIAL',
    teacherNum: 34, // محمود رشاد
    name: 'الدراسات الاجتماعية (برايفت) - ا/ محمود رشاد',
    price_per_month: 180,
    price_per_session: 0,
    schedule: [
      { day: 'monday', start_time: '17:00', end_time: '18:00' },
      { day: 'thursday', start_time: '17:00', end_time: '18:00' },
    ],
  },

  // --- المدرس: أسماء | Math (الاثنين) ---
  {
    gradeOrder: 7, // 1 ع
    subjectKey: 'MATH_EN',
    teacherNum: 21, // أسماء
    name: 'Math (برايفت) - ميس/ اسماء',
    price_per_month: 40,
    price_per_session: 0,
    schedule: [{ day: 'monday', start_time: '17:00', end_time: '18:30' }],
  },

  // ==========================================================================
  // جدول البرايفت - يوم الثلاثاء
  // ==========================================================================
  // --- المدرس: الغزالي | اللغة العربية (الثلاثاء) ---
  {
    gradeOrder: 12, // 3 ث
    subjectKey: 'ARABIC',
    teacherNum: 5, // الغزالي
    name: 'اللغة العربية (3 ث - برايفت - الثلاثاء 8:00 ص) - ا/ الغزالي',
    price_per_month: 310,
    price_per_session: 0,
    schedule: [{ day: 'tuesday', start_time: '08:00', end_time: '10:00' }],
  },
  {
    gradeOrder: 11, // 2 ث
    subjectKey: 'ARABIC',
    teacherNum: 5, // الغزالي
    name: 'اللغة العربية (2 ث - برايفت - الثلاثاء 12:00 ظ) - ا/ الغزالي',
    price_per_month: 310,
    price_per_session: 0,
    schedule: [{ day: 'tuesday', start_time: '12:00', end_time: '14:00' }],
  },
  {
    gradeOrder: 10, // 1 ث
    subjectKey: 'ARABIC',
    teacherNum: 5, // الغزالي
    name: 'اللغة العربية (برايفت - الثلاثاء 5:00 م) - ا/ الغزالي',
    price_per_month: 160,
    price_per_session: 0,
    schedule: [{ day: 'tuesday', start_time: '17:00', end_time: '19:00' }],
  },

  // --- المدرس: محمد علاء | اللغة الإنجليزية (3 ع الثلاثاء) ---
  {
    gradeOrder: 9, // 3 ع
    subjectKey: 'ENGLISH',
    teacherNum: 11, // محمد علاء
    name: 'اللغة الانجليزية (برايفت - الثلاثاء 12:00 ظ) - ا/ محمد علاء',
    price_per_month: 210,
    price_per_session: 0,
    schedule: [{ day: 'tuesday', start_time: '12:00', end_time: '13:30' }],
  },

  // --- المدرس: أدهم أبو الصفا | اللغة الإنجليزية (الثلاثاء) ---
  {
    gradeOrder: 11, // 2 ث
    subjectKey: 'ENGLISH',
    teacherNum: 14, // أدهم أبو الصفا
    name: 'اللغة الانجليزية (برايفت - الثلاثاء 12:00 ظ) - ا/ ادهم ابو الصفا',
    price_per_month: 320,
    price_per_session: 0,
    schedule: [{ day: 'tuesday', start_time: '12:00', end_time: '14:00' }],
  },
  {
    gradeOrder: 12, // 3 ث (مجموعة 3:00 عصراً)
    subjectKey: 'ENGLISH',
    teacherNum: 14, // أدهم أبو الصفا
    name: 'اللغة الانجليزية (برايفت - الثلاثاء 3:00 ع) - ا/ ادهم ابو الصفا',
    price_per_month: 330,
    price_per_session: 0,
    schedule: [{ day: 'tuesday', start_time: '15:00', end_time: '17:00' }],
  },
  {
    gradeOrder: 12, // 3 ث (مجموعة 5:00 مساءً)
    subjectKey: 'ENGLISH',
    teacherNum: 14, // أدهم أبو الصفا
    name: 'اللغة الانجليزية (برايفت - الثلاثاء 5:00 م) - ا/ ادهم ابو الصفا',
    price_per_month: 330,
    price_per_session: 0,
    schedule: [{ day: 'tuesday', start_time: '17:00', end_time: '19:00' }],
  },
  {
    gradeOrder: 10, // 1 ث
    subjectKey: 'ENGLISH',
    teacherNum: 14, // أدهم أبو الصفا
    name: 'اللغة الانجليزية (برايفت - الثلاثاء 7:00 م) - ا/ ادهم ابو الصفا',
    price_per_month: 260,
    price_per_session: 0,
    schedule: [{ day: 'tuesday', start_time: '19:00', end_time: '21:00' }],
  },

  // --- المدرس: أميرة إنجليزي | اللغة الإنجليزية (الثلاثاء) ---
  {
    gradeOrder: 11, // 2 ث
    subjectKey: 'ENGLISH',
    teacherNum: 47, // أميرة إنجليزي
    name: 'اللغة الانجليزية (برايفت - الثلاثاء 12:00 ظ) - ميس/ اميرة انجليزي',
    price_per_month: 400,
    price_per_session: 0,
    schedule: [{ day: 'tuesday', start_time: '12:00', end_time: '14:00' }],
  },

  // --- المدرس: ياسمين ماث | Math (الثلاثاء) ---
  {
    gradeOrder: 2, // 2 ب
    subjectKey: 'MATH_EN',
    teacherNum: 48, // ياسمين ماث
    name: 'Math (برايفت - الثلاثاء 12:00 ظ) - ميس/ ياسمين ماث',
    price_per_month: 35,
    price_per_session: 0,
    schedule: [{ day: 'tuesday', start_time: '12:00', end_time: '13:30' }],
  },
  {
    gradeOrder: 6, // 6 ب
    subjectKey: 'MATH_EN',
    teacherNum: 48, // ياسمين ماث
    name: 'Math (برايفت - الثلاثاء 2:00 ظ) - ميس/ ياسمين ماث',
    price_per_month: 35,
    price_per_session: 0,
    schedule: [{ day: 'tuesday', start_time: '14:00', end_time: '15:30' }],
  },
  {
    gradeOrder: 7, // 1 ع
    subjectKey: 'MATH_EN',
    teacherNum: 48, // ياسمين ماث
    name: 'Math (برايفت - الثلاثاء 5:00 م) - ميس/ ياسمين ماث',
    price_per_month: 35,
    price_per_session: 0,
    schedule: [{ day: 'tuesday', start_time: '17:00', end_time: '18:30' }],
  },

  // --- المدرس: إسلام موسى | الدراسات الاجتماعية (الثلاثاء) ---
  {
    gradeOrder: 6, // 6 ب
    subjectKey: 'SOCIAL',
    teacherNum: 46, // إسلام موسى
    name: 'الدراسات الاجتماعية (برايفت - الثلاثاء 1:00 ظ) - ا/ اسلام موسى',
    price_per_month: 35,
    price_per_session: 0,
    schedule: [{ day: 'tuesday', start_time: '13:00', end_time: '14:00' }],
  },
  {
    gradeOrder: 5, // 5 ب
    subjectKey: 'SOCIAL',
    teacherNum: 46, // إسلام موسى
    name: 'الدراسات الاجتماعية (برايفت - الثلاثاء 3:00 ع) - ا/ اسلام موسى',
    price_per_month: 35,
    price_per_session: 0,
    schedule: [{ day: 'tuesday', start_time: '15:00', end_time: '16:00' }],
  },
  {
    gradeOrder: 8, // 2 ع
    subjectKey: 'SOCIAL',
    teacherNum: 46, // إسلام موسى
    name: 'الدراسات الاجتماعية (برايفت - الثلاثاء 5:00 م) - ا/ اسلام موسى',
    price_per_month: 35,
    price_per_session: 0,
    schedule: [{ day: 'tuesday', start_time: '17:00', end_time: '18:00' }],
  },

  // --- المدرس: صبحي محمد | اللغة الإنجليزية (الثلاثاء) ---
  {
    gradeOrder: 10, // 1 ث
    subjectKey: 'ENGLISH',
    teacherNum: 12, // صبحي محمد
    name: 'اللغة الانجليزية (برايفت - الثلاثاء 7:00 م) - ا/ صبحي محمد',
    price_per_month: 210,
    price_per_session: 0,
    schedule: [{ day: 'tuesday', start_time: '19:00', end_time: '21:00' }],
  },

  // --- المدرس: نهلة | ICT (الثلاثاء) ---
  {
    gradeOrder: 7, // 1 ع
    subjectKey: 'ICT_EN',
    teacherNum: 39, // نهلة
    name: 'ICT (برايفت) - ميس/ نهلة',
    price_per_month: 160,
    price_per_session: 0,
    schedule: [{ day: 'tuesday', start_time: '19:00', end_time: '20:00' }],
  },
  {
    gradeOrder: 8, // 2 ع
    subjectKey: 'ICT_EN',
    teacherNum: 39, // نهلة
    name: 'ICT (برايفت) - ميس/ نهلة',
    price_per_month: 160,
    price_per_session: 0,
    schedule: [{ day: 'tuesday', start_time: '18:00', end_time: '19:00' }],
  },
  {
    gradeOrder: 5, // 5 ب
    subjectKey: 'ICT_EN',
    teacherNum: 39, // نهلة
    name: 'ICT (برايفت) - ميس/ نهلة',
    price_per_month: 160,
    price_per_session: 0,
    schedule: [{ day: 'tuesday', start_time: '17:00', end_time: '18:00' }],
  },
  {
    gradeOrder: 4, // 4 ب
    subjectKey: 'ICT_EN',
    teacherNum: 39, // نهلة
    name: 'ICT (برايفت) - ميس/ نهلة',
    price_per_month: 160,
    price_per_session: 0,
    schedule: [{ day: 'tuesday', start_time: '16:00', end_time: '17:00' }],
  },
  {
    gradeOrder: 6, // 6 ب
    subjectKey: 'ICT_EN',
    teacherNum: 39, // نهلة
    name: 'ICT (برايفت) - ميس/ نهلة',
    price_per_month: 160,
    price_per_session: 0,
    schedule: [{ day: 'tuesday', start_time: '20:00', end_time: '21:00' }],
  },

  // ==========================================================================
  // جدول البرايفت - يوم الأربعاء
  // ==========================================================================
  // --- المدرس: محمد العربي | Science (الأربعاء) ---
  {
    gradeOrder: 12, // 3 ث برايفت
    subjectKey: 'SCIENCE_EN',
    teacherNum: 32, // محمد العربي
    name: 'Science / Bio (3 ث برايفت - الأربعاء 10:00 ص) - ا/ محمد العربي',
    price_per_month: 550,
    price_per_session: 0,
    schedule: [{ day: 'wednesday', start_time: '10:00', end_time: '12:00' }],
  },
  {
    gradeOrder: 10, // 1 ث برايفت
    subjectKey: 'INTEGRATED_SCI_EN',
    teacherNum: 32, // محمد العربي
    name: 'Integrated Science (1 ث برايفت) - ا/ محمد العربي',
    price_per_month: 310,
    price_per_session: 0,
    schedule: [{ day: 'wednesday', start_time: '17:00', end_time: '19:00' }],
  },

  // --- المدرس: آية آدم | العلوم المتكاملة (الأربعاء) ---
  {
    gradeOrder: 10, // 1 ث برايفت
    subjectKey: 'INTEGRATED_SCI_AR',
    teacherNum: 27, // آية آدم
    name: 'العلوم المتكاملة (1 ث برايفت) - ميس/ اية ادم',
    price_per_month: 240,
    price_per_session: 0,
    schedule: [{ day: 'wednesday', start_time: '17:00', end_time: '19:00' }],
  },

  // --- المدرس: أسماء | Math (الأربعاء) ---
  {
    gradeOrder: 6, // 6 ب
    subjectKey: 'MATH_EN',
    teacherNum: 21, // أسماء
    name: 'Math (برايفت) - ميس/ اسماء',
    price_per_month: 40,
    price_per_session: 0,
    schedule: [{ day: 'wednesday', start_time: '15:00', end_time: '16:30' }],
  },
  {
    gradeOrder: 5, // 5 ب
    subjectKey: 'MATH_EN',
    teacherNum: 21, // أسماء
    name: 'Math (برايفت) - ميس/ اسماء',
    price_per_month: 40,
    price_per_session: 0,
    schedule: [{ day: 'wednesday', start_time: '17:00', end_time: '18:30' }],
  },

  // --- المدرس: محمود طارق | الجغرافيا (الأربعاء) ---
  {
    gradeOrder: 12, // 3 ث
    subjectKey: 'GEOGRAPHY',
    teacherNum: 36, // محمود طارق
    name: 'الجغرافيا (برايفت - الأربعاء 1:30 ظ) - ا/ محمود طارق',
    price_per_month: 310,
    price_per_session: 0,
    schedule: [{ day: 'wednesday', start_time: '13:30', end_time: '15:30' }],
  },

  // --- المدرس: ياسمين ماث | Math (الأربعاء) ---
  {
    gradeOrder: 3, // 3 ب (12:00 ظهراً)
    subjectKey: 'MATH_EN',
    teacherNum: 48, // ياسمين ماث
    name: 'Math (3 ب - برايفت - الأربعاء 12:00 ظ) - ميس/ ياسمين ماث',
    price_per_month: 35,
    price_per_session: 0,
    schedule: [{ day: 'wednesday', start_time: '12:00', end_time: '13:30' }],
  },
  {
    gradeOrder: 2, // 2 ب (4:30 عصراً)
    subjectKey: 'MATH_EN',
    teacherNum: 48, // ياسمين ماث
    name: 'Math (برايفت - الأربعاء 4:30 ع) - ميس/ ياسمين ماث',
    price_per_month: 35,
    price_per_session: 0,
    schedule: [{ day: 'wednesday', start_time: '16:30', end_time: '18:00' }],
  },

  // --- المدرس: أميرة إنجليزي | اللغة الإنجليزية (الأربعاء) ---
  {
    gradeOrder: 11, // 2 ث بكالوريا
    subjectKey: 'ENGLISH',
    teacherNum: 47, // أميرة إنجليزي
    name: 'اللغة الانجليزية (2 ث بكالوريا - برايفت - الأربعاء 12:30 ظ) - ميس/ اميرة انجليزي',
    price_per_month: 400,
    price_per_session: 0,
    schedule: [{ day: 'wednesday', start_time: '12:30', end_time: '14:30' }],
  },

  // --- المدرس: إسلام موسى | الدراسات الاجتماعية (الأربعاء) ---
  {
    gradeOrder: 4, // 4 ب
    subjectKey: 'SOCIAL',
    teacherNum: 46, // إسلام موسى
    name: 'الدراسات الاجتماعية (برايفت - الأربعاء 1:00 ظ) - ا/ اسلام موسى',
    price_per_month: 35,
    price_per_session: 0,
    schedule: [{ day: 'wednesday', start_time: '13:00', end_time: '14:00' }],
  },
  {
    gradeOrder: 9, // 3 ع
    subjectKey: 'SOCIAL',
    teacherNum: 46, // إسلام موسى
    name: 'الدراسات الاجتماعية (3 ع - برايفت - الأربعاء 3:00 ع) - ا/ اسلام موسى',
    price_per_month: 35,
    price_per_session: 0,
    schedule: [{ day: 'wednesday', start_time: '15:00', end_time: '16:00' }],
  },
  {
    gradeOrder: 7, // 1 ع
    subjectKey: 'SOCIAL',
    teacherNum: 46, // إسلام موسى
    name: 'الدراسات الاجتماعية (برايفت - الأربعاء 5:00 م) - ا/ اسلام موسى',
    price_per_month: 35,
    price_per_session: 0,
    schedule: [{ day: 'wednesday', start_time: '17:00', end_time: '18:00' }],
  },

  // --- المدرس: الشاذلي | اللغة الإنجليزية (الأربعاء) ---
  {
    gradeOrder: 11, // 2 ث
    subjectKey: 'ENGLISH',
    teacherNum: 13, // الشاذلي
    name: 'اللغة الانجليزية (برايفت - الأربعاء 1:00 ظ) - ا/ الشاذلي',
    price_per_month: 310,
    price_per_session: 0,
    schedule: [{ day: 'wednesday', start_time: '13:00', end_time: '15:00' }],
  },

  // --- المدرس: محمد سعيد إنجليزي | اللغة الإنجليزية (الأربعاء) ---
  {
    gradeOrder: 9, // 3 ع
    subjectKey: 'ENGLISH',
    teacherNum: 43, // محمد سعيد إنجليزي
    name: 'اللغة الانجليزية (برايفت - الأربعاء 4:00 ع) - ا/ محمد سعيد انجليزي',
    price_per_month: 210,
    price_per_session: 0,
    schedule: [{ day: 'wednesday', start_time: '16:00', end_time: '17:30' }],
  },

  // --- المدرس: محمود الرفاعي | Math (الأربعاء) ---
  {
    gradeOrder: 8, // 2 ع
    subjectKey: 'MATH_EN',
    teacherNum: 23, // محمود الرفاعي
    name: 'Math (برايفت) - ا/ محمود الرفاعي',
    price_per_month: 260,
    price_per_session: 0,
    schedule: [{ day: 'wednesday', start_time: '19:00', end_time: '20:30' }],
  },

  // ==========================================================================
  // جدول البرايفت - يوم الخميس
  // ==========================================================================
  // --- المدرس: أيمن سليمان | التاريخ (الخميس) ---
  {
    gradeOrder: 10, // 1 ث
    subjectKey: 'HISTORY',
    teacherNum: 37, // أيمن سليمان
    name: 'التاريخ (برايفت) - ا/ ايمن سليمان',
    price_per_month: 250,
    price_per_session: 0,
    schedule: [{ day: 'thursday', start_time: '19:00', end_time: '21:00' }],
  },

  // --- المدرس: حازم | العلوم (الخميس) ---
  {
    gradeOrder: 9, // 3 ع
    subjectKey: 'SCIENCE_AR',
    teacherNum: 25, // حازم
    name: 'العلوم (برايفت) - ا/ حازم',
    price_per_month: 190,
    price_per_session: 0,
    schedule: [{ day: 'thursday', start_time: '19:30', end_time: '21:00' }],
  },

  // --- المدرس: محمد سعيد إنجليزي | اللغة الإنجليزية (الخميس) ---
  {
    gradeOrder: 8, // 2 ع
    subjectKey: 'ENGLISH',
    teacherNum: 43, // محمد سعيد إنجليزي
    name: 'اللغة الانجليزية (2 ع - برايفت - الخميس 6:00 م) - ا/ محمد سعيد انجليزي',
    price_per_month: 210,
    price_per_session: 0,
    schedule: [{ day: 'thursday', start_time: '18:00', end_time: '19:30' }],
  },

  // --- المدرس: إيناس | Science (الخميس) ---
  {
    gradeOrder: 6, // 6 ب
    subjectKey: 'SCIENCE_EN',
    teacherNum: 29, // إيناس
    name: 'Science (برايفت) - ميس/ ايناس',
    price_per_month: 160,
    price_per_session: 0,
    schedule: [{ day: 'thursday', start_time: '17:00', end_time: '18:30' }],
  },

  // --- المدرس: محمد سالم | الفيزياء (Physics) (الخميس) ---
  {
    gradeOrder: 11, // 2 ث
    subjectKey: 'PHYSICS',
    teacherNum: 49, // محمد سالم
    name: 'الفيزياء / Physics (برايفت - الخميس 2:30 ظ) - ا/ محمد سالم',
    price_per_month: 450,
    price_per_session: 0,
    schedule: [{ day: 'thursday', start_time: '14:30', end_time: '16:30' }],
  },

  // --- المدرس: إسلام موسى | الدراسات الاجتماعية (الخميس) ---
  {
    gradeOrder: 5, // 5 ب
    subjectKey: 'SOCIAL',
    teacherNum: 46, // إسلام موسى
    name: 'الدراسات الاجتماعية (برايفت - الخميس 3:00 ع) - ا/ اسلام موسى',
    price_per_month: 35,
    price_per_session: 0,
    schedule: [{ day: 'thursday', start_time: '15:00', end_time: '16:00' }],
  },
  {
    gradeOrder: 7, // 1 ع
    subjectKey: 'SOCIAL',
    teacherNum: 46, // إسلام موسى
    name: 'الدراسات الاجتماعية (برايفت - الخميس 5:00 م) - ا/ اسلام موسى',
    price_per_month: 35,
    price_per_session: 0,
    schedule: [{ day: 'thursday', start_time: '17:00', end_time: '18:00' }],
  },

  // --- المدرس: محمد العربي | Science (الخميس - الحصة 70 جنيه) ---
  {
    gradeOrder: 9, // 3 ع
    subjectKey: 'SCIENCE_EN',
    teacherNum: 32, // محمد العربي
    name: 'Science (برايفت - الخميس 3:00 ع - الحصة 70 ج) - ا/ محمد العربي',
    price_per_month: 280,
    price_per_session: 70,
    schedule: [{ day: 'thursday', start_time: '15:00', end_time: '16:30' }],
  },

  // --- المدرس: ياسمين حسن | شرعي (الخميس) ---
  {
    gradeOrder: 8, // 2 ع
    subjectKey: 'SHARIA',
    teacherNum: 4, // ياسمين حسن
    name: 'الشرعي (أزهر - برايفت) - ميس/ ياسمين حسن',
    price_per_month: 210,
    price_per_session: 0,
    schedule: [{ day: 'thursday', start_time: '18:00', end_time: '19:30' }],
  },
  {
    gradeOrder: 7, // 1 ع
    subjectKey: 'SHARIA',
    teacherNum: 4, // ياسمين حسن
    name: 'الشرعي (أزهر - برايفت) - ميس/ ياسمين حسن',
    price_per_month: 160,
    price_per_session: 0,
    schedule: [{ day: 'thursday', start_time: '16:00', end_time: '17:30' }],
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

      // Check if group already exists for this grade, subject, teacher, and name
      const existGrp = await client.query(
        `SELECT id FROM groups WHERE grade_id = $1 AND teacher_id = $2 AND subject_id = $3 AND name = $4`,
        [grade.id, teacherId, subjectId, gDef.name]
      );

      let groupId;
      if (existGrp.rows.length > 0) {
        groupId = existGrp.rows[0].id;
        await client.query(
          `UPDATE groups
           SET name_ar = $1, schedule = $2, status = 'active',
               package_teacher_ratio = 0, package_center_ratio = 100,
               private_teacher_ratio = 75, private_center_ratio = 25,
               max_students = 9999, updated_at = NOW()
           WHERE id = $3`,
          [gDef.name, JSON.stringify(gDef.schedule), groupId]
        );
        groupsUpdated++;
      } else {
        const insGrp = await client.query(
          `INSERT INTO groups (
             name, name_ar, teacher_id, subject_id, grade_id,
             schedule, price_per_month, price_per_session, max_students,
             package_teacher_ratio, package_center_ratio, private_teacher_ratio, private_center_ratio, status
           ) VALUES ($1, $2, $3, $4, $5, $6, 0, 0, 9999, 0, 100, 75, 25, 'active')
           RETURNING id`,
          [gDef.name, gDef.name, teacherId, subjectId, grade.id, JSON.stringify(gDef.schedule)]
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
        `SELECT id FROM groups WHERE grade_id = $1 AND teacher_id = $2 AND subject_id = $3 AND name = $4`,
        [grade.id, teacherId, subjectId, pDef.name]
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
