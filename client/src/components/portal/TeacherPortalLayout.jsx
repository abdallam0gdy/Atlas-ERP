import { Outlet } from 'react-router-dom';
import { 
  UserCheck, 
  ShieldCheck, 
  Sparkles,
  CalendarDays
} from 'lucide-react';
import PublicFooter from '../PublicFooter';

export default function TeacherPortalLayout() {
  return (
    <div 
      className="min-h-screen flex flex-col font-sans text-slate-800 antialiased selection:bg-[#D8232A] selection:text-white"
      dir="rtl"
      style={{
        background: 'linear-gradient(180deg, #00275C 0%, #0C3C82 280px, #F9F9FF 280px, #F1F5F9 100%)',
      }}
    >
      {/* Top Private Security Bar */}
      <header className="w-full bg-[#001A42]/90 backdrop-blur-md border-b border-white/10 text-white/90 text-xs py-2 px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D8232A] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D8232A]"></span>
            </span>
            <span className="font-semibold text-sky-200 text-[11px] sm:text-xs">بوابة انضمام الكوادر التعليمية</span>
            <span className="hidden sm:inline text-white/30">|</span>
            <span className="hidden sm:inline text-white/70">العام الدراسي الجديد 2026 / 2027</span>
          </div>

          <div className="flex items-center gap-3 text-white/70 text-[11px] sm:text-xs">
            <span className="flex items-center gap-1.5 text-sky-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
              <ShieldCheck size={13} className="text-[#32B4F9]" />
              <span>استمارة معتمدة ومحمية</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Brand Header — Teacher Ad Campaign Identity */}
      <div className="w-full text-white pt-5 pb-6 px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5 text-center md:text-right">
          
          {/* Logo & Identity */}
          <div className="flex flex-col sm:flex-row items-center gap-3.5">
            <div 
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-2 flex items-center justify-center shrink-0 shadow-2xl transition-transform hover:scale-105"
              style={{
                background: 'rgba(255, 255, 255, 0.98)',
                boxShadow: '0 12px 30px rgba(0,39,92,0.45), 0 0 25px rgba(216,35,42,0.25)',
              }}
            >
              <img 
                src="/atlas-logo.png" 
                alt="أكاديمية أطلس التعليمية" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentNode.innerHTML = '<span class="text-xl font-black text-[#0C3C82]">ATLAS</span>';
                }}
              />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
                  نسّق جدولك ومجموعاتك
                </h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#D8232A] text-white px-2.5 py-0.5 rounded-full shadow-sm animate-pulse">
                  <Sparkles size={11} />
                  بوابة المعلمين
                </span>
              </div>
              <p className="text-sky-200/90 text-xs sm:text-sm font-semibold mt-0.5 tracking-wide">
                أهلاً ومرحباً بحضرتك يا أستاذنا في صرح أطلس التعليمي
              </p>
              <p className="text-white/70 text-[11px] sm:text-xs mt-1">
                نسّق مواعيدك وقاعاتك بكل سهولة، وفريق الإدارة هيجهزلك كل حاجة بأعلى معايير الجودة
              </p>
            </div>
          </div>

          {/* Teacher Campaign Character Illustration & Interactive Badge */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-2 pl-4 rounded-3xl border border-white/15 text-white/90 shadow-xl transition-transform hover:scale-102">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-[#0C3C82] to-[#00275C] border border-white/20 p-1 shrink-0 flex items-center justify-center shadow-inner">
              <img 
                src="/images/teacher-character.png" 
                alt="بوابة المعلمين" 
                className="w-full h-full object-contain"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            <div className="text-right">
              <span className="block font-black text-white text-xs sm:text-sm">نوّرتنا يا أستاذنا! 🌟</span>
              <span className="text-[11px] text-sky-200 block">تنسيق فوري للمجموعات والقاعات المجهزة</span>
            </div>
          </div>

        </div>
      </div>

      {/* Main Form Content — Full Width Responsive Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-12 z-10">
        <Outlet />
      </main>

      {/* Public Footer */}
      <PublicFooter />
    </div>
  );
}
