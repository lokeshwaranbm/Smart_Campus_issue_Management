export default function AuthShell({ children }) {
  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="hidden rounded-card border border-slate-200 bg-white p-8 shadow-card lg:block">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Smart Campus</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">University Issue Operations</h2>
            <p className="mt-2 text-sm text-slate-600">
              Centralized portal for students, maintenance teams, and administrators.
            </p>
          </div>

          <div className="relative mt-10 h-64 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <div className="absolute inset-0 bg-blue-50/60" />
            <div className="relative flex h-full items-end justify-center">
              <div className="relative h-40 w-64">
                <div className="absolute bottom-0 left-0 h-20 w-full rounded-xl bg-blue-100 shadow-sm" />
                <div className="absolute bottom-8 left-10 h-24 w-20 rounded-lg bg-white shadow-md" />
                <div className="absolute bottom-8 left-36 h-28 w-24 rounded-lg bg-slate-100 shadow-md" />
                <div className="absolute bottom-28 left-14 h-2 w-12 rounded bg-primary/70" />
                <div className="absolute bottom-[7.75rem] left-40 h-2 w-14 rounded bg-primary/60" />
              </div>
            </div>
          </div>
        </section>

        <section>{children}</section>
      </div>
    </div>
  );
}
