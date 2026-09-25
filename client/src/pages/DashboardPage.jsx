import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { Users, GraduationCap, BookOpen, DoorOpen, TrendingUp, Clock, CreditCard } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/master/dashboard-stats');
        setStats(data.data);
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    {
      title: 'إجمالي الطلاب',
      value: stats?.totalStudents || 0,
      icon: Users,
      color: '#0C3C82',
      bgGradient: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
    },
    {
      title: 'المدرسين النشطين',
      value: stats?.totalTeachers || 0,
      icon: GraduationCap,
      color: '#10B981',
      bgGradient: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
    },
    {
      title: 'المجموعات النشطة',
      value: stats?.activeGroups || 0,
      icon: BookOpen,
      color: '#8B5CF6',
      bgGradient: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)',
    },
    {
      title: 'حضور اليوم',
      value: stats?.todayAttendance || 0,
      icon: DoorOpen,
      color: '#D8232A',
      bgGradient: 'linear-gradient(135deg, #FEF2F2, #FECACA)',
    },
  ];

  const now = new Date();
  const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('ar-EG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0C3C82' }}>
            لوحة التحكم
          </h1>
          <p className="text-sm mt-1" style={{ color: '#64748B' }}>
            مرحباً بك في نظام أطلس — نظرة عامة على اليوم
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm" style={{ color: '#64748B' }}>
          <Clock size={16} />
          <span>{dateStr}</span>
          <span className="font-bold" style={{ color: '#0C3C82' }}>{timeStr}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="atlas-card p-5 animate-fade-in-up"
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'backwards' }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: '#64748B' }}>
                    {card.title}
                  </p>
                  <p className="text-3xl font-extrabold" style={{ color: card.color }}>
                    {loading ? (
                      <span className="inline-block w-16 h-8 rounded animate-pulse" style={{ background: '#E2E8F0' }} />
                    ) : (
                      (card.value ?? 0).toLocaleString('en-US')
                    )}
                  </p>
                </div>
                <div
                  className="p-3 rounded-xl"
                  style={{ background: card.bgGradient }}
                >
                  <Icon size={24} style={{ color: card.color }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="atlas-card p-6 animate-fade-in-up" style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}>
        <h2 className="text-lg font-bold mb-4" style={{ color: '#0C3C82' }}>
          إجراءات سريعة
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link to="/gate" className="atlas-btn atlas-btn-primary text-base py-4 rounded-xl">
            <DoorOpen size={20} />
            فتح بوابة الحضور
          </Link>
          <Link to="/subscriptions" className="atlas-btn atlas-btn-outline text-base py-4 rounded-xl text-[#0C3C82] border-blue-200 hover:bg-blue-50">
            <CreditCard size={20} />
            اشتراكات وحسابات الطلاب
          </Link>
          <Link to="/students" className="atlas-btn atlas-btn-outline text-base py-4 rounded-xl">
            <Users size={20} />
            إدارة شؤون الطلاب
          </Link>
        </div>
      </div>
    </div>
  );
}
