import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { formatTime12h } from '../lib/formatters';
import GroupModal from '../components/GroupModal';
import {
  ArrowRight, BookOpen, GraduationCap, Calendar, MapPin,
  Users, Loader2, Search, Plus, Edit2,
  Phone, UserPlus, X, Check, Coins
} from 'lucide-react';

const dayMap = {
  saturday: 'السبت', sunday: 'الأحد', monday: 'الاثنين',
  tuesday: 'الثلاثاء', wednesday: 'الأربعاء', thursday: 'الخميس', friday: 'الجمعة',
};

export default function GroupDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchGroup = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/groups/${id}`);
      setGroup(data.data.group);
      setStudents(data.data.students || []);
    } catch (err) {
      console.error('Failed to load group:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroup();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <Loader2 size={40} className="animate-spin" style={{ color: '#0C3C82' }} />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="p-8 text-center">
        <p className="text-lg font-medium" style={{ color: '#64748B' }}>لم يتم العثور على المجموعة</p>
        <button onClick={() => navigate('/groups')} className="atlas-btn atlas-btn-outline mt-4">
          العودة للقائمة
        </button>
      </div>
    );
  }

  const studentCount = students.filter(s => s.enrollment_active).length;

  const formatSchedule = (schedule) => {
    if (!schedule || !Array.isArray(schedule) || schedule.length === 0) return [];
    return schedule;
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/groups')}
        className="flex items-center gap-2 text-sm font-medium mb-4 transition-colors hover:text-sky-600"
        style={{ color: '#64748B' }}
      >
        <ArrowRight size={18} />
        العودة لقائمة المجموعات
      </button>

      {/* Group Profile Card */}
      <div className="atlas-card overflow-hidden mb-6 animate-fade-in-up">
        {/* Color Strip */}
        <div className="h-2" style={{ background: group.subject_color || '#0C3C82' }} />

        <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg, #0C3C82, #0a2e63)' }}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg"
                style={{ background: group.subject_color || '#0EA5E9' }}
              >
                {group.subject_name?.[0] || '?'}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{group.name_ar || group.name}</h1>
                <p className="text-white/70 text-sm mt-1">
                  {group.subject_name} — {group.grade_name}
                </p>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className={`atlas-badge ${group.status === 'active' ? 'atlas-badge-success' : 'atlas-badge-warning'}`}>
                    {group.status === 'active' ? '✅ نشطة' : '⏸ متوقفة'}
                  </span>
                  <span className="text-white/60 text-xs flex items-center gap-1">
                    <GraduationCap size={14} />
                    {group.teacher_name}
                  </span>
                  {group.classroom_name && (
                    <span className="text-white/60 text-xs flex items-center gap-1">
                      <MapPin size={14} />
                      {group.classroom_name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-white/20 shadow-sm cursor-pointer"
            >
              <Edit2 size={14} />
              تعديل بيانات المجموعة
            </button>
          </div>
        </div>

        {/* Stats & Schedule Row */}
        <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-5 gap-4 border-b" style={{ borderColor: '#E2E8F0' }}>
          {/* Students Count */}
          <div className="col-span-2 sm:col-span-1">
            <div className="text-center p-2 bg-blue-50/80 rounded-lg">
              <p className="text-lg font-bold" style={{ color: '#0C3C82' }}>
                {studentCount} طالب
              </p>
              <p className="text-[11px] text-slate-500">مسجل بالمجموعة</p>
            </div>
          </div>

          {/* Prices */}
          <div className="text-center p-2 bg-cyan-50/80 rounded-lg">
            <p className="text-lg font-bold" style={{ color: '#0EA5E9' }}>{Number(group.price_per_month)} ج.م</p>
            <p className="text-[11px] text-slate-500">اشتراك شهري</p>
          </div>
          <div className="text-center p-2 bg-green-50/80 rounded-lg">
            <p className="text-lg font-bold" style={{ color: '#10B981' }}>{Number(group.price_per_session)} ج.م</p>
            <p className="text-[11px] text-slate-500">سعر الحصة</p>
          </div>

          {/* Schedule */}
          <div className="col-span-2 flex items-center gap-2 flex-wrap">
            {formatSchedule(group.schedule).map((slot, i) => (
              <span
                key={i}
                className="atlas-badge text-[11px]"
                style={{ background: '#EFF6FF', color: '#1E40AF' }}
              >
                <Calendar size={10} className="ml-1" />
                {dayMap[slot.day]} {formatTime12h(slot.start_time)} - {formatTime12h(slot.end_time)}
              </span>
            ))}
          </div>
        </div>

        {/* Group Capacity Info */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Users size={15} className="text-[#0C3C82]" />
            <span>إجمالي الطلاب المسجلين: {studentCount} طالب</span>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            سعة غير محدودة (مفتوحة)
          </span>
        </div>
      </div>

      {/* Students Section */}
      <div className="atlas-card overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
        {/* Section Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: '#E2E8F0', background: '#F8FAFC' }}>
          <h2 className="font-bold text-sm flex items-center gap-2" style={{ color: '#0C3C82' }}>
            <Users size={18} />
            الطلاب المشتركين ({studentCount})
          </h2>
          <Link
            to="/subscriptions"
            className="text-xs font-bold text-[#0C3C82] hover:underline flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition-all"
          >
            <Coins size={14} />
            <span>تسجيل وقيد الطلاب (صفحة الاشتراكات)</span>
          </Link>
        </div>

        {/* Students Table */}
        {students.length === 0 ? (
          <div className="text-center py-12">
            <Users size={40} className="mx-auto mb-3" style={{ color: '#CBD5E1' }} />
            <p className="text-sm font-medium" style={{ color: '#64748B' }}>لا يوجد طلاب مسجلين في هذه المجموعة حتى الآن</p>
            <p className="text-xs text-slate-400 mt-1">يتم قيد الطلاب وتجديد الحصص حصرياً من خلال صفحة اشتراكات الطلاب والحصص</p>
            <Link
              to="/subscriptions"
              className="atlas-btn atlas-btn-primary text-xs mt-3 inline-flex items-center gap-1.5"
            >
              <Coins size={14} />
              <span>الانتقال لصفحة الاشتراكات والقيد</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="atlas-table w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-slate-600 text-xs font-semibold py-3 px-4 text-right">كود الطالب</th>
                  <th className="text-slate-600 text-xs font-semibold py-3 px-4 text-right">الاسم</th>
                  <th className="text-slate-600 text-xs font-semibold py-3 px-4 text-right">الموبايل</th>
                  <th className="text-slate-600 text-xs font-semibold py-3 px-4 text-right">نظام الطالب</th>
                  <th className="text-slate-600 text-xs font-semibold py-3 px-4 text-right">الحالة</th>
                  <th className="text-slate-600 text-xs font-semibold py-3 px-4 text-right">تاريخ التسجيل</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr
                    key={student.id}
                    className="border-b transition-colors hover:bg-blue-50/50 cursor-pointer"
                    style={{ borderColor: '#E2E8F0' }}
                    onClick={() => navigate(`/students/${student.id}`)}
                  >
                    <td className="py-3 px-4">
                      <code className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: '#EFF6FF', color: '#0C3C82' }}>
                        {student.barcode_id}
                      </code>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-sm" style={{ color: '#1E293B' }}>{student.full_name}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-mono text-slate-500">{student.phone || '—'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`atlas-badge ${student.enrollment_type === 'PRIVATE' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {student.enrollment_type === 'PRIVATE' ? '👤 برايفت' : '🏫 باقة سنتر'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`atlas-badge ${student.enrollment_active ? 'atlas-badge-success' : 'atlas-badge-error'}`}>
                        {student.enrollment_active ? 'نشط' : 'منسحب'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-slate-500">
                        {student.enrolled_at ? new Date(student.enrolled_at).toLocaleDateString('ar-EG') : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Group Modal */}
      <GroupModal
        isOpen={isEditModalOpen}
        initialData={group}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          setIsEditModalOpen(false);
          fetchGroup();
        }}
      />
    </div>
  );
}
