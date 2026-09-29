import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { formatTime12h, formatEGP } from '../lib/formatters';
import GroupModal from '../components/GroupModal';
import PrintReportModal from '../components/PrintReportModal';
import CancelSessionModal from '../components/CancelSessionModal';
import GroupSettingsModal from '../components/GroupSettingsModal';
import {
  Search, Plus, BookOpen, Users, Calendar,
  Loader2, GraduationCap, MapPin, Edit2,
  Filter, Printer, Download, RefreshCw, X, CalendarX,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';

const dayMap = {
  saturday: 'السبت', sunday: 'الأحد', monday: 'الاثنين',
  tuesday: 'الثلاثاء', wednesday: 'الأربعاء', thursday: 'الخميس', friday: 'الجمعة',
};

export default function GroupsPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Filters
  const [grades, setGrades] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');


  const fetchGroups = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (selectedGrade) params.grade_id = selectedGrade;
      if (selectedTeacher) params.teacher_id = selectedTeacher;
      const { data } = await api.get('/groups', { params });
      setGroups(data.data || []);
    } catch (err) {
      console.error('Failed to load groups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      api.get('/master/grades'),
      api.get('/teachers'),
    ]).then(([g, t]) => {
      setGrades(g.data.data || []);
      setTeachers(t.data.data || []);
    });
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => fetchGroups(), 300);
    return () => clearTimeout(debounce);
  }, [search, selectedGrade, selectedTeacher]);

  const formatSchedule = (schedule) => {
    if (!schedule || !Array.isArray(schedule) || schedule.length === 0) return 'بدون موعد';
    return schedule.map(s => `${dayMap[s.day] || s.day} (${formatTime12h(s.start_time)})`).join(' ، ');
  };

  const handleExportCsv = () => {
    if (groups.length === 0) {
      toast.error('لا توجد مجموعات لتصديرها');
      return;
    }

    const headers = [
      'اسم المجموعة',
      'المادة الدراسية',
      'المرحلة الدراسية',
      'المدرس',
      'القاعة',
      'الجدول والمواعيد',
      'الطلاب المسجلون',
      'السعر الشهري',
      'سعر الحصة',
      'الحالة'
    ];

    const rows = groups.map((g) => [
      g.name_ar || g.name || '',
      g.subject_name || '',
      g.grade_name || '',
      g.teacher_name || '',
      g.classroom_name || '',
      formatSchedule(g.schedule),
      g.student_count || 0,
      g.price_per_month || 0,
      g.price_per_session || 0,
      g.status === 'active' ? 'نشطة' : 'متوقفة'
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
        )
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `كشف_المجموعات_الدراسية_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('تم تصدير كشف المجموعات بنجاح');
  };

  const printColumns = [
    { header: 'اسم المجموعة', render: (g) => g.name_ar || g.name },
    { header: 'المادة', accessor: 'subject_name' },
    { header: 'المرحلة', accessor: 'grade_name' },
    { header: 'المدرس', accessor: 'teacher_name' },
    { header: 'القاعة', render: (g) => g.classroom_name || '—' },
    { header: 'المواعيد', render: (g) => formatSchedule(g.schedule) },
    { header: 'الطلاب', render: (g) => `${g.student_count || 0} طالب` },
    { header: 'الاشتراك', render: (g) => `${g.price_per_month || 0} ج/شهر` },
    { header: 'الحالة', render: (g) => (g.status === 'active' ? 'نشطة' : 'متوقفة') }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 animate-fade-in-up">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2" style={{ color: '#0C3C82' }}>
            <span>إدارة المجموعات والقاعات</span>
            <span className="atlas-badge bg-sky-100 text-sky-800 text-xs">
              {groups.length} مجموعة
            </span>
          </h1>
          <p className="text-xs sm:text-sm mt-1 text-slate-500">
            متابعة الحصص الدراسية، القاعات، السعة، والمواعيد الأسبوعية
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setEditingGroup(null);
              setIsModalOpen(true);
            }}
            className="atlas-btn atlas-btn-primary text-xs sm:text-sm flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={16} />
            <span>إنشاء مجموعة جديدة</span>
          </button>

          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="atlas-btn text-xs sm:text-sm flex items-center gap-1.5 bg-sky-50 text-sky-800 border border-sky-300 hover:bg-sky-100 font-semibold transition-all shadow-sm cursor-pointer"
            title="تعديل مواعيد وفترات الحضور، فاصل الحصص المتتالية، وإدارة القاعات الدراسية"
          >
            <Settings size={16} className="text-sky-600" />
            <span>إعدادات الحصص والقاعات</span>
          </button>

          <button
            onClick={() => setIsCancelModalOpen(true)}
            className="atlas-btn text-xs sm:text-sm flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 font-semibold transition-all shadow-sm cursor-pointer"
            title="إلغاء حصة أسبوعية بسبب اعتذار المدرس حتى لا تُحتسب على الطلاب"
          >
            <CalendarX size={16} className="text-amber-600" />
            <span>إلغاء حصة (اعتذار مدرس)</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="atlas-btn atlas-btn-secondary text-xs sm:text-sm flex items-center gap-1.5"
            title="تصدير كشف المجموعات إلى Excel"
          >
            <Download size={16} className="text-emerald-600" />
            <span>تصدير Excel</span>
          </button>

          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="atlas-btn atlas-btn-secondary text-xs sm:text-sm flex items-center gap-1.5"
            title="معاينة وطباعة كشف المجموعات"
          >
            <Printer size={16} className="text-slate-600" />
            <span>طباعة كشف</span>
          </button>
        </div>
      </div>


      {/* Search & Filters */}
      <div className="atlas-card p-4 mb-6 animate-fade-in-up" style={{ animationDelay: '80ms', animationFillMode: 'backwards' }}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
            <input
              id="groups-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث باسم المجموعة..."
              className="atlas-input pr-10"
            />
          </div>
          <select
            id="groups-grade-filter"
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="atlas-input sm:w-52"
          >
            <option value="">كل المراحل</option>
            {grades.map(g => (
              <option key={g.id} value={g.id}>{g.name_ar}</option>
            ))}
          </select>
          <select
            id="groups-teacher-filter"
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            className="atlas-input sm:w-52"
          >
            <option value="">كل المدرسين</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>{t.full_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Groups Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin" style={{ color: '#0C3C82' }} />
        </div>
      ) : groups.length === 0 ? (
        <div className="atlas-card text-center py-20">
          <BookOpen size={48} className="mx-auto mb-3" style={{ color: '#CBD5E1' }} />
          <p className="text-lg font-medium" style={{ color: '#64748B' }}>لا توجد مجموعات</p>
          <p className="text-sm" style={{ color: '#94A3B8' }}>
            {search ? 'جرب كلمات بحث مختلفة' : 'أنشئ أول مجموعة من الزر أعلاه'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in-up" style={{ animationDelay: '160ms', animationFillMode: 'backwards' }}>
          {groups.map((group, i) => {
            const studentCount = parseInt(group.student_count, 10) || 0;

            return (
              <div
                key={group.id}
                className="atlas-card overflow-hidden cursor-pointer group hover:shadow-lg transition-all"
                onClick={() => navigate(`/groups/${group.id}`)}
              >
                {/* Color Strip */}
                <div className="h-1.5" style={{ background: group.subject_color || '#0C3C82' }} />

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ background: group.subject_color || '#0C3C82' }}
                      >
                        {group.subject_name?.[0] || '?'}
                      </div>
                      <div>
                        <p className="font-bold text-sm" style={{ color: '#1E293B' }}>
                          {group.name_ar || group.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {group.subject_name} — {group.grade_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`atlas-badge ${
                        group.status === 'active' ? 'atlas-badge-success' : 'atlas-badge-warning'
                      }`}>
                        {group.status === 'active' ? 'نشطة' : 'متوقفة'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingGroup(group);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#0C3C82] hover:bg-slate-100 transition-colors"
                        title="تعديل المجموعة"
                      >
                        <Edit2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Teacher & Classroom */}
                  <div className="flex items-center gap-2 mb-3 text-xs text-slate-600">
                    <GraduationCap size={14} style={{ color: '#0C3C82' }} />
                    <span className="font-medium">{group.teacher_name || '—'}</span>
                    {group.classroom_name && (
                      <>
                        <span className="text-slate-300">|</span>
                        <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                          <MapPin size={11} className="text-[#0C3C82]" />
                          {group.classroom_name}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Schedule */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                    <Calendar size={12} />
                    <span>{formatSchedule(group.schedule)}</span>
                  </div>

                  {/* Student Count Badge (No capacity limitation) */}
                  <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-blue-50/60 border border-blue-100 mb-3 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-700">
                      <Users size={14} className="text-[#0C3C82]" />
                      <span>{studentCount} طالب مسجل</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">
                      مجموعة معتمدة
                    </span>
                  </div>

                  {/* Pricing */}
                  <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1 text-xs">
                      <span className="font-black text-sm" style={{ color: '#0C3C82' }}>{Number(group.price_per_month)} ج.م</span>
                      <span className="text-slate-400">/شهر</span>
                    </div>
                    {Number(group.price_per_session) > 0 && (
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-slate-300">|</span>
                        <span className="font-black text-sm" style={{ color: '#0EA5E9' }}>{Number(group.price_per_session)} ج.م</span>
                        <span className="text-slate-400">/حصة</span>
                      </div>
                    )}
                  </div>
                </div>
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
        subtitle={`إجمالي المجموعات (${groups.length} مجموعة)`}
        columns={printColumns}
        data={groups}
        filtersSummary={[
          selectedGrade ? `المرحلة: ${grades.find((g) => g.id === selectedGrade)?.name_ar || ''}` : '',
          selectedTeacher ? `المدرس: ${teachers.find((t) => t.id === selectedTeacher)?.full_name || ''}` : '',
          search ? `بحث: "${search}"` : ''
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


