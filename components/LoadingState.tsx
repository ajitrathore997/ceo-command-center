type LoadingStateProps = {
  message: string;
  compact?: boolean;
};

export function LoadingState({ message, compact = false }: LoadingStateProps) {
  return (
    <div
      className={`flex items-center gap-3 text-sm text-slate-600 ${compact ? "py-3" : "min-h-[12rem] justify-center"}`}
      role="status"
      aria-live="polite"
    >
      <span
        className="h-4 w-4 shrink-0 rounded-full border-2 border-slate-200 border-t-slate-700"
        aria-hidden="true"
      />
      <span>{message}</span>
    </div>
  );
}
