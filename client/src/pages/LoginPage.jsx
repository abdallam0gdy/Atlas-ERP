import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import { Eye, EyeOff, Loader2, User, Lock, QrCode, Printer, Users, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState(() => localStorage.getItem('atlas_remember_user') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('atlas_remember_user'));
  const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    clearError();
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    if (rememberMe) {
      localStorage.setItem('atlas_remember_user', username);
    } else {
      localStorage.removeItem('atlas_remember_user');
    }

    const success = await login(username, password);
    if (success) {
      navigate('/dashboard');
    }
  };


  return (
    <div
      className="min-h-screen flex items-center justify-center p-3 sm:p-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #071E40 0%, #0C3C82 45%, #05142B 100%)',
      }}
    >
      {/* Decorative Glow Spheres */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #0EA5E9 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, #D8232A 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #1E40AF 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative w-full max-w-lg z-10">
        {/* Brand Header */}
        <div className="text-center mb-6 sm:mb-8 animate-fade-in-up">
          <div
            className="inline-flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-3xl mb-3 sm:mb-4 p-3 shadow-2xl transition-transform hover:scale-105"
            style={{
              background: 'rgba(255, 255, 255, 0.96)',
              boxShadow: '0 12px 35px rgba(0,0,0,0.4), 0 0 30px rgba(14,165,233,0.3)',
              width: '6.5rem',
              height: '6.5rem',
              maxWidth: '100%',
              borderRadius: '1.5rem',
              display: 'inline-flex',
            }}
          >
            <img
              src="/atlas-logo.png"
              alt="أكاديمية أطلس التعليمية"
              className="w-full h-full object-contain"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide flex items-center justify-center gap-2">
            <span>أكاديمية أطلس التعليمية</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse inline-block" title="نظام متصل" />
          </h1>
          <p className="text-sky-200/70 text-xs sm:text-sm mt-1.5 font-medium tracking-wider">
            ATLAS EDUCATIONAL ACADEMY — ERP ENTERPRISE
          </p>
        </div>

        {/* Login Card */}
        <div
          className="p-6 sm:p-8 rounded-3xl"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 25px 65px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
          }}
        >
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">تسجيل الدخول للمنظومة</h2>
              <p className="text-white/50 text-xs mt-0.5">يرجى إدخال بيانات الاعتماد للمتابعة</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <ShieldCheck size={22} />
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-sm text-center flex items-center justify-center gap-2 animate-shake">
              <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white/80 text-xs sm:text-sm font-semibold mb-1.5">
                اسم المستخدم أو رقم الهاتف
              </label>
              <div className="relative">
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="مثال: admin أو 01012345678"
                  required
                  autoFocus
                  className="w-full pr-11 pl-4 py-3 sm:py-3.5 rounded-xl text-white placeholder-white/35 outline-none transition-all text-sm font-medium"
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1.5px solid rgba(255, 255, 255, 0.12)',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0EA5E9';
                    e.target.style.boxShadow = '0 0 0 3px rgba(14,165,233,0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
                  <User size={18} />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-white/80 text-xs sm:text-sm font-semibold">
                  كلمة المرور
                </label>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pr-11 pl-12 py-3 sm:py-3.5 rounded-xl text-white placeholder-white/35 outline-none transition-all text-sm font-medium"
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1.5px solid rgba(255, 255, 255, 0.12)',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0EA5E9';
                    e.target.style.boxShadow = '0 0 0 3px rgba(14,165,233,0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
                  <Lock size={18} />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-500 bg-white/10 border-white/20 focus:ring-0 cursor-pointer"
                />
                <span className="text-white/70 text-xs">تذكر اسم المستخدم</span>
              </label>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm sm:text-base transition-all disabled:opacity-50 mt-2 shadow-lg hover:shadow-rose-900/40 active:scale-[0.99] cursor-pointer"
              style={{
                background: isLoading
                  ? 'rgba(216,35,42,0.5)'
                  : 'linear-gradient(135deg, #D8232A 0%, #b01d22 100%)',
                boxShadow: isLoading ? 'none' : '0 8px 25px rgba(216,35,42,0.4)',
              }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={20} className="animate-spin" />
                  جاري تسجيل الدخول...
                </span>
              ) : (
                'تسجيل الدخول للمنظومة'
              )}
            </button>
          </form>

          {/* Quick Features Strip */}
          <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center gap-1">
              <QrCode size={16} className="text-sky-400" />
              <span className="text-[10px] text-white/70 font-medium">QR كود ذكي</span>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center gap-1">
              <Printer size={16} className="text-emerald-400" />
              <span className="text-[10px] text-white/70 font-medium">طباعة حرارية</span>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center gap-1">
              <Users size={16} className="text-amber-400" />
              <span className="text-[10px] text-white/70 font-medium">إدارة الطلاب</span>
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-white/40 text-[11px]">
              نظام إدارة أكاديمية أطلس التعليمية المتكامل © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
