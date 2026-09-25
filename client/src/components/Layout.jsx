import { Navigate, Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import useAuthStore from '../stores/authStore';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, QrCode,
  DoorOpen, LogOut, Menu, X, ChevronLeft, Settings,
  Wallet, Package, ShoppingCart, BookMarked, Library,
  User, ShieldCheck, Clock, Calendar, CheckCircle2, CreditCard
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

// Protected route wrapper
export function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasAccess = user?.role?.name === 'SUPER_ADMIN_OWNER' ||
      allowedRoles.includes(user?.role?.name);
    if (!hasAccess) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
}

// Route titles map for Header breadcrumb
const PAGE_TITLES = {
  '/dashboard': 'لوحة التحكم والمؤشرات',
  '/students': 'إدارة شؤون الطلاب',
  '/teachers': 'هيئة التدريس والمدرسين',
  '/groups': 'المجموعات الدراسية والقاعات',
  '/subjects': 'المواد الدراسية والتخصصات',
  '/subscriptions': 'اشتراكات وحسابات الطلاب والحصص',
  '/packages': 'منظومة باكدجات المراحل الدراسية',
  '/finance': 'الخزينة والمالية العامة',
  '/booklets': 'مكتب الملازم والكتب المدرسية',
  '/pos': 'كاشير نقاط البيع السريعة',
  '/qrcode': 'إصدار وطباعة كروت الـ QR',
  '/barcodes': 'إصدار وطباعة كروت الـ QR',
  '/profile': 'الملف الشخصي والحساب',
};

// Main layout with sidebar, header, and footer
export function MainLayout() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم', roles: [] },
    { path: '/students', icon: Users, label: 'الطلاب', roles: [] },
    { path: '/teachers', icon: GraduationCap, label: 'المدرسين', roles: ['SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER', 'RECEPTION_ASSISTANT', 'CASHIER'] },
    { path: '/groups', icon: BookOpen, label: 'المجموعات', roles: ['SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER', 'RECEPTION_ASSISTANT', 'CASHIER'] },
    { path: '/subjects', icon: BookMarked, label: 'المواد الدراسية', roles: ['SUPER_ADMIN_OWNER', 'CENTER_MANAGER'] },
    { path: '/subscriptions', icon: CreditCard, label: 'اشتراكات الطلاب والحصص', roles: ['SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER', 'RECEPTION_ASSISTANT', 'CASHIER', 'RECEPTIONIST'] },
    { path: '/packages', icon: Package, label: 'نظام الباكدجات', roles: ['SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER'] },
    { path: '/finance', icon: Wallet, label: 'الخزينة والمالية العامة', roles: ['SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER', 'RECEPTION_ASSISTANT', 'CASHIER', 'RECEPTIONIST'] },
    { path: '/booklets', icon: Library, label: 'مكتب الملازم والكتب', roles: ['SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER', 'RECEPTION_ASSISTANT', 'CASHIER', 'BOOKLET_MANAGER'] },
    // { path: '/inventory', icon: Package, label: 'المخزن العام', roles: ['SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER'] }, // مخفية مؤقتاً
    // { path: '/pos', icon: ShoppingCart, label: 'كاشير المبيعات', roles: ['SUPER_ADMIN_OWNER', 'CENTER_MANAGER', 'FINANCE_MANAGER', 'RECEPTIONIST'] }, // مخفية مؤقتاً
    { path: '/qrcode', icon: QrCode, label: 'كروت الـ QR', roles: ['SUPER_ADMIN_OWNER', 'CENTER_MANAGER'] },
    { path: '/profile', icon: User, label: 'الملف الشخصي', roles: [] },
    { path: '/gate', icon: DoorOpen, label: 'بوابة الحضور', roles: [] },
  ];

  const filteredNav = navItems.filter(item => {
    if (item.roles.length === 0) return true;
    return user?.role?.name === 'SUPER_ADMIN_OWNER' || item.roles.includes(user?.role?.name);
  });

  const isActive = (path) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path + '/'));

  // Determine current page title
  const currentTitle = PAGE_TITLES[location.pathname] || 
    Object.entries(PAGE_TITLES).find(([key]) => location.pathname.startsWith(key))?.[1] || 
    'الرئيسية';

  const todayDateStr = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-atlas-bg)' }}>
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Desktop Collapsible & Mobile Slide-over Drawer) */}
      <aside
        className={`fixed top-0 right-0 h-full z-50 lg:z-40 transition-all duration-300 flex flex-col print:hidden
          ${mobileMenuOpen ? 'translate-x-0 w-72 shadow-2xl' : 'translate-x-full lg:translate-x-0'}
          ${sidebarOpen ? 'lg:w-64' : 'lg:w-20'}
        `}
        style={{
          background: 'linear-gradient(180deg, #0C3C82 0%, #082a5c 100%)',
          boxShadow: '-4px 0 20px rgba(12, 60, 130, 0.2)',
        }}
      >
        {/* Sidebar Header with Official Logo */}
        <div className="flex items-center justify-between p-3.5 border-b border-white/10">
          <Link to="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
            <img
              src="/atlas-logo.png"
              alt="شعار سنتر أطلس"
              className="w-10 h-10 object-contain rounded-xl bg-white p-1 shadow-md flex-shrink-0"
            />
            {(sidebarOpen || mobileMenuOpen) && (
              <div className="animate-fade-in leading-tight">
                <h1 className="text-white font-black text-base tracking-tight">سنتر أطلس</h1>
                <p className="text-white/60 text-[10px] font-medium tracking-wide">Atlas Educational ERP</p>
              </div>
            )}
          </Link>
          
          <div className="flex items-center gap-1">
            {/* Desktop collapse toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
              title={sidebarOpen ? 'تصغير القائمة' : 'توسيع القائمة'}
            >
              {sidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
            </button>

            {/* Mobile close drawer button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
              title="إغلاق القائمة"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2.5 space-y-1 overflow-y-auto">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const showLabel = sidebarOpen || mobileMenuOpen;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  active
                    ? 'bg-white/15 text-white shadow-md font-bold'
                    : 'text-white/70 hover:text-white hover:bg-white/10 font-medium'
                }`}
              >
                <Icon size={19} className={active ? 'text-cyan-300' : 'group-hover:text-white/90'} />
                {showLabel && (
                  <span className="text-xs">{item.label}</span>
                )}
                {active && showLabel && (
                  <div className="mr-auto w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#67e8f9]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="p-3 border-t border-white/10">
          <Link
            to="/profile"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-white/10 transition-colors group ${
              (sidebarOpen || mobileMenuOpen) ? '' : 'justify-center'
            }`}
            title="انقر لفتح الملف الشخصي"
          >
            <div className="w-9 h-9 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 group-hover:scale-105 transition-transform">
              {user?.fullNameAr?.[0] || user?.fullName?.[0] || 'A'}
            </div>
            {(sidebarOpen || mobileMenuOpen) && (
              <div className="flex-1 min-w-0 animate-fade-in">
                <p className="text-white text-xs font-bold truncate group-hover:text-cyan-200 transition-colors">
                  {user?.fullNameAr || user?.fullName || 'مستخدم النظام'}
                </p>
                <p className="text-white/50 text-[10px] truncate">{user?.role?.label || 'مدير'}</p>
              </div>
            )}
            {(sidebarOpen || mobileMenuOpen) && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  logout();
                }}
                className="text-white/50 hover:text-rose-300 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                title="تسجيل الخروج"
              >
                <LogOut size={16} />
              </button>
            )}
          </Link>
        </div>
      </aside>

      {/* Main Container */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 mr-0 ${
          sidebarOpen ? 'lg:mr-64' : 'lg:mr-20'
        } print:mr-0 print:m-0 print:p-0 print:w-full`}
      >
        {/* Sticky Header */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between transition-shadow shadow-xs print:hidden">
          {/* Breadcrumb / Mobile Hamburger / Page Title */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-700 hover:text-[#0C3C82] hover:bg-blue-50 rounded-xl transition-colors"
              title="فتح القائمة الرئيسية"
            >
              <Menu size={22} />
            </button>

            {/* Mobile Logo Icon */}
            <Link to="/dashboard" className="lg:hidden flex items-center flex-shrink-0">
              <img src="/atlas-logo.png" alt="Atlas" className="w-8 h-8 object-contain" />
            </Link>

            <h2 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight flex items-center gap-2 truncate">
              <span>{currentTitle}</span>
            </h2>
          </div>

          {/* Header Actions & Profile Quick Access */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Live Date Badge */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200/80">
              <Calendar size={13} className="text-[#0C3C82]" />
              <span>{todayDateStr}</span>
            </div>

            {/* User Profile Button */}
            <Link
              to="/profile"
              className="flex items-center gap-2 sm:gap-2.5 pl-2 pr-2.5 sm:pr-3 py-1 sm:py-1.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all shadow-2xs"
            >
              <div 
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                style={{ background: '#0C3C82' }}
              >
                {user?.fullNameAr?.[0] || user?.fullName?.[0] || 'A'}
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold text-slate-800 leading-tight">
                  {user?.fullNameAr || user?.fullName || 'الحساب'}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">@{user?.username}</p>
              </div>
            </Link>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              title="تسجيل الخروج"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white/60 py-3.5 px-6 lg:px-8 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <img src="/atlas-logo.png" alt="Atlas" className="w-5 h-5 object-contain" />
            <span className="font-bold text-slate-700">سنتر أطلس التعليمي</span>
            <span>—</span>
            <span>جميع الحقوق محفوظة © 2026 Atlas Educational ERP</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>النظام متصل ومستقر</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">v2.5.0</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

