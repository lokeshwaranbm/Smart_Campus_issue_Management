import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';

export default function AlertMessage({ type = 'info', message }) {
  if (!message) return null;

  const variants = {
    success: {
      className: 'mt-2 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800',
      Icon: CheckCircle2,
    },
    error: {
      className: 'mt-2 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800',
      Icon: AlertCircle,
    },
    warning: {
      className: 'mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900',
      Icon: TriangleAlert,
    },
    info: {
      className: 'mt-2 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800',
      Icon: Info,
    },
  };

  const variant = variants[type] || variants.info;
  const IconComponent = variant.Icon;

  return (
    <div className={variant.className} role="status" aria-live="polite">
      <IconComponent size={16} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
