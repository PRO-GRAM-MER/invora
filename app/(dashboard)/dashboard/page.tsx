import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/dashboard/StatCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { DollarSign, Clock, AlertTriangle, Users, TrendingUp } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

const STATUS_BADGE: Record<string, string> = {
  PAID: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  OVERDUE: "bg-red-50 text-red-700 ring-1 ring-red-200",
};
const STATUS_DOT: Record<string, string> = {
  PAID: "bg-emerald-500",
  PENDING: "bg-amber-400",
  OVERDUE: "bg-red-500",
};

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function buildChartData(
  paidInvoices: { amount: { toString(): string }; issueDate: Date }[]
) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  return months.map(({ year, month }) => {
    const revenue = paidInvoices
      .filter((inv) => {
        const d = inv.issueDate;
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .reduce((sum, inv) => sum + Number(inv.amount.toString()), 0);

    return {
      month: new Date(year, month).toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      }),
      revenue: Math.round(revenue * 100) / 100,
    };
  });
}

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [statusGroups, clientCount, recentInvoices, chartInvoices] = await Promise.all([
    prisma.invoice.groupBy({
      by: ["status"],
      where: { userId },
      _sum: { amount: true },
    }),
    prisma.client.count({ where: { userId } }),
    prisma.invoice.findMany({
      where: { userId },
      include: { client: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.invoice.findMany({
      where: { userId, status: "PAID", issueDate: { gte: sixMonthsAgo } },
      select: { amount: true, issueDate: true },
    }),
  ]);

  const byStatus = Object.fromEntries(
    statusGroups.map((g) => [g.status, Number(g._sum.amount ?? 0)])
  );

  const totalRevenue = byStatus["PAID"] ?? 0;
  const pendingAmount = byStatus["PENDING"] ?? 0;
  const overdueAmount = byStatus["OVERDUE"] ?? 0;

  const chartData = buildChartData(chartInvoices);

  const stats = [
    {
      label: "Total Revenue",
      value: `$${fmt(totalRevenue)}`,
      icon: DollarSign,
      iconClass: "bg-emerald-50 text-emerald-600",
      href: "/invoices",
      trend: { label: "From paid invoices", positive: totalRevenue > 0 },
    },
    {
      label: "Pending",
      value: `$${fmt(pendingAmount)}`,
      icon: Clock,
      iconClass: "bg-amber-50 text-amber-600",
      href: "/invoices",
      trend: { label: "Awaiting payment", positive: false },
    },
    {
      label: "Overdue",
      value: `$${fmt(overdueAmount)}`,
      icon: AlertTriangle,
      iconClass: "bg-red-50 text-red-600",
      href: "/invoices",
      trend: { label: overdueAmount > 0 ? "Needs attention" : "All clear", positive: overdueAmount === 0 },
    },
    {
      label: "Total Clients",
      value: clientCount.toString(),
      icon: Users,
      iconClass: "bg-indigo-50 text-indigo-600",
      href: "/clients",
      trend: { label: "Active clients", positive: clientCount > 0 },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Good {getGreeting()}, {session!.user.name?.split(" ")[0]}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Here&apos;s a snapshot of your business today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Chart + Recent Invoices row */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Revenue chart — takes 2/3 width on xl */}
        <div className="xl:col-span-2 rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
              <h3 className="font-semibold text-gray-900">Revenue — last 6 months</h3>
            </div>
            <span className="text-xs font-semibold text-emerald-600">
              ${fmt(chartData.reduce((s, d) => s + d.revenue, 0))}
            </span>
          </div>
          <div className="px-4 py-5 sm:px-6">
            <RevenueChart data={chartData} />
          </div>
        </div>

        {/* Recent invoices — takes 1/3 width on xl */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h3 className="font-semibold text-gray-900">Recent Invoices</h3>
            <Link
              href="/invoices"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
            >
              View all →
            </Link>
          </div>

          {recentInvoices.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-gray-400">No invoices yet</p>
              <Link
                href="/invoices"
                className="mt-3 inline-block text-xs font-medium text-indigo-600 hover:underline"
              >
                Create your first →
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {recentInvoices.map((inv) => (
                <li
                  key={inv.id}
                  className="flex items-center justify-between gap-3 px-6 py-3.5 hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {inv.client.name}
                    </p>
                    <p className="font-mono text-xs text-indigo-500">{inv.invoiceNumber}</p>
                  </div>
                  <div className="flex flex-shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-semibold text-gray-900">
                      ${fmt(Number(inv.amount))}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[inv.status]}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[inv.status]}`} />
                      {inv.status.charAt(0) + inv.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
