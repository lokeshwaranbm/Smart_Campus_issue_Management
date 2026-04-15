import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthSession, logoutUser } from '../../utils/auth';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';

export default function UserAccountDropdown() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const session = getAuthSession();

  const handleLogout = async () => {
    await logoutUser();
    setIsOpen(false);
    navigate('/login');
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  if (!session) {
    return null;
  }

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        {/* Avatar */}
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-xs font-semibold text-white">
          {getInitials(session.fullName)}
        </div>
        {/* Name - Hidden on mobile */}
        <span className="hidden sm:inline truncate max-w-[120px]">{session.fullName}</span>
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          {/* Menu */}
          <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            {/* User Info Section */}
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account</p>
              <p className="mt-1 truncate text-sm font-medium text-slate-900">{session.fullName}</p>
              <p className="truncate text-xs text-slate-600">{session.email}</p>
            </div>

            {/* Menu Items */}
            <button
              onClick={() => handleNavigation('/profile')}
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
            >
              <User size={16} className="text-slate-600" />
              <span>View Profile</span>
            </button>

            <button
              onClick={() => handleNavigation('/settings')}
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
            >
              <Settings size={16} className="text-slate-600" />
              <span>Settings</span>
            </button>

            {/* Divider */}
            <div className="my-1 border-t border-slate-100" />

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-red-700 transition hover:bg-red-50"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
