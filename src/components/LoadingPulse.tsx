import { EchoGradientLoader } from "@/components/EchoGradientLoader";

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
  return (
    <div
      aria-label={label}
      aria-live="polite"
      className={["flex items-center justify-center", className].join(" ")}
      role="status"
    >
      <span className="sr-only">{label}</span>
      <EchoGradientLoader size={size} />
    </div>
  );
}
