import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import Login from './pages/Login';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import PatientsList from './pages/patients/PatientsList';
import PatientForm from './pages/patients/PatientForm';
import PatientDetails from './pages/patients/PatientDetails';
import OPDQueue from './pages/opd/OPDQueue';
import VisitForm from './pages/visits/VisitForm';
import PrescriptionForm from './pages/prescriptions/PrescriptionForm';
import Billing from './pages/billing/Billing';
import Settings from './pages/Settings';
import AdminDashboard from './pages/admin/AdminDashboard';
import ClinicManagement from './pages/admin/ClinicManagement';

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

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" /> : <Login />}
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />

        {/* Patients */}
        <Route path="patients" element={<PatientsList />} />
        <Route path="patients/new" element={<PatientForm />} />
        <Route path="patients/:id" element={<PatientDetails />} />
        <Route path="patients/:id/edit" element={<PatientForm />} />

        {/* OPD */}
        <Route path="opd" element={<OPDQueue />} />

        {/* Visits */}
        <Route path="visits/new" element={<VisitForm />} />

        {/* Prescriptions */}
        <Route path="prescriptions/new" element={<PrescriptionForm />} />

        {/* Billing */}
        <Route path="billing" element={<Billing />} />
        <Route path="billing/new" element={<Billing />} />
        
        {/* Settings */}
        <Route 
          path="settings" 
          element={
            user?.role === 'ADMIN' ? <Navigate to="/admin" /> : <Settings />
          } 
        />

        {/* Admin Routes */}
        <Route path="admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="admin/clinics/:clinicId" element={<AdminRoute><ClinicManagement /></AdminRoute>} />
      </Route>
    </Routes>
  );
}

export default App;
