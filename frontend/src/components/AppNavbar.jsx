import { useNavigate } from 'react-router-dom';
import { getAuthSession } from '../../utils/auth';
import UserAccountDropdown from '../dashboard/UserAccountDropdown';
import { Briefcase } from 'lucide-react';

export default function AppNavbar() {
  const navigate = useNavigate();
  const session = getAuthSession();

  if (!session) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <button
          onClick={() => {
            if (session.role === 'admin') {
              navigate('/dashboard/admin');
            } else if (session.role === 'student') {
              navigate('/dashboard/student');
            } else if (session.role === 'maintenance' || session.role === 'staff') {
              navigate('/dashboard/maintenance');
            } else {
              navigate('/');
            }
          }}
          className="flex items-center gap-2 transition hover:opacity-80"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 shadow-md">
            <Briefcase size={20} className="text-white" />
          </div>
          <span className="hidden text-lg font-bold text-slate-900 sm:block">
            Smart Campus
          </span>
        </button>

        {/* User Account Dropdown */}
        <div className="flex items-center gap-3">
          <UserAccountDropdown />
        </div>
      </div>
    </nav>
  );
}
