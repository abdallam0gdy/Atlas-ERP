import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { formatTime12h } from '../lib/formatters';
import PrintReportModal from '../components/PrintReportModal';
import {
  GraduationCap, Calendar, BookOpen, Search, Printer,
  Users, Clock, Layers, Package, Sparkles, X,
  ChevronLeft, Phone, UserCheck, Compass, ExternalLink
} from 'lucide-react';

const dayMap = {
  saturday: 'السبت',
  sunday: 'الأحد',
  monday: 'الاثنين',
  tuesday: 'الثلاثاء',
  wednesday: 'الأربعاء',
  thursday: 'الخميس',
  friday: 'الجمعة',
};

const orderedDays = [
  { key: 'saturday', label: 'السبت' },
  { key: 'sunday', label: 'الأحد' },
  { key: 'monday', label: 'الاثنين' },
  { key: 'tuesday', label: 'الثلاثاء' },
  { key: 'wednesday', label: 'الأربعاء' },
  { key: 'thursday', label: 'الخميس' },
  { key: 'friday', label: 'الجمعة' },
];

const formatScheduleText = (schedule) => {
  if (!schedule || !Array.isArray(schedule) || schedule.length === 0) return 'بدون موعد';
  return schedule
    .map((s) => `${dayMap[s.day] || s.day} (${formatTime12h(s.start_time)})`)
    .join(' ، ');
};

export default function InfoCenterPage() {
  const navigate = useNavigate();

  // Main Mode: 'TEACHER' | 'GRADE'
  const [activeMode, setActiveMode] = useState('TEACHER');

  // Master Data
  const [teachers, setTeachers] = useState([]);
  const [grades, setGrades] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Teacher Mode States
  const [teacherSearch, setTeacherSearch] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [teacherGroupType, setTeacherGroupType] = useState('ALL'); // 'ALL' | 'PACKAGE' | 'PRIVATE'
  const [teacherViewStyle, setTeacherViewStyle] = useState('BY_GRADE'); // 'BY_GRADE' | 'BY_DAY'

  // Grade Mode States
  const [selectedGradeId, setSelectedGradeId] = useState('');
  const [gradeTrackFilter, setGradeTrackFilter] = useState('ALL'); // 'ALL' | 'PACKAGE_PUBLIC' | 'PACKAGE_LANG' | 'PRIVATE'
  const [gradeSubjectFilter, setGradeSubjectFilter] = useState('');
  const [gradeViewStyle, setGradeViewStyle] = useState('BY_SUBJECT'); // 'BY_SUBJECT' | 'BY_DAY'

  // Print Modal
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/teachers'),
      api.get('/master/grades'),
      api.get('/groups'),
    ])
      .then(([tRes, gRes, grpRes]) => {
        const tList = tRes.data.data || [];
        const gList = gRes.data.data || [];
        const grpList = grpRes.data.data || [];

        setTeachers(tList);
        setGrades(gList);
        setGroups(grpList);

        if (gList.length > 0) {
          // Default to 4th Primary or first grade
          const defaultGrade = gList.find((g) => g.grade_order === 4) || gList[0];
          setSelectedGradeId(defaultGrade.id);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // ============================================================================
  // TEACHER MODE COMPUTATIONS
  // ============================================================================
  const filteredTeachersList = useMemo(() => {
    const q = teacherSearch.trim().toLowerCase();
    return teachers.filter((t) => {
      if (!q) return true;
      return (
        (t.full_name || '').toLowerCase().includes(q) ||
        (t.specialization || '').toLowerCase().includes(q) ||
        (t.subject_name || '').toLowerCase().includes(q)
      );
    });
  }, [teachers, teacherSearch]);

  const selectedTeacher = useMemo(
    () => teachers.find((t) => t.id === selectedTeacherId) || null,
    [teachers, selectedTeacherId]
  );

  const teacherAllGroups = useMemo(() => {
    if (!selectedTeacherId) return [];
    return groups.filter((g) => g.teacher_id === selectedTeacherId);
  }, [groups, selectedTeacherId]);

  const teacherFilteredGroups = useMemo(() => {
    return teacherAllGroups.filter((g) => {
      if (teacherGroupType === 'PACKAGE' && g.is_private) return false;
      if (teacherGroupType === 'PRIVATE' && !g.is_private) return false;
      return true;
    });
  }, [teacherAllGroups, teacherGroupType]);

  const teacherStats = useMemo(() => {
    let pkgCount = 0;
    let privCount = 0;
    let totalStudents = 0;
    const gradesSet = new Set();
    const subjectsSet = new Set();

    for (const g of teacherAllGroups) {
      if (g.is_private) privCount++;
      else pkgCount++;
      totalStudents += parseInt(g.student_count, 10) || 0;
      if (g.grade_name) gradesSet.add(g.grade_name);
      if (g.subject_name) subjectsSet.add(g.subject_name);
    }

    return {
      total: teacherAllGroups.length,
      pkgCount,
      privCount,
      totalStudents,
      gradesList: Array.from(gradesSet),
      subjectsList: Array.from(subjectsSet),
    };
  }, [teacherAllGroups]);

  const teacherGroupsByDay = useMemo(() => {
    return orderedDays
      .map((d) => {
        const slots = [];
        for (const g of teacherFilteredGroups) {
          const sched = Array.isArray(g.schedule) ? g.schedule : [];
          for (const s of sched) {
            if (s.day && s.day.toLowerCase() === d.key) {
              slots.push({
                ...g,
                slotDay: d.label,
                startTime: s.start_time,
                endTime: s.end_time,
              });
            }
          }
        }
        slots.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
        return {
          dayKey: d.key,
          dayLabel: d.label,
          slots,
        };
      })
      .filter((d) => d.slots.length > 0);
  }, [teacherFilteredGroups]);

  // ============================================================================
  // GRADE MODE COMPUTATIONS
  // ============================================================================
  const selectedGrade = useMemo(
    () => grades.find((g) => g.id === selectedGradeId) || null,
    [grades, selectedGradeId]
  );

  const gradeAllGroups = useMemo(() => {
    if (!selectedGradeId) return [];
    return groups.filter((g) => g.grade_id === selectedGradeId);
  }, [groups, selectedGradeId]);

  const gradeStats = useMemo(() => {
    let pkgPublic = 0;
    let pkgLang = 0;
    let pkgTotal = 0;
    let privTotal = 0;
    const teachersSet = new Set();
    const subjectsMap = new Map();

    for (const g of gradeAllGroups) {
      if (g.is_private) {
        privTotal++;
      } else {
        pkgTotal++;
        const types = Array.isArray(g.package_education_types) ? g.package_education_types : [];
        if (types.includes('PUBLIC')) pkgPublic++;
        if (types.includes('LANGUAGES')) pkgLang++;
      }
      if (g.teacher_id) teachersSet.add(g.teacher_id);
      if (g.subject_id && g.subject_name) {
        subjectsMap.set(g.subject_id, g.subject_name);
      }
    }

    return {
      total: gradeAllGroups.length,
      pkgTotal,
      pkgPublic,
      pkgLang,
      privTotal,
      teacherCount: teachersSet.size,
      availableSubjects: Array.from(subjectsMap.entries()).map(([id, name]) => ({ id, name })),
    };
  }, [gradeAllGroups]);

  const gradeFilteredGroups = useMemo(() => {
    return gradeAllGroups.filter((g) => {
      if (gradeTrackFilter === 'PACKAGE_PUBLIC') {
        if (g.is_private) return false;
        const types = Array.isArray(g.package_education_types) ? g.package_education_types : [];
        if (!types.includes('PUBLIC')) return false;
      } else if (gradeTrackFilter === 'PACKAGE_LANG') {
        if (g.is_private) return false;
        const types = Array.isArray(g.package_education_types) ? g.package_education_types : [];
        if (!types.includes('LANGUAGES')) return false;
      } else if (gradeTrackFilter === 'PRIVATE') {
        if (!g.is_private) return false;
      }

      if (gradeSubjectFilter && g.subject_id !== gradeSubjectFilter) return false;

      return true;
    });
  }, [gradeAllGroups, gradeTrackFilter, gradeSubjectFilter]);

  const gradeGroupsBySubject = useMemo(() => {
    const map = new Map();
    for (const g of gradeFilteredGroups) {
      const key = g.subject_id || 'other';
      if (!map.has(key)) {
        map.set(key, {
          subjectId: key,
          subjectName: g.subject_name || 'مادة أخرى',
          subjectColor: g.subject_color || '#0C3C82',
          items: [],
        });
      }
      map.get(key).items.push(g);
    }
    return Array.from(map.values());
  }, [gradeFilteredGroups]);

  const gradeGroupsByDay = useMemo(() => {
    return orderedDays
      .map((d) => {
        const slots = [];
        for (const g of gradeFilteredGroups) {
          const sched = Array.isArray(g.schedule) ? g.schedule : [];
          for (const s of sched) {
            if (s.day && s.day.toLowerCase() === d.key) {
              slots.push({
                ...g,
                slotDay: d.label,
                startTime: s.start_time,
                endTime: s.end_time,
              });
            }
          }
        }
        slots.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
        return {
          dayKey: d.key,
          dayLabel: d.label,
          slots,
        };
      })
      .filter((d) => d.slots.length > 0);
  }, [gradeFilteredGroups]);

  // ============================================================================
  // PRINT CONFIGURATION
  // ============================================================================
  const printColumns = useMemo(() => {
    if (activeMode === 'TEACHER') {
      return [
        { header: 'المرحلة الدراسية', accessor: 'grade_name' },
        { header: 'المادة', accessor: 'subject_name' },
        { header: 'اسم المجموعة', render: (g) => g.name_ar || g.name },
        { header: 'النظام', render: (g) => (g.is_private ? 'برايفت' : 'باكدج') },
        { header: 'المواعيد', render: (g) => formatScheduleText(g.schedule) },
        {
          header: 'السعر الشهري',
          render: (g) =>
            Number(g.price_per_month) > 0 ? `${Number(g.price_per_month)} ج.م` : 'ضمن الباكدج',
        },
        { header: 'الطلاب', render: (g) => `${g.student_count || 0} طالب` },
      ];
    }
    return [
      { header: 'المادة الدراسية', accessor: 'subject_name' },
      { header: 'المدرس', accessor: 'teacher_name' },
      { header: 'اسم المجموعة', render: (g) => g.name_ar || g.name },
      { header: 'النظام', render: (g) => (g.is_private ? 'برايفت' : 'باكدج') },
      { header: 'المواعيد', render: (g) => formatScheduleText(g.schedule) },
      {
        header: 'السعر الشهري',
        render: (g) =>
          Number(g.price_per_month) > 0 ? `${Number(g.price_per_month)} ج.م` : 'ضمن الباكدج',
      },
    ];
  }, [activeMode]);

  const printData = activeMode === 'TEACHER' ? teacherFilteredGroups : gradeFilteredGroups;
  const printTitle =
    activeMode === 'TEACHER'
      ? `جدول ومواعيد المدرس: ${selectedTeacher?.full_name || ''}`
      : `جدول مواعيد: ${selectedGrade?.name_ar || ''}`;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1
            className="text-xl sm:text-2xl font-bold flex items-center gap-2"
            style={{ color: '#0C3C82' }}
          >
            <Compass size={26} className="text-sky-600" />
            <span>مركز المعلومات والاستعلام السريع</span>
          </h1>
          <p className="text-xs sm:text-sm mt-1 text-slate-500">
            استعلم فوراً عن بيانات ومواعيد أي مدرس أو اعرض الجدول الكامل لأي مرحلة دراسية (باكدج وبرايفت)
          </p>
        </div>

        {((activeMode === 'TEACHER' && selectedTeacher) ||
          (activeMode === 'GRADE' && selectedGrade)) && (
          <button
            type="button"
            onClick={() => setIsPrintOpen(true)}
            className="atlas-btn atlas-btn-primary text-xs sm:text-sm flex items-center gap-2 self-start sm:self-auto"
          >
            <Printer size={16} />
            <span>
              {activeMode === 'TEACHER' ? 'طباعة جدول المدرس' : 'طباعة جدول المرحلة'}
            </span>
          </button>
        )}
      </div>

      {/* Mode Switcher Cards: Choose Teacher Info vs. Grade Schedule */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Choice 1: Teacher Info */}
        <button
          type="button"
          onClick={() => setActiveMode('TEACHER')}
          className={`p-5 rounded-2xl border-2 text-right flex items-center gap-4 cursor-pointer ${
            activeMode === 'TEACHER'
              ? 'bg-[#0C3C82] text-white border-[#0C3C82] shadow-md'
              : 'bg-white text-slate-800 border-slate-200 hover:border-sky-300 hover:bg-sky-50/40'
          }`}
        >
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
              activeMode === 'TEACHER'
                ? 'bg-white/15 text-cyan-300'
                : 'bg-sky-100 text-[#0C3C82]'
            }`}
          >
            <GraduationCap size={30} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-lg font-black">
              1. استعلام عن مدرس (معلومات وجدول مدرس)
            </h2>
            <p
              className={`text-xs mt-1 ${
                activeMode === 'TEACHER' ? 'text-white/80' : 'text-slate-500'
              }`}
            >
              اختر أي مدرس لعرض مواده، مراحله، مواعيد مجموعات الباكدج والبرايفت، وأسعار الشهر
            </p>
          </div>
        </button>

        {/* Choice 2: Grade Timetable */}
        <button
          type="button"
          onClick={() => setActiveMode('GRADE')}
          className={`p-5 rounded-2xl border-2 text-right flex items-center gap-4 cursor-pointer ${
            activeMode === 'GRADE'
              ? 'bg-[#0C3C82] text-white border-[#0C3C82] shadow-md'
              : 'bg-white text-slate-800 border-slate-200 hover:border-sky-300 hover:bg-sky-50/40'
          }`}
        >
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
              activeMode === 'GRADE'
                ? 'bg-white/15 text-cyan-300'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            <Calendar size={30} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-lg font-black">
              2. استعلام عن جدول مرحلة دراسية معينة
            </h2>
            <p
              className={`text-xs mt-1 ${
                activeMode === 'GRADE' ? 'text-white/80' : 'text-slate-500'
              }`}
            >
              اختر المرحلة الدراسية لعرض جدولها الأسبوعي أو تقسيم المواد والمدرسين (عربي / لغات / برايفت)
            </p>
          </div>
        </button>
      </div>

      {/* ========================================================================
          MODE 1: TEACHER INFORMATION & SCHEDULE
      ======================================================================== */}
      {activeMode === 'TEACHER' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Right Column: Teacher Selector List */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                اختر المدرس ({teachers.length} مدرس مسجل)
              </label>
              <div className="relative">
                <Search
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                  placeholder="ابحث باسم المدرس أو المادة..."
                  className="atlas-input pr-9 text-xs"
                />
                {teacherSearch && (
                  <button
                    type="button"
                    onClick={() => setTeacherSearch('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-[540px] overflow-y-auto divide-y divide-slate-100">
              {filteredTeachersList.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  لا يوجد مدرس مطابق للبحث
                </div>
              ) : (
                filteredTeachersList.map((t) => {
                  const isSelected = t.id === selectedTeacherId;
                  const tGroupCount = groups.filter((g) => g.teacher_id === t.id).length;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTeacherId(t.id)}
                      className={`w-full text-right px-4 py-3 flex items-center justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-sky-50 border-r-4 border-[#0C3C82]'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0">
                        <p
                          className={`text-xs sm:text-sm font-bold truncate ${
                            isSelected ? 'text-[#0C3C82]' : 'text-slate-800'
                          }`}
                        >
                          {t.full_name}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {t.specialization || t.subject_name || 'هيئة التدريس'}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                          isSelected
                            ? 'bg-[#0C3C82] text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {tGroupCount} مجموعة
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Left Column: Selected Teacher Details & Schedule */}
          <div className="lg:col-span-8 space-y-4">
            {!selectedTeacher ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <GraduationCap size={48} className="mx-auto mb-3 text-slate-300" />
                <h3 className="text-base font-bold text-slate-700">
                  اختر مدرساً من القائمة الجانبية
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  اضغط على اسم أي مدرس لعرض كافة معلوماته، المراحل التي يدرس لها، وجدول مواعيده بالتفصيل
                </p>
              </div>
            ) : (
              <>
                {/* Teacher Profile Banner */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3.5">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shrink-0"
                        style={{ background: '#0C3C82' }}
                      >
                        {selectedTeacher.full_name?.replace(/^أ\/\s*|^ميس\/\s*|^مسيو\/\s*/, '')?.[0] ||
                          'م'}
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl font-black text-slate-900">
                          {selectedTeacher.full_name}
                        </h2>
                        <p className="text-xs sm:text-sm font-semibold text-sky-700 mt-0.5">
                          التخصص: {selectedTeacher.specialization || selectedTeacher.subject_name || '—'}
                        </p>
                        {selectedTeacher.phone && (
                          <p className="text-xs text-slate-500 font-mono mt-1 flex items-center gap-1">
                            <Phone size={12} />
                            <span>{selectedTeacher.phone}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => navigate(`/teachers/${selectedTeacher.id}`)}
                        className="atlas-btn atlas-btn-secondary text-xs flex items-center gap-1.5"
                      >
                        <ExternalLink size={14} />
                        <span>ملف المدرس الكامل</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsPrintOpen(true)}
                        className="atlas-btn atlas-btn-primary text-xs flex items-center gap-1.5"
                      >
                        <Printer size={14} />
                        <span>طباعة الجدول</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="text-[11px] text-slate-500 font-semibold">إجمالي المجموعات</p>
                      <p className="text-lg font-black text-slate-900 mt-0.5">
                        {teacherStats.total} مجموعة
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                      <p className="text-[11px] text-emerald-700 font-semibold">مجموعات الباكدج</p>
                      <p className="text-lg font-black text-emerald-900 mt-0.5">
                        📦 {teacherStats.pkgCount}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                      <p className="text-[11px] text-amber-700 font-semibold">مجموعات البرايفت</p>
                      <p className="text-lg font-black text-amber-900 mt-0.5">
                        💎 {teacherStats.privCount}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-sky-50 border border-sky-200">
                      <p className="text-[11px] text-sky-700 font-semibold">إجمالي الطلاب المسجلين</p>
                      <p className="text-lg font-black text-sky-900 mt-0.5">
                        👥 {teacherStats.totalStudents} طالب
                      </p>
                    </div>
                  </div>

                  {/* Grades Taught Pills */}
                  {teacherStats.gradesList.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-600 ml-1">
                        المراحل التي يدرس لها:
                      </span>
                      {teacherStats.gradesList.map((grName, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold"
                        >
                          {grName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Teacher Schedule Toolbar */}
                <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTeacherGroupType('ALL')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                        teacherGroupType === 'ALL'
                          ? 'bg-[#0C3C82] text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      الكل ({teacherStats.total})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTeacherGroupType('PACKAGE')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                        teacherGroupType === 'PACKAGE'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      📦 مواعيد الباكدج ({teacherStats.pkgCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTeacherGroupType('PRIVATE')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                        teacherGroupType === 'PRIVATE'
                          ? 'bg-amber-600 text-white'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      💎 مواعيد البرايفت ({teacherStats.privCount})
                    </button>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
                    <button
                      type="button"
                      onClick={() => setTeacherViewStyle('BY_GRADE')}
                      className={`px-2.5 py-1 rounded font-bold cursor-pointer ${
                        teacherViewStyle === 'BY_GRADE'
                          ? 'bg-white text-[#0C3C82] shadow-2xs'
                          : 'text-slate-600'
                      }`}
                    >
                      جدول حسب المرحلة
                    </button>
                    <button
                      type="button"
                      onClick={() => setTeacherViewStyle('BY_DAY')}
                      className={`px-2.5 py-1 rounded font-bold cursor-pointer ${
                        teacherViewStyle === 'BY_DAY'
                          ? 'bg-white text-[#0C3C82] shadow-2xs'
                          : 'text-slate-600'
                      }`}
                    >
                      جدول حسب الأيام
                    </button>
                  </div>
                </div>

                {/* Teacher Schedule Content */}
                {teacherFilteredGroups.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-xs text-slate-500">
                    لا توجد مجموعات مسجلة لهذا الفلتر
                  </div>
                ) : teacherViewStyle === 'BY_GRADE' ? (
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse">
                        <thead>
                          <tr style={{ background: '#0C3C82' }}>
                            <th className="text-white text-xs font-semibold py-3 px-4">المرحلة</th>
                            <th className="text-white text-xs font-semibold py-3 px-4">النوع</th>
                            <th className="text-white text-xs font-semibold py-3 px-4">
                              اسم المجموعة والمادة
                            </th>
                            <th className="text-white text-xs font-semibold py-3 px-4">
                              المواعيد الأسبوعية
                            </th>
                            <th className="text-white text-xs font-semibold py-3 px-4">
                              السعر الشهري
                            </th>
                            <th className="text-white text-xs font-semibold py-3 px-4 text-center">
                              الطلاب
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {teacherFilteredGroups.map((g) => (
                            <tr
                              key={g.id}
                              onClick={() => navigate(`/groups/${g.id}`)}
                              className="hover:bg-sky-50/60 cursor-pointer"
                            >
                              <td className="py-3 px-4 font-bold text-xs text-slate-800 whitespace-nowrap">
                                {g.grade_name}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                {g.is_private ? (
                                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                    💎 برايفت
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    📦 باكدج
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <p className="font-bold text-xs sm:text-sm text-slate-800">
                                  {g.name_ar || g.name}
                                </p>
                                <p className="text-[11px] text-slate-500">{g.subject_name}</p>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex flex-wrap gap-1">
                                  {(Array.isArray(g.schedule) ? g.schedule : []).map((s, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-0.5 rounded bg-sky-50 text-sky-900 border border-sky-100 text-xs font-bold"
                                    >
                                      {dayMap[s.day] || s.day}: {formatTime12h(s.start_time)}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                {Number(g.price_per_month) > 0 ? (
                                  <span className="font-black text-xs sm:text-sm text-amber-700">
                                    {Number(g.price_per_month)} ج.م / شهر
                                  </span>
                                ) : (
                                  <span className="text-xs font-semibold text-emerald-700">
                                    ضمن باكدج المرحلة
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-bold">
                                  {g.student_count || 0} طالب
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {teacherGroupsByDay.map((d) => (
                      <div
                        key={d.dayKey}
                        className="bg-white rounded-xl border border-slate-200 overflow-hidden"
                      >
                        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                          <span className="font-black text-sm text-[#0C3C82]">
                            📅 يوم {d.dayLabel}
                          </span>
                          <span className="text-xs font-bold text-slate-600">
                            {d.slots.length} حصة
                          </span>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {d.slots.map((slot, idx) => (
                            <div
                              key={`${slot.id}-${idx}`}
                              onClick={() => navigate(`/groups/${slot.id}`)}
                              className="p-3.5 hover:bg-sky-50/50 cursor-pointer flex flex-wrap items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-3">
                                <span className="px-3 py-1 rounded-lg bg-[#0C3C82] text-white font-bold text-xs">
                                  🕒 {formatTime12h(slot.startTime)}
                                </span>
                                <div>
                                  <p className="font-bold text-xs sm:text-sm text-slate-800">
                                    {slot.grade_name} — {slot.name_ar || slot.name}
                                  </p>
                                  <p className="text-[11px] text-slate-500">{slot.subject_name}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {slot.is_private ? (
                                  <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                    💎 برايفت ({Number(slot.price_per_month)} ج.م)
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    📦 باكدج
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================
          MODE 2: ACADEMIC GRADE SCHEDULE & INFORMATION
      ======================================================================== */}
      {activeMode === 'GRADE' && (
        <div className="space-y-5">
          {/* Grade Selection Pills */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <label className="block text-xs font-bold text-slate-700 mb-2.5">
              اختر المرحلة الدراسية لعرض جدولها ومعلوماتها بالكامل:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {grades.map((g) => {
                const isSelected = g.id === selectedGradeId;
                const count = groups.filter((grp) => grp.grade_id === g.id).length;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      setSelectedGradeId(g.id);
                      setGradeSubjectFilter('');
                    }}
                    className={`p-3 rounded-xl border text-right cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#0C3C82] text-white border-[#0C3C82] shadow-xs'
                        : 'bg-slate-50/70 text-slate-800 border-slate-200 hover:bg-sky-50 hover:border-sky-300'
                    }`}
                  >
                    <span className="font-bold text-xs sm:text-sm leading-snug">{g.name_ar}</span>
                    <span
                      className={`text-[11px] mt-1.5 font-semibold ${
                        isSelected ? 'text-cyan-200' : 'text-slate-500'
                      }`}
                    >
                      {count} مجموعة متاحة
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedGrade && (
            <>
              {/* Grade Summary & Track Filters */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-[#0C3C82]">
                      جدول ومعلومات: {selectedGrade.name_ar}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      إجمالي المجموعات: <strong>{gradeStats.total}</strong> مجموعة (
                      <strong>{gradeStats.pkgTotal}</strong> باكدج ،{' '}
                      <strong>{gradeStats.privTotal}</strong> برايفت) — يدرس بها{' '}
                      <strong>{gradeStats.teacherCount}</strong> مدرس
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsPrintOpen(true)}
                    className="atlas-btn atlas-btn-primary text-xs flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <Printer size={15} />
                    <span>طباعة جدول {selectedGrade.name_ar}</span>
                  </button>
                </div>

                {/* Track Filter Tabs + View Switcher */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setGradeTrackFilter('ALL')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                        gradeTrackFilter === 'ALL'
                          ? 'bg-[#0C3C82] text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      الكل ({gradeStats.total})
                    </button>

                    {gradeStats.pkgPublic > 0 && (
                      <button
                        type="button"
                        onClick={() => setGradeTrackFilter('PACKAGE_PUBLIC')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                          gradeTrackFilter === 'PACKAGE_PUBLIC'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        📦 باكدج عربي / عام ({gradeStats.pkgPublic})
                      </button>
                    )}

                    {gradeStats.pkgLang > 0 && (
                      <button
                        type="button"
                        onClick={() => setGradeTrackFilter('PACKAGE_LANG')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                          gradeTrackFilter === 'PACKAGE_LANG'
                            ? 'bg-purple-600 text-white'
                            : 'bg-purple-50 text-purple-800 border border-purple-200'
                        }`}
                      >
                        🌐 باكدج لغات ({gradeStats.pkgLang})
                      </button>
                    )}

                    {gradeStats.privTotal > 0 && (
                      <button
                        type="button"
                        onClick={() => setGradeTrackFilter('PRIVATE')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                          gradeTrackFilter === 'PRIVATE'
                            ? 'bg-amber-600 text-white'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        💎 مجموعات البرايفت ({gradeStats.privTotal})
                      </button>
                    )}

                    {/* Subject Dropdown Filter */}
                    <select
                      value={gradeSubjectFilter}
                      onChange={(e) => setGradeSubjectFilter(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white outline-none"
                    >
                      <option value="">كل المواد في هذه المرحلة ({gradeStats.availableSubjects.length})</option>
                      {gradeStats.availableSubjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* View Style Switcher */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs self-start lg:self-auto">
                    <button
                      type="button"
                      onClick={() => setGradeViewStyle('BY_SUBJECT')}
                      className={`px-3 py-1.5 rounded font-bold cursor-pointer ${
                        gradeViewStyle === 'BY_SUBJECT'
                          ? 'bg-white text-[#0C3C82] shadow-2xs'
                          : 'text-slate-600'
                      }`}
                    >
                      📚 عرض حسب المواد والمدرسين
                    </button>
                    <button
                      type="button"
                      onClick={() => setGradeViewStyle('BY_DAY')}
                      className={`px-3 py-1.5 rounded font-bold cursor-pointer ${
                        gradeViewStyle === 'BY_DAY'
                          ? 'bg-white text-[#0C3C82] shadow-2xs'
                          : 'text-slate-600'
                      }`}
                    >
                      📅 الجدول الأسبوعي (الأيام)
                    </button>
                  </div>
                </div>
              </div>

              {/* Grade Schedule Content */}
              {gradeFilteredGroups.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500">
                  لا توجد مجموعات مطابقة لهذا الفلتر في {selectedGrade.name_ar}
                </div>
              ) : gradeViewStyle === 'BY_SUBJECT' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {gradeGroupsBySubject.map((subSec) => (
                    <div
                      key={subSec.subjectId}
                      className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
                    >
                      <div
                        className="px-4 py-3 border-b border-slate-200 flex items-center justify-between"
                        style={{ background: '#f8fafc' }}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-5 rounded-full"
                            style={{ background: subSec.subjectColor }}
                          />
                          <h3 className="font-black text-sm text-slate-900">
                            {subSec.subjectName}
                          </h3>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-800">
                          {subSec.items.length} مجموعة
                        </span>
                      </div>

                      <div className="divide-y divide-slate-100">
                        {subSec.items.map((g) => (
                          <div
                            key={g.id}
                            onClick={() => navigate(`/groups/${g.id}`)}
                            className="p-3.5 hover:bg-sky-50/50 cursor-pointer space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <GraduationCap size={15} className="text-[#0C3C82] shrink-0" />
                                <span className="font-bold text-xs sm:text-sm text-slate-900">
                                  {g.teacher_name}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {g.is_private ? (
                                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                    💎 برايفت ({Number(g.price_per_month)} ج.م/شهر)
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    📦 باكدج
                                  </span>
                                )}
                              </div>
                            </div>

                            <p className="text-xs text-slate-500">{g.name_ar || g.name}</p>

                            <div className="flex flex-wrap items-center gap-1.5">
                              {(Array.isArray(g.schedule) ? g.schedule : []).map((s, idx) => (
                                <span
                                  key={idx}
                                  className="px-2.5 py-0.5 rounded-md bg-sky-50 text-sky-900 border border-sky-100 text-xs font-bold"
                                >
                                  📅 {dayMap[s.day] || s.day}: {formatTime12h(s.start_time)}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {gradeGroupsByDay.map((d) => (
                    <div
                      key={d.dayKey}
                      className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
                    >
                      <div
                        className="px-4 py-3 flex items-center justify-between text-white"
                        style={{ background: '#0C3C82' }}
                      >
                        <span className="font-black text-sm">📅 يوم {d.dayLabel}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20">
                          {d.slots.length} مواعيد
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs">
                              <th className="py-2.5 px-4 font-bold">الموعد</th>
                              <th className="py-2.5 px-4 font-bold">المادة الدراسية</th>
                              <th className="py-2.5 px-4 font-bold">المدرس</th>
                              <th className="py-2.5 px-4 font-bold">اسم المجموعة</th>
                              <th className="py-2.5 px-4 font-bold">النظام / السعر</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {d.slots.map((slot, idx) => (
                              <tr
                                key={`${slot.id}-${idx}`}
                                onClick={() => navigate(`/groups/${slot.id}`)}
                                className="hover:bg-sky-50/50 cursor-pointer text-xs"
                              >
                                <td className="py-3 px-4 font-black text-[#0C3C82] whitespace-nowrap">
                                  🕒 {formatTime12h(slot.startTime)}
                                </td>
                                <td className="py-3 px-4 font-bold text-slate-800 whitespace-nowrap">
                                  {slot.subject_name}
                                </td>
                                <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                                  {slot.teacher_name}
                                </td>
                                <td className="py-3 px-4 text-slate-600">
                                  {slot.name_ar || slot.name}
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap">
                                  {slot.is_private ? (
                                    <span className="px-2 py-0.5 rounded font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                      💎 برايفت ({Number(slot.price_per_month)} ج.م)
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                      📦 ضمن الباكدج
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Print Modal */}
      <PrintReportModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        title={printTitle}
        subtitle={`عدد المجموعات: ${printData.length} مجموعة`}
        columns={printColumns}
        data={printData}
      />
    </div>
  );
}

