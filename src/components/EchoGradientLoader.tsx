type EchoGradientLoaderProps = {
  className?: string;
  size?: "sm" | "md";
};

export function EchoGradientLoader({
  className = "",
  size = "md",
}: EchoGradientLoaderProps) {
  const rootClass =
    size === "sm" ? "echo-loader echo-loader--sm" : "echo-loader";

  return (
    <span aria-hidden className={[rootClass, className].join(" ")} role="presentation">
      <img
        alt=""
        className="echo-loader-logo"
        draggable={false}
        src="/brand/echo_logo.png"
      />
      <span className="echo-loader-glow" />
    </span>
  );
}
