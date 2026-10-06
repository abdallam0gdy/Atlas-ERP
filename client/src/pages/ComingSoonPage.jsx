import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  GraduationCap, 
  Clock, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  ArrowLeft, 
  Building2, 
  ShieldCheck,
  Calendar
} from 'lucide-react';

export default function ComingSoonPage() {
  return (
    <div 
      className="min-h-screen flex flex-col justify-between text-slate-100 relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at top, #0E356A 0%, #071C3A 40%, #040E1E 100%)',
        fontFamily: 'Plus Jakarta Sans, IBM Plex Sans Arabic, sans-serif'
      }}
    >
      {/* Decorative Ambient Glow Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, #0284C7 0%, transparent 70%)' }}
        />
        <div 
          className="absolute bottom-0 -right-40 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #D8232A 0%, transparent 70%)' }}
        />
        <div 
          className="absolute top-1/3 -left-32 w-80 h-80 rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, #38BDF8 0%, transparent 70%)' }}
        />
      </div>

      {/* Top Header */}
      <header className="relative z-10 w-full border-b border-white/10 bg-slate-950/40 backdrop-blur-md px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl p-1.5 flex items-center justify-center shrink-0 shadow-lg"
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
              }}
            >
              <img 
                src="/atlas-logo.png" 
                alt="أكاديمية أطلس التعليمية" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="font-extrabold text-sm sm:text-base text-white tracking-wide">
                أكاديمية أطلس التعليمية
              </div>
              <div className="text-[10px] sm:text-xs text-sky-300/80 font-medium tracking-wider">
                ATLAS EDUCATIONAL ACADEMY
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-amber-300 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>قيد التجهيز والتطوير</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Hero */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
        <div className="max-w-3xl w-full mx-auto text-center">
          
          {/* Main Status Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-400/25 text-sky-300 text-xs sm:text-sm font-semibold mb-6 shadow-inner animate-pulse">
            <Sparkles size={15} className="text-sky-400" />
            <span>البوابة الإلكترونية الرسمية — انطلاقة العام الجديد 2026 / 2027</span>
          </div>

          {/* Central Logo Display */}
          <div className="mb-6 flex justify-center">
            <div 
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl p-3.5 flex items-center justify-center shadow-2xl relative group transition-transform duration-300 hover:scale-105"
              style={{
                background: 'rgba(255, 255, 255, 0.96)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.45), 0 0 40px rgba(14,165,233,0.3)',
              }}
            >
              <img 
                src="/atlas-logo.png" 
                alt="أكاديمية أطلس التعليمية" 
                className="w-full h-full object-contain"
              />
              <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-white text-[10px] font-bold shadow-md">
                ✓
              </div>
            </div>
          </div>

          {/* Big Headline */}
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
            لم يتم إطلاق هذه الصفحة بعد
          </h1>

          <p className="text-sky-200/80 text-base sm:text-lg max-w-xl mx-auto mb-8 font-normal leading-relaxed">
            نعمل حالياً على تجهيز وإطلاق المنصة الإلكترونية الشاملة لـ <span className="text-white font-bold">أكاديمية أطلس التعليمية</span> لتقديم تجربة تعليمية متطورة وحديثة.
          </p>

          {/* Student Registration Callout Card */}
          <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-2xl mb-8 text-right max-w-xl mx-auto relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-sky-400 to-blue-600" />
            
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-sky-500/15 border border-sky-400/20 flex items-center justify-center shrink-0 text-sky-400">
                <GraduationCap size={26} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white mb-1">
                    هل ترغب في التسجيل كطالب؟
                  </h2>
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
                    متاح الآن
                  </span>
                </div>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                  استمارة تسجيل الطلاب الجدد مفتوحة حالياً. يمكنك ملء بياناتك إلكترونياً لحجز مقعدك بالعام الدراسي الجديد.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>تسجيل فوري بدون أي رسوم تقديم إلكترونية</span>
              </span>
              <Link 
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-lg shadow-sky-500/25 transition-all duration-200 hover:-translate-y-0.5"
              >
                <span>الانتقال لاستمارة تسجيل الطلاب</span>
                <ArrowLeft size={16} />
              </Link>
            </div>
          </div>

          {/* Academy Highlights Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-2xl mx-auto text-right">
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-sky-300 font-bold text-xs mb-1">
                <Building2 size={14} />
                <span>قاعات مجهزة بالكامل</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                بيئة تعليمية مريحة ومكيفة بأحدث شاشات العرض الذكية.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs mb-1">
                <ShieldCheck size={14} />
                <span>نخبة من كبار المعلمين</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                كادر تدريسي متخصص لجميع المراحل (ابتدائي - إعدادي - ثانوي).
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs mb-1">
                <Calendar size={14} />
                <span>متابعة إلكترونية دقيقة</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                إشعارات حضور وتقييمات دورية مستمرة لأولياء الأمور.
              </p>
            </div>
          </div>

        </div>
      </main>

      {/* Footer & Contact */}
      <footer className="relative z-10 w-full border-t border-white/10 bg-slate-950/60 backdrop-blur-md px-4 sm:px-8 py-5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-6">
            <span className="flex items-center gap-1.5">
              <Clock size={13} className="text-sky-400" />
              <span>مواعيد الاستقبال: 9:00 صباحاً – 10:00 مساءً</span>
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin size={13} className="text-red-400" />
              <span>مقر الأكاديمية الرئيسي</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Phone size={13} className="text-emerald-400" />
              <span>للاستفسار: إدارة الأكاديمية</span>
            </span>
          </div>

          <div className="text-center md:text-left text-[11px] text-slate-500">
            جميع الحقوق محفوظة © {new Date().getFullYear()} — أكاديمية أطلس التعليمية
          </div>
        </div>
      </footer>
    </div>
  );
}
