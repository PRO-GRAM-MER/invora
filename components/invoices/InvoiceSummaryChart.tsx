"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { Invoice, InvoiceStatus } from "@/lib/stores/invoiceStore";

// ── Donut constants ────────────────────────────────────────────────────
const R   = 36;
const SW  = 13;
const C   = 2 * Math.PI * R; // ≈ 226.2
const SZ  = 100;
const CX  = SZ / 2;
const GAP = 3; // px gap between segments

const STATUS_ORDER: InvoiceStatus[] = ["PAID", "PENDING", "OVERDUE"];

const CFG = {
  PAID:    { color: "#10b981", label: "Paid",    sub: "Collected"     },
  PENDING: { color: "#f59e0b", label: "Pending", sub: "Awaiting"      },
  OVERDUE: { color: "#ef4444", label: "Overdue", sub: "Action needed" },
} as const;

// ── Helpers ────────────────────────────────────────────────────────────
function fmtFull(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtShort(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

type Props = { invoices: Invoice[]; clientCount: number };

export function InvoiceSummaryChart({ invoices, clientCount }: Props) {
  const { groups, total } = useMemo(() => {
    const groups = {
      PAID:    { amount: 0, count: 0 },
      PENDING: { amount: 0, count: 0 },
      OVERDUE: { amount: 0, count: 0 },
    } as Record<InvoiceStatus, { amount: number; count: number }>;
    let total = 0;
    for (const inv of invoices) {
      const amt = Number(inv.amount);
      groups[inv.status].amount += amt;
      groups[inv.status].count  += 1;
      total += amt;
    }
    return { groups, total };
  }, [invoices]);

  const segments = useMemo(() => {
    let acc = 0;
    return STATUS_ORDER.map((status) => {
      const raw = total > 0 ? (groups[status].amount / total) * C : 0;
      const len = raw > GAP ? raw - GAP : 0;
      const seg = { status, len, offset: -acc };
      acc += raw;
      return seg;
    });
  }, [groups, total]);

  const active = STATUS_ORDER.filter((s) => groups[s].count > 0);

  if (invoices.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-col sm:flex-row sm:divide-x sm:divide-gray-100">

        {/* ── Panel 1: Donut ──────────────────────────────────────────── */}
        <div className="flex items-center gap-5 p-5 sm:flex-col sm:items-center sm:justify-center sm:gap-3 sm:px-7 sm:py-6">
          {/* SVG donut */}
          <div className="relative flex-shrink-0">
            <svg width={96} height={96} viewBox={`0 0 ${SZ} ${SZ}`}>
              <g transform={`rotate(-90 ${CX} ${CX})`}>
                {/* Track */}
                <circle
                  cx={CX} cy={CX} r={R}
                  fill="none" stroke="#f3f4f6" strokeWidth={SW}
                />
                {/* Animated segments */}
                {total > 0 && segments.map(({ status, len, offset }, i) =>
                  len > 0 ? (
                    <motion.circle
                      key={status}
                      cx={CX} cy={CX} r={R}
                      fill="none"
                      stroke={CFG[status].color}
                      strokeWidth={SW}
                      strokeLinecap="butt"
                      strokeDashoffset={offset}
                      initial={{ strokeDasharray: `0 ${C}` }}
                      animate={{ strokeDasharray: `${len} ${C - len}` }}
                      transition={{
                        duration: 0.85,
                        ease: [0.34, 1.2, 0.64, 1],
                        delay: i * 0.1,
                      }}
                    />
                  ) : null
                )}
              </g>
              {/* Center label */}
              <text
                x={CX} y={CX - 7}
                textAnchor="middle" dominantBaseline="middle"
                fill="#111827" fontSize={17} fontWeight={700} fontFamily="inherit"
              >
                {invoices.length}
              </text>
              <text
                x={CX} y={CX + 9}
                textAnchor="middle" dominantBaseline="middle"
                fill="#9ca3af" fontSize={8.5} fontFamily="inherit"
              >
                invoices
              </text>
            </svg>
          </div>

          {/* Dot legend under donut — desktop only */}
          <div className="hidden sm:flex sm:gap-2">
            {active.map((s) => (
              <span key={s} className="flex items-center gap-1 text-[10px] text-gray-400">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: CFG[s].color }} />
                {CFG[s].label}
              </span>
            ))}
          </div>

          {/* Mobile: key numbers beside donut */}
          <div className="sm:hidden">
            <p className="text-xl font-bold tracking-tight text-gray-900">{fmtShort(total)}</p>
            <p className="text-xs text-gray-400">total value</p>
            <div className="mt-2.5 flex items-baseline gap-1">
              <span className="text-sm font-bold text-gray-900">{clientCount}</span>
              <span className="text-xs text-gray-400">clients</span>
            </div>
            <div className="mt-2 flex gap-1.5">
              {active.map((s) => (
                <span key={s} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: CFG[s].color }} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Panel 2: Status breakdown ────────────────────────────────── */}
        <div className="flex flex-1 divide-x divide-gray-100 border-t border-gray-100 sm:border-t-0">
          {active.map((status) => {
            const { amount, count } = groups[status];
            const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
            const cfg = CFG[status];
            return (
              <div key={status} className="flex flex-1 flex-col justify-between px-4 py-4 sm:px-5 sm:py-5">
                {/* Label */}
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: cfg.color }} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    {cfg.label}
                  </span>
                </div>

                {/* Amount */}
                <div className="mt-2.5">
                  <p className="text-base font-bold leading-none text-gray-900 sm:text-lg">
                    ${fmtFull(amount)}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-400">
                    {count} invoice{count !== 1 ? "s" : ""} · {pct}%
                  </p>
                </div>

                {/* Progress bar */}
                <div className="mt-3.5 h-1 w-full overflow-hidden rounded-full bg-gray-100">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: cfg.color }}
                    initial={{ width: "0%" }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, ease: "easeOut", delay: 0.25 }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Panel 3: Total + Clients — desktop only ──────────────────── */}
        <div className="hidden flex-col justify-center gap-0 divide-y divide-gray-100 sm:flex">
          {/* Total */}
          <div className="px-6 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Total</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900">{fmtShort(total)}</p>
            <p className="mt-0.5 text-[11px] text-gray-400">${fmtFull(total)}</p>
          </div>
          {/* Clients */}
          <div className="px-6 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Clients</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900">{clientCount}</p>
            <p className="mt-0.5 text-[11px] text-gray-400">active</p>
          </div>
        </div>

      </div>
    </div>
  );
}
