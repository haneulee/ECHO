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
        "fixed inset-0 z-[120] grid place-items-center gap-4 bg-bg/55 text-text backdrop-blur-sm",
        className,
      ].join(" ")}
    >
      <EchoGradientLoader size="md" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
