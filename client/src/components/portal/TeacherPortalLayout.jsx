import { Link, Outlet } from 'react-router-dom';
import { 
  UserCheck, 
  ShieldCheck, 
  PhoneCall, 
  MapPin, 
  Clock, 
  Award,
  Sparkles,
  Lock,
  Building
} from 'lucide-react';

export default function TeacherPortalLayout() {
  return (
    <div 
      className="min-h-screen flex flex-col font-sans text-slate-800 antialiased selection:bg-rose-500 selection:text-white"
      dir="rtl"
      style={{
        background: 'linear-gradient(180deg, #1A1325 0%, #311B45 280px, #F8FAFC 280px, #F1F5F9 100%)',
      }}
    >
      {/* Top Private Security Bar */}
      <header className="w-full bg-[#100B17]/90 backdrop-blur-md border-b border-white/10 text-white/90 text-xs py-2 px-3 sm:px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span className="font-semibold text-rose-300 text-[11px] sm:text-xs">بوابة انضمام الكوادر التعليمية</span>
            <span className="hidden sm:inline text-white/30">|</span>
            <span className="hidden sm:inline text-white/70">العام الدراسي 2026 / 2027</span>
          </div>

          <div className="flex items-center gap-3 text-white/70 text-[11px] sm:text-xs">
            <span className="flex items-center gap-1.5 text-amber-300">
              <ShieldCheck size={13} />
              <span>استمارة سرية ومحمية</span>
            </span>
            <Link 
              to="/login" 
              className="flex items-center gap-1 text-white/80 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-2 py-1 rounded border border-white/10"
            >
              <Lock size={11} />
              <span>دخول الإدارة</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Brand Header — Prestigious Teacher Identity */}
      <div className="w-full text-white pt-5 pb-6 px-3 sm:px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
          
          {/* Logo & Identity */}
          <div className="flex flex-col sm:flex-row items-center gap-3.5">
            <div 
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-2.5 flex items-center justify-center shrink-0 shadow-2xl transition-transform hover:scale-105"
              style={{
                background: 'rgba(255, 255, 255, 0.98)',
                boxShadow: '0 12px 30px rgba(0,0,0,0.4), 0 0 25px rgba(225,29,72,0.3)',
              }}
            >
              <img 
                src="/atlas-logo.png" 
                alt="أكاديمية أطلس التعليمية" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentNode.innerHTML = '<span class="text-xl font-black text-rose-800">ATLAS</span>';
                }}
              />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm">
                  أكاديمية أطلس التعليمية
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  <Award size={10} />
                  نخبة المعلمين
                </span>
              </div>
              <p className="text-rose-200/90 text-xs sm:text-sm font-semibold mt-0.5 tracking-wide">
                نظام أطلس الإداري — Atlas ERP
              </p>
              <p className="text-white/60 text-[11px] sm:text-xs mt-1">
                بوابة انضمام وتنسيق مواعيد وقاعات السادة أعضاء هيئة التدريس
              </p>
            </div>
          </div>

          {/* Teacher Badge */}
          <div className="hidden sm:flex items-center gap-2.5 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 text-white/90 text-xs shadow-md">
            <UserCheck size={22} className="text-rose-400" />
            <div className="text-right">
              <span className="block font-bold text-white text-xs">استمارة المعلمين</span>
              <span className="text-[10px] text-amber-200">تنسيق مباشر مع الإدارة</span>
            </div>
          </div>

        </div>
      </div>

      {/* Main Form Content */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-3 sm:px-4 pb-12 z-10">
        <Outlet />
      </main>

      {/* Prestigious Footer for Teachers */}
      <footer className="w-full bg-[#100B17] border-t border-white/10 text-white/80 mt-auto pt-10 pb-6 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pb-8 border-b border-white/10 text-right">
            
            {/* About & Values */}
            <div className="sm:col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-7 h-7 rounded-lg bg-white p-1 flex items-center justify-center shrink-0">
                  <img src="/atlas-logo.png" alt="Atlas" className="w-full h-full object-contain" />
                </div>
                <h3 className="font-bold text-white text-sm">شراكة تعليمية واعدة</h3>
              </div>
              <p className="text-white/60 text-xs leading-relaxed mb-3">
                نحرص في أكاديمية أطلس التعليمية على توفير أرقى بيئة عمل للسادة المعلمين، تشمل قاعات مكيفة ومجهزة بشاشات حديثة، وفريق سكرتارية محترف، ونظام حضور ذكي بالباركود.
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md w-fit">
                <Award size={14} />
                <span>شريكك الأمثل للنجاح التعليمي المستدام</span>
              </div>
            </div>

            {/* Teacher Privileges */}
            <div>
              <h4 className="font-bold text-white text-xs sm:text-sm mb-3 flex items-center gap-2">
                <span>مزايا أكاديمية أطلس للمعلم</span>
                <span className="w-6 h-0.5 bg-rose-500 rounded-full inline-block"></span>
              </h4>
              <ul className="space-y-1.5 text-xs text-white/70">
                <li>• 15 قاعة مجهزة بأحدث الشاشات والصوتيات.</li>
                <li>• نظام إلكتروني فوري لحساب الحصص والغياب.</li>
                <li>• تسليم تقارير الحضور والمالية بضغطة زر.</li>
              </ul>
            </div>

            {/* Direct Executive Contact */}
            <div>
              <h4 className="font-bold text-white text-xs sm:text-sm mb-3 flex items-center gap-2">
                <span>التنسيق المباشر مع الإدارة</span>
                <span className="w-6 h-0.5 bg-amber-500 rounded-full inline-block"></span>
              </h4>
              <div className="space-y-2 text-xs text-white/70">
                <div className="flex items-center gap-2">
                  <Building size={14} className="text-amber-400 shrink-0" />
                  <span>مكتب المدير التنفيذي وتنسيق المواعيد</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-sky-400 shrink-0" />
                  <span>متاح يومياً للتنسيق وتحديد المعاينات</span>
                </div>
                <div className="flex items-center gap-2">
                  <PhoneCall size={14} className="text-emerald-400 shrink-0" />
                  <span>التواصل المباشر مع إدارة الأكاديمية</span>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Copyright */}
          <div className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-white/50 text-center sm:text-right">
            <p>
              جميع الحقوق محفوظة © {new Date().getFullYear()} أكاديمية أطلس التعليمية — بوابة الكوادر التعليمية
            </p>
            <div className="flex items-center gap-1.5 font-medium text-white/60 text-[11px]">
              <span>مدعوم بنظام</span>
              <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded border border-white/15">
                Atlas ERP — نظام أطلس الإداري
              </span>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}
