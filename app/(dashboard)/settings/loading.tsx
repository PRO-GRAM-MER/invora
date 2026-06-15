export default function SettingsLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 w-28 rounded-lg bg-gray-200" />
        <div className="h-4 w-64 rounded-lg bg-gray-100" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Form skeleton */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
            <div className="border-b border-gray-100 px-6 py-4">
              <div className="h-5 w-16 rounded bg-gray-200" />
            </div>
            <div className="space-y-5 px-6 py-5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-4 w-28 rounded bg-gray-200" />
                  <div className="h-10 rounded-xl bg-gray-100" />
                </div>
              ))}
              <div className="flex justify-end pt-2">
                <div className="h-10 w-32 rounded-xl bg-gray-200" />
              </div>
            </div>
          </div>
        </div>

        {/* Account card skeleton */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 h-fit">
          <div className="border-b border-gray-100 px-6 py-4">
            <div className="h-5 w-20 rounded bg-gray-200" />
          </div>
          <div className="space-y-4 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 flex-shrink-0 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-32 rounded bg-gray-200" />
                <div className="h-3 w-40 rounded bg-gray-100" />
              </div>
            </div>
            <div className="space-y-3 border-t border-gray-50 pt-4">
              <div className="h-3 w-full rounded bg-gray-100" />
              <div className="h-3 w-3/4 rounded bg-gray-100" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
