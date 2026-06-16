"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Menu, User, LogOut } from "lucide-react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
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
  userEmail: string;
};

export function Header({ onMenuClick, userName, userEmail }: Props) {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? "Invora";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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

      {/* Right: user avatar + dropdown */}
      <div className="relative flex flex-shrink-0 items-center" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white transition-opacity hover:opacity-80"
          aria-label="User menu"
        >
          {userName.charAt(0).toUpperCase()}
        </button>

        {open && (
          <div className="absolute right-0 top-10 z-50 w-52 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
            {/* User info */}
            <div className="border-b border-gray-100 px-4 py-2.5">
              <p className="truncate text-sm font-medium text-gray-900">{userName}</p>
              <p className="truncate text-xs text-gray-500">{userEmail}</p>
            </div>

            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
            >
              <User className="h-4 w-4 text-gray-400" />
              Profile
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-4 w-4 text-gray-400" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
