import { Building2 } from 'lucide-react';

export default function AuthHeader({ title, subtitle }) {
  return (
    <div className="mb-6 text-center sm:mb-8">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-primary">
        <Building2 size={24} />
      </div>
      <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">{title}</h1>
      {subtitle ? <p className="mt-2 text-sm text-slate-600">{subtitle}</p> : null}
    </div>
  );
}
