export default function ClientsLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-24 rounded-lg bg-gray-200" />
          <div className="h-4 w-16 rounded-lg bg-gray-100" />
        </div>
        <div className="h-10 w-32 rounded-xl bg-gray-200" />
      </div>

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
        {/* Header row */}
        <div className="border-b border-gray-100 bg-gray-50/80 px-6 py-3.5">
          <div className="flex gap-8">
            {[120, 160, 100, 80].map((w) => (
              <div key={w} className="h-3 rounded bg-gray-200" style={{ width: w }} />
            ))}
          </div>
        </div>
        {/* Data rows */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-gray-50 px-6 py-4 last:border-0">
            <div className="h-9 w-9 flex-shrink-0 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-36 rounded bg-gray-200" />
              <div className="h-3 w-52 rounded bg-gray-100" />
            </div>
            <div className="h-3 w-20 rounded bg-gray-100" />
            <div className="h-3 w-24 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
