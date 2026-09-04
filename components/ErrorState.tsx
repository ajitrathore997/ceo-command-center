type ErrorStateProps = {
  title: string;
  message: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  compact?: boolean;
};

export function ErrorState({
  title,
  message,
  onRetry,
  isRetrying = false,
  compact = false,
}: ErrorStateProps) {
  return (
    <section
      className={`border border-red-200 bg-red-50 text-red-950 ${compact ? "rounded-md p-3" : "w-full max-w-sm rounded-xl p-6 text-center shadow-sm"}`}
      role="alert"
    >
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-red-800">{message}</p>
      {onRetry && (
        <button
          className="mt-4 min-h-11 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
        >
          {isRetrying ? "Retrying..." : "Try again"}
        </button>
      )}
    </section>
  );
}
