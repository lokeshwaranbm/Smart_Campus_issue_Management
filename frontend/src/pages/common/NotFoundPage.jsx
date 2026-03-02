import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-card border border-slate-200 bg-white p-8 text-center shadow-card">
        <h1 className="text-xl font-semibold text-slate-900">Page not found</h1>
        <p className="mt-2 text-sm text-slate-600">The requested page is unavailable.</p>
        <Link to="/login" className="secondary-link mt-4 inline-block">
          Go to Login
        </Link>
      </div>
    </div>
  );
}
