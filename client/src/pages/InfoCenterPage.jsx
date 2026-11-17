import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { formatTime12h } from '../lib/formatters';
import PrintReportModal from '../components/PrintReportModal';
import {
  GraduationCap, Calendar, BookOpen, Search, Printer,
  Users, Clock, Layers, Package, Sparkles, X,
  ChevronLeft, Phone, UserCheck, Compass, ExternalLink,
  MapPin, CheckSquare, Square, RefreshCw, CalendarDays,
  Filter, ChevronDown, ChevronUp
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

const dayIndexToKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const formatScheduleText = (schedule) => {
  if (!schedule || !Array.isArray(schedule) || schedule.length === 0) return 'بدون موعد';
  return schedule
    .map((s) => `${dayMap[s.day] || s.day} (${formatTime12h(s.start_time)})`)
    .join(' ، ');
};

const renderSystemBadge = (item) => {
  const inPkg = Boolean(item.is_in_package);
  const inPriv = Boolean(item.is_private || Number(item.price_per_month) > 0);
  const price = Number(item.price_per_month) || 0;

  if (inPkg && inPriv) {
    return (
      <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-blue-50 text-[#0C3C82] border border-blue-200 inline-flex items-center gap-1">
        <span>📦 باكدج + 💎 برايفت</span>
        {price > 0 && <span className="text-[10px] text-blue-700">({price} ج.م)</span>}
      </span>
    );
  }
  if (inPriv) {
    return (
      <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
        <span>💎 برايفت</span>
        {price > 0 && <span className="text-[10px] text-amber-700">({price} ج.م)</span>}
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200">
      📦 باكدج
    </span>
  );
};

export default function InfoCenterPage() {
  const navigate = useNavigate();

  // Current system day key (e.g. 'saturday', 'sunday', etc.)
  const todayKey = useMemo(() => {
    const jsDay = new Date().getDay();
    return dayIndexToKey[jsDay] || 'saturday';
  }, []);

  // Main Active Mode: 'TEACHER' | 'GRADE' | 'DAY'
  const [activeMode, setActiveMode] = useState('DAY');

  // Master Data
  const [teachers, setTeachers] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // ---------------------------------------------------------------------------
  // 1. Teacher Mode States
  // ---------------------------------------------------------------------------
  const [teacherSearch, setTeacherSearch] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [teacherGroupType, setTeacherGroupType] = useState('ALL'); // 'ALL' | 'PACKAGE' | 'PRIVATE'
  const [teacherViewStyle, setTeacherViewStyle] = useState('BY_GRADE'); // 'BY_GRADE' | 'BY_DAY'

  // ---------------------------------------------------------------------------
  // 2. Grade Mode States
  // ---------------------------------------------------------------------------
  const [selectedGradeId, setSelectedGradeId] = useState('');
  const [gradeTrackFilter, setGradeTrackFilter] = useState('ALL'); // 'ALL' | 'PACKAGE_PUBLIC' | 'PACKAGE_LANG' | 'PRIVATE'
  const [gradeSubjectFilter, setGradeSubjectFilter] = useState('');
  const [gradeViewStyle, setGradeViewStyle] = useState('BY_SUBJECT'); // 'BY_SUBJECT' | 'BY_DAY'

  // ---------------------------------------------------------------------------
  // 3. Day Mode States (Single Day or Multiple Days with Center Filters)
  // ---------------------------------------------------------------------------
  const [selectedDays, setSelectedDays] = useState([todayKey]);
  const [daySearch, setDaySearch] = useState('');
  const [dayGradeFilter, setDayGradeFilter] = useState('');
  const [daySubjectFilter, setDaySubjectFilter] = useState('');
  const [dayTeacherFilter, setDayTeacherFilter] = useState('');
  const [dayTypeFilter, setDayTypeFilter] = useState('ALL'); // 'ALL' | 'PACKAGE' | 'PRIVATE'
  const [dayTrackFilter, setDayTrackFilter] = useState('ALL'); // 'ALL' | 'PUBLIC' | 'LANGUAGES'
  const [dayClassroomFilter, setDayClassroomFilter] = useState('');
  const [daySortBy, setDaySortBy] = useState('TIME_ASC'); // 'TIME_ASC' | 'GRADE_ASC'
  const [collapsedDaySections, setCollapsedDaySections] = useState({});

  // Print Modal
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [singleDayPrint, setSingleDayPrint] = useState(null); // { dayLabel, slots } | null

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/teachers'),
      api.get('/master/grades'),
      api.get('/master/subjects'),
      api.get('/master/classrooms').catch(() => ({ data: { data: [] } })),
      api.get('/groups'),
    ])
      .then(([tRes, gRes, sRes, cRes, grpRes]) => {
        const tList = tRes.data.data || [];
        const gList = gRes.data.data || [];
        const sList = sRes.data.data || [];
        const cList = cRes.data.data || [];
        const grpList = grpRes.data.data || [];

        setTeachers(tList);
        setGrades(gList);
        setSubjects(sList);
        setClassrooms(cList);
        setGroups(grpList);

        if (gList.length > 0) {
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
    const q = (teacherSearch || '').replace(/[أإآ]/g, 'ا').trim().toLowerCase();
    return teachers.filter((t) => {
      if (!q) return true;
      const fn = (t.full_name || '').replace(/[أإآ]/g, 'ا').toLowerCase();
      const sp = (t.specialization || '').replace(/[أإآ]/g, 'ا').toLowerCase();
      const sn = (t.subject_name || '').replace(/[أإآ]/g, 'ا').toLowerCase();
      return fn.includes(q) || sp.includes(q) || sn.includes(q);
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
      if (teacherGroupType === 'PACKAGE' && !g.is_in_package) return false;
      if (teacherGroupType === 'PRIVATE' && !(g.is_private || Number(g.price_per_month) > 0)) return false;
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
      if (g.is_in_package) pkgCount++;
      if (g.is_private || Number(g.price_per_month) > 0) privCount++;
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
      if (g.is_in_package) {
        pkgTotal++;
        const types = Array.isArray(g.package_education_types) ? g.package_education_types : [];
        if (types.includes('PUBLIC')) pkgPublic++;
        if (types.includes('LANGUAGES')) pkgLang++;
      }
      if (g.is_private || Number(g.price_per_month) > 0) {
        privTotal++;
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
        if (!g.is_in_package) return false;
        const types = Array.isArray(g.package_education_types) ? g.package_education_types : [];
        if (!types.includes('PUBLIC')) return false;
      } else if (gradeTrackFilter === 'PACKAGE_LANG') {
        if (!g.is_in_package) return false;
        const types = Array.isArray(g.package_education_types) ? g.package_education_types : [];
        if (!types.includes('LANGUAGES')) return false;
      } else if (gradeTrackFilter === 'PRIVATE') {
        if (!(g.is_private || Number(g.price_per_month) > 0)) return false;
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
  // 3. DAY / MULTI-DAY MODE COMPUTATIONS
  // ============================================================================
  // Toggle day selection
  const handleToggleDay = useCallback((dayKey) => {
    setSelectedDays((prev) => {
      if (prev.includes(dayKey)) {
        // Keep at least one or allow empty
        return prev.filter((k) => k !== dayKey);
      } else {
        return [...prev, dayKey];
      }
    });
  }, []);

  const handleSelectOnlyDay = useCallback((dayKey) => {
    setSelectedDays([dayKey]);
  }, []);

  const handleSelectAllDays = useCallback(() => {
    setSelectedDays(orderedDays.map((d) => d.key));
  }, []);

  const handleClearDays = useCallback(() => {
    setSelectedDays([]);
  }, []);

  // Extract all slots matching selected days and filters
  const dayFilteredSlots = useMemo(() => {
    if (selectedDays.length === 0) return [];

    const q = daySearch.trim().toLowerCase();
    const result = [];

    for (const g of groups) {
      // Type Filter
      if (dayTypeFilter === 'PACKAGE' && !g.is_in_package) continue;
      if (dayTypeFilter === 'PRIVATE' && !(g.is_private || Number(g.price_per_month) > 0)) continue;

      // Track Filter
      if (dayTrackFilter !== 'ALL') {
        const types = Array.isArray(g.package_education_types) ? g.package_education_types : [];
        if (!types.includes(dayTrackFilter)) continue;
      }

      // Grade Filter
      if (dayGradeFilter && g.grade_id !== dayGradeFilter) continue;

      // Subject Filter
      if (daySubjectFilter && g.subject_id !== daySubjectFilter) continue;

      // Teacher Filter
      if (dayTeacherFilter && g.teacher_id !== dayTeacherFilter) continue;

      // Classroom Filter
      if (dayClassroomFilter && g.classroom_id !== dayClassroomFilter) continue;

      // Search Filter
      if (q) {
        const normQ = q.replace(/[أإآ]/g, 'ا');
        const nameMatch = (g.name_ar || g.name || '').replace(/[أإآ]/g, 'ا').toLowerCase().includes(normQ);
        const tMatch = (g.teacher_name || '').replace(/[أإآ]/g, 'ا').toLowerCase().includes(normQ);
        const sMatch = (g.subject_name || '').replace(/[أإآ]/g, 'ا').toLowerCase().includes(normQ);
        const grMatch = (g.grade_name || '').replace(/[أإآ]/g, 'ا').toLowerCase().includes(normQ);
        if (!nameMatch && !tMatch && !sMatch && !grMatch) continue;
      }

      // Schedule Slots
      const sched = Array.isArray(g.schedule) ? g.schedule : [];
      for (const slot of sched) {
        const slotDayKey = (slot.day || '').toLowerCase();
        if (selectedDays.includes(slotDayKey)) {
          result.push({
            ...g,
            slotId: `${g.id}-${slotDayKey}-${slot.start_time}`,
            dayKey: slotDayKey,
            slotDay: dayMap[slotDayKey] || slotDayKey,
            startTime: slot.start_time || '00:00',
            endTime: slot.end_time || '',
          });
        }
      }
    }

    // Sort slots
    if (daySortBy === 'TIME_ASC') {
      result.sort((a, b) => {
        // First sort by day order in the week
        const dayOrderA = orderedDays.findIndex((d) => d.key === a.dayKey);
        const dayOrderB = orderedDays.findIndex((d) => d.key === b.dayKey);
        if (dayOrderA !== dayOrderB) return dayOrderA - dayOrderB;
        // Then by time
        return a.startTime.localeCompare(b.startTime);
      });
    } else if (daySortBy === 'GRADE_ASC') {
      result.sort((a, b) => {
        const grA = a.grade_order || 99;
        const grB = b.grade_order || 99;
        if (grA !== grB) return grA - grB;
        return a.startTime.localeCompare(b.startTime);
      });
    }

    return result;
  }, [
    groups,
    selectedDays,
    daySearch,
    dayGradeFilter,
    daySubjectFilter,
    dayTeacherFilter,
    dayTypeFilter,
    dayTrackFilter,
    dayClassroomFilter,
    daySortBy,
  ]);

  // Group slots by Day for sectioned display
  const daySectionsList = useMemo(() => {
    return orderedDays
      .filter((d) => selectedDays.includes(d.key))
      .map((d) => {
        const slots = dayFilteredSlots.filter((s) => s.dayKey === d.key);
        let pkgCount = 0;
        let privCount = 0;
        const teachersSet = new Set();
        slots.forEach((s) => {
          if (s.is_private || Number(s.price_per_month) > 0) privCount++;
          if (s.is_in_package) pkgCount++;
          if (s.teacher_name) teachersSet.add(s.teacher_name);
        });

        return {
          dayKey: d.key,
          dayLabel: d.label,
          slots,
          pkgCount,
          privCount,
          teacherCount: teachersSet.size,
        };
      });
  }, [orderedDays, selectedDays, dayFilteredSlots]);

  // Overall Day Stats
  const dayStats = useMemo(() => {
    let pkgCount = 0;
    let privCount = 0;
    const teachersSet = new Set();
    const gradesSet = new Set();

    dayFilteredSlots.forEach((s) => {
      if (s.is_private || Number(s.price_per_month) > 0) privCount++;
      if (s.is_in_package) pkgCount++;
      if (s.teacher_name) teachersSet.add(s.teacher_name);
      if (s.grade_name) gradesSet.add(s.grade_name);
    });

    return {
      totalSlots: dayFilteredSlots.length,
      pkgCount,
      privCount,
      teacherCount: teachersSet.size,
      gradeCount: gradesSet.size,
    };
  }, [dayFilteredSlots]);

  const toggleDaySection = useCallback((dayKey) => {
    setCollapsedDaySections((prev) => ({
      ...prev,
      [dayKey]: !prev[dayKey],
    }));
  }, []);

  const resetDayFilters = () => {
    setDaySearch('');
    setDayGradeFilter('');
    setDaySubjectFilter('');
    setDayTeacherFilter('');
    setDayTypeFilter('ALL');
    setDayTrackFilter('ALL');
    setDayClassroomFilter('');
    setDaySortBy('TIME_ASC');
  };

  const hasActiveDayFilters = Boolean(
    daySearch ||
      dayGradeFilter ||
      daySubjectFilter ||
      dayTeacherFilter ||
      dayTypeFilter !== 'ALL' ||
      dayTrackFilter !== 'ALL' ||
      dayClassroomFilter ||
      daySortBy !== 'TIME_ASC'
  );

  // ============================================================================
  // PRINT CONFIGURATION (Dynamic per mode)
  // ============================================================================
  const formatSystemType = (item) => {
    const inPkg = Boolean(item.is_in_package);
    const inPriv = Boolean(item.is_private || Number(item.price_per_month) > 0);
    if (inPkg && inPriv) return 'باكدج + برايفت';
    if (inPriv) return 'برايفت';
    return 'باكدج';
  };

  const printColumns = useMemo(() => {
    if (activeMode === 'TEACHER') {
      return [
        { header: 'المرحلة الدراسية', accessor: 'grade_name' },
        { header: 'المادة', accessor: 'subject_name' },
        { header: 'اسم المجموعة', render: (g) => g.name_ar || g.name },
        { header: 'النظام', render: (g) => formatSystemType(g) },
        { header: 'المواعيد', render: (g) => formatScheduleText(g.schedule) },
        {
          header: 'السعر الشهري',
          render: (g) =>
            Number(g.price_per_month) > 0 ? `${Number(g.price_per_month)} ج.م` : 'ضمن الباكدج',
        },
        { header: 'الطلاب', render: (g) => `${g.student_count || 0} طالب` },
      ];
    } else if (activeMode === 'GRADE') {
      return [
        { header: 'المادة الدراسية', accessor: 'subject_name' },
        { header: 'المدرس', accessor: 'teacher_name' },
        { header: 'اسم المجموعة', render: (g) => g.name_ar || g.name },
        { header: 'النظام', render: (g) => formatSystemType(g) },
        { header: 'المواعيد', render: (g) => formatScheduleText(g.schedule) },
        {
          header: 'السعر الشهري',
          render: (g) =>
            Number(g.price_per_month) > 0 ? `${Number(g.price_per_month)} ج.م` : 'ضمن الباكدج',
        },
      ];
    } else {
      // DAY MODE
      return [
        { header: 'اليوم', render: (s) => s.slotDay || '' },
        { header: 'الموعد', render: (s) => formatTime12h(s.startTime) },
        { header: 'المادة الدراسية', accessor: 'subject_name' },
        { header: 'المدرس', accessor: 'teacher_name' },
        { header: 'المرحلة الدراسية', accessor: 'grade_name' },
        { header: 'اسم المجموعة', render: (s) => s.name_ar || s.name },
        { header: 'النظام', render: (s) => formatSystemType(s) },
        { header: 'القاعة', render: (s) => s.classroom_name || '—' },
        {
          header: 'السعر الشهري',
          render: (s) =>
            Number(s.price_per_month) > 0 ? `${Number(s.price_per_month)} ج.م` : 'ضمن الباكدج',
        },
      ];
    }
  }, [activeMode]);

  const printData = singleDayPrint
    ? singleDayPrint.slots
    : activeMode === 'TEACHER'
    ? teacherFilteredGroups
    : activeMode === 'GRADE'
    ? gradeFilteredGroups
    : dayFilteredSlots;

  const printTitle = singleDayPrint
    ? `جدول حصص السنتر — يوم ${singleDayPrint.dayLabel}`
    : activeMode === 'TEACHER'
    ? `جدول ومواعيد المدرس: ${selectedTeacher?.full_name || ''}`
    : activeMode === 'GRADE'
    ? `جدول مواعيد: ${selectedGrade?.name_ar || ''}`
    : `جدول حصص السنتر - ${
        selectedDays.length === 7
          ? 'كامل أيام الأسبوع'
          : selectedDays.map((k) => dayMap[k]).join(' ، ')
      }`;

  const printFiltersSummary = useMemo(() => {
    if (activeMode === 'TEACHER') {
      const list = [];
      if (selectedTeacher?.full_name) list.push(`المدرس: ${selectedTeacher.full_name}`);
      if (teacherGroupType === 'PACKAGE') list.push('النوع: مجموعات الباكدج');
      if (teacherGroupType === 'PRIVATE') list.push('النوع: مجموعات البرايفت');
      return list;
    }
    if (activeMode === 'GRADE') {
      const list = [];
      if (selectedGrade?.name_ar) list.push(`المرحلة: ${selectedGrade.name_ar}`);
      if (gradeTrackFilter === 'PACKAGE_PUBLIC') list.push('المسار: باكدج عربي/عام');
      if (gradeTrackFilter === 'PACKAGE_LANG') list.push('المسار: باكدج لغات');
      if (gradeTrackFilter === 'PRIVATE') list.push('المسار: حصص برايفت');
      if (gradeSubjectFilter) {
        const sub = subjects.find((s) => s.id === gradeSubjectFilter);
        if (sub) list.push(`المادة: ${sub.name_ar}`);
      }
      return list;
    }
    const list = [];
    if (singleDayPrint) {
      list.push(`اليوم: ${singleDayPrint.dayLabel}`);
    } else if (selectedDays.length > 0) {
      list.push(
        `الأيام: ${
          selectedDays.length === 7
            ? 'كامل الأسبوع'
            : selectedDays.map((k) => dayMap[k]).join(' + ')
        }`
      );
    }
    if (dayTypeFilter === 'PACKAGE') list.push('النوع: حصص الباكدج');
    if (dayTypeFilter === 'PRIVATE') list.push('النوع: حصص البرايفت');
    if (dayTrackFilter === 'PUBLIC') list.push('المسار: عربي / عام');
    if (dayTrackFilter === 'LANGUAGES') list.push('المسار: لغات');
    if (dayGradeFilter) {
      const gr = grades.find((g) => g.id === dayGradeFilter);
      if (gr) list.push(`المرحلة: ${gr.name_ar}`);
    }
    if (daySubjectFilter) {
      const sub = subjects.find((s) => s.id === daySubjectFilter);
      if (sub) list.push(`المادة: ${sub.name_ar}`);
    }
    if (dayTeacherFilter) {
      const t = teachers.find((x) => x.id === dayTeacherFilter);
      if (t) list.push(`المدرس: ${t.full_name}`);
    }
    if (daySearch.trim()) list.push(`بحث: "${daySearch.trim()}"`);
    return list;
  }, [
    activeMode,
    selectedTeacher,
    teacherGroupType,
    selectedGrade,
    gradeTrackFilter,
    gradeSubjectFilter,
    subjects,
    singleDayPrint,
    selectedDays,
    dayTypeFilter,
    dayTrackFilter,
    dayGradeFilter,
    grades,
    daySubjectFilter,
    dayTeacherFilter,
    teachers,
    daySearch,
  ]);

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
            استعلم فوراً عن جدول السنتر باليوم، أو مواعيد أي مدرس، أو جدول أي مرحلة دراسية (باكدج وبرايفت)
          </p>
        </div>

        {((activeMode === 'TEACHER' && selectedTeacher) ||
          (activeMode === 'GRADE' && selectedGrade) ||
          (activeMode === 'DAY' && dayFilteredSlots.length > 0)) && (
          <button
            type="button"
            onClick={() => {
              setSingleDayPrint(null);
              setIsPrintOpen(true);
            }}
            className="atlas-btn atlas-btn-primary text-xs sm:text-sm flex items-center gap-2 self-start sm:self-auto"
          >
            <Printer size={16} />
            <span>
              {activeMode === 'TEACHER'
                ? 'طباعة جدول المدرس'
                : activeMode === 'GRADE'
                ? 'طباعة جدول المرحلة'
                : 'طباعة كشف الأيام المحددة'}
            </span>
          </button>
        )}
      </div>

      {/* 3 Main Mode Switcher Cards: Day Schedule, Teacher Info, Grade Timetable */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Choice 1: Day & Multi-Day Timetable */}
        <button
          type="button"
          onClick={() => setActiveMode('DAY')}
          className={`p-4 rounded-2xl border-2 text-right flex items-center gap-3.5 cursor-pointer ${
            activeMode === 'DAY'
              ? 'bg-[#0C3C82] text-white border-[#0C3C82] shadow-md'
              : 'bg-white text-slate-800 border-slate-200 hover:border-sky-300 hover:bg-sky-50/40'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              activeMode === 'DAY' ? 'bg-white/15 text-cyan-300' : 'bg-sky-100 text-[#0C3C82]'
            }`}
          >
            <CalendarDays size={26} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm sm:text-base font-black">1. استعلام بجدول الأيام</h2>
            <p
              className={`text-[11px] mt-0.5 leading-snug ${
                activeMode === 'DAY' ? 'text-white/80' : 'text-slate-500'
              }`}
            >
              اختر يوماً أو عدة أيام لعرض كافة حصص ومواعيد السنتر مرتبة زمنياً مع الفلاتر
            </p>
          </div>
        </button>

        {/* Choice 2: Teacher Info */}
        <button
          type="button"
          onClick={() => setActiveMode('TEACHER')}
          className={`p-4 rounded-2xl border-2 text-right flex items-center gap-3.5 cursor-pointer ${
            activeMode === 'TEACHER'
              ? 'bg-[#0C3C82] text-white border-[#0C3C82] shadow-md'
              : 'bg-white text-slate-800 border-slate-200 hover:border-sky-300 hover:bg-sky-50/40'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              activeMode === 'TEACHER' ? 'bg-white/15 text-cyan-300' : 'bg-sky-100 text-[#0C3C82]'
            }`}
          >
            <GraduationCap size={26} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm sm:text-base font-black">2. استعلام عن مدرس</h2>
            <p
              className={`text-[11px] mt-0.5 leading-snug ${
                activeMode === 'TEACHER' ? 'text-white/80' : 'text-slate-500'
              }`}
            >
              اختر أي مدرس لعرض مواده ومجموعات الباكدج والبرايفت وأسعار الشهر
            </p>
          </div>
        </button>

        {/* Choice 3: Grade Timetable */}
        <button
          type="button"
          onClick={() => setActiveMode('GRADE')}
          className={`p-4 rounded-2xl border-2 text-right flex items-center gap-3.5 cursor-pointer ${
            activeMode === 'GRADE'
              ? 'bg-[#0C3C82] text-white border-[#0C3C82] shadow-md'
              : 'bg-white text-slate-800 border-slate-200 hover:border-sky-300 hover:bg-sky-50/40'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              activeMode === 'GRADE' ? 'bg-white/15 text-cyan-300' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            <Calendar size={26} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm sm:text-base font-black">3. جدول مرحلة دراسية</h2>
            <p
              className={`text-[11px] mt-0.5 leading-snug ${
                activeMode === 'GRADE' ? 'text-white/80' : 'text-slate-500'
              }`}
            >
              اختر المرحلة لعرض جدولها الكامل (عربي / لغات / برايفت)
            </p>
          </div>
        </button>
      </div>

      {/* ========================================================================
          MODE 1: DAY / MULTI-DAY SCHEDULE (جدول السنتر باليوم أو عدة أيام)
      ======================================================================== */}
      {activeMode === 'DAY' && (
        <div className="space-y-5">
          {/* Day Selector Box (Multi-Day Chips & Quick Presets) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                  <CalendarDays size={18} className="text-[#0C3C82]" />
                  <span>اختر الأيام المراد عرض جدول السنتر لها (يمكنك اختيار يوم أو عدة أيام معاً):</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  اضغط على أي يوم لتحديده أو إلغاء تحديده، أو استخدم الأزرار السريعة
                </p>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleSelectOnlyDay(todayKey)}
                  className="px-2.5 py-1 rounded-lg font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 cursor-pointer flex items-center gap-1"
                >
                  ⚡ اليوم ({dayMap[todayKey]})
                </button>
                <button
                  type="button"
                  onClick={handleSelectAllDays}
                  className="px-2.5 py-1 rounded-lg font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  تحديد كل الأيام
                </button>
                <button
                  type="button"
                  onClick={handleClearDays}
                  className="px-2.5 py-1 rounded-lg font-bold text-rose-600 hover:bg-rose-50 cursor-pointer"
                >
                  مسح التحديد
                </button>
              </div>
            </div>

            {/* 7 Days Toggle Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-1">
              {orderedDays.map((d) => {
                const isSelected = selectedDays.includes(d.key);
                const isToday = d.key === todayKey;
                // Count how many groups occur on this day across center
                const countOnDay = groups.filter((g) => {
                  const s = Array.isArray(g.schedule) ? g.schedule : [];
                  return s.some((slot) => slot.day && slot.day.toLowerCase() === d.key);
                }).length;

                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => handleToggleDay(d.key)}
                    className={`p-3 rounded-xl border text-center cursor-pointer transition-all flex flex-col items-center justify-between gap-1 relative ${
                      isSelected
                        ? 'bg-[#0C3C82] text-white border-[#0C3C82] shadow-sm'
                        : 'bg-slate-50/70 text-slate-800 border-slate-200 hover:bg-sky-50 hover:border-sky-300'
                    }`}
                  >
                    {isToday && (
                      <span className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white" title="اليوم الحالي" />
                    )}
                    <span className="font-black text-sm">يوم {d.label}</span>
                    <span
                      className={`text-[11px] font-semibold ${
                        isSelected ? 'text-cyan-200' : 'text-slate-500'
                      }`}
                    >
                      {countOnDay} حصة
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Filters Toolbar for Selected Day(s) */}
          <div className="atlas-card p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Filter size={14} className="text-[#0C3C82]" />
                <span>فلاتر جدول الأيام المحددة:</span>
              </span>

              {hasActiveDayFilters && (
                <button
                  type="button"
                  onClick={resetDayFilters}
                  className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={13} />
                  <span>إعادة ضبط الفلاتر</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {/* Search Box */}
              <div className="relative sm:col-span-2">
                <Search
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={daySearch}
                  onChange={(e) => setDaySearch(e.target.value)}
                  placeholder="بحث باسم المدرس، المادة، أو المجموعة..."
                  className="atlas-input pr-9 text-xs"
                />
                {daySearch && (
                  <button
                    type="button"
                    onClick={() => setDaySearch('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Grade Filter */}
              <div>
                <select
                  value={dayGradeFilter}
                  onChange={(e) => setDayGradeFilter(e.target.value)}
                  className="atlas-input text-xs"
                >
                  <option value="">كل المراحل الدراسية</option>
                  {grades.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name_ar}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Filter */}
              <div>
                <select
                  value={daySubjectFilter}
                  onChange={(e) => setDaySubjectFilter(e.target.value)}
                  className="atlas-input text-xs"
                >
                  <option value="">كل المواد الدراسية ({subjects.length})</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name_ar}
                    </option>
                  ))}
                </select>
              </div>

              {/* Teacher Filter */}
              <div>
                <select
                  value={dayTeacherFilter}
                  onChange={(e) => setDayTeacherFilter(e.target.value)}
                  className="atlas-input text-xs"
                >
                  <option value="">كل المدرسين ({teachers.length})</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Group Type (Package vs Private) */}
              <div>
                <select
                  value={dayTypeFilter}
                  onChange={(e) => setDayTypeFilter(e.target.value)}
                  className="atlas-input text-xs"
                >
                  <option value="ALL">كل الأنظمة (باكدج + برايفت)</option>
                  <option value="PACKAGE">📦 مجموعات الباكدج فقط</option>
                  <option value="PRIVATE">💎 مجموعات البرايفت فقط</option>
                </select>
              </div>
            </div>

            {/* Secondary Filter Row: Track, Classroom, Sorting */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                {/* Track Filter */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setDayTrackFilter('ALL')}
                    className={`px-2.5 py-1 rounded font-bold cursor-pointer ${
                      dayTrackFilter === 'ALL'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600'
                    }`}
                  >
                    الكل (عربي + لغات)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDayTrackFilter('PUBLIC')}
                    className={`px-2.5 py-1 rounded font-bold cursor-pointer ${
                      dayTrackFilter === 'PUBLIC'
                        ? 'bg-white text-blue-800 shadow-2xs'
                        : 'text-slate-600'
                    }`}
                  >
                    🏛️ عربي
                  </button>
                  <button
                    type="button"
                    onClick={() => setDayTrackFilter('LANGUAGES')}
                    className={`px-2.5 py-1 rounded font-bold cursor-pointer ${
                      dayTrackFilter === 'LANGUAGES'
                        ? 'bg-white text-purple-800 shadow-2xs'
                        : 'text-slate-600'
                    }`}
                  >
                    🌐 لغات
                  </button>
                </div>

                {/* Classroom Filter if available */}
                {classrooms.length > 0 && (
                  <select
                    value={dayClassroomFilter}
                    onChange={(e) => setDayClassroomFilter(e.target.value)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold bg-white outline-none"
                  >
                    <option value="">كل القاعات الدراسية</option>
                    {classrooms.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name_ar || c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Sorting Mode & Print Button */}
              <div className="flex flex-wrap items-center gap-2 text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold">ترتيب النتائج:</span>
                  <select
                    value={daySortBy}
                    onChange={(e) => setDaySortBy(e.target.value)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 bg-white outline-none cursor-pointer"
                  >
                    <option value="TIME_ASC">🕒 بالموعد (من الصباح للمساء)</option>
                    <option value="GRADE_ASC">🎓 بالمرحلة الدراسية</option>
                  </select>
                </div>

                {dayFilteredSlots.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSingleDayPrint(null);
                      setIsPrintOpen(true);
                    }}
                    className="px-3 py-1 rounded-lg bg-[#0C3C82] hover:bg-[#092c61] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer size={13} />
                    <span>طباعة الجدول ({dayFilteredSlots.length})</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar for Day Mode */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-500 font-semibold">إجمالي الحصص المطابقة</p>
                <p className="text-lg font-black text-slate-900 mt-0.5">
                  {dayStats.totalSlots} حصة
                </p>
              </div>
              <CalendarDays size={22} className="text-[#0C3C82]" />
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/30 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-emerald-700 font-semibold">حصص الباكدج</p>
                <p className="text-lg font-black text-emerald-900 mt-0.5">
                  📦 {dayStats.pkgCount}
                </p>
              </div>
              <Package size={22} className="text-emerald-600" />
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-amber-200 bg-amber-50/30 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-amber-700 font-semibold">حصص البرايفت</p>
                <p className="text-lg font-black text-amber-900 mt-0.5">
                  💎 {dayStats.privCount}
                </p>
              </div>
              <Sparkles size={22} className="text-amber-600" />
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-500 font-semibold">المدرسون المتواجدون</p>
                <p className="text-lg font-black text-slate-900 mt-0.5">
                  👨‍🏫 {dayStats.teacherCount} مدرس
                </p>
              </div>
              <GraduationCap size={22} className="text-sky-600" />
            </div>
          </div>

          {/* Day Schedule Content: Grouped by Day */}
          {selectedDays.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500">
              يرجى اختيار يوم واحد على الأقل من شريط الأيام بالأعلى لعرض جدول السنتر له
            </div>
          ) : dayFilteredSlots.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500">
              لا توجد حصص مطابقة للفلاتر في الأيام المحددة
            </div>
          ) : (
            <div className="space-y-4">
              {daySectionsList.map((sec) => {
                const isCollapsed = Boolean(collapsedDaySections[sec.dayKey]);
                return (
                  <div
                    key={sec.dayKey}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs"
                  >
                    {/* Day Section Header */}
                    <div
                      onClick={() => toggleDaySection(sec.dayKey)}
                      className="px-4 sm:px-5 py-3.5 bg-slate-50 hover:bg-slate-100/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-6 rounded-full bg-[#0C3C82]" />
                        <h3 className="font-black text-sm sm:text-base text-slate-900">
                          جدول يوم {sec.dayLabel}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0C3C82] text-white">
                          {sec.slots.length} حصة
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        {sec.pkgCount > 0 && (
                          <span className="px-2 py-0.5 rounded-md font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            📦 {sec.pkgCount} باكدج
                          </span>
                        )}
                        {sec.privCount > 0 && (
                          <span className="px-2 py-0.5 rounded-md font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            💎 {sec.privCount} برايفت
                          </span>
                        )}
                        <span className="text-slate-400">|</span>
                        <span className="text-slate-600 font-semibold">
                          👨‍🏫 {sec.teacherCount} مدرس
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSingleDayPrint({ dayLabel: sec.dayLabel, slots: sec.slots });
                            setIsPrintOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-sky-50 text-[#0C3C82] border border-slate-200 font-bold flex items-center gap-1 cursor-pointer"
                          title={`طباعة جدول يوم ${sec.dayLabel}`}
                        >
                          <Printer size={12} />
                          <span>طباعة اليوم</span>
                        </button>
                        <button
                          type="button"
                          className="p-1 rounded-lg text-slate-500 hover:bg-slate-200"
                        >
                          {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Day Sessions Table */}
                    {!isCollapsed && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                          <thead>
                            <tr className="bg-slate-50/60 border-b border-slate-200 text-slate-700 text-xs">
                              <th className="py-2.5 px-4 font-bold whitespace-nowrap">الموعد</th>
                              <th className="py-2.5 px-4 font-bold whitespace-nowrap">
                                المادة الدراسية
                              </th>
                              <th className="py-2.5 px-4 font-bold whitespace-nowrap">المدرس</th>
                              <th className="py-2.5 px-4 font-bold whitespace-nowrap">
                                المرحلة الدراسية
                              </th>
                              <th className="py-2.5 px-4 font-bold whitespace-nowrap">
                                اسم المجموعة
                              </th>
                              <th className="py-2.5 px-4 font-bold whitespace-nowrap">النظام</th>
                              <th className="py-2.5 px-4 font-bold whitespace-nowrap">القاعة</th>
                              <th className="py-2.5 px-4 font-bold whitespace-nowrap">
                                السعر الشهري
                              </th>
                              <th className="py-2.5 px-4 font-bold text-center whitespace-nowrap">
                                الطلاب
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {sec.slots.map((slot) => (
                              <tr
                                key={slot.slotId}
                                onClick={() => navigate(`/groups/${slot.id}`)}
                                className="hover:bg-sky-50/50 cursor-pointer text-xs"
                              >
                                <td className="py-3 px-4 font-black text-[#0C3C82] whitespace-nowrap">
                                  <span className="px-2 py-1 rounded-md bg-sky-50 text-[#0C3C82] border border-sky-200 font-mono">
                                    🕒 {formatTime12h(slot.startTime)}
                                  </span>
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap">
                                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                    <span
                                      className="w-2.5 h-2.5 rounded-full shrink-0"
                                      style={{ background: slot.subject_color || '#0C3C82' }}
                                    />
                                    <span>{slot.subject_name}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                                  {slot.teacher_name}
                                </td>
                                <td className="py-3 px-4 font-semibold text-slate-700 whitespace-nowrap">
                                  <span className="px-2 py-0.5 rounded bg-slate-100">
                                    {slot.grade_name}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-slate-700">
                                  {slot.name_ar || slot.name}
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap">
                                  {renderSystemBadge(slot)}
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap">
                                  {slot.classroom_name ? (
                                    <span className="font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1 text-[11px] w-fit">
                                      <MapPin size={11} className="text-[#0C3C82]" />
                                      {slot.classroom_name}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap">
                                  {Number(slot.price_per_month) > 0 ? (
                                    <span className="font-black text-amber-700">
                                      {Number(slot.price_per_month)} ج.م / شهر
                                    </span>
                                  ) : (
                                    <span className="text-emerald-700 font-semibold">
                                      ضمن الباكدج
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-center whitespace-nowrap">
                                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                                    {slot.student_count || 0}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================
          MODE 2: TEACHER INFORMATION & SCHEDULE
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
                                {renderSystemBadge(g)}
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
                                {renderSystemBadge(slot)}
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
          MODE 3: ACADEMIC GRADE SCHEDULE & INFORMATION
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
                                {renderSystemBadge(g)}
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
                                  {renderSystemBadge(slot)}
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
        onClose={() => {
          setIsPrintOpen(false);
          setSingleDayPrint(null);
        }}
        title={printTitle}
        subtitle={`عدد الحصص/المجموعات: ${printData.length}`}
        columns={printColumns}
        data={printData}
        filtersSummary={printFiltersSummary}
      />
    </div>
  );
}
