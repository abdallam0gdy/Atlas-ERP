import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  Clock,
  Sparkles,
  CreditCard,
  Home
} from 'lucide-react';
import PublicFooter from '../PublicFooter';

export default function StudentPortalLayout() {
  const location = useLocation();
  const isLookupPage = location.pathname.startsWith('/student-card');

  return (
    <div
      className="min-h-screen flex flex-col font-sans text-slate-800 antialiased selection:bg-[#D8232A] selection:text-white"
      dir="rtl"
      style={{
        background: 'linear-gradient(180deg, #00275C 0%, #0C3C82 300px, #F9F9FF 300px, #F1F5F9 100%)',
      }}
    >
      {/* Top Announcement Strip */}
      <header className="w-full bg-[#001A42]/90 backdrop-blur-md border-b border-white/10 text-white/90 text-xs py-2 px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D8232A] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D8232A]"></span>
            </span>
            <span className="font-semibold text-sky-200 text-[11px] sm:text-xs">
              {isLookupPage ? 'بوابة استعلام الطلاب أونلاين' : 'باب التقديم والقبول مفتوح'}
            </span>
            <span className="hidden sm:inline text-white/30">|</span>
            <span className="hidden sm:inline text-white/70">العام الدراسي الجديد 2026 / 2027</span>
          </div>

          <div className="flex items-center gap-2.5 text-white/70 text-[11px] sm:text-xs">
            <span className="hidden md:flex items-center gap-1.5">
              <Clock size={12} className="text-[#32B4F9]" />
              <span>مواعيد العمل: 9:00 ص - 8:00 م</span>
            </span>
            <Link
              to="/"
              className="flex items-center gap-1 text-white/80 hover:text-white bg-white/10 hover:bg-white/15 px-2.5 py-1 rounded-full border border-white/10 transition-colors font-semibold"
            >
              <Home size={12} />
              <span>الرئيسية</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Brand Header */}
      <div className="w-full text-white pt-5 pb-6 px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5 text-center md:text-right">

          {/* Logo & Identity */}
          <div className="flex flex-col sm:flex-row items-center gap-3.5">
            <Link
              to="/"
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
            </Link>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
                  {isLookupPage ? 'استعلم عن كودك وكارنيهك الذكي' : 'سجّل واستلم كودك الذكي'}
                </h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#D8232A] text-white px-2.5 py-0.5 rounded-full shadow-sm">
                  <Sparkles size={11} />
                  منظومة أطلس الإلكترونية
                </span>
              </div>
              <p className="text-sky-200/90 text-xs sm:text-sm font-semibold mt-0.5 tracking-wide">
                أكاديمية أطلس التعليمية — منورنا يا بطل في صرح التفوق
              </p>
              <p className="text-white/70 text-[11px] sm:text-xs mt-1">
                {isLookupPage
                  ? 'أدخل رقمك القومي فقط لاستخراج صورتك وكودك ورمز الـ QR والجدول فوراً'
                  : 'دقيقة واحدة تسجل فيها بياناتك وتضمن مكانك وتستلم كود حضورك الذكي فوراً'}
              </p>
            </div>
          </div>

          {/* Quick Public Portal Mode Switcher */}
          <div className="flex flex-col items-center md:items-end gap-2.5">
            <div className="inline-flex items-center bg-[#001A42]/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/15 shadow-lg gap-1">
              <Link
                to="/register"
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  !isLookupPage
                    ? 'bg-white text-[#0C3C82] shadow-md'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <GraduationCap size={15} />
                <span>تسجيل طالب جديد</span>
              </Link>
              <Link
                to="/student-card"
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  isLookupPage
                    ? 'bg-white text-[#0C3C82] shadow-md'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <CreditCard size={15} />
                <span>استعلام عن الكود والكارنيه</span>
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* Main Content — Full Width Responsive Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-12 z-10">
        <Outlet />
      </main>

      {/* Public Footer — Consistent across the academy */}
      <PublicFooter />
    </div>
  );
}
