export default function ProfileCard({ user, isLoading }) {
  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-400 to-blue-600 animate-pulse" />
        <div className="relative px-6 pb-6 sm:px-8">
          <div className="flex items-end gap-4 -translate-y-16">
            <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white bg-slate-200 shadow-lg animate-pulse" />
            <div className="mb-2 flex-1">
              <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse mb-2" />
              <div className="h-6 w-32 bg-slate-200 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getRoleBadgeColor = (role) => {
    if (role === 'student') return 'bg-blue-100 text-blue-700 border border-blue-200';
    if (role === 'maintenance' || role === 'staff') return 'bg-amber-100 text-amber-700 border border-amber-200';
    if (role === 'admin') return 'bg-purple-100 text-purple-700 border border-purple-200';
    return 'bg-slate-100 text-slate-700';
  };

  const getRoleLabel = (role) => {
    if (role === 'maintenance') return 'Staff';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Gradient Background */}
      <div className="h-32 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700" />

      {/* Profile Content */}
      <div className="relative px-6 pb-6 sm:px-8">
        <div className="flex items-end gap-4 -translate-y-16">
          {/* Avatar */}
          <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg flex-shrink-0">
            <span className="text-4xl font-bold text-white">{getInitials(user.fullName)}</span>
          </div>

          {/* Name and Role */}
          <div className="mb-2 flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-slate-900 truncate">{user.fullName}</h1>
            <div className="mt-2 flex items-center gap-2">
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getRoleBadgeColor(user.role)}`}>
                {getRoleLabel(user.role)}
              </span>
              <span className={`text-xs font-medium rounded-full px-2.5 py-1 ${
                user.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                user.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {user.status?.charAt(0).toUpperCase() + user.status?.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
