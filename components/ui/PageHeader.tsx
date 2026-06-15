"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

type Props = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export function PageHeader({ title, subtitle, action }: Props) {
  const router = useRouter();

  return (
    <div className="flex min-h-[44px] items-center justify-between gap-4">
      {/* Left: back + title */}
      <div className="flex min-w-0 items-center gap-2">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          <h2 className="truncate text-xl font-bold tracking-tight text-gray-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>

      {/* Right: action slot */}
      {action && <div className="flex flex-shrink-0 items-center">{action}</div>}
    </div>
  );
}
