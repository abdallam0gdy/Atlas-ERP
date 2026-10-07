import { Link } from 'react-router-dom';
import { 
  Clock, 
  MapPin, 
  ExternalLink, 
  GraduationCap, 
  BookOpen, 
  Home 
} from 'lucide-react';

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
  workingHours: 'يومياً من 9:00 ص إلى 8:00 م'
};

function WhatsAppIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.53 1.77.813 2.796.813h.005c3.179 0 5.767-2.587 5.767-5.766.001-3.187-2.575-5.999-5.772-5.999zm3.376 8.219c-.144.405-.837.774-1.17.824-.312.045-.698.073-2.027-.478-1.699-.704-2.775-2.453-2.859-2.568-.083-.115-.688-.916-.688-1.747 0-.832.434-1.238.588-1.407.155-.169.34-.212.453-.212.114 0 .228.001.328.006.105.006.246-.04.385.294.144.346.491 1.2.535 1.288.043.088.072.19.014.305-.058.115-.087.187-.174.288-.087.102-.184.227-.263.305-.089.088-.182.183-.078.361.104.179.462.763.992 1.234.682.607 1.258.795 1.437.883.179.088.284.073.39-.048.106-.121.455-.53.577-.712.122-.182.245-.152.41-.091.164.06 1.042.492 1.221.581.179.089.299.133.342.207.043.074.043.432-.101.837z"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.05 21.95l4.908-1.287A9.957 9.957 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2a8.163 8.163 0 0 1-4.321-1.233l-.31-.184-2.898.76.774-2.827-.202-.322A8.165 8.165 0 0 1 3.8 12c0-4.521 3.679-8.2 8.2-8.2s8.2 3.679 8.2 8.2-3.679 8.2-8.2 8.2z"/>
    </svg>
  );
}

function FacebookIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

export default function PublicFooter() {
  return (
    <footer 
      className="w-full bg-slate-900 text-slate-300 text-right pt-12 pb-8 border-t border-slate-800"
      dir="rtl"
      style={{ fontFamily: "'IBM Plex Sans Arabic', 'Plus Jakarta Sans', -apple-system, sans-serif" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Main 4 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10 pb-10 border-b border-slate-800">
          
          {/* Col 1: About */}
          <div>
            <div className="flex items-center gap-2.5 mb-3.5">
              <img src="/atlas-logo.png" alt="أطلس" className="w-8 h-8 object-contain" />
              <span className="font-extrabold text-white text-base">أكاديمية أطلس التعليمية</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              صرح تعليمي متكامل يقدم أفضل بيئة دراسية لجميع المراحل التعليمية بنخبة من أكفأ المعلمين ومتابعة دراسية مستمرة.
            </p>
            <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>العام الدراسي 2026 / 2027</span>
            </div>
          </div>

          {/* Col 2: Hours & Location */}
          <div>
            <h4 className="font-bold text-white text-sm mb-3.5">المقر ومواعيد الاستقبال</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <Clock size={14} className="text-blue-400 mt-0.5 shrink-0" />
                <span>
                  <strong>المواعيد:</strong> {CONTACT_INFO.workingHours}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={14} className="text-red-400 mt-0.5 shrink-0" />
                <a 
                  href={CONTACT_INFO.mapsUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-slate-300 hover:text-white underline-offset-2 hover:underline inline-flex items-center gap-1"
                >
                  <span>موقع الأكاديمية على Google Maps</span>
                  <ExternalLink size={11} />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Direct Contact */}
          <div>
            <h4 className="font-bold text-white text-sm mb-3.5">قنوات التواصل</h4>
            <div className="space-y-2 text-xs">
              <a 
                href={CONTACT_INFO.whatsapp1.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              >
                <span className="text-[11px]">{CONTACT_INFO.whatsapp1.label}:</span>
                <span dir="ltr" className="font-mono text-emerald-400 font-bold flex items-center gap-1">
                  <WhatsAppIcon className="w-3.5 h-3.5" />
                  <span>{CONTACT_INFO.whatsapp1.number}</span>
                </span>
              </a>

              <a 
                href={CONTACT_INFO.whatsapp2.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              >
                <span className="text-[11px]">{CONTACT_INFO.whatsapp2.label}:</span>
                <span dir="ltr" className="font-mono text-emerald-400 font-bold flex items-center gap-1">
                  <WhatsAppIcon className="w-3.5 h-3.5" />
                  <span>{CONTACT_INFO.whatsapp2.number}</span>
                </span>
              </a>

              <a 
                href={CONTACT_INFO.facebookUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              >
                <FacebookIcon className="w-3.5 h-3.5 text-[#1877F2]" />
                <span>صفحتنا الرسمية على فيسبوك</span>
              </a>
            </div>
          </div>

          {/* Col 4: Quick Links */}
          <div>
            <h4 className="font-bold text-white text-sm mb-3.5">روابط مهمة</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link 
                  to="/" 
                  className="text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <Home size={13} className="text-blue-400" />
                  <span>الرئيسية (أكاديمية أطلس)</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/register" 
                  className="text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <GraduationCap size={13} className="text-blue-400" />
                  <span>استمارة تسجيل الطلاب الجدد</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/#stages" 
                  className="text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  <BookOpen size={13} />
                  <span>المراحل والبرامج الدراسية</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/#location" 
                  className="text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  <MapPin size={13} />
                  <span>مواعيد العمل والمقر</span>
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Sub-footer copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            جميع الحقوق محفوظة © {new Date().getFullYear()} — <strong className="text-slate-300">أكاديمية أطلس التعليمية</strong>
          </div>
          <div className="text-[11px] font-mono">
            Atlas Educational Academy • All Rights Reserved
          </div>
        </div>

      </div>
    </footer>
  );
}
