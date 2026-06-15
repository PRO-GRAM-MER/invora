"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { GlobalSearch } from "./GlobalSearch";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/clients":   "Clients",
  "/invoices":  "Invoices",
  "/settings":  "Settings",
};

type Props = {
  onMenuClick: () => void;
  userName: string;
};

export function Header({ onMenuClick, userName }: Props) {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? "Invora";

  return (
    <header className="flex h-14 flex-shrink-0 items-center gap-2 border-b border-gray-200 bg-white px-4 sm:px-6">
      {/* Left: mobile menu + page title */}
      <div className="flex min-w-0 flex-shrink-0 items-center gap-2">
        <button
          onClick={onMenuClick}
          className="flex-shrink-0 rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="hidden truncate text-sm font-semibold text-gray-600 sm:block">{title}</h1>
      </div>

      {/* Centre: global search */}
      <GlobalSearch />

      {/* Right: user avatar */}
      <div className="flex flex-shrink-0 items-center">
        <Link
          href="/settings"
          title="Settings"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white transition-opacity hover:opacity-80"
        >
          {userName.charAt(0).toUpperCase()}
        </Link>
      </div>
    </header>
  );
}
