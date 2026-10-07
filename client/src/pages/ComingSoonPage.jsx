import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  Clock, 
  MapPin, 
  Phone, 
  ArrowLeft, 
  ExternalLink,
  BookOpen,
  Award,
  Users,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Menu,
  X,
  ChevronLeft
} from 'lucide-react';
import PublicFooter from '../components/PublicFooter';

const CONTACT_INFO = {
  mapsUrl: 'https://maps.app.goo.gl/Stpru5tWARXVBiX56',
  facebookUrl: 'https://web.facebook.com/Atlasacademy10',
  whatsapp1: {
    number: '01016083050',
    url: 'https://wa.me/qr/LL2VGIU4UXXZJ1',
    label: 'الاستقبال والحجز'
  },
  whatsapp2: {
    number: '01288817183',
    url: 'https://wa.me/message/6UWB472VJFKAO1',
    label: 'شؤون الطلاب والاستفسارات'
  },
  workingHours: 'يومياً من 9:00 صباحاً حتى 8:00 مساءً'
};

function WhatsAppIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.53 1.77.813 2.796.813h.005c3.179 0 5.767-2.587 5.767-5.766.001-3.187-2.575-5.999-5.772-5.999zm3.376 8.219c-.144.405-.837.774-1.17.824-.312.045-.698.073-2.027-.478-1.699-.704-2.775-2.453-2.859-2.568-.083-.115-.688-.916-.688-1.747 0-.832.434-1.238.588-1.407.155-.169.34-.212.453-.212.114 0 .228.001.328.006.105.006.246-.04.385.294.144.346.491 1.2.535 1.288.043.088.072.19.014.305-.058.115-.087.187-.174.288-.087.102-.184.227-.263.305-.089.088-.182.183-.078.361.104.179.462.763.992 1.234.682.607 1.258.795 1.437.883.179.088.284.073.39-.048.106-.121.455-.53.577-.712.122-.182.245-.152.41-.091.164.06 1.042.492 1.221.581.179.089.299.133.342.207.043.074.043.432-.101.837z"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.05 21.95l4.908-1.287A9.957 9.957 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2a8.163 8.163 0 0 1-4.321-1.233l-.31-.184-2.898.76.774-2.827-.202-.322A8.165 8.165 0 0 1 3.8 12c0-4.521 3.679-8.2 8.2-8.2s8.2 3.679 8.2 8.2-3.679 8.2-8.2 8.2z"/>
    </svg>
  );
}

export default function ComingSoonPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div 
      className="min-h-screen flex flex-col bg-slate-50 text-slate-800 selection:bg-blue-100 selection:text-blue-900"
      dir="rtl"
      style={{ fontFamily: "'IBM Plex Sans Arabic', 'Plus Jakarta Sans', -apple-system, sans-serif" }}
    >

      {/* ──────────────────────────────────────────────────────────
          1. Top Notification Bar (Clean, Professional Info Strip)
          ────────────────────────────────────────────────────────── */}
      <div className="bg-[#0C3C82] text-white text-xs py-2 px-4 border-b border-blue-900/40">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 font-medium text-blue-100">
              <Clock size={13} className="text-amber-300" />
              <span>مواعيد الاستقبال: يومياً من 9:00 صباحاً حتى 8:00 مساءً</span>
            </span>
          </div>

          <div className="flex items-center gap-4 text-blue-100">
            <div className="flex items-center gap-2">
              <Phone size={13} className="text-emerald-300" />
              <span className="text-[11px] text-blue-200">للاستفسار:</span>
              <a href={`tel:${CONTACT_INFO.whatsapp1.number}`} className="hover:text-white font-mono font-medium" dir="ltr">
                {CONTACT_INFO.whatsapp1.number}
              </a>
              <span className="text-blue-400">|</span>
              <a href={`tel:${CONTACT_INFO.whatsapp2.number}`} className="hover:text-white font-mono font-medium" dir="ltr">
                {CONTACT_INFO.whatsapp2.number}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          2. Main Header / Navigation
          ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          
          {/* Logo & Academy Name */}
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src="/atlas-logo.png" 
              alt="أكاديمية أطلس التعليمية" 
              className="w-10 h-10 sm:w-11 sm:h-11 object-contain transition-transform group-hover:scale-105" 
            />
            <div>
              <div className="font-extrabold text-slate-900 text-base sm:text-lg leading-tight">
                أكاديمية أطلس التعليمية
              </div>
              <div className="text-[11px] sm:text-xs text-slate-500 font-medium">
                Atlas Educational Academy
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-[13px] font-semibold text-slate-600">
            <a href="#about" className="hover:text-[#0C3C82] transition-colors">عن الأكاديمية</a>
            <a href="#features" className="hover:text-[#0C3C82] transition-colors">مميزاتنا</a>
            <a href="#stages" className="hover:text-[#0C3C82] transition-colors">المراحل الدراسية</a>
            <a href="#location" className="hover:text-[#0C3C82] transition-colors">المقر والمواعيد</a>
            <a href="#contact" className="hover:text-[#0C3C82] transition-colors">تواصل معنا</a>
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-2.5">
            <a
              href={CONTACT_INFO.whatsapp1.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-2 rounded-lg transition-colors"
            >
              <WhatsAppIcon className="w-4 h-4 text-emerald-600" />
              <span>واتساب</span>
            </a>

            <Link
              to="/register"
              className="inline-flex items-center gap-2 text-xs font-bold text-white bg-[#0C3C82] hover:bg-blue-800 px-4 py-2 rounded-lg shadow-sm transition-all"
            >
              <GraduationCap size={15} />
              <span>تسجيل طالب جديد</span>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200"
            aria-label="القائمة الرئيسية"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
            <nav className="flex flex-col gap-2.5 text-sm font-semibold text-slate-700">
              <a 
                href="#about" 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:bg-slate-50 rounded-lg"
              >
                عن الأكاديمية
              </a>
              <a 
                href="#features" 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:bg-slate-50 rounded-lg"
              >
                مميزاتنا
              </a>
              <a 
                href="#stages" 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:bg-slate-50 rounded-lg"
              >
                المراحل الدراسية
              </a>
              <a 
                href="#location" 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:bg-slate-50 rounded-lg"
              >
                المقر والمواعيد
              </a>
              <a 
                href="#contact" 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:bg-slate-50 rounded-lg"
              >
                تواصل معنا
              </a>
            </nav>

            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 bg-[#0C3C82] text-white font-bold text-sm rounded-lg"
              >
                تسجيل طالب جديد
              </Link>
              <a
                href={CONTACT_INFO.whatsapp1.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center py-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-sm rounded-lg flex items-center justify-center gap-2"
              >
                <WhatsAppIcon className="w-4 h-4 text-emerald-600" />
                <span>تواصل عبر واتساب</span>
              </a>
            </div>
          </div>
        )}
      </header>

      {/* ──────────────────────────────────────────────────────────
          3. Hero Section (Authoritative, Clear, Human-Designed)
          ────────────────────────────────────────────────────────── */}
      <section id="about" className="relative bg-gradient-to-b from-blue-50/70 via-white to-slate-50 border-b border-slate-200/80 pt-10 pb-16 sm:pt-16 sm:pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Right: Main Content & Headline */}
            <div className="lg:col-span-7 text-right">
              
              {/* Official Academic Badge */}
              <div className="inline-flex items-center gap-2 bg-blue-100/80 text-[#0C3C82] text-xs font-bold px-3 py-1.5 rounded-full mb-5 border border-blue-200">
                <span className="w-2 h-2 rounded-full bg-[#0C3C82] animate-pulse" />
                <span>العام الدراسي الجديد 2026 / 2027</span>
                <span className="text-blue-300">•</span>
                <span>باب التسجيل مفتوح</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-[1.25] mb-5 tracking-tight">
                صرح تعليمي متكامل
                <span className="block text-[#0C3C82] mt-1">لبناء جيل متفوق ومتميز</span>
              </h1>

              {/* Subtitle / Paragraph */}
              <p className="text-slate-600 text-base sm:text-lg leading-relaxed mb-8 max-w-xl">
                في <strong className="text-slate-800">أكاديمية أطلس</strong>، نوفر لأبنائنا الطلاب بيئة دراسية متكاملة تجمع بين كبار الأساتذة والمعلمين، وقاعات حديثة ومكيفة، مع نظام متابعة وتقارير مستمرة لولي الأمر لضمان أعلى درجات التفوق والنجاح.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-8">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2.5 bg-[#0C3C82] hover:bg-blue-800 text-white font-bold text-sm sm:text-base px-6 py-3.5 rounded-xl shadow-md shadow-blue-900/10 transition-all hover:-translate-y-0.5"
                >
                  <GraduationCap size={20} />
                  <span>استمارة تسجيل الطلاب الجدد</span>
                  <ArrowLeft size={17} />
                </Link>

                <a
                  href={CONTACT_INFO.whatsapp1.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm sm:text-base px-5 py-3.5 rounded-xl border border-slate-300 hover:border-slate-400 transition-colors"
                >
                  <WhatsAppIcon className="w-5 h-5 text-emerald-600" />
                  <span>تواصل عبر واتساب</span>
                </a>
              </div>

              {/* Trust Badges */}
              <div className="pt-6 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-3 gap-4 text-right">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-[#0C3C82] shrink-0">
                    <CheckCircle2 size={16} />
                  </div>
                  <span className="text-xs font-semibold text-slate-700">نخبة كبار المعلمين</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                    <Building2 size={16} />
                  </div>
                  <span className="text-xs font-semibold text-slate-700">قاعات مكيفة ومجهزة</span>
                </div>

                <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                    <ShieldCheck size={16} />
                  </div>
                  <span className="text-xs font-semibold text-slate-700">متابعة مستمرة لولي الأمر</span>
                </div>
              </div>

            </div>

            {/* Left: Academy Overview Card */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sm:p-7 relative overflow-hidden">
                
                {/* Decorative Top Accent */}
                <div className="absolute top-0 inset-x-0 h-1.5 bg-[#0C3C82]" />

                {/* Card Header */}
                <div className="flex items-center gap-3.5 mb-6 pb-5 border-b border-slate-100">
                  <img 
                    src="/atlas-logo.png" 
                    alt="Atlas Academy" 
                    className="w-14 h-14 object-contain bg-slate-50 p-1.5 rounded-xl border border-slate-100" 
                  />
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 leading-snug">
                      أكاديمية أطلس التعليمية
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      المقر الرئيسي لجميع المراحل الدراسية
                    </p>
                  </div>
                </div>

                {/* Working Hours Highlight Box */}
                <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 mb-5">
                  <div className="flex items-center gap-2 text-[#0C3C82] font-bold text-xs mb-1.5">
                    <Clock size={16} />
                    <span>مواعيد الاستقبال والعمل</span>
                  </div>
                  <p className="text-sm text-slate-800 font-semibold mb-1">
                    يومياً من <span className="text-[#0C3C82]">9:00 صباحاً</span> حتى <span className="text-[#0C3C82]">8:00 مساءً</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    فريق الاستقبال جاهز للرد على استفساراتكم وحجز المقاعد.
                  </p>
                </div>

                {/* Contact Shortcuts */}
                <div className="space-y-2.5 mb-5">
                  <div className="text-xs font-bold text-slate-700 mb-2">أرقام التواصل والاستفسار:</div>
                  
                  <a
                    href={CONTACT_INFO.whatsapp1.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <WhatsAppIcon className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-medium text-slate-700">{CONTACT_INFO.whatsapp1.label}</span>
                    </div>
                    <span dir="ltr" className="font-mono text-xs font-bold text-slate-900">
                      {CONTACT_INFO.whatsapp1.number}
                    </span>
                  </a>

                  <a
                    href={CONTACT_INFO.whatsapp2.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <WhatsAppIcon className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-medium text-slate-700">{CONTACT_INFO.whatsapp2.label}</span>
                    </div>
                    <span dir="ltr" className="font-mono text-xs font-bold text-slate-900">
                      {CONTACT_INFO.whatsapp2.number}
                    </span>
                  </a>
                </div>

                {/* Map Button */}
                <a
                  href={CONTACT_INFO.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2.5 px-4 rounded-xl border border-slate-200 transition-colors"
                >
                  <MapPin size={14} className="text-red-500" />
                  <span>عرض المقر على خرائط Google</span>
                  <ExternalLink size={12} className="text-slate-400" />
                </a>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          4. Features Section (لماذا تختار أكاديمية أطلس)
          ────────────────────────────────────────────────────────── */}
      <section id="features" className="py-16 sm:py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-xs font-bold tracking-wider text-[#0C3C82] uppercase mb-2">
              ركائز التميز الأكاديمي
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">
              لماذا يختارنا الطلاب وأولياء الأمور؟
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              نهتم بأدق التفاصيل التعليمية والتربوية لخلق تجربة تعليمية محفزة تحقق أفضل النتائج.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Feature 1 */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-6 text-right hover:border-blue-300 hover:shadow-sm transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#0C3C82] flex items-center justify-center mb-4">
                <Award size={24} />
              </div>
              <h4 className="font-bold text-slate-900 text-base mb-2">
                نخبة الكوادر التعليمية
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                معلمون من ذوي الخبرة والكفاءة العالية في شرح وتبسيط المناهج بأساليب تعليمية حديثة تلائم جميع المستويات.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-6 text-right hover:border-blue-300 hover:shadow-sm transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <Building2 size={24} />
              </div>
              <h4 className="font-bold text-slate-900 text-base mb-2">
                قاعات مجهزة ومكيفة
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                قاعات واسعة ومكيفة بالكامل مع شاشات عرض تفاعلية وأنظمة صوتية متطورة لتوفير أقصى درجات التركيز.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-6 text-right hover:border-blue-300 hover:shadow-sm transition-all">
              <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-4">
                <ShieldCheck size={24} />
              </div>
              <h4 className="font-bold text-slate-900 text-base mb-2">
                متابعة وتقارير لولي الأمر
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                رصد دوري للحضور والغياب ودرجات الاختبارات الأسبوعية مع إخطار مستمر لولي الأمر لمتابعة تقدم الطالب.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-6 text-right hover:border-blue-300 hover:shadow-sm transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                <Users size={24} />
              </div>
              <h4 className="font-bold text-slate-900 text-base mb-2">
                انضباط وكثافات متوازنة
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                مجموعات بأعداد منتظمة تضمن اهتمام المعلم بكل طالب مع بيئة يسودها الانضباط والجدية الأكاديمية.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          5. Educational Stages (المراحل الدراسية)
          ────────────────────────────────────────────────────────── */}
      <section id="stages" className="py-16 sm:py-20 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-xs font-bold tracking-wider text-[#0C3C82] uppercase mb-2">
              البرامج التعليمية
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">
              المراحل الدراسية في أكاديمية أطلس
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              برامج ومجموعات مخصصة لكل مرحلة عمرية تتناسب مع طبيعة المنهج ونظام التقييم.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Stage 1 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-right flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                    الصفوف 1 - 6
                  </span>
                  <BookOpen size={20} className="text-[#0C3C82]" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">المرحلة الابتدائية</h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  تأسيس علمي ولغوي سليم، وبناء المفاهيم الرياضية والقرائية الأساسية بأسلوب تربوي محبب للطفل.
                </p>
                <ul className="space-y-2 text-xs text-slate-500 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                    <span>تأسيس المهارات اللغوية والرياضية</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                    <span>متابعة أسبوعية للواجبات المدرسية</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                    <span>اختبارات تقييمية مستمرة</span>
                  </li>
                </ul>
              </div>

              <Link
                to="/register"
                className="w-full text-center py-2.5 px-4 bg-slate-100 hover:bg-blue-50 hover:text-[#0C3C82] text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>حجز مقعد في الابتدائية</span>
                <ChevronLeft size={14} />
              </Link>
            </div>

            {/* Stage 2 */}
            <div className="bg-white border-2 border-blue-200 rounded-2xl p-6 text-right flex flex-col justify-between shadow-xs relative">
              <div className="absolute -top-3 right-6 bg-[#0C3C82] text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-xs">
                إقبال مرتفع
              </div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                    الصفوف 1 - 3 إعدادي
                  </span>
                  <Award size={20} className="text-[#0C3C82]" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">المرحلة الإعدادية</h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  شرح وافٍ وتدريب عملي مكثف على نماذج الامتحانات لضمان أعلى المجموع والتأهيل للشهادة الإعدادية.
                </p>
                <ul className="space-y-2 text-xs text-slate-500 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                    <span>شرح تفصيلي ومبسط لكافة المواد</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                    <span>تدريب مستمر على حل نماذج الامتحانات</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                    <span>مذكرات ومراجعات دورية شاملة</span>
                  </li>
                </ul>
              </div>

              <Link
                to="/register"
                className="w-full text-center py-2.5 px-4 bg-[#0C3C82] hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>حجز مقعد في الإعدادية</span>
                <ChevronLeft size={14} />
              </Link>
            </div>

            {/* Stage 3 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-right flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                    الصفوف 1 - 3 ثانوي
                  </span>
                  <GraduationCap size={20} className="text-[#0C3C82]" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">المرحلة الثانوية</h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  نخبة كبار أساتذة الثانوية العامة، تدريب على أنماط أسئلة الفهم والتحليل، ومراجعات نهائية مكثفة.
                </p>
                <ul className="space-y-2 text-xs text-slate-500 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                    <span>كبار معلمي وموجهي الثانوية العامة</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                    <span>بنوك أسئلة وتدريب على أسئلة التفكير العليا</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                    <span>مراجعات ليلة الامتحان وحصص مكثفة</span>
                  </li>
                </ul>
              </div>

              <Link
                to="/register"
                className="w-full text-center py-2.5 px-4 bg-slate-100 hover:bg-blue-50 hover:text-[#0C3C82] text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>حجز مقعد في الثانوية</span>
                <ChevronLeft size={14} />
              </Link>
            </div>

          </div>

        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          6. Location, Hours, and Direct Contact Section
          ────────────────────────────────────────────────────────── */}
      <section id="location" className="py-16 sm:py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold tracking-wider text-[#0C3C82] uppercase mb-2">
              المقر وقنوات التواصل
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">
              يسعدنا تشريفكم بمقر الأكاديمية
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              يمكنكم زيارة السنتر أو التواصل المباشر مع فريق الاستقبال للاستفسار عن المواعيد والأساتذة.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Box 1: Working Hours & Reception */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-right">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#0C3C82] flex items-center justify-center mb-4">
                <Clock size={20} />
              </div>
              <h4 className="font-bold text-slate-900 text-base mb-2">
                مواعيد الاستقبال والعمل
              </h4>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                مكتب الاستقبال مفتوح يومياً لاستقبال أولياء الأمور وتسجيل الطلاب والإجابة على كافة الاستفسارات.
              </p>

              <div className="bg-white border border-slate-200 rounded-xl p-3.5 mb-3">
                <div className="text-xs text-slate-500 mb-1">المواعيد اليومية الرسمية:</div>
                <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>من 9:00 صباحاً حتى 8:00 مساءً</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500">
                * الاستقبال متاح طوال أيام الأسبوع لخدمتكم.
              </div>
            </div>

            {/* Box 2: Location & Google Maps */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-right flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
                  <MapPin size={20} />
                </div>
                <h4 className="font-bold text-slate-900 text-base mb-2">
                  المقر الجغرافي
                </h4>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  موقع متميز يسهل الوصول إليه، متوفر به كافة وسائل الراحة والأمان لأبنائنا الطلاب.
                </p>

                <div className="bg-white border border-slate-200 rounded-xl p-3.5 mb-4">
                  <div className="text-xs text-slate-500 mb-1">الموقع على الخريطة:</div>
                  <div className="text-xs font-bold text-slate-800">
                    أكاديمية أطلس التعليمية (Atlas Academy)
                  </div>
                </div>
              </div>

              <a
                href={CONTACT_INFO.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-3 px-4 rounded-xl shadow-xs transition-colors"
              >
                <MapPin size={15} />
                <span>فتح الاتجاهات على Google Maps</span>
                <ExternalLink size={12} />
              </a>
            </div>

            {/* Box 3: Social & Facebook */}
            <div id="contact" className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-right flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#1877F2]/10 text-[#1877F2] flex items-center justify-center mb-4">
                  <FacebookIcon className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-base mb-2">
                  الصفحة الرسمية على فيسبوك
                </h4>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  تابعوا جداول الحصص الجديدة، وإعلانات المدرسين، وتكريم أوائل الطلاب أولاً بأول.
                </p>

                <div className="bg-white border border-slate-200 rounded-xl p-3.5 mb-4">
                  <div className="text-xs text-slate-500 mb-1">صفحة الفيسبوك المعتمدة:</div>
                  <div className="text-xs font-bold text-slate-800" dir="ltr">
                    @Atlasacademy10
                  </div>
                </div>
              </div>

              <a
                href={CONTACT_INFO.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-bold py-3 px-4 rounded-xl shadow-xs transition-colors"
              >
                <FacebookIcon className="w-4 h-4" />
                <span>زيارة صفحتنا على Facebook</span>
                <ExternalLink size={12} />
              </a>
            </div>

          </div>

          {/* Dedicated WhatsApp Contact Row */}
          <div className="mt-8 bg-blue-50/70 border border-blue-200/80 rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              
              <div className="text-right">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-md mb-2">
                  <WhatsAppIcon className="w-3.5 h-3.5" />
                  <span>تواصل فوري عبر تطبيق واتساب</span>
                </div>
                <h4 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">
                  هل لديك استفسار عن مواعيد مادة أو معلم معين؟
                </h4>
                <p className="text-xs sm:text-sm text-slate-600">
                  تواصل مباشرة مع أحد ممثلي الاستقبال وسنرد عليك في أقرب وقت خلال أوقات العمل الرسمية.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                <a
                  href={CONTACT_INFO.whatsapp1.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-xs transition-colors"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  <span className="font-mono" dir="ltr">{CONTACT_INFO.whatsapp1.number}</span>
                  <span className="text-emerald-200 text-xs">({CONTACT_INFO.whatsapp1.label})</span>
                </a>

                <a
                  href={CONTACT_INFO.whatsapp2.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs sm:text-sm px-5 py-3 rounded-xl transition-colors"
                >
                  <WhatsAppIcon className="w-4 h-4 text-emerald-600" />
                  <span className="font-mono" dir="ltr">{CONTACT_INFO.whatsapp2.number}</span>
                  <span className="text-slate-500 text-xs">({CONTACT_INFO.whatsapp2.label})</span>
                </a>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          7. Registration CTA Banner (Clear and Professional)
          ────────────────────────────────────────────────────────── */}
      <section className="py-14 sm:py-16 bg-[#0C3C82] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          
          <img 
            src="/atlas-logo.png" 
            alt="Atlas Logo" 
            className="w-16 h-16 mx-auto mb-5 object-contain bg-white/10 p-2 rounded-2xl border border-white/20" 
          />

          <h3 className="text-2xl sm:text-3xl font-extrabold mb-3 leading-snug">
            ابدأ رحلة التفوق مع أكاديمية أطلس
          </h3>

          <p className="text-blue-100 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed">
            سجل بيانات الطالب الآن من خلال الاستمارة الإلكترونية لضمان حجز المكان في المجموعات المناسبة قبل اكتمال العدد.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-blue-50 text-[#0C3C82] font-bold text-sm sm:text-base px-8 py-3.5 rounded-xl shadow-lg transition-transform hover:-translate-y-0.5"
            >
              <GraduationCap size={20} />
              <span>فتح استمارة تسجيل الطلاب</span>
              <ArrowLeft size={16} />
            </Link>

            <a
              href={CONTACT_INFO.whatsapp1.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-900/60 hover:bg-blue-900/90 text-white font-semibold text-sm sm:text-base px-6 py-3.5 rounded-xl border border-blue-400/30 transition-colors"
            >
              <WhatsAppIcon className="w-4 h-4 text-emerald-400" />
              <span>استفسار عبر واتساب</span>
            </a>
          </div>

          <div className="mt-8 text-xs text-blue-200/80">
            * تجري حالياً أعمال تطوير المنظومة الرقمية الموسعة لخدمات أولياء الأمور أونلاين.
          </div>

        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          8. Comprehensive Professional Footer
          ────────────────────────────────────────────────────────── */}
      <PublicFooter />

    </div>
  );
}

function FacebookIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}
