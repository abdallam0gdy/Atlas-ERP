import { Link, useLocation, Outlet } from 'react-router-dom';
import { 
  GraduationCap, 
  UserCheck, 
  ShieldCheck, 
  PhoneCall, 
  MapPin, 
  Clock, 
  Sparkles,
  Lock,
  ChevronLeft
} from 'lucide-react';

export default function PortalLayout() {
  const location = useLocation();
  const isStudent = location.pathname.includes('/student') || location.pathname === '/register';
  const isTeacher = location.pathname.includes('/teacher');

  return (
    <div 
      className="min-h-screen flex flex-col font-sans text-slate-800 antialiased selection:bg-sky-500 selection:text-white"
      dir="rtl"
      style={{
        background: 'linear-gradient(180deg, #071E40 0%, #0C3C82 320px, #F8FAFC 320px, #F1F5F9 100%)',
      }}
    >
      {/* ============================================================
          TOP ANNOUNCEMENT BAR
          ============================================================ */}
      <header className="w-full bg-[#05142B]/80 backdrop-blur-md border-b border-white/10 text-white/90 text-xs py-2 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-medium text-emerald-300">باب التقديم مفتوح الآن</span>
            <span className="hidden sm:inline text-white/40">|</span>
            <span className="hidden sm:inline text-white/80">العام الدراسي الجديد 2026 / 2027</span>
          </div>

          <div className="flex items-center gap-4 text-white/70">
            <span className="hidden md:flex items-center gap-1.5">
              <Clock size={13} className="text-sky-400" />
              <span>مواعيد العمل: 9:00 ص - 10:00 م</span>
            </span>
            <Link 
              to="/login" 
              className="flex items-center gap-1 text-sky-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-md border border-white/10"
            >
              <Lock size={12} />
              <span>بوابة الإدارة</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ============================================================
          MAIN BRAND HEADER
          ============================================================ */}
      <div className="w-full text-white pt-6 pb-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-4 text-center md:text-right">
            <div 
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-2.5 flex items-center justify-center shrink-0 shadow-2xl transition-transform hover:scale-105"
              style={{
                background: 'rgba(255, 255, 255, 0.98)',
                boxShadow: '0 12px 30px rgba(0,0,0,0.35), 0 0 25px rgba(14,165,233,0.3)',
              }}
            >
              <img 
                src="/atlas-logo.png" 
                alt="سنتر أطلس التعليمي" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentNode.innerHTML = '<span class="text-xl font-black text-atlas-primary">ATLAS</span>';
                }}
              />
            </div>
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm">
                  سنتر أطلس التعليمي
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full">
                  <Sparkles size={11} />
                  الرسمي
                </span>
              </div>
              <p className="text-sky-200/80 text-xs sm:text-sm font-medium mt-0.5 tracking-wide">
                نظام أطلس الإداري — Atlas ERP
              </p>
              <p className="text-white/60 text-[11px] sm:text-xs mt-1">
                بوابة تسجيل وقبول الطلاب وانضمام المعلمين إلكترونياً
              </p>
            </div>
          </div>

          {/* Registration Navigation Tabs */}
          <div className="flex items-center p-1.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-xl">
            <Link
              to="/register/student"
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 ${
                isStudent
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-600/40 scale-[1.02]'
                  : 'text-white/80 hover:text-white hover:bg-white/5'
              }`}
            >
              <GraduationCap size={18} />
              <span>تسجيل طالب جديد</span>
            </Link>

            <Link
              to="/register/teacher"
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 ${
                isTeacher
                  ? 'bg-gradient-to-r from-rose-600 to-red-700 text-white shadow-lg shadow-rose-900/40 scale-[1.02]'
                  : 'text-white/80 hover:text-white hover:bg-white/5'
              }`}
            >
              <UserCheck size={18} />
              <span>استمارة معلم</span>
            </Link>
          </div>

        </div>
      </div>

      {/* ============================================================
          MAIN BODY CONTENT (OUTLET)
          ============================================================ */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 pb-16 z-10">
        <Outlet />
      </main>

      {/* ============================================================
          PROFESSIONAL FOOTER
          ============================================================ */}
      <footer className="w-full bg-[#071E40] border-t border-white/10 text-white/80 mt-auto pt-12 pb-6 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 border-b border-white/10">
            
            {/* Column 1: About the Center */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center shrink-0">
                  <img src="/atlas-logo.png" alt="Atlas" className="w-full h-full object-contain" />
                </div>
                <h3 className="font-bold text-white text-base">سنتر أطلس التعليمي</h3>
              </div>
              <p className="text-white/60 text-xs sm:text-sm leading-relaxed mb-4">
                صرح تعليمي رائد يقدم نخبة من كبار الأساتذة والمعلمين لكافة المراحل التعليمية، بأحدث أنظمة الإدارة والمتابعة الإلكترونية الفورية للطلاب وأولياء الأمور.
              </p>
              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg w-fit">
                <ShieldCheck size={15} />
                <span>بياناتك مسجلة ومشفرة بنظام أمان كامل</span>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 className="font-bold text-white text-sm mb-3.5 flex items-center gap-2">
                <span>روابط وخدمات البوابة</span>
                <span className="w-8 h-0.5 bg-sky-500 rounded-full inline-block"></span>
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-white/70">
                <li>
                  <Link to="/register/student" className="hover:text-sky-300 transition-colors flex items-center gap-1.5">
                    <ChevronLeft size={14} className="text-sky-400" />
                    <span>استمارة تسجيل وحجز الطلاب الجدد</span>
                  </Link>
                </li>
                <li>
                  <Link to="/register/teacher" className="hover:text-sky-300 transition-colors flex items-center gap-1.5">
                    <ChevronLeft size={14} className="text-rose-400" />
                    <span>طلب انضمام عضو هيئة تدريس (معلم)</span>
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-sky-300 transition-colors flex items-center gap-1.5">
                    <ChevronLeft size={14} className="text-slate-400" />
                    <span>دخول إدارة السنتر ومسؤولي الاستقبال</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Contact & Support */}
            <div>
              <h4 className="font-bold text-white text-sm mb-3.5 flex items-center gap-2">
                <span>المقر والدعم الفني</span>
                <span className="w-8 h-0.5 bg-rose-500 rounded-full inline-block"></span>
              </h4>
              <div className="space-y-2.5 text-xs sm:text-sm text-white/70">
                <div className="flex items-start gap-2.5">
                  <MapPin size={16} className="text-rose-400 shrink-0 mt-0.5" />
                  <span>سنتر أطلس التعليمي — المقر الرئيسي</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock size={16} className="text-sky-400 shrink-0" />
                  <span>مواعيد العمل: يومياً من 9 صباحاً حتى 10 مساءً</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <PhoneCall size={16} className="text-emerald-400 shrink-0" />
                  <span>استقبال السنتر متاح طوال ساعات العمل</span>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Bar: Copyright & System Identity */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/50">
            <p>
              جميع الحقوق محفوظة © {new Date().getFullYear()} سنتر أطلس التعليمي
            </p>
            <div className="flex items-center gap-2 font-medium text-white/60">
              <span>مدعوم بواسطة</span>
              <span className="font-bold text-white text-xs bg-white/10 px-2 py-0.5 rounded border border-white/15">
                Atlas ERP — نظام أطلس الإداري
              </span>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}
