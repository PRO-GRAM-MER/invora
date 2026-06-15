"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export type FilterOption = {
  value: string;
  label: string;
  indicator?: string; // tailwind bg- class for colored dot
  icon?: React.ReactNode;
};

type Props = {
  label: string;
  icon: React.ReactNode;
  options: FilterOption[];
  value: string;
  defaultValue: string;
  onChange: (v: string) => void;
  align?: "left" | "right";
};

const MIN_PANEL_W = 172;

export function FilterDropdown({
  label, icon, options, value, defaultValue, onChange, align = "left",
}: Props) {
  const [open, setOpen] = useState(false);
  const [pos,  setPos]  = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef   = useRef<HTMLDivElement>(null);

  const isActive = value !== defaultValue;
  const selected = options.find((o) => o.value === value);

  // Close on outside click (both trigger and panel)
  useEffect(() => {
    function handle(e: MouseEvent) {
      const t = e.target as Node;
      if (
        !triggerRef.current?.contains(t) &&
        !panelRef.current?.contains(t)
      ) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Close on scroll or resize (position would be stale)
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  function handleToggle() {
    if (!open && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setPos({
        top:  r.bottom + 6,
        left: align === "right"
          ? Math.max(8, r.right - MIN_PANEL_W)
          : r.left,
      });
    }
    setOpen((o) => !o);
  }

  return (
    <div className="relative flex-shrink-0">
      {/* ── Trigger ─────────────────────────────────────────────────── */}
      <button
        ref={triggerRef}
        onClick={handleToggle}
        className={cn(
          "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-150 select-none",
          !isActive && !open && "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm",
          !isActive &&  open && "border-gray-300 bg-gray-100 text-gray-900",
           isActive && !open && "border-indigo-200 bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200/70 hover:border-indigo-300 hover:bg-indigo-100",
           isActive &&  open && "border-indigo-300 bg-indigo-100 text-indigo-700 ring-1 ring-inset ring-indigo-300/70",
        )}
      >
        {/* Leading icon */}
        <span className={cn("flex-shrink-0", isActive ? "text-indigo-500" : "text-gray-400")}>
          {icon}
        </span>

        {/* Label */}
        <span>{label}</span>

        {/* Active value */}
        {isActive && selected && (
          <span className="flex items-center gap-1 border-l border-indigo-200 pl-1.5">
            {selected.indicator && (
              <span className={cn("h-1.5 w-1.5 flex-shrink-0 rounded-full", selected.indicator)} />
            )}
            <span className="font-semibold">{selected.label}</span>
          </span>
        )}

        {/* Chevron */}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
          className="flex-shrink-0"
        >
          <ChevronDown className={cn("h-3.5 w-3.5", isActive ? "text-indigo-400" : "text-gray-400")} />
        </motion.span>
      </button>

      {/* ── Dropdown — portalled to body so overflow-x: auto can't clip it ── */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0,  scale: 1     }}
              exit={{   opacity: 0, y: -6,  scale: 0.97  }}
              transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
              style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 9999, minWidth: MIN_PANEL_W }}
              className="overflow-hidden rounded-xl bg-white py-1 shadow-xl ring-1 ring-gray-200"
            >
              {options.map((opt) => {
                const active = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => { onChange(opt.value); setOpen(false); }}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors",
                      active
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    {opt.indicator !== undefined && (
                      <span className={cn("h-2 w-2 flex-shrink-0 rounded-full", opt.indicator || "bg-gray-300")} />
                    )}
                    {opt.icon && (
                      <span className={cn("flex-shrink-0", active ? "text-indigo-500" : "text-gray-400")}>
                        {opt.icon}
                      </span>
                    )}
                    <span className="flex-1 font-medium">{opt.label}</span>
                    {active && <Check className="h-3.5 w-3.5 flex-shrink-0 text-indigo-500" />}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
