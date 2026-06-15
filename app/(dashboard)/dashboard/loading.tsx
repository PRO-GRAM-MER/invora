export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Greeting */}
      <div className="space-y-2">
        <div className="h-8 w-56 rounded-lg bg-gray-200" />
        <div className="h-4 w-72 rounded-lg bg-gray-100" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-gray-100" />
        ))}
      </div>

      {/* Chart + recent invoices */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2 h-80 rounded-2xl bg-gray-100" />
        <div className="h-80 rounded-2xl bg-gray-100" />
      </div>
    </div>
  );
}
