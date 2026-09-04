type CriticalAlertProps = {
  message: string;
  isCritical: boolean;
};

export function CriticalAlert({ message, isCritical }: CriticalAlertProps) {
  return (
    <aside
      className={`mb-6 flex min-w-0 items-start gap-3 rounded-lg border px-4 py-3 text-sm ${
        isCritical
          ? "border-red-200 bg-red-50 text-red-950"
          : "border-emerald-200 bg-emerald-50 text-emerald-950"
      }`}
      role={isCritical ? "alert" : "status"}
      aria-live="polite"
    >
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          isCritical ? "bg-red-700 text-white" : "bg-emerald-700 text-white"
        }`}
        aria-hidden="true"
      >
        {isCritical ? "!" : "✓"}
      </span>
      <p className="min-w-0 break-words font-medium">{message}</p>
    </aside>
  );
}
