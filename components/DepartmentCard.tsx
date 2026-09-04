"use client";

import { useState } from "react";
import { Status, StatusBadge } from "./StatusBadge";

export type DepartmentMetric = {
  label: string;
  value: string | number;
};

type DepartmentCardProps = {
  name: string;
  status: Status;
  metrics: DepartmentMetric[];
};

export function DepartmentCard({ name, status, metrics }: DepartmentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleMetrics = isExpanded ? metrics : metrics.slice(0, 2);

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-900">{name}</h2>
        <StatusBadge status={status} />
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        {visibleMetrics.map((metric) => (
          <div key={metric.label} className="rounded-lg bg-slate-50 px-3 py-2">
            <dt className="text-xs font-medium text-slate-500">{metric.label}</dt>
            <dd className="mt-1 text-base font-semibold text-slate-900">
              {metric.value}
            </dd>
          </div>
        ))}
      </dl>

      <button
        className="mt-5 text-sm font-medium text-slate-700 underline underline-offset-4"
        type="button"
        onClick={() => setIsExpanded((expanded) => !expanded)}
        aria-expanded={isExpanded}
      >
        {isExpanded ? "Show less" : "Show details"}
      </button>
    </article>
  );
}
