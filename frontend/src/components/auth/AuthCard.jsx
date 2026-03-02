export default function AuthCard({ children, className = '' }) {
  return (
    <div className={`w-full rounded-card border border-slate-200 bg-white p-6 shadow-card sm:p-8 ${className}`}>
      {children}
    </div>
  );
}
