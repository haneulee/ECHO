import { LoadingPulse } from "@/components/LoadingPulse";

type PageLoadingProps = {
  label?: string;
};

export function PageLoading({ label = "Loading" }: PageLoadingProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-white text-text">
      <LoadingPulse label={label} />
    </main>
  );
}
