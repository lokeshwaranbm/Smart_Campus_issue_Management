import { useState, useEffect } from 'react';
import { Mail, Building2, User, Badge, Key, LogsIcon, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAuthSession } from '../../utils/auth';
import ProfileSidebar from '../../components/profile/ProfileSidebar';
import ProfileCard from '../../components/profile/ProfileCard';
import InfoSection from '../../components/profile/InfoSection';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const session = getAuthSession();
      if (!session) {
        setError('No session found. Please login first.');
        setUser(null);
      } else {
        setUser(session);
        setError(null);
      }
    } catch (err) {
      setError('Failed to load profile.');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-50">
        <ProfileSidebar userRole="student" />
        <div className="flex-1 overflow-auto lg:ml-0">
          <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="space-y-6 animate-pulse">
              <div className="h-40 bg-slate-200 rounded-3xl" />
              <div className="h-40 bg-slate-200 rounded-2xl" />
              <div className="h-40 bg-slate-200 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex h-screen bg-slate-50">
        <ProfileSidebar userRole="student" />
        <div className="flex-1 overflow-auto lg:ml-0 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 mx-auto mb-4">
              <AlertCircle size={28} />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Unable to load profile</h2>
            <p className="text-slate-600 mb-6">{error || 'No user session found.'}</p>
            <button
              onClick={() => navigate('/login')}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getRoleLabel = (role) => {
    if (role === 'maintenance') return 'Staff';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  // Personal Information Fields
  const personalFields = [
    {
      label: 'Email',
      value: user.email,
      icon: <Mail size={18} />,
    },
    {
      label: 'Full Name',
      value: user.fullName,
      icon: <User size={18} />,
    },
    {
      label: 'Role',
      value: getRoleLabel(user.role),
      icon: <Badge size={18} />,
    },
  ];

  // Role-Specific Fields
  let roleFields = [];

  if (user.role === 'student') {
    roleFields = [
      {
        label: 'Student ID',
        value: user.studentId,
        icon: <Key size={18} />,
      },
      {
        label: 'Department',
        value: user.department,
        icon: <Building2 size={18} />,
      },
      {
        label: 'Year of Study',
        value: user.year,
        icon: <Badge size={18} />,
      },
    ];
  } else if (user.role === 'maintenance' || user.role === 'staff') {
    roleFields = [
      {
        label: 'Staff ID',
        value: user.staffId,
        icon: <Key size={18} />,
      },
      {
        label: 'Department',
        value: user.department,
        icon: <Building2 size={18} />,
      },
      {
        label: 'Designation',
        value: user.designation,
        icon: <Badge size={18} />,
      },
    ];
  } else if (user.role === 'admin') {
    roleFields = [
      {
        label: 'Admin ID',
        value: user.adminId,
        icon: <Key size={18} />,
      },
      {
        label: 'Access Level',
        value: 'Full Administrator',
        icon: <Badge size={18} />,
      },
      {
        label: 'Permissions',
        value: 'All systems',
        icon: <LogsIcon size={18} />,
      },
    ];
  }

  const getSectionTitle = () => {
    if (user.role === 'student') return 'Academic Information';
    if (user.role === 'maintenance' || user.role === 'staff') return 'Staff Information';
    return 'Admin Information';
  };

  const getColorScheme = () => {
    if (user.role === 'student') return 'blue';
    if (user.role === 'maintenance' || user.role === 'staff') return 'amber';
    return 'purple';
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <ProfileSidebar userRole={user.role} />

      {/* Main Content */}
      <div className="flex-1 overflow-auto lg:ml-0">
        {/* Page Header */}
        <div className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-20">
          <div className="mx-auto w-full max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
            <p className="mt-1 text-sm text-slate-600">View and manage your account information</p>
          </div>
        </div>

        {/* Page Content */}
        <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {/* Profile Card */}
            <ProfileCard user={user} isLoading={false} />

            {/* Personal Information */}
            <InfoSection
              title="Personal Information"
              fields={personalFields}
              isLoading={false}
              colorScheme="blue"
            />

            {/* Role-Specific Information */}
            {roleFields.length > 0 && (
              <InfoSection
                title={getSectionTitle()}
                fields={roleFields}
                isLoading={false}
                colorScheme={getColorScheme()}
              />
            )}

            {/* Footer Info */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
              <p className="text-xs uppercase tracking-wide font-medium text-slate-600">
                Account Information
              </p>
              <p className="mt-2 text-sm text-slate-600">
                For profile updates or assistance, contact system support
              </p>
            </div>
          </div>

          {/* Bottom Spacer */}
          <div className="h-8" />
        </div>
      </div>
    </div>
  );
}
