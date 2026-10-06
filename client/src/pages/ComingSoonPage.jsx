import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  Clock, 
  MapPin, 
  Phone, 
  ArrowLeft, 
  ExternalLink,
  Calendar,
  CheckCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';

// Custom Crisp Brand SVGs
function WhatsAppIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.53 1.77.813 2.796.813h.005c3.179 0 5.767-2.587 5.767-5.766.001-3.187-2.575-5.999-5.772-5.999zm3.376 8.219c-.144.405-.837.774-1.17.824-.312.045-.698.073-2.027-.478-1.699-.704-2.775-2.453-2.859-2.568-.083-.115-.688-.916-.688-1.747 0-.832.434-1.238.588-1.407.155-.169.34-.212.453-.212.114 0 .228.001.328.006.105.006.246-.04.385.294.144.346.491 1.2.535 1.288.043.088.072.19.014.305-.058.115-.087.187-.174.288-.087.102-.184.227-.263.305-.089.088-.182.183-.078.361.104.179.462.763.992 1.234.682.607 1.258.795 1.437.883.179.088.284.073.39-.048.106-.121.455-.53.577-.712.122-.182.245-.152.41-.091.164.06 1.042.492 1.221.581.179.089.299.133.342.207.043.074.043.432-.101.837z" />
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.05 21.95l4.908-1.287A9.957 9.957 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2a8.163 8.163 0 0 1-4.321-1.233l-.31-.184-2.898.76.774-2.827-.202-.322A8.165 8.165 0 0 1 3.8 12c0-4.521 3.679-8.2 8.2-8.2s8.2 3.679 8.2 8.2-3.679 8.2-8.2 8.2z" />
    </svg>
  );
}

function FacebookIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export default function ComingSoonPage() {
  const FACEBOOK_URL = "https://web.facebook.com/Atlasacademy10";
  const MAPS_URL = "https://maps.app.goo.gl/Stpru5tWARXVBiX56";
  const WHATSAPP_1 = {
    number: "01016083050",
    url: "https://wa.me/qr/LL2VGIU4UXXZJ1",
    label: "خدمة العملاء والتسجيل",
  };
  const WHATSAPP_2 = {
    number: "01288817183",
    url: "https://wa.me/message/6UWB472VJFKAO1",
    label: "الإدارة وشؤون الطلاب",
  };

  return (
    <div 
      className="min-h-screen flex flex-col justify-between text-slate-100 relative overflow-hidden selection:bg-sky-500 selection:text-white"
      dir="rtl"
      style={{
        background: 'radial-gradient(ellipse at 50% 0%, #0D2C59 0%, #071731 45%, #030A17 100%)',
        fontFamily: 'Plus Jakarta Sans, IBM Plex Sans Arabic, sans-serif'
      }}
    >
      {/* Decorative Ambient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[720px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #0284C7 0%, transparent 70%)' }}
        />
        <div 
          className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, #D8232A 0%, transparent 70%)' }}
        />
        <div 
          className="absolute top-1/2 -left-32 w-72 h-72 rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, #2563EB 0%, transparent 70%)' }}
        />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 w-full border-b border-white/10 bg-slate-950/50 backdrop-blur-md px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          
          {/* Identity */}
          <div className="flex items-center gap-3">
            <div 
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl p-1.5 flex items-center justify-center shrink-0 shadow-lg"
              style={{
                background: 'rgba(255, 255, 255, 0.96)',
                boxShadow: '0 4px 18px rgba(0,0,0,0.3)',
              }}
            >
              <img 
                src="/atlas-logo.png" 
                alt="أكاديمية أطلس التعليمية" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="font-extrabold text-base sm:text-lg text-white tracking-wide">
                أكاديمية أطلس التعليمية
              </div>
              <div className="text-[11px] text-sky-300 font-medium tracking-wider">
                العام الدراسي 2026 / 2027
              </div>
            </div>
          </div>

          {/* Header Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a 
              href={FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="صفحة الفيسبوك الرسمية"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#1877F2]/20 hover:bg-[#1877F2]/30 text-sky-200 border border-[#1877F2]/40 transition-colors"
            >
              <FacebookIcon className="w-3.5 h-3.5 text-[#1877F2]" />
              <span>صفحتنا على فيسبوك</span>
            </a>

            <a
              href={WHATSAPP_1.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-colors"
            >
              <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xs:inline">واتساب:</span>
              <span dir="ltr" className="font-mono">{WHATSAPP_1.number}</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Hero & Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-10 sm:py-14">
        <div className="max-w-4xl w-full mx-auto text-center">
          
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-400/25 text-sky-300 text-xs sm:text-sm font-semibold mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>الموقع الرسمي قيد التجهيز — سيتم الإطلاق قريباً</span>
          </div>

          {/* Academy Logo */}
          <div className="mb-6 flex justify-center">
            <div 
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl p-3 flex items-center justify-center shadow-2xl relative group transition-transform duration-300 hover:scale-105"
              style={{
                background: 'rgba(255, 255, 255, 0.98)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.45), 0 0 35px rgba(14,165,233,0.3)',
              }}
            >
              <img 
                src="/atlas-logo.png" 
                alt="أكاديمية أطلس التعليمية" 
                className="w-full h-full object-contain"
              />
              <div 
                className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-emerald-600 border border-emerald-300/40 text-white text-[10px] font-bold shadow-md"
                title="مؤسسة تعليمية معتمدة"
              >
                مفتوح
              </div>
            </div>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
            أهلاً بكم في أكاديمية أطلس التعليمية
          </h1>

          <p className="text-sky-200/85 text-base sm:text-lg max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
            نعمل حالياً على تجهيز البوابة الإلكترونية الكاملة للأكاديمية. في هذه الأثناء، يمكنك <strong className="text-white font-bold">تسجيل بياناتك كطالب</strong> لحجز مقعدك بالعام الجديد، أو التواصل مع إدارة السنتر مباشرة.
          </p>

          {/* Student Registration Primary Card */}
          <div className="bg-slate-900/80 border border-sky-500/30 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-2xl mb-8 text-right max-w-2xl mx-auto relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-sky-400 via-blue-500 to-indigo-600" />
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center shrink-0 text-sky-400">
                  <GraduationCap size={28} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    <span>استمارة تسجيل الطلاب الجدد</span>
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                      متاحة الآن
                    </span>
                  </h2>
                  <p className="text-xs text-slate-300 mt-0.5">
                    لطلاب المراحل الابتدائية والإعدادية والثانوية للعام الدراسي 2026 / 2027
                  </p>
                </div>
              </div>

              <Link 
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 shadow-lg shadow-sky-500/25 transition-all duration-200 hover:-translate-y-0.5 shrink-0"
              >
                <span>سجّل بياناتك الآن</span>
                <ArrowLeft size={17} />
              </Link>
            </div>

            <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle size={14} />
                <span>تسجيل فوري بدون رسوم تقديم</span>
              </span>
              <span>
                يتم التواصل معكم من قِبل إدارة الأكاديمية لتأكيد المواعيد
              </span>
            </div>
          </div>

          {/* Direct Communication Channels Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl mx-auto text-right">
            
            {/* WhatsApp 1 */}
            <a 
              href={WHATSAPP_1.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-xl bg-slate-900/60 border border-emerald-500/30 hover:border-emerald-400/60 hover:bg-slate-900/90 transition-all duration-200 group flex items-center gap-3.5"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-400/25 flex items-center justify-center shrink-0 text-emerald-400 group-hover:scale-105 transition-transform">
                <WhatsAppIcon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-slate-400">{WHATSAPP_1.label}</div>
                <div dir="ltr" className="text-sm font-bold text-white font-mono group-hover:text-emerald-300">
                  {WHATSAPP_1.number}
                </div>
              </div>
            </a>

            {/* WhatsApp 2 */}
            <a 
              href={WHATSAPP_2.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-xl bg-slate-900/60 border border-emerald-500/30 hover:border-emerald-400/60 hover:bg-slate-900/90 transition-all duration-200 group flex items-center gap-3.5"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-400/25 flex items-center justify-center shrink-0 text-emerald-400 group-hover:scale-105 transition-transform">
                <WhatsAppIcon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-slate-400">{WHATSAPP_2.label}</div>
                <div dir="ltr" className="text-sm font-bold text-white font-mono group-hover:text-emerald-300">
                  {WHATSAPP_2.number}
                </div>
              </div>
            </a>

            {/* Facebook */}
            <a 
              href={FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-xl bg-slate-900/60 border border-[#1877F2]/30 hover:border-[#1877F2]/60 hover:bg-slate-900/90 transition-all duration-200 group flex items-center gap-3.5"
            >
              <div className="w-10 h-10 rounded-lg bg-[#1877F2]/15 border border-[#1877F2]/25 flex items-center justify-center shrink-0 text-[#1877F2] group-hover:scale-105 transition-transform">
                <FacebookIcon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-slate-400">فيسبوك الأكاديمية</div>
                <div className="text-sm font-bold text-white truncate group-hover:text-sky-300">
                  Atlasacademy10
                </div>
              </div>
            </a>

            {/* Location */}
            <a 
              href={MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-xl bg-slate-900/60 border border-red-500/30 hover:border-red-400/60 hover:bg-slate-900/90 transition-all duration-200 group flex items-center gap-3.5"
            >
              <div className="w-10 h-10 rounded-lg bg-red-500/15 border border-red-400/25 flex items-center justify-center shrink-0 text-red-400 group-hover:scale-105 transition-transform">
                <MapPin size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-slate-400">الموقع الجغرافي</div>
                <div className="text-sm font-bold text-white group-hover:text-red-300 flex items-center gap-1">
                  <span>خرائط Google</span>
                  <ExternalLink size={12} className="opacity-70" />
                </div>
              </div>
            </a>

          </div>

        </div>
      </main>

      {/* Comprehensive Authentic Footer */}
      <footer className="relative z-10 w-full border-t border-white/10 bg-slate-950/85 backdrop-blur-lg pt-10 pb-6 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Main Footer Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10 text-right">
            
            {/* Column 1: About Academy */}
            <div>
              <div className="flex items-center gap-2.5 mb-3.5">
                <div className="w-8 h-8 rounded-lg p-1 bg-white flex items-center justify-center shrink-0">
                  <img src="/atlas-logo.png" alt="Atlas" className="w-full h-full object-contain" />
                </div>
                <div className="font-extrabold text-white text-base">
                  أكاديمية أطلس التعليمية
                </div>
              </div>
              <p className="text-xs text-slate-300/80 leading-relaxed mb-4">
                صرح تعليمي متكامل يهدف لتقديم أفضل بيئة دراسية لجميع المراحل التعليمية مع نخبة من أكفأ المعلمين، ومتابعة دراسية دقيقة لأبنائنا الطلاب.
              </p>
              <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>التقديم متاح حالياً للعام الدراسي الجديد</span>
              </div>
            </div>

            {/* Column 2: Working Hours & Location */}
            <div>
              <h3 className="text-white font-bold text-sm mb-3.5 flex items-center gap-2">
                <Clock size={16} className="text-sky-400" />
                <span>مواعيد الاستقبال والمقر</span>
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-300/90">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>
                    <strong>مواعيد الاستقبال:</strong> يومياً من الساعة <span className="text-white font-bold">9:00 صباحاً</span> حتى <span className="text-white font-bold">8:00 مساءً</span>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span>
                    <strong>المقر:</strong> يمكنك الوصول للمقر بكل سهولة عبر نظام الملاحة (GPS).
                  </span>
                </li>
              </ul>

              <div className="mt-3.5">
                <a 
                  href={MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 transition-colors"
                >
                  <MapPin size={13} />
                  <span>عرض المقر على خرائط Google</span>
                  <ExternalLink size={11} className="opacity-70" />
                </a>
              </div>
            </div>

            {/* Column 3: Contact & WhatsApp */}
            <div>
              <h3 className="text-white font-bold text-sm mb-3.5 flex items-center gap-2">
                <Phone size={16} className="text-emerald-400" />
                <span>أرقام التواصل والواتساب</span>
              </h3>
              <div className="space-y-2.5">
                <a 
                  href={WHATSAPP_1.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors text-xs"
                >
                  <span className="text-slate-300">{WHATSAPP_1.label}:</span>
                  <span dir="ltr" className="font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                    <WhatsAppIcon className="w-3.5 h-3.5" />
                    <span>{WHATSAPP_1.number}</span>
                  </span>
                </a>

                <a 
                  href={WHATSAPP_2.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors text-xs"
                >
                  <span className="text-slate-300">{WHATSAPP_2.label}:</span>
                  <span dir="ltr" className="font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                    <WhatsAppIcon className="w-3.5 h-3.5" />
                    <span>{WHATSAPP_2.number}</span>
                  </span>
                </a>
              </div>
              <p className="text-[11px] text-slate-400 mt-2.5">
                اضغط على أي رقم للمحادثة الفورية عبر تطبيق واتساب.
              </p>
            </div>

            {/* Column 4: Quick Links */}
            <div>
              <h3 className="text-white font-bold text-sm mb-3.5 flex items-center gap-2">
                <Sparkles size={16} className="text-amber-400" />
                <span>روابط وخدمات سريعة</span>
              </h3>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link 
                    to="/register" 
                    className="text-sky-300 hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <ArrowLeft size={13} />
                    <span>استمارة تسجيل الطلاب الجدد</span>
                  </Link>
                </li>
                <li>
                  <a 
                    href={FACEBOOK_URL} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <FacebookIcon className="w-3.5 h-3.5 text-[#1877F2]" />
                    <span>متابعة أخبار الأكاديمية على فيسبوك</span>
                  </a>
                </li>
                <li>
                  <a 
                    href={MAPS_URL} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <MapPin size={13} className="text-red-400" />
                    <span>اتجاهات الوصول لمقر السنتر</span>
                  </a>
                </li>
                <li>
                  <a 
                    href={`tel:${WHATSAPP_1.number}`}
                    className="text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <Phone size={13} className="text-sky-400" />
                    <span>اتصال هاتفي مباشر</span>
                  </a>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Sub-footer */}
          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 text-center sm:text-right">
            <div>
              جميع الحقوق محفوظة © {new Date().getFullYear()} — <strong className="text-white font-semibold">أكاديمية أطلس التعليمية</strong>
            </div>
            <div className="text-[11px] text-slate-500">
              Atlas Educational Academy • إدارة الشؤون التعليمية
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}
