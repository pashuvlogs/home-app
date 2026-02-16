import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationPanel from './NotificationPanel';
import { Home, BarChart3, LogOut } from 'lucide-react';

export default function Layout() {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();

  const roleLabels = {
    assessor: 'Assessor',
    manager: 'Manager',
    senior_manager: 'Senior Manager',
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="no-print bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Home size={18} className="text-white" />
                </div>
                <span className="text-lg font-bold text-gray-900">H.O.M.E.</span>
              </Link>

              <nav className="flex items-center gap-1">
                <Link
                  to="/"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Dashboard
                </Link>
                {hasRole('manager', 'senior_manager') && (
                  <Link
                    to="/reports"
                    className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1 ${
                      location.pathname === '/reports'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <BarChart3 size={16} />
                    Reports
                  </Link>
                )}
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <NotificationPanel />
              <div className="text-sm text-gray-600">
                <span className="font-medium">{user?.fullName}</span>
                <span className="ml-1 text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                  {roleLabels[user?.role]}
                </span>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 border border-gray-300 rounded-md hover:border-red-300"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}
