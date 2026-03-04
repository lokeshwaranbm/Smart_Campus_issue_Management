import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';

export default function AlertMessage({ type = 'info', message, duration = 6000, onDismiss }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!message) return;

    setVisible(true);

    // Auto-dismiss after duration
    const timer = setTimeout(() => {
      setVisible(false);
      if (onDismiss) onDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration, onDismiss]);

  if (!message || !visible) return null;

  const variants = {
    success: {
      className: 'mt-2 flex items-start justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 shadow-sm animate-fade-in',
      Icon: CheckCircle2,
    },
    error: {
      className: 'mt-2 flex items-start justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 shadow-sm animate-fade-in',
      Icon: AlertCircle,
    },
    warning: {
      className: 'mt-2 flex items-start justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 shadow-sm animate-fade-in',
      Icon: TriangleAlert,
    },
    info: {
      className: 'mt-2 flex items-start justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800 shadow-sm animate-fade-in',
      Icon: Info,
    },
  };

  const variant = variants[type] || variants.info;
  const IconComponent = variant.Icon;

  const handleDismiss = () => {
    setVisible(false);
    if (onDismiss) onDismiss();
  };

  return (
    <div className={variant.className} role="status" aria-live="polite">
      <div className="flex items-start gap-2 flex-1">
        <IconComponent size={16} className="mt-0.5 shrink-0" />
        <span>{message}</span>
      </div>
      <button
        onClick={handleDismiss}
        className="shrink-0 rounded p-0.5 transition hover:bg-black/5"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
