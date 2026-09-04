export type Status = "green" | "amber" | "red";

const statusStyles: Record<Status, { label: string; className: string }> = {
  green: { label: "Green", className: "bg-emerald-100 text-emerald-800" },
  amber: { label: "Amber", className: "bg-amber-100 text-amber-800" },
  red: { label: "Red", className: "bg-red-100 text-red-800" },
};

export function StatusBadge({ status }: { status: Status }) {
  const { label, className } = statusStyles[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
      {label}
    </span>
  );
}
