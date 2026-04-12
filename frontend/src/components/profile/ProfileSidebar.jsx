import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, LayoutDashboard, FileText, Settings, LogOut, Menu, X } from 'lucide-react';
import { clearAuthSession } from '../../utils/auth';

export default function ProfileSidebar({ userRole = 'student' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    clearAuthSession();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (userRole === 'student') return '/dashboard/student';
    if (userRole === 'maintenance' || userRole === 'staff') return '/dashboard/maintenance';
    return '/dashboard/admin';
  };

  const navigationItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: getDashboardPath(),
    },
    {
      label: 'Issues',
      icon: FileText,
      path: userRole === 'student' ? '/report-issue' : '/dashboard/maintenance',
    },
    {
      label: 'Profile',
      icon: User,
      path: '/profile',
    },
    {
      label: 'Settings',
      icon: Settings,
      path: '/settings',
    },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-40 rounded-lg border border-slate-200 bg-white p-2 text-slate-700 lg:hidden shadow-sm hover:bg-slate-50"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar Backdrop (Mobile) */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="border-b border-slate-200 px-6 py-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 shadow-md">
              <LayoutDashboard size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">Campus</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 px-4 py-6">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                    : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-slate-200 px-4 py-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-200"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Spacer (Desktop) */}
      <div className="hidden lg:block w-72 flex-shrink-0" />
    </>
  );
}
