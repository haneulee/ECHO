type LoadingPulseProps = {
  label?: string;
  className?: string;
  size?: "sm" | "md";
};

export function LoadingPulse({
  label = "Loading",
  className = "",
  size = "md",
}: LoadingPulseProps) {
  const dotSize = size === "sm" ? "h-1.5 w-1.5" : "h-2.5 w-2.5";
  const gap = size === "sm" ? "gap-1.5" : "gap-2";

  return (
    <div
      aria-label={label}
      aria-live="polite"
      className={["flex items-center justify-center", className].join(" ")}
      role="status"
    >
      <span className="sr-only">{label}</span>
      <span aria-hidden className={["flex text-current", gap].join(" ")}>
        {[0, 1, 2].map((i) => (
          <span
            className={[
              dotSize,
              "rounded-full bg-current opacity-35 motion-safe:animate-pulse",
            ].join(" ")}
            key={i}
            style={{ animationDelay: `${i * 160}ms` }}
          />
        ))}
      </span>
    </div>
  );
}
