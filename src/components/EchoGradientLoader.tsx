type EchoGradientLoaderProps = {
  className?: string;
  size?: "sm" | "md";
};

const DOTS = [
  { className: "bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)]" },
  { className: "bg-[#D4E8EC] shadow-[0_0_10px_rgba(180,210,220,0.8)]" },
  { className: "bg-[#E8E4DC] shadow-[0_0_10px_rgba(200,195,185,0.75)]" },
] as const;

export function EchoGradientLoader({
  className = "",
  size = "md",
}: EchoGradientLoaderProps) {
  const rootClass =
    size === "sm" ? "echo-loader echo-loader--sm" : "echo-loader";

  return (
    <span aria-hidden className={[rootClass, className].join(" ")} role="presentation">
      <span className="echo-loader-ring" />
      <span className="echo-loader-ring echo-loader-ring--inner" />
      <span className="echo-loader-orbit">
        {DOTS.map((dot, index) => (
          <span
            className="echo-loader-arm"
            key={dot.className}
            style={{ transform: `rotate(${index * 120}deg)` }}
          >
            <span
              className={["echo-loader-dot", dot.className].join(" ")}
              style={{ animationDelay: `${index * 110}ms` }}
            />
          </span>
        ))}
      </span>
    </span>
  );
}
