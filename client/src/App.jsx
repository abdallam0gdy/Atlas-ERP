import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { MainLayout, ProtectedRoute } from './components/Layout';
import LoginPage from './pages/LoginPage';
import ComingSoonPage from './pages/ComingSoonPage';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import StudentDetailPage from './pages/StudentDetailPage';
import TeachersPage from './pages/TeachersPage';
import TeacherDetailPage from './pages/TeacherDetailPage';
import GroupsPage from './pages/GroupsPage';
import GroupDetailPage from './pages/GroupDetailPage';
import GatePage from './pages/GatePage';
import SubjectsPage from './pages/SubjectsPage';
import QrCardsPage from './pages/QrCardsPage';
import InventoryPage from './pages/InventoryPage';
import PosPage from './pages/PosPage';
import FinancePage from './pages/FinancePage';
import BookletsPage from './pages/BookletsPage';
import ProfilePage from './pages/ProfilePage';
import StudentSubscriptionsPage from './pages/StudentSubscriptionsPage';
import PackagesPage from './pages/PackagesPage';
import UsersManagementPage from './pages/UsersManagementPage';
import SettingsPage from './pages/SettingsPage';
import OnlineRegistrationsPage from './pages/OnlineRegistrationsPage';
import StudentPortalLayout from './components/portal/StudentPortalLayout';
import TeacherPortalLayout from './components/portal/TeacherPortalLayout';
import StudentRegistrationPage from './pages/portal/StudentRegistrationPage';
import TeacherRegistrationPage from './pages/portal/TeacherRegistrationPage';

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
