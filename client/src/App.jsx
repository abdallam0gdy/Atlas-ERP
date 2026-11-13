import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { MainLayout, ProtectedRoute } from './components/Layout';
import { Loader2 } from 'lucide-react';

// Lazy-loaded pages for fast initial page load and low memory usage
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ComingSoonPage = lazy(() => import('./pages/ComingSoonPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const StudentsPage = lazy(() => import('./pages/StudentsPage'));
const StudentDetailPage = lazy(() => import('./pages/StudentDetailPage'));
const TeachersPage = lazy(() => import('./pages/TeachersPage'));
const TeacherDetailPage = lazy(() => import('./pages/TeacherDetailPage'));
const GroupsPage = lazy(() => import('./pages/GroupsPage'));
const GroupDetailPage = lazy(() => import('./pages/GroupDetailPage'));
const GatePage = lazy(() => import('./pages/GatePage'));
const SubjectsPage = lazy(() => import('./pages/SubjectsPage'));
const QrCardsPage = lazy(() => import('./pages/QrCardsPage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const PosPage = lazy(() => import('./pages/PosPage'));
const FinancePage = lazy(() => import('./pages/FinancePage'));
const BookletsPage = lazy(() => import('./pages/BookletsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const StudentSubscriptionsPage = lazy(() => import('./pages/StudentSubscriptionsPage'));
const PackagesPage = lazy(() => import('./pages/PackagesPage'));
const UsersManagementPage = lazy(() => import('./pages/UsersManagementPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const OnlineRegistrationsPage = lazy(() => import('./pages/OnlineRegistrationsPage'));
const StudentPortalLayout = lazy(() => import('./components/portal/StudentPortalLayout'));
const TeacherPortalLayout = lazy(() => import('./components/portal/TeacherPortalLayout'));
const StudentRegistrationPage = lazy(() => import('./pages/portal/StudentRegistrationPage'));
const TeacherRegistrationPage = lazy(() => import('./pages/portal/TeacherRegistrationPage'));

const PageLoader = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-slate-500 animate-fade-in" dir="rtl">
    <Loader2 size={36} className="animate-spin text-[#0C3C82] mb-3" />
    <span className="text-xs font-bold text-slate-500">جاري تحميل الصفحة...</span>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
          {/* Public Root Landing / Coming Soon Page */}
          <Route path="/" element={<ComingSoonPage />} />

          {/* Dedicated Administration Login Portal */}
          <Route path="/atlas-admin" element={<LoginPage />} />

          {/* Legacy /login route redirects to root */}
          <Route path="/login" element={<Navigate to="/" replace />} />

          {/* Public Student Registration Portal */}
          <Route element={<StudentPortalLayout />}>
            <Route path="/register" element={<StudentRegistrationPage />} />
            <Route path="/register/student" element={<Navigate to="/register" replace />} />
            <Route path="/apply" element={<Navigate to="/register" replace />} />
          </Route>

          {/* Private & Obfuscated Teacher Onboarding Portal */}
          <Route element={<TeacherPortalLayout />}>
            <Route path="/faculty-onboarding-2026" element={<TeacherRegistrationPage />} />
            <Route path="/staff-apply" element={<Navigate to="/faculty-onboarding-2026" replace />} />
          </Route>

          {/* Gate Terminal — Full Screen (No Sidebar) */}
          <Route element={<ProtectedRoute allowedRoles={[]} />}>
            <Route path="/gate" element={<GatePage />} />
          </Route>

          {/* Protected Routes with Sidebar Layout */}
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* Students */}
            <Route element={<ProtectedRoute pageId="students" />}>
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/students/:id" element={<StudentDetailPage />} />
            </Route>

            {/* Teachers */}
            <Route element={<ProtectedRoute pageId="teachers" />}>
              <Route path="/teachers" element={<TeachersPage />} />
              <Route path="/teachers/:id" element={<TeacherDetailPage />} />
            </Route>

            {/* Groups */}
            <Route element={<ProtectedRoute pageId="groups" />}>
              <Route path="/groups" element={<GroupsPage />} />
              <Route path="/groups/:id" element={<GroupDetailPage />} />
            </Route>

            {/* Subjects */}
            <Route element={<ProtectedRoute pageId="subjects" />}>
              <Route path="/subjects" element={<SubjectsPage />} />
            </Route>

            {/* QR Codes */}
            <Route element={<ProtectedRoute pageId="qrcode" />}>
              <Route path="/qrcode" element={<QrCardsPage />} />
              <Route path="/barcodes" element={<Navigate to="/qrcode" replace />} />
            </Route>

            {/* Subscriptions */}
            <Route element={<ProtectedRoute pageId="subscriptions" />}>
              <Route path="/subscriptions" element={<StudentSubscriptionsPage />} />
            </Route>

            {/* Packages */}
            <Route element={<ProtectedRoute pageId="packages" />}>
              <Route path="/packages" element={<PackagesPage />} />
            </Route>

            {/* Finance */}
            <Route element={<ProtectedRoute pageId="finance" />}>
              <Route path="/finance" element={<FinancePage />} />
            </Route>

            {/* Booklets */}
            <Route element={<ProtectedRoute pageId="booklets" />}>
              <Route path="/booklets" element={<BookletsPage />} />
            </Route>

            {/* Inventory / POS */}
            <Route element={<ProtectedRoute pageId="pos" />}>
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/pos" element={<PosPage />} />
            </Route>

            {/* Users & Online Registrations - Strictly SUPER_ADMIN_OWNER */}
            <Route element={<ProtectedRoute adminOnly />}>
              <Route path="/online-registrations" element={<OnlineRegistrationsPage />} />
              <Route path="/users" element={<UsersManagementPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* Default catch-all redirect to public Coming Soon page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </BrowserRouter>

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            fontFamily: 'Plus Jakarta Sans, IBM Plex Sans Arabic, sans-serif',
            direction: 'rtl',
            borderRadius: '12px',
            padding: '12px 16px',
          },
          success: {
            style: { background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0' },
          },
          error: {
            style: { background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' },
          },
        }}
      />
    </QueryClientProvider>
  );
}

// Temporary placeholder for pages not yet built
function PlaceholderPage({ title, icon }) {
  return (
    <div className="p-8">
      <div className="atlas-card p-12 text-center">
        <span className="text-6xl mb-4 block">{icon}</span>
        <h2 className="text-xl font-bold mb-2" style={{ color: '#0C3C82' }}>{title}</h2>
        <p style={{ color: '#64748B' }}>هذه الصفحة قيد التطوير — ستكون جاهزة قريباً</p>
      </div>
    </div>
  );
}

export default App;
