import type { LucideIcon } from "lucide-react";
import Link from "next/link";

type Props = {
  label: string;
  value: string;
  icon: LucideIcon;
  iconClass: string;
  trend?: { label: string; positive: boolean };
  href: string;
};

export function StatCard({ label, value, icon: Icon, iconClass, trend, href }: Props) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md hover:ring-indigo-200"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-2 truncate text-2xl font-bold tracking-tight text-gray-900">{value}</p>
          {trend && (
            <p
              className={`mt-1.5 text-xs font-medium ${
                trend.positive ? "text-emerald-600" : "text-gray-400"
              }`}
            >
              {trend.label}
            </p>
          )}
        </div>
        <div className={`flex-shrink-0 rounded-xl p-2.5 ${iconClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Link>
  );
}
