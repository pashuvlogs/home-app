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

  const roleColors = {
    assessor: 'neon-blue',
    manager: 'neon-green',
    senior_manager: 'neon-purple',
  };

  return (
    <div className="min-h-screen">
      <header className="no-print glass-strong sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="w-9 h-9 rounded-lg gradient-border flex items-center justify-center bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
                  <Home size={18} className="text-cyan-400" />
                </div>
                <span className="text-lg font-bold neon-blue">H.O.M.E.</span>
              </Link>

              <nav className="flex items-center gap-1">
                <Link
                  to="/"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    location.pathname === '/'
                      ? 'bg-cyan-500/15 text-cyan-400 glow-blue'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  Dashboard
                </Link>
                {hasRole('manager', 'senior_manager') && (
                  <Link
                    to="/reports"
                    className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all duration-300 ${
                      location.pathname === '/reports'
                        ? 'bg-purple-500/15 text-purple-400 glow-purple'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
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
              <div className="text-sm">
                <span className="text-slate-300 font-medium">{user?.fullName}</span>
                <span className={`ml-2 text-xs px-2.5 py-0.5 rounded-full glass ${roleColors[user?.role]}`}>
                  {roleLabels[user?.role]}
                </span>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm btn-ghost rounded-lg"
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
