import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { clinicAPI } from '../../services/api';

export default function DashboardLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    const checkOwnerStatus = async () => {
      if (user?.role === 'DOCTOR') {
        try {
          const response = await clinicAPI.getInfo();
          setIsOwner(response.data.is_owner);
        } catch (error) {
          console.error('Failed to check owner status:', error);
        }
      }
    };
    checkOwnerStatus();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'ADMIN';
  const isDoctor = user?.role === 'DOCTOR';
  
  const baseNavigation = [
    { name: 'Dashboard', path: '/', icon: '📊' },
    { name: 'Patients', path: '/patients', icon: '👥' },
    { name: 'OPD Queue', path: '/opd', icon: '🏥' },
    { name: 'Collections', path: '/reports/collections', icon: '💰' },
  ];

  const navigation = isAdmin ? [
    { name: 'Admin Dashboard', path: '/admin', icon: '🏢' },
    { name: 'Onboarding Requests', path: '/admin/onboarding', icon: '📋' },
  ] : [
    ...baseNavigation,
    { name: 'Settings', path: '/settings', icon: '⚙️' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex items-center ml-2 md:ml-0">
                <img src="/docease-icon.svg" alt="DocEase" className="h-8 w-8" />
                <h1 className="text-2xl font-bold text-primary-600 ml-2">
                  DocEase
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">{user?.full_name || user?.fullName}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role?.toLowerCase()}</p>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-secondary text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-16 flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex md:flex-col md:w-64 bg-white shadow-sm fixed h-full">
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="bg-white w-64 h-full" onClick={(e) => e.stopPropagation()}>
              <div className="p-4">
                <div className="mb-6">
                  <p className="text-lg font-medium text-gray-900">{user?.full_name || user?.fullName}</p>
                  <p className="text-sm text-gray-500 capitalize">{user?.role?.toLowerCase()}</p>
                </div>
                <nav className="space-y-2">
                  {navigation.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive(item.path)
                          ? 'bg-primary-50 text-primary-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {user?.is_guest && (
              <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <p className="text-sm text-amber-800">
                  You're using a demo account. Data will be reset on logout.
                </p>
                <Link
                  to="/onboard"
                  className="text-sm font-medium text-primary-600 hover:text-primary-700 whitespace-nowrap"
                >
                  Register your clinic &rarr;
                </Link>
              </div>
            )}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
