import { EchoGradientLoader } from "@/components/EchoGradientLoader";

type PageLoadingProps = {
  label?: string;
  className?: string;
};

export function PageLoading({
  label = "Loading",
  className = "min-h-screen",
}: PageLoadingProps) {
  return (
    <div
      className={[
        "grid place-items-center gap-4 bg-transparent text-text",
        className,
      ].join(" ")}
    >
      <EchoGradientLoader size="md" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
