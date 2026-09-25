import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import TeacherModal from '../components/TeacherModal';
import {
  ArrowRight, Phone, Mail, BookOpen, Edit2,
  Loader2, Users, Calendar, Coins, Percent,
  Clock, MapPin, GraduationCap
} from 'lucide-react';

export default function TeacherDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('groups');

  const fetchTeacher = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/teachers/${id}`);
      setTeacher(data.data.teacher);
      setGroups(data.data.groups || []);
    } catch (err) {
      console.error('Failed to load teacher:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacher();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <Loader2 size={40} className="animate-spin" style={{ color: '#0C3C82' }} />
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="p-8 text-center">
        <p className="text-lg font-medium" style={{ color: '#64748B' }}>لم يتم العثور على المدرس</p>
        <button onClick={() => navigate('/teachers')} className="atlas-btn atlas-btn-outline mt-4">
          العودة للقائمة
        </button>
      </div>
    );
  }

  const dayMap = {
    saturday: 'السبت', sunday: 'الأحد', monday: 'الاثنين',
    tuesday: 'الثلاثاء', wednesday: 'الأربعاء', thursday: 'الخميس', friday: 'الجمعة',
  };

  const formatSchedule = (schedule) => {
    if (!schedule || !Array.isArray(schedule) || schedule.length === 0) return 'بدون موعد';
    return schedule.map((s) => `${dayMap[s.day] || s.day} ${s.start_time}-${s.end_time}`).join(' ، ');
  };

  const activeGroups = groups.filter(g => g.status === 'active');
  const totalStudents = activeGroups.reduce((sum, g) => sum + (parseInt(g.student_count, 10) || 0), 0);

  const tabs = [
    { id: 'groups', label: 'المجموعات', icon: BookOpen, count: groups.length },
    { id: 'finance', label: 'المستحقات المالية', icon: Coins },
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/teachers')}
        className="flex items-center gap-2 text-sm font-medium mb-4 transition-colors hover:text-sky-600"
        style={{ color: '#64748B' }}
      >
        <ArrowRight size={18} />
        العودة لقائمة المدرسين
      </button>

      {/* Teacher Profile Card */}
      <div className="atlas-card overflow-hidden mb-6 animate-fade-in-up">
        {/* Header Banner */}
        <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg, #0C3C82, #0a2e63)' }}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg"
                style={{ background: 'linear-gradient(135deg, #0EA5E9, #0284c7)' }}>
                {teacher.full_name?.[0] || '؟'}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{teacher.full_name}</h1>
                <p className="text-white/70 text-sm mt-1">{teacher.specialization || 'بدون تخصص محدد'}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`atlas-badge ${teacher.is_active ? 'atlas-badge-success' : 'atlas-badge-error'}`}>
                    {teacher.is_active ? '✅ نشط' : '⛔ معطل'}
                  </span>
                  {teacher.revenue_split_type === 'percentage' ? (
                    <span className="atlas-badge" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
                      <Percent size={12} className="ml-1" />
                      {Number(teacher.revenue_split_percent)}% نسبة المدرس
                    </span>
                  ) : (
                    <span className="atlas-badge" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
                      <Coins size={12} className="ml-1" />
                      {Number(teacher.fixed_rate_per_student)} ج/طالب
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="atlas-btn text-sm text-white/80 hover:text-white hover:bg-white/10 border border-white/20"
            >
              <Edit2 size={16} />
              تعديل
            </button>
          </div>
        </div>

        {/* Contact & Stats Row */}
        <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 border-b" style={{ borderColor: '#E2E8F0' }}>
          <div className="flex items-center gap-2">
            <Phone size={16} style={{ color: '#64748B' }} />
            <span className="text-sm font-mono" style={{ color: '#1E293B' }}>{teacher.phone || '—'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail size={16} style={{ color: '#64748B' }} />
            <span className="text-sm" style={{ color: '#1E293B' }}>{teacher.email || '—'}</span>
          </div>
          <div className="text-center p-2 bg-blue-50/80 rounded-lg">
            <p className="text-lg font-bold" style={{ color: '#0C3C82' }}>{activeGroups.length}</p>
            <p className="text-[11px] text-slate-500">مجموعة نشطة</p>
          </div>
          <div className="text-center p-2 bg-cyan-50/80 rounded-lg">
            <p className="text-lg font-bold" style={{ color: '#0EA5E9' }}>{totalStudents}</p>
            <p className="text-[11px] text-slate-500">إجمالي الطلاب</p>
          </div>
        </div>

        {/* Notes */}
        {teacher.notes && (
          <div className="px-6 py-3 bg-amber-50/50 border-b text-xs text-amber-800" style={{ borderColor: '#E2E8F0' }}>
            📝 {teacher.notes}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-xl w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                active ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon size={16} />
              {tab.label}
              {tab.count !== undefined && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  active ? 'bg-sky-100 text-sky-700' : 'bg-slate-200 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'groups' && (
        <div className="animate-fade-in-up">
          {groups.length === 0 ? (
            <div className="atlas-card text-center py-12">
              <BookOpen size={40} className="mx-auto mb-3" style={{ color: '#CBD5E1' }} />
              <p className="text-sm font-medium" style={{ color: '#64748B' }}>لا توجد مجموعات مسندة لهذا المدرس</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="atlas-card p-4 cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => navigate(`/groups/${group.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                        style={{ background: group.subject_color || '#0C3C82' }}
                      >
                        {group.subject_name?.[0] || '؟'}
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
                    <span className={`atlas-badge ${
                      group.status === 'active' ? 'atlas-badge-success' : 'atlas-badge-warning'
                    }`}>
                      {group.status === 'active' ? 'نشطة' : group.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-50 rounded-lg p-2">
                      <p className="font-bold text-sm" style={{ color: '#0C3C82' }}>{group.student_count || 0}</p>
                      <p className="text-[10px] text-slate-500">طالب</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2">
                      <p className="font-bold text-sm" style={{ color: '#0EA5E9' }}>{Number(group.price_per_month)} ج</p>
                      <p className="text-[10px] text-slate-500">شهري</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2">
                      <p className="font-bold text-sm" style={{ color: '#10B981' }}>
                        {group.classroom_name || '—'}
                      </p>
                      <p className="text-[10px] text-slate-500">القاعة</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1 text-xs text-slate-500">
                    <Calendar size={12} />
                    {formatSchedule(group.schedule)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'finance' && (
        <div className="animate-fade-in-up">
          <div className="atlas-card overflow-hidden">
            <div className="px-6 py-4 border-b" style={{ borderColor: '#E2E8F0', background: '#F8FAFC' }}>
              <h3 className="font-bold text-sm" style={{ color: '#0C3C82' }}>
                كشف حساب المدرس — الشهر الحالي
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                يتم حساب المستحقات بناءً على سجلات الحضور الفعلية
              </p>
            </div>

            {/* Financial Summary */}
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl border border-slate-200 bg-blue-50/50 text-center">
                  <Calendar size={20} className="mx-auto mb-2" style={{ color: '#0C3C82' }} />
                  <p className="text-2xl font-bold" style={{ color: '#0C3C82' }}>—</p>
                  <p className="text-xs text-slate-500 mt-1">حصة منعقدة</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-cyan-50/50 text-center">
                  <Users size={20} className="mx-auto mb-2" style={{ color: '#0EA5E9' }} />
                  <p className="text-2xl font-bold" style={{ color: '#0EA5E9' }}>—</p>
                  <p className="text-xs text-slate-500 mt-1">طالب حاضر</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-green-50/50 text-center">
                  <Coins size={20} className="mx-auto mb-2" style={{ color: '#10B981' }} />
                  <p className="text-2xl font-bold" style={{ color: '#10B981' }}>— ج.م</p>
                  <p className="text-xs text-slate-500 mt-1">مستحقات المدرس</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center">
                <p className="text-sm font-medium text-amber-800">
                  🚧 المستحقات المالية ستُحسب تلقائياً بعد تفعيل نظام الكاشير والتحصيل (المرحلة 5)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <TeacherModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchTeacher}
        initialData={teacher}
      />
    </div>
  );
}
