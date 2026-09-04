"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DepartmentCard, DepartmentMetric } from "@/components/DepartmentCard";
import { Status } from "@/components/StatusBadge";

type Department = {
  status: Status;
  metrics: Record<string, number | string | null>;
};

type DashboardData = {
  departments: {
    sales: Department;
    operations: Department;
    finance: Department;
    marketing: Department;
    hr: Department;
  };
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const formatPercentage = (value: number) => `${value}%`;

export default function DashboardPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = useCallback(() => {
    return fetch("/api/dashboard", { credentials: "same-origin" }).then(
      async (response) => {
        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        const data = (await response.json()) as DashboardData & { error?: string };

        if (!response.ok) {
          setError(data.error ?? "Unable to load the dashboard right now.");
          return;
        }

        setDashboard(data);
      },
    ).catch(() => {
      setError("Unable to load the dashboard right now. Please try again.");
    }).finally(() => {
      setIsLoading(false);
    });
  }, [router]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  function retryDashboard() {
    setError("");
    setIsLoading(true);
    void loadDashboard();
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-700">
        Loading dashboard...
      </main>
    );
  }

  if (error || !dashboard) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-900">
        <section className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold">Dashboard unavailable</h1>
          <p className="mt-2 text-sm text-slate-600">
            {error || "Unable to load the dashboard right now."}
          </p>
          <button
            className="mt-5 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            type="button"
            onClick={retryDashboard}
          >
            Try again
          </button>
        </section>
      </main>
    );
  }

  const { departments } = dashboard;
  const cards: Array<{ name: string; department: Department; metrics: DepartmentMetric[] }> = [
    {
      name: "Sales",
      department: departments.sales,
      metrics: [
        { label: "Active deals", value: departments.sales.metrics.activeDeals ?? 0 },
        {
          label: "Pipeline this month",
          value: formatCurrency(Number(departments.sales.metrics.pipelineValueThisMonth ?? 0)),
        },
        {
          label: "Closed this week",
          value: departments.sales.metrics.dealsClosedThisWeek ?? 0,
        },
      ],
    },
    {
      name: "Operations",
      department: departments.operations,
      metrics: [
        { label: "Overdue tasks", value: departments.operations.metrics.overdueTasks ?? 0 },
        {
          label: "Completed today",
          value: departments.operations.metrics.completedTasksToday ?? 0,
        },
        {
          label: "Team members active",
          value: departments.operations.metrics.activeTeamMembers ?? 0,
        },
      ],
    },
    {
      name: "Finance",
      department: departments.finance,
      metrics: [
        {
          label: "Revenue vs target",
          value: formatPercentage(
            Number(departments.finance.metrics.revenueAchievementPercentage ?? 0),
          ),
        },
        {
          label: "Pending invoices",
          value: departments.finance.metrics.pendingInvoiceCount ?? 0,
        },
        {
          label: "Pending invoice value",
          value: formatCurrency(
            Number(departments.finance.metrics.pendingInvoiceTotalValue ?? 0),
          ),
        },
      ],
    },
    {
      name: "Marketing",
      department: departments.marketing,
      metrics: [
        {
          label: "Active campaigns",
          value: departments.marketing.metrics.activeCampaigns ?? 0,
        },
        {
          label: "Leads this week",
          value: departments.marketing.metrics.leadsGeneratedThisWeek ?? 0,
        },
        {
          label: "Top lead source",
          value: departments.marketing.metrics.topLeadSource ?? "No data",
        },
      ],
    },
    {
      name: "HR",
      department: departments.hr,
      metrics: [
        { label: "Total headcount", value: departments.hr.metrics.totalHeadcount ?? 0 },
        { label: "Open positions", value: departments.hr.metrics.openPositions ?? 0 },
        {
          label: "Attendance today",
          value: formatPercentage(
            Number(departments.hr.metrics.attendanceTodayPercentage ?? 0),
          ),
        },
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6">
          <p className="text-sm font-medium text-slate-500">CEO Command Center</p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Department overview</h1>
        </header>

        <section className="grid gap-4 md:grid-cols-2" aria-label="Department status">
          {cards.map(({ name, department, metrics }) => (
            <DepartmentCard
              key={name}
              name={name}
              status={department.status}
              metrics={metrics}
            />
          ))}
        </section>
      </div>
    </main>
  );
}
