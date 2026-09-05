"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DepartmentCard, DepartmentMetric } from "@/components/DepartmentCard";
import { DepartmentKey } from "@/components/DepartmentDetails";
import { CriticalAlert } from "@/components/CriticalAlert";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { LogoutButton } from "@/components/LogoutButton";
import { Status } from "@/components/StatusBadge";
import { ThemeToggle } from "@/components/ThemeToggle";

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
const dashboardPollInterval = 30_000;

type CriticalAlertData = {
  department: string;
  message: string;
  priority: number;
};

function getCriticalAlert(departments: DashboardData["departments"]): CriticalAlertData | null {
  // Metric gaps are not directly comparable, so business-impact tiers break ties.
  // Operations and Finance take precedence because overdue work and revenue risk
  // are the most immediate executive concerns.
  const candidates: Array<CriticalAlertData & { status: Status }> = [
    {
      department: "Operations",
      status: departments.operations.status,
      priority: 500 + Number(departments.operations.metrics.overdueTasks ?? 0),
      message: `Critical: Operations has ${departments.operations.metrics.overdueTasks ?? 0} overdue tasks.`,
    },
    {
      department: "Finance",
      status: departments.finance.status,
      priority: 400 + Math.max(
        0,
        100 - Number(departments.finance.metrics.revenueAchievementPercentage ?? 0),
      ),
      message: `Critical: Finance revenue is at ${departments.finance.metrics.revenueAchievementPercentage ?? 0}% of target.`,
    },
    {
      department: "HR",
      status: departments.hr.status,
      priority: 300 + Math.max(
        0,
        100 - Number(departments.hr.metrics.attendanceTodayPercentage ?? 0),
      ),
      message: `Critical: HR attendance is ${departments.hr.metrics.attendanceTodayPercentage ?? 0}%.`,
    },
    {
      department: "Marketing",
      status: departments.marketing.status,
      priority: 200 + Math.max(
        0,
        100 - Number(departments.marketing.metrics.leadsGeneratedThisWeek ?? 0),
      ),
      message: `Critical: Marketing generated ${departments.marketing.metrics.leadsGeneratedThisWeek ?? 0} leads this week.`,
    },
    {
      department: "Sales",
      status: departments.sales.status,
      priority: 100 +
        Math.max(0, 20 - Number(departments.sales.metrics.activeDeals ?? 0)) +
        Math.max(0, 5 - Number(departments.sales.metrics.dealsClosedThisWeek ?? 0)) * 2,
      message: `Critical: Sales has ${departments.sales.metrics.activeDeals ?? 0} active deals and ${departments.sales.metrics.dealsClosedThisWeek ?? 0} deals closed this week.`,
    },
  ];

  return candidates
    .filter((candidate) => candidate.status === "red")
    .sort((first, second) => second.priority - first.priority)[0] ?? null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const requestInFlight = useRef(false);

  const loadDashboard = useCallback(async (showLoading = false) => {
    if (requestInFlight.current) {
      return;
    }

    requestInFlight.current = true;
    if (showLoading) {
      setIsLoading(true);
    }

    try {
      const response = await fetch("/api/dashboard", { credentials: "same-origin" });

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
      setError("");
      setLastUpdated(new Date());
    } catch {
      setError("Unable to refresh the dashboard right now. We will try again automatically.");
    } finally {
      requestInFlight.current = false;
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, [router]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void loadDashboard(true);
    }, 0);

    return () => window.clearTimeout(initialLoad);
  }, [loadDashboard]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadDashboard();
    }, dashboardPollInterval);

    return () => window.clearInterval(interval);
  }, [loadDashboard]);

  function retryDashboard() {
    setError("");
    void loadDashboard(!dashboard);
  }

  if (isLoading && !dashboard) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <LoadingState message="Loading your department dashboard..." />
      </main>
    );
  }

  if (!dashboard) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-900">
        <ErrorState
          title="Dashboard unavailable"
          message={error || "We could not load the dashboard right now."}
          onRetry={retryDashboard}
          isRetrying={isLoading && !dashboard}
        />
      </main>
    );
  }

  const { departments } = dashboard;
  const criticalAlert = getCriticalAlert(departments);
  const cards: Array<{
    name: string;
    key: DepartmentKey;
    department: Department;
    metrics: DepartmentMetric[];
  }> = [
    {
      name: "Sales",
      key: "sales",
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
      key: "operations",
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
      key: "finance",
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
      key: "marketing",
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
      key: "hr",
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
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted">CEO Command Center</p>
            <h1 className="mt-1 text-2xl font-semibold text-foreground sm:text-3xl">Department overview</h1>
            {lastUpdated && (
              <p className="mt-2 text-xs text-muted">
                Last updated {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </header>

        {error && (
          <ErrorState
            title="Live refresh unavailable"
            message={error}
            onRetry={retryDashboard}
            isRetrying={isLoading && !dashboard}
            compact
          />
        )}

        <CriticalAlert
          isCritical={criticalAlert !== null}
          message={criticalAlert?.message ?? "All departments are on track."}
        />

        <section className="grid min-w-0 gap-4 md:grid-cols-2" aria-label="Department status">
          {cards.map(({ name, key, department, metrics }) => (
            <DepartmentCard
              key={name}
              name={name}
              department={key}
              status={department.status}
              metrics={metrics}
              onUnauthenticated={() => router.replace("/login")}
              onDataChanged={() => void loadDashboard()}
            />
          ))}
        </section>
      </div>
    </main>
  );
}
