export default function InvoicesLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-28 rounded-lg bg-gray-200" />
          <div className="h-4 w-44 rounded-lg bg-gray-100" />
        </div>
        <div className="h-10 w-36 rounded-xl bg-gray-200" />
      </div>

      {/* Filter tabs */}
      <div className="flex w-72 gap-1 rounded-xl bg-gray-100 p-1">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-8 flex-1 rounded-lg bg-gray-200" />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
        {/* Header row */}
        <div className="border-b border-gray-100 bg-gray-50/80 px-6 py-3.5">
          <div className="flex gap-8">
            {[80, 120, 80, 80, 100, 100].map((w, i) => (
              <div key={i} className="h-3 rounded bg-gray-200" style={{ width: w }} />
            ))}
          </div>
        </div>
        {/* Data rows */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-6 border-b border-gray-50 px-6 py-4 last:border-0">
            <div className="h-4 w-24 rounded bg-indigo-100" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-32 rounded bg-gray-200" />
              <div className="h-3 w-20 rounded bg-gray-100" />
            </div>
            <div className="h-4 w-20 rounded bg-gray-200" />
            <div className="h-5 w-16 rounded-full bg-gray-200" />
            <div className="h-3 w-24 rounded bg-gray-100" />
            <div className="h-3 w-24 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
