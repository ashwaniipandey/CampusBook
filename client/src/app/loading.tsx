export default function Loading() {
  return (
    <div role="status" aria-label="Loading page" className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
      <span className="sr-only">Loading page content</span>
      <div className="h-9 w-2/5 animate-pulse rounded-lg bg-slate-200" />
      <div className="mt-4 h-5 w-3/5 animate-pulse rounded bg-slate-100" />
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="aspect-[4/3] animate-pulse bg-slate-200" />
            <div className="space-y-2 p-4">
              <div className="h-4 w-4/5 animate-pulse rounded bg-slate-200" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
