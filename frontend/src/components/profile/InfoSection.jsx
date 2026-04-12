export default function InfoSection({ title, fields, isLoading, colorScheme = 'blue' }) {
  const getColorClasses = () => {
    const schemes = {
      blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'bg-blue-100 text-blue-600' },
      amber: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'bg-amber-100 text-amber-600' },
      purple: { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'bg-purple-100 text-purple-600' },
      slate: { bg: 'bg-slate-50', border: 'border-slate-200', icon: 'bg-slate-100 text-slate-600' },
    };
    return schemes[colorScheme] || schemes.blue;
  };

  const colors = getColorClasses();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="h-6 w-48 bg-slate-200 rounded-lg animate-pulse mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`flex items-start gap-4 rounded-xl ${colors.bg} p-4`}>
              <div className={`mt-1 flex h-10 w-10 rounded-lg ${colors.icon} animate-pulse`} />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 bg-slate-200 rounded animate-pulse" />
                <div className="h-4 w-40 bg-slate-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Filter out fields with no value
  const visibleFields = fields.filter((field) => field.value != null && field.value !== '');

  if (visibleFields.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="mb-6 text-lg font-semibold text-slate-900">{title}</h2>

      <div className="space-y-4">
        {visibleFields.map((field, idx) => (
          <div key={idx} className={`flex items-start gap-4 rounded-xl ${colors.bg} border ${colors.border} p-4 transition-colors hover:shadow-sm`}>
            <div className={`mt-1 flex h-10 w-10 items-center justify-center rounded-lg ${colors.icon} flex-shrink-0`}>
              {field.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{field.label}</p>
              <p className="mt-1 text-sm font-medium text-slate-900 break-words">{field.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
