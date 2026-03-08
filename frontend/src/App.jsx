import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import PatientsList from './pages/patients/PatientsList';
import PatientForm from './pages/patients/PatientForm';
import PatientDetails from './pages/patients/PatientDetails';
import OPDQueue from './pages/opd/OPDQueue';
import VisitForm from './pages/visits/VisitForm';
import VisitDetails from './pages/visits/VisitDetails';
import DoctorVisitsList from './pages/visits/DoctorVisitsList';
import Settings from './pages/Settings';
import AdminDashboard from './pages/admin/AdminDashboard';
import ClinicManagement from './pages/admin/ClinicManagement';
import DoctorList from './pages/admin/DoctorList';
import OnboardingRequests from './pages/admin/OnboardingRequests';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import ClinicAnalytics from './pages/admin/ClinicAnalytics';
import OnboardingRequest from './pages/OnboardingRequest';
import CollectionReport from './pages/reports/CollectionReport';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import TermsOfService from './pages/legal/TermsOfService';
import Subprocessors from './pages/legal/Subprocessors';

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (user?.role !== 'ADMIN') return <Navigate to="/" />;
  return children;
}

function PluginRoute({ plugin, children }) {
  const user = useAuthStore((state) => state.user);
  if (user?.enabled_plugins?.[plugin] === false) return <Navigate to="/" />;
  return children;
}

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
      <Route
        path="/landing"
        element={isAuthenticated ? <Navigate to="/" /> : <LandingPage />}
      />
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" /> : <Login />}
      />
      <Route
        path="/onboard"
        element={isAuthenticated ? <Navigate to="/" /> : <OnboardingRequest />}
      />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/subprocessors" element={<Subprocessors />} />

      <Route
        path="/"
        element={
          isAuthenticated ? (
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          ) : (
            <Navigate to="/landing" />
          )
        }
      >
        <Route index element={<Dashboard />} />

        {/* Patients */}
        <Route path="patients" element={<PatientsList />} />
        <Route path="patients/new" element={<PatientForm />} />
        <Route path="patients/:id" element={<PatientDetails />} />
        <Route path="patients/:id/edit" element={<PatientForm />} />

        {/* OPD */}
        <Route path="opd" element={<PluginRoute plugin="opd_queue"><OPDQueue /></PluginRoute>} />

        {/* Visits */}
        <Route path="visits" element={<DoctorVisitsList />} />
        <Route path="visits/new" element={<VisitForm />} />
        <Route path="visits/:id" element={<VisitDetails />} />
        <Route path="visits/:id/edit" element={<VisitForm />} />

        {/* Reports */}
        <Route path="reports/collections" element={<PluginRoute plugin="collections"><CollectionReport /></PluginRoute>} />
        
        {/* Settings */}
        <Route 
          path="settings" 
          element={
            user?.role === 'ADMIN' ? <Navigate to="/admin" /> : <Settings />
          } 
        />

        {/* Admin Routes */}
        <Route path="admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="admin/doctors" element={<AdminRoute><DoctorList /></AdminRoute>} />
        <Route path="admin/onboarding" element={<AdminRoute><OnboardingRequests /></AdminRoute>} />
        <Route path="admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
        <Route path="admin/clinics/:clinicId/analytics" element={<AdminRoute><ClinicAnalytics /></AdminRoute>} />
        <Route path="admin/clinics/:clinicId" element={<AdminRoute><ClinicManagement /></AdminRoute>} />
      </Route>
    </Routes>
    </>
  );
}

export default App;
