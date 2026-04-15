import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { clearAuthSession, getAuthSession, logoutUser } from '../../utils/auth';
import UserAccountDropdown from './UserAccountDropdown';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  ChevronDown,
  LogOut,
  UserCog,
  Menu,
  X,
  Clock3,
  BarChart3,
  Briefcase
} from 'lucide-react';

export default function DashboardShell({ title, subtitle, roleLabel, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getAuthSession();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const expectedRole =
      roleLabel === 'Admin'
        ? 'admin'
        : roleLabel === 'Maintenance'
          ? 'maintenance'
          : roleLabel === 'Student'
            ? 'student'
            : null;

    if (expectedRole && session?.role && session.role !== expectedRole) {
      clearAuthSession();
      navigate('/login', { replace: true });
    }
  }, [roleLabel, session?.role, navigate]);

  const getDashboardHomePath = () => {
    if (session?.role === 'admin') return '/dashboard/admin';
    if (session?.role === 'maintenance') return '/dashboard/maintenance';
    if (session?.role === 'student') return '/dashboard/student';
    return '/login';
  };

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

  // Define navigation items based on role
  const getNavigationItems = () => {
    if (roleLabel === 'Admin') {
      return [
        {
          label: 'Staff Management',
          icon: Users,
          path: '/admin/staff',
        },
        {
          label: 'Staff Workload',
          icon: BarChart3,
          path: '/admin/staff-workload',
        },
        {
          label: 'Reporter Management',
          icon: Users,
          path: '/admin/reporters',
        },
        {
          label: 'SLA Monitor',
          icon: Clock3,
          path: '/admin/sla-monitoring',
        },
        {
          label: 'Settings',
          icon: Settings,
          path: '/admin/settings',
        },
      ];
    }
    return [];
  };

  const navigationItems = getNavigationItems();

  const isActivePath = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const toggleDropdown = (label) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
    setOpenDropdown(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Modern Navigation Bar */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Logo Section */}
          <button
            onClick={() => handleNavigation(getDashboardHomePath())}
            className="flex items-center gap-2 transition hover:opacity-80"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 shadow-md">
              <Briefcase size={20} className="text-white" />
            </div>
            <span className="hidden text-lg font-bold text-slate-900 sm:block">
              Smart Campus
            </span>
          </button>

          {/* Navigation Items - Desktop */}
          <div className="hidden items-center gap-1 lg:flex">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const hasDropdown = item.dropdown && item.dropdown.length > 0;
              const isActive = item.path ? isActivePath(item.path) : false;

              if (hasDropdown) {
                return (
                  <div key={item.label} className="relative">
                    <button
                      onClick={() => toggleDropdown(item.label)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                        isActive
                          ? 'text-primary'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                      <ChevronDown
                        size={14}
                        className={`transition-transform ${
                          openDropdown === item.label ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {/* Dropdown Menu */}
                    {openDropdown === item.label && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setOpenDropdown(null)}
                        />
                        <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-lg border border-slate-200 bg-white py-2 shadow-lg">
                          {item.dropdown.map((dropdownItem) => (
                            <button
                              key={dropdownItem.path}
                              onClick={() => handleNavigation(dropdownItem.path)}
                              className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition ${
                                isActivePath(dropdownItem.path)
                                  ? 'bg-blue-50 text-primary font-medium'
                                  : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {dropdownItem.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              }

              return (
                <button
                  key={item.label}
                  onClick={() => handleNavigation(item.path)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'text-primary'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* User Account Dropdown - Desktop */}
            <div className="hidden sm:block">
              <UserAccountDropdown />
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-slate-700 transition hover:bg-slate-100 lg:hidden"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Side Drawer */}
        <div
          className={`fixed inset-0 z-40 bg-slate-900/40 transition-opacity duration-200 lg:hidden ${
            mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setMobileMenuOpen(false)}
        />

        <aside
          className={`fixed right-0 top-0 z-50 h-full w-80 max-w-[85vw] border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 lg:hidden ${
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 shadow-md">
                <Briefcase size={16} className="text-white" />
              </div>
              <span className="text-sm font-bold text-slate-900">Smart Campus</span>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
            >
              <X size={18} />
            </button>
          </div>

          <div className="h-[calc(100%-73px)] overflow-y-auto p-4">
            <div className="space-y-1">
              {/* Navigation items */}
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const hasDropdown = item.dropdown && item.dropdown.length > 0;
                const isActive = item.path ? isActivePath(item.path) : false;

                if (hasDropdown) {
                  return (
                    <div key={item.label}>
                      <button
                        onClick={() => toggleDropdown(item.label)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
                          isActive
                            ? 'text-primary'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon size={16} />
                          <span>{item.label}</span>
                        </div>
                        <ChevronDown
                          size={14}
                          className={`transition-transform ${
                            openDropdown === item.label ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {openDropdown === item.label && (
                        <div className="space-y-1 bg-slate-50 py-1">
                          {item.dropdown.map((dropdownItem) => (
                            <button
                              key={dropdownItem.path}
                              onClick={() => handleNavigation(dropdownItem.path)}
                              className={`flex w-full items-center gap-2 rounded-lg px-6 py-2 text-left text-xs font-medium transition ${
                                isActivePath(dropdownItem.path)
                                  ? 'bg-blue-100 text-primary'
                                  : 'text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {dropdownItem.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <button
                    key={item.label}
                    onClick={() => handleNavigation(item.path)}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                      isActive
                        ? 'text-primary'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Mobile Account Section */}
            <div className="mt-4 border-t border-slate-200 pt-4">
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2">
                <UserCog size={14} className="text-primary" />
                <span className="text-xs font-semibold text-primary">{roleLabel}</span>
              </div>
              <UserAccountDropdown />
            </div>
          </div>
        </aside>
      </nav>

      {/* Page Header */}
      <div className="border-b border-slate-100 bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
