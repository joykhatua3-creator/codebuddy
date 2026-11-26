export function RouteContentSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-6 w-48 rounded-lg bg-gray-200 dark:bg-slate-800" />
        <div className="h-4 w-72 rounded-md bg-gray-200 dark:bg-slate-800" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card p-5 space-y-3">
            <div className="h-4 w-24 rounded bg-gray-200 dark:bg-slate-800" />
            <div className="h-7 w-16 rounded bg-gray-200 dark:bg-slate-800" />
          </div>
        ))}
      </div>
      <div className="card p-6 space-y-4">
        <div className="h-5 w-40 rounded bg-gray-200 dark:bg-slate-800" />
        <div className="h-44 w-full rounded-lg bg-gray-100 dark:bg-slate-800/80" />
      </div>
    </div>
  );
}

export function DashboardSkeleton({ cards = 5 }) {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-6 w-36 rounded-lg bg-gray-200 dark:bg-slate-800" />
        <div className="h-4 w-64 rounded-md bg-gray-200 dark:bg-slate-800" />
      </div>
      <div className={`grid grid-cols-2 ${cards === 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4`}>
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="card p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-slate-800 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-20 rounded bg-gray-200 dark:bg-slate-800" />
              <div className="h-6 w-12 rounded bg-gray-200 dark:bg-slate-800" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2 space-y-4">
          <div className="h-5 w-32 rounded bg-gray-200 dark:bg-slate-800" />
          <div className="h-48 rounded-lg bg-gray-100 dark:bg-slate-800/80" />
        </div>
        <div className="card p-5 space-y-4">
          <div className="h-5 w-32 rounded bg-gray-200 dark:bg-slate-800" />
          <div className="h-48 rounded-lg bg-gray-100 dark:bg-slate-800/80" />
        </div>
      </div>
    </div>
  );
}

export function ReviewDetailSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
      <div className="h-7 w-28 rounded-md bg-gray-200 dark:bg-slate-800" />
      <div className="card p-6 flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex gap-2">
            <div className="h-5 w-24 rounded-full bg-gray-200 dark:bg-slate-800" />
            <div className="h-5 w-28 rounded bg-gray-200 dark:bg-slate-800" />
          </div>
          <div className="h-6 w-64 rounded bg-gray-200 dark:bg-slate-800" />
          <div className="h-4 w-full rounded bg-gray-200 dark:bg-slate-800" />
          <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-slate-800" />
        </div>
        <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-slate-800 shrink-0" />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card p-5 h-36 bg-gray-100/70 dark:bg-slate-900" />
        <div className="card p-5 h-36 bg-gray-100/70 dark:bg-slate-900" />
      </div>
      <div className="card h-56 bg-gray-100/70 dark:bg-slate-900" />
    </div>
  );
}

export function ListSkeleton({ count = 4 }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-4 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-800 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <div className="h-5 w-20 rounded-full bg-gray-200 dark:bg-slate-800" />
              <div className="h-5 w-16 rounded bg-gray-200 dark:bg-slate-800" />
            </div>
            <div className="h-4 w-5/6 rounded bg-gray-200 dark:bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  );
}
