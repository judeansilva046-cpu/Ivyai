type Props = {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
};

export function StatBlock({ label, value, hint, accent }: Props) {
  return (
    <div
      className={`rounded-xl border px-4 py-4 ${
        accent
          ? "border-dh-accent/30 bg-dh-accent-soft"
          : "border-dh-line bg-dh-elevated"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-dh-muted">
        {label}
      </p>
      <p
        className={`mt-1 font-display text-2xl font-semibold ${
          accent ? "text-dh-accent-deep" : "text-dh-ink"
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-dh-muted">{hint}</p>}
    </div>
  );
}
