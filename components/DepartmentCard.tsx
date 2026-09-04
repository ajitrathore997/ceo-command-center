"use client";

import { useState } from "react";
import { DepartmentDetails, DepartmentKey } from "./DepartmentDetails";
import { Status, StatusBadge } from "./StatusBadge";

export type DepartmentMetric = {
  label: string;
  value: string | number;
};

export const departmentEndpoints: Record<DepartmentKey, string> = {
  sales: "/api/sales",
  operations: "/api/operations",
  finance: "/api/finance",
  marketing: "/api/marketing",
  hr: "/api/hr",
};

type DepartmentCardProps = {
  name: string;
  department: DepartmentKey;
  status: Status;
  metrics: DepartmentMetric[];
  onUnauthenticated: () => void;
};

export function DepartmentCard({
  name,
  department,
  status,
  metrics,
  onUnauthenticated,
}: DepartmentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [details, setDetails] = useState<unknown>(null);
  const [detailsError, setDetailsError] = useState("");
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const visibleMetrics = isExpanded ? metrics : metrics.slice(0, 2);

  async function loadDetails() {
    setIsLoadingDetails(true);
    setDetailsError("");

    try {
      const response = await fetch(departmentEndpoints[department], {
        credentials: "same-origin",
      });

      if (response.status === 401) {
        onUnauthenticated();
        return;
      }

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setDetailsError(data.error ?? "Unable to load department details.");
        return;
      }

      setDetails(data);
    } catch {
      setDetailsError("Unable to load department details.");
    } finally {
      setIsLoadingDetails(false);
    }
  }

  function toggleExpanded() {
    const nextExpanded = !isExpanded;
    setIsExpanded(nextExpanded);

    if (nextExpanded && details === null && !isLoadingDetails) {
      void loadDetails();
    }
  }

  return (
    <article className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <button
        className="flex w-full min-h-11 items-start justify-between gap-3 text-left"
        type="button"
        onClick={toggleExpanded}
        aria-expanded={isExpanded}
      >
        <span className="min-w-0">
          <span className="block text-lg font-semibold text-slate-900">{name}</span>
          <span className="mt-1 block text-sm text-slate-500">
            {isExpanded ? "Hide details" : "Show details"}
          </span>
        </span>
        <StatusBadge status={status} />
      </button>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        {visibleMetrics.map((metric) => (
          <div key={metric.label} className="min-w-0 rounded-lg bg-slate-50 px-3 py-2">
            <dt className="text-xs font-medium text-slate-500">{metric.label}</dt>
            <dd className="mt-1 break-words text-base font-semibold text-slate-900">
              {metric.value}
            </dd>
          </div>
        ))}
      </dl>

      {isExpanded && (
        <div className="mt-2 min-w-0 border-t border-slate-100 pt-2">
          {isLoadingDetails && (
            <p className="mt-3 text-sm text-slate-600">Loading details...</p>
          )}

          {detailsError && !isLoadingDetails && (
            <div className="mt-3">
              <p className="text-sm text-red-600">{detailsError}</p>
              <button
                className="mt-2 min-h-11 text-sm font-medium text-slate-700 underline underline-offset-4"
                type="button"
                onClick={() => void loadDetails()}
              >
                Try again
              </button>
            </div>
          )}

          {details !== null && !isLoadingDetails && !detailsError && (
            <DepartmentDetails department={department} data={details} />
          )}

          <button
            className="mt-4 min-h-11 w-full rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-800"
            type="button"
            onClick={toggleExpanded}
          >
            Collapse
          </button>
        </div>
      )}
    </article>
  );
}
