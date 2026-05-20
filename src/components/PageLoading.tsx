import { LoadingPulse } from "@/components/LoadingPulse";

type PageLoadingProps = {
  label?: string;
  className?: string;
};

export function PageLoading({
  label = "Loading",
  className = "min-h-screen",
}: PageLoadingProps) {
  return (
    <div className={["grid place-items-center bg-white text-text", className].join(" ")}>
      <LoadingPulse label={label} />
    </div>
  );
}
