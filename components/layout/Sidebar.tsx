"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, FileText, X, Zap } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/invoices", label: "Invoices", icon: FileText },
];

type SidebarContentProps = {
  pathname: string;
  onClose: () => void;
  showCloseButton?: boolean;
};

function SidebarContent({
  pathname,
  onClose,
  showCloseButton,
}: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-gray-900">Invora</span>
        </div>
        {showCloseButton && (
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
          Menu
        </p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                active
                  ? "bg-indigo-50 text-indigo-700 shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Icon
                className={`h-5 w-5 flex-shrink-0 transition-colors duration-150 ${
                  active ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"
                }`}
              />
              {label}
              {active && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-600" />
              )}
            </Link>
          );
        })}
      </nav>

    </div>
  );
}

type Props = {
  open: boolean;
  onClose: () => void;
};

export function Sidebar({ open, onClose }: Props) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar — always visible, no transitions needed */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-shrink-0 lg:flex-col border-r border-gray-200 bg-white">
        <SidebarContent
          pathname={pathname}
          onClose={onClose}
        />
      </aside>

      {/*
        Mobile overlay — always mounted so both enter AND exit animate.
        pointer-events-none when closed prevents blocking clicks behind it.
      */}
      <div
        className={`fixed inset-0 z-40 lg:hidden ${
          open ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        {/* Backdrop: fades in/out */}
        <div
          className={`absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={onClose}
        />

        {/* Drawer: slides in from left */}
        <aside
          className={`absolute left-0 top-0 h-full w-72 bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <SidebarContent
            pathname={pathname}
            onClose={onClose}
            showCloseButton
          />
        </aside>
      </div>
    </>
  );
}
