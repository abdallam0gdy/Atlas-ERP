import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { formatTime12h } from '../lib/formatters';
import GroupModal from '../components/GroupModal';
import PrintReportModal from '../components/PrintReportModal';
import CancelSessionModal from '../components/CancelSessionModal';
import GroupSettingsModal from '../components/GroupSettingsModal';
import {
  Search, Plus, BookOpen, Users, Calendar,
  Loader2, GraduationCap, MapPin, Edit2,
  Printer, Download, RefreshCw, X, CalendarX,
  Settings, Layers, ChevronDown, ChevronUp, Package, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

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

export const formatScheduleText = (schedule) => {
  if (!schedule || !Array.isArray(schedule) || schedule.length === 0) return 'بدون موعد';
  return schedule
    .map((s) => `${dayMap[s.day] || s.day} (${formatTime12h(s.start_time)})`)
    .join(' ، ');
};

// Lightweight memoized Group Card for fast rendering on low-end PCs
const GroupCard = memo(function GroupCard({ group, onNavigate, onEdit }) {
  const studentCount = parseInt(group.student_count, 10) || 0;
  const isPrivate = Boolean(group.is_private);
  const eduTypes = Array.isArray(group.package_education_types)
    ? group.package_education_types
    : [];
  const hasPublic = eduTypes.includes('PUBLIC');
  const hasLang = eduTypes.includes('LANGUAGES');

  const scheduleList = Array.isArray(group.schedule) ? group.schedule : [];

  return (
    <div
      onClick={() => onNavigate(group.id)}
      className="bg-white rounded-xl border border-slate-200 hover:border-sky-400 overflow-hidden cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top Color Accent Strip */}
        <div
          className="h-1.5"
          style={{ background: isPrivate ? '#d97706' : group.subject_color || '#0C3C82' }}
        />

        <div className="p-4">
          {/* Type Badge + Actions */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              {isPrivate ? (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  💎 مجموعة برايفت
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  📦 مجموعة باكدج
                </span>
              )}

              {!isPrivate && hasPublic && hasLang && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                  عربي + لغات
                </span>
              )}
              {!isPrivate && hasPublic && !hasLang && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700">
                  عربي
                </span>
              )}
              {!isPrivate && hasLang && !hasPublic && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700">
                  لغات
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  group.status === 'active'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {group.status === 'active' ? 'نشطة' : 'متوقفة'}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(group);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-[#0C3C82] hover:bg-slate-100"
                title="تعديل المجموعة"
              >
                <Edit2 size={14} />
              </button>
            </div>
          </div>

          {/* Group Title & Subject */}
          <div className="flex items-start gap-2.5 mb-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0 mt-0.5"
              style={{ background: group.subject_color || '#0C3C82' }}
            >
              {group.subject_name?.[0] || 'م'}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-sm text-slate-800 leading-snug">
                {group.name_ar || group.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-slate-700">{group.subject_name}</span>
                <span>•</span>
                <span>{group.grade_name}</span>
              </p>
            </div>
          </div>

          {/* Teacher & Classroom */}
          <div className="flex items-center justify-between gap-2 py-2 px-2.5 rounded-lg bg-slate-50 border border-slate-100 mb-2.5 text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <GraduationCap size={14} className="text-[#0C3C82] shrink-0" />
              <span className="font-bold text-slate-800 truncate">{group.teacher_name || '—'}</span>
            </div>
            {group.classroom_name && (
              <span className="font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1 shrink-0 text-[11px]">
                <MapPin size={11} className="text-[#0C3C82]" />
                {group.classroom_name}
              </span>
            )}
          </div>

          {/* Schedule Pills */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            {scheduleList.length > 0 ? (
              scheduleList.map((slot, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-900 border border-sky-100"
                >
                  <Calendar size={11} className="text-sky-600" />
                  <span>{dayMap[slot.day] || slot.day}:</span>
                  <span className="font-bold">{formatTime12h(slot.start_time)}</span>
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400">بدون موعد محدد</span>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer: Students & Pricing */}
      <div className="px-4 py-2.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-700">
          <Users size={13} className="text-[#0C3C82]" />
          <span>{studentCount} طالب مسجل</span>
        </div>

        <div>
          {Number(group.price_per_month) > 0 ? (
            <div className="flex items-center gap-1">
              <span className="font-black text-sm text-amber-700">
                {Number(group.price_per_month)} ج.م
              </span>
              <span className="text-slate-500 text-[11px]">/ شهر</span>
            </div>
          ) : (
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              ضمن باكدج المرحلة
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

export default function GroupsPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Master Data for Filters
  const [grades, setGrades] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Filter States
  const [groupCategory, setGroupCategory] = useState('ALL'); // 'ALL' | 'PACKAGE' | 'PRIVATE'
  const [packageTrack, setPackageTrack] = useState('ALL'); // 'ALL' | 'PUBLIC' | 'LANGUAGES'
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedDay, setSelectedDay] = useState('');

  // Grouping / Organization Mode
  const [groupByMode, setGroupByMode] = useState('GRADE'); // 'GRADE' | 'DAY' | 'SUBJECT' | 'FLAT'
  const [collapsedSections, setCollapsedSections] = useState({});

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 200);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    Promise.all([
      api.get('/master/grades'),
      api.get('/teachers'),
      api.get('/master/subjects'),
    ]).then(([g, t, s]) => {
      setGrades(g.data.data || []);
      setTeachers(t.data.data || []);
      setSubjects(s.data.data || []);
    });
  }, []);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/groups');
      setGroups(data.data || []);
    } catch (err) {
      console.error('Failed to load groups:', err);
      toast.error('تعذر تحميل قائمة المجموعات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Summary counts across all loaded groups
  const summaryCounts = useMemo(() => {
    let pkg = 0;
    let priv = 0;
    for (const g of groups) {
      if (g.is_private) priv++;
      else pkg++;
    }
    return { total: groups.length, pkg, priv };
  }, [groups]);

  // Client-side instant filtering (since 217 groups is small enough in memory to filter in <1ms without network round-trips!)
  const filteredGroups = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return groups.filter((g) => {
      // Category filter
      if (groupCategory === 'PACKAGE' && g.is_private) return false;
      if (groupCategory === 'PRIVATE' && !g.is_private) return false;

      // Package Track filter (PUBLIC vs LANGUAGES)
      if (groupCategory === 'PACKAGE' && packageTrack !== 'ALL') {
        const types = Array.isArray(g.package_education_types) ? g.package_education_types : [];
        if (!types.includes(packageTrack)) return false;
      }

      // Grade filter
      if (selectedGrade && g.grade_id !== selectedGrade) return false;

      // Subject filter
      if (selectedSubject && g.subject_id !== selectedSubject) return false;

      // Teacher filter
      if (selectedTeacher && g.teacher_id !== selectedTeacher) return false;

      // Day of Week filter
      if (selectedDay) {
        const sched = Array.isArray(g.schedule) ? g.schedule : [];
        const hasDay = sched.some((s) => s.day && s.day.toLowerCase() === selectedDay);
        if (!hasDay) return false;
      }

      // Text search
      if (q) {
        const normQ = q.replace(/[أإآ]/g, 'ا');
        const nameMatch = (g.name_ar || g.name || '').replace(/[أإآ]/g, 'ا').toLowerCase().includes(normQ);
        const teacherMatch = (g.teacher_name || '').replace(/[أإآ]/g, 'ا').toLowerCase().includes(normQ);
        const subjectMatch = (g.subject_name || '').replace(/[أإآ]/g, 'ا').toLowerCase().includes(normQ);
        const gradeMatch = (g.grade_name || '').replace(/[أإآ]/g, 'ا').toLowerCase().includes(normQ);
        if (!nameMatch && !teacherMatch && !subjectMatch && !gradeMatch) return false;
      }

      return true;
    });
  }, [
    groups,
    groupCategory,
    packageTrack,
    selectedGrade,
    selectedSubject,
    selectedTeacher,
    selectedDay,
    debouncedSearch,
  ]);

  // Organize filtered groups into sections according to groupByMode
  const groupedSections = useMemo(() => {
    if (groupByMode === 'FLAT') {
      return [
        {
          id: 'all',
          title: 'جميع المجموعات المطابقة',
          subtitle: `${filteredGroups.length} مجموعة`,
          items: filteredGroups,
        },
      ];
    }

    if (groupByMode === 'GRADE') {
      const map = new Map();
      for (const g of filteredGroups) {
        const key = g.grade_id || 'unknown';
        if (!map.has(key)) {
          map.set(key, {
            id: key,
            title: g.grade_name || 'مرحلة غير محددة',
            order: g.grade_order || 99,
            pkgCount: 0,
            privCount: 0,
            items: [],
          });
        }
        const sec = map.get(key);
        if (g.is_private) sec.privCount++;
        else sec.pkgCount++;
        sec.items.push(g);
      }
      return Array.from(map.values()).sort((a, b) => a.order - b.order);
    }

    if (groupByMode === 'DAY') {
      return orderedDays
        .map((d) => {
          const items = filteredGroups
            .filter((g) => {
              const sched = Array.isArray(g.schedule) ? g.schedule : [];
              return sched.some((s) => s.day && s.day.toLowerCase() === d.key);
            })
            .sort((a, b) => {
              const slotA = (a.schedule || []).find((s) => s.day === d.key);
              const slotB = (b.schedule || []).find((s) => s.day === d.key);
              return (slotA?.start_time || '').localeCompare(slotB?.start_time || '');
            });

          let pkgCount = 0;
          let privCount = 0;
          items.forEach((g) => {
            if (g.is_private) privCount++;
            else pkgCount++;
          });

          return {
            id: d.key,
            title: `يوم ${d.label}`,
            pkgCount,
            privCount,
            items,
          };
        })
        .filter((sec) => sec.items.length > 0);
    }

    if (groupByMode === 'SUBJECT') {
      const map = new Map();
      for (const g of filteredGroups) {
        const key = g.subject_id || 'unknown';
        if (!map.has(key)) {
          map.set(key, {
            id: key,
            title: g.subject_name || 'مادة غير محددة',
            color: g.subject_color || '#0C3C82',
            pkgCount: 0,
            privCount: 0,
            items: [],
          });
        }
        const sec = map.get(key);
        if (g.is_private) sec.privCount++;
        else sec.pkgCount++;
        sec.items.push(g);
      }
      return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title, 'ar'));
    }

    return [];
  }, [filteredGroups, groupByMode]);

  const toggleSection = useCallback((secId) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [secId]: !prev[secId],
    }));
  }, []);

  const expandAll = () => setCollapsedSections({});
  const collapseAll = () => {
    const next = {};
    groupedSections.forEach((s) => {
      next[s.id] = true;
    });
    setCollapsedSections(next);
  };

  const handleNavigateGroup = useCallback(
    (id) => {
      navigate(`/groups/${id}`);
    },
    [navigate]
  );

  const handleEditGroup = useCallback((group) => {
    setEditingGroup(group);
    setIsModalOpen(true);
  }, []);

  const hasActiveFilters = Boolean(
    groupCategory !== 'ALL' ||
      packageTrack !== 'ALL' ||
      selectedGrade ||
      selectedSubject ||
      selectedTeacher ||
      selectedDay ||
      searchInput
  );

  const resetFilters = () => {
    setGroupCategory('ALL');
    setPackageTrack('ALL');
    setSelectedGrade('');
    setSelectedSubject('');
    setSelectedTeacher('');
    setSelectedDay('');
    setSearchInput('');
    setDebouncedSearch('');
  };

  const handleExportCsv = () => {
    if (filteredGroups.length === 0) {
      toast.error('لا توجد مجموعات لتصديرها');
      return;
    }

    const headers = [
      'نوع المجموعة',
      'اسم المجموعة',
      'المادة الدراسية',
      'المرحلة الدراسية',
      'المدرس',
      'القاعة',
      'الجدول والمواعيد',
      'الطلاب المسجلون',
      'السعر الشهري',
      'الحالة',
    ];

    const rows = filteredGroups.map((g) => [
      g.is_private ? 'برايفت' : 'باكدج',
      g.name_ar || g.name || '',
      g.subject_name || '',
      g.grade_name || '',
      g.teacher_name || '',
      g.classroom_name || '',
      formatScheduleText(g.schedule),
      g.student_count || 0,
      g.price_per_month || 0,
      g.status === 'active' ? 'نشطة' : 'متوقفة',
    ]);

    const csvContent =
      '\uFEFF' +
      [
        headers.join(','),
        ...rows.map((row) =>
          row
            .map((val) => {
              const str = String(val ?? '').replace(/"/g, '""');
              return `"${str}"`;
            })
            .join(',')
        ),
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `كشف_المجموعات_الدراسية_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('تم تصدير كشف المجموعات بنجاح');
  };

  const printColumns = useMemo(
    () => [
      { header: 'النوع', render: (g) => (g.is_private ? 'برايفت' : 'باكدج') },
      { header: 'اسم المجموعة', render: (g) => g.name_ar || g.name },
      { header: 'المادة', accessor: 'subject_name' },
      { header: 'المرحلة', accessor: 'grade_name' },
      { header: 'المدرس', accessor: 'teacher_name' },
      { header: 'المواعيد', render: (g) => formatScheduleText(g.schedule) },
      { header: 'الطلاب', render: (g) => `${g.student_count || 0} طالب` },
      {
        header: 'الاشتراك',
        render: (g) =>
          Number(g.price_per_month) > 0 ? `${g.price_per_month} ج/شهر` : 'ضمن الباكدج',
      },
    ],
    []
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1
            className="text-xl sm:text-2xl font-bold flex items-center gap-2"
            style={{ color: '#0C3C82' }}
          >
            <span>إدارة المجموعات والجداول</span>
            <span className="atlas-badge bg-sky-100 text-sky-800 text-xs">
              {filteredGroups.length} من {summaryCounts.total} مجموعة
            </span>
          </h1>
          <p className="text-xs sm:text-sm mt-1 text-slate-500">
            تقسيم ذكي لمجموعات الباكدج والبرايفت حسب المراحل الدراسية، الأيام، والمواد
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setEditingGroup(null);
              setIsModalOpen(true);
            }}
            className="atlas-btn atlas-btn-primary text-xs sm:text-sm flex items-center gap-1.5"
          >
            <Plus size={16} />
            <span>إنشاء مجموعة جديدة</span>
          </button>

          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="atlas-btn text-xs sm:text-sm flex items-center gap-1.5 bg-sky-50 text-sky-800 border border-sky-300 hover:bg-sky-100 font-semibold cursor-pointer"
          >
            <Settings size={15} className="text-sky-600" />
            <span>إعدادات الحصص والقاعات</span>
          </button>

          <button
            onClick={() => setIsCancelModalOpen(true)}
            className="atlas-btn text-xs sm:text-sm flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 font-semibold cursor-pointer"
          >
            <CalendarX size={15} className="text-amber-600" />
            <span>إلغاء حصة (اعتذار مدرس)</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="atlas-btn atlas-btn-secondary text-xs sm:text-sm flex items-center gap-1.5"
          >
            <Download size={15} className="text-emerald-600" />
            <span>تصدير Excel</span>
          </button>

          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="atlas-btn atlas-btn-secondary text-xs sm:text-sm flex items-center gap-1.5"
          >
            <Printer size={15} className="text-slate-600" />
            <span>طباعة كشف</span>
          </button>
        </div>
      </div>

      {/* Primary Category Tabs (الكل | مجموعات الباكدج | مجموعات البرايفت) + View Mode Switcher */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setGroupCategory('ALL')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
              groupCategory === 'ALL'
                ? 'bg-[#0C3C82] text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Layers size={14} />
            <span>كل المجموعات ({summaryCounts.total})</span>
          </button>

          <button
            type="button"
            onClick={() => setGroupCategory('PACKAGE')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
              groupCategory === 'PACKAGE'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <Package size={14} />
            <span>📦 مجموعات الباكدج ({summaryCounts.pkg})</span>
          </button>

          <button
            type="button"
            onClick={() => setGroupCategory('PRIVATE')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
              groupCategory === 'PRIVATE'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Sparkles size={14} />
            <span>💎 مجموعات البرايفت ({summaryCounts.priv})</span>
          </button>

          {/* Sub-filter for Package Track */}
          {groupCategory === 'PACKAGE' && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs mr-1">
              <button
                type="button"
                onClick={() => setPackageTrack('ALL')}
                className={`px-2 py-1 rounded font-bold cursor-pointer ${
                  packageTrack === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                الكل
              </button>
              <button
                type="button"
                onClick={() => setPackageTrack('PUBLIC')}
                className={`px-2 py-1 rounded font-bold cursor-pointer ${
                  packageTrack === 'PUBLIC' ? 'bg-white text-blue-800 shadow-2xs' : 'text-slate-600'
                }`}
              >
                باكدج عربي
              </button>
              <button
                type="button"
                onClick={() => setPackageTrack('LANGUAGES')}
                className={`px-2 py-1 rounded font-bold cursor-pointer ${
                  packageTrack === 'LANGUAGES'
                    ? 'bg-white text-purple-800 shadow-2xs'
                    : 'text-slate-600'
                }`}
              >
                باكدج لغات
              </button>
            </div>
          )}
        </div>

        {/* Grouping Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs self-start md:self-auto">
          <span className="text-slate-500 font-semibold px-2">تقسيم العرض:</span>
          <button
            type="button"
            onClick={() => setGroupByMode('GRADE')}
            className={`px-2.5 py-1.5 rounded-md font-bold cursor-pointer ${
              groupByMode === 'GRADE'
                ? 'bg-white text-[#0C3C82] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            حسب المرحلة
          </button>
          <button
            type="button"
            onClick={() => setGroupByMode('DAY')}
            className={`px-2.5 py-1.5 rounded-md font-bold cursor-pointer ${
              groupByMode === 'DAY'
                ? 'bg-white text-[#0C3C82] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            حسب اليوم
          </button>
          <button
            type="button"
            onClick={() => setGroupByMode('SUBJECT')}
            className={`px-2.5 py-1.5 rounded-md font-bold cursor-pointer ${
              groupByMode === 'SUBJECT'
                ? 'bg-white text-[#0C3C82] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            حسب المادة
          </button>
        </div>
      </div>

      {/* Quick Grade Pills Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setSelectedGrade('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 cursor-pointer border ${
            selectedGrade === ''
              ? 'bg-sky-600 text-white border-sky-600'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          كل المراحل الدراسية
        </button>
        {grades.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setSelectedGrade(selectedGrade === g.id ? '' : g.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 cursor-pointer border ${
              selectedGrade === g.id
                ? 'bg-sky-600 text-white border-sky-600'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-sky-50 hover:border-sky-200'
            }`}
          >
            {g.name_ar}
          </button>
        ))}
      </div>

      {/* Search & Detailed Filters Card */}
      <div className="atlas-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="relative sm:col-span-2 lg:col-span-4">
            <Search
              size={17}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              id="groups-search"
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="بحث باسم المجموعة، المدرس، أو المادة..."
              className="atlas-input pr-9 text-xs sm:text-sm"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Subject Filter */}
          <div className="lg:col-span-3">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="atlas-input text-xs sm:text-sm"
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
          <div className="lg:col-span-3">
            <select
              id="groups-teacher-filter"
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="atlas-input text-xs sm:text-sm"
            >
              <option value="">كل المدرسين ({teachers.length})</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </select>
          </div>

          {/* Day Filter */}
          <div className="lg:col-span-2">
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="atlas-input text-xs sm:text-sm"
            >
              <option value="">كل الأيام</option>
              {orderedDays.map((d) => (
                <option key={d.key} value={d.key}>
                  يوم {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bottom Filter Controls & Expand/Collapse */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <span>
              النتائج المعروضة: <strong className="text-slate-900">{filteredGroups.length}</strong>{' '}
              مجموعة في <strong className="text-slate-900">{groupedSections.length}</strong> قسم
            </span>
          </div>

          <div className="flex items-center gap-3">
            {groupedSections.length > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={expandAll}
                  className="text-sky-700 hover:underline font-semibold cursor-pointer"
                >
                  فتح كل الأقسام
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="text-slate-600 hover:underline font-semibold cursor-pointer"
                >
                  طي كل الأقسام
                </button>
              </div>
            )}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw size={13} />
                <span>إعادة ضبط الفلاتر</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Organized Sections View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <Loader2 size={32} className="animate-spin text-[#0C3C82]" />
          <p className="text-xs text-slate-500">جاري تحميل وتقسيم المجموعات...</p>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="atlas-card text-center py-16 px-4">
          <BookOpen size={44} className="mx-auto mb-3 text-slate-300" />
          <p className="text-base font-bold text-slate-700">لا توجد مجموعات مطابقة</p>
          <p className="text-xs text-slate-500 mt-1">
            جرب تغيير الفلاتر أو البحث بكلمة أخرى
          </p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="mt-3 atlas-btn atlas-btn-secondary text-xs"
            >
              عرض كل المجموعات
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {groupedSections.map((section) => {
            const isCollapsed = Boolean(collapsedSections[section.id]);
            return (
              <div
                key={section.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs"
              >
                {/* Section Header Bar */}
                <div
                  onClick={() => toggleSection(section.id)}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3.5 bg-slate-50 hover:bg-slate-100/80 border-b border-slate-200 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-3 h-6 rounded-full"
                      style={{ background: section.color || '#0C3C82' }}
                    />
                    <h2 className="text-sm sm:text-base font-black text-slate-800">
                      {section.title}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0C3C82] text-white">
                      {section.items.length} مجموعة
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {section.pkgCount > 0 && (
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        📦 {section.pkgCount} باكدج
                      </span>
                    )}
                    {section.privCount > 0 && (
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        💎 {section.privCount} برايفت
                      </span>
                    )}
                    <button
                      type="button"
                      className="p-1 rounded-lg text-slate-500 hover:bg-slate-200"
                    >
                      {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                    </button>
                  </div>
                </div>

                {/* Section Cards Grid */}
                {!isCollapsed && (
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 bg-slate-50/30">
                    {section.items.map((group) => (
                      <GroupCard
                        key={group.id}
                        group={group}
                        onNavigate={handleNavigateGroup}
                        onEdit={handleEditGroup}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Group Modal */}
      <GroupModal
        isOpen={isModalOpen}
        initialData={editingGroup}
        onClose={() => {
          setIsModalOpen(false);
          setEditingGroup(null);
        }}
        onSuccess={fetchGroups}
      />

      {/* Print Groups Report Modal */}
      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="كشف المجموعات والقاعات الدراسية"
        subtitle={`إجمالي المجموعات المطابقة (${filteredGroups.length} مجموعة)`}
        columns={printColumns}
        data={filteredGroups}
        filtersSummary={[
          groupCategory !== 'ALL'
            ? `النوع: ${groupCategory === 'PRIVATE' ? 'برايفت' : 'باكدج'}`
            : '',
          selectedGrade
            ? `المرحلة: ${grades.find((g) => g.id === selectedGrade)?.name_ar || ''}`
            : '',
          selectedSubject
            ? `المادة: ${subjects.find((s) => s.id === selectedSubject)?.name_ar || ''}`
            : '',
          selectedTeacher
            ? `المدرس: ${teachers.find((t) => t.id === selectedTeacher)?.full_name || ''}`
            : '',
          selectedDay ? `اليوم: ${dayMap[selectedDay] || ''}` : '',
          debouncedSearch ? `بحث: "${debouncedSearch}"` : '',
        ].filter(Boolean)}
      />

      {/* Cancel Session Modal */}
      <CancelSessionModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onSessionCancelled={fetchGroups}
      />

      {/* Group & Classroom Settings Modal */}
      <GroupSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSettingsSaved={fetchGroups}
      />
    </div>
  );
}
