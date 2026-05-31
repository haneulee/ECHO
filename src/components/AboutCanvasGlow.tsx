type AboutCanvasGlowProps = {
  /** `modal` fills the fullscreen About dialog; `page` fills the article. */
  scope?: "page" | "modal";
};

export function AboutCanvasGlow({ scope = "page" }: AboutCanvasGlowProps) {
  return (
    <div
      aria-hidden
      className={
        scope === "modal" ? "about-modal-glow" : "about-canvas__glow"
      }
    >
      <div className="about-canvas__field" />
    </div>
  );
}
