import { Plus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function FloatingActionButton() {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show FAB on report-issue page
  if (location.pathname === '/report-issue') {
    return null;
  }

  return (
    <button
      onClick={() => navigate('/report-issue')}
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition hover:shadow-xl hover:scale-110 sm:bottom-8 sm:right-8 sm:h-16 sm:w-16"
      aria-label="Report Issue"
      title="Report Issue"
    >
      <Plus size={28} strokeWidth={2.5} />
    </button>
  );
}
