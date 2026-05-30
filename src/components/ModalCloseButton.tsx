type ModalCloseButtonProps = {
  onClose: () => void;
  /** Accessible label (e.g. "Close about"). */
  label?: string;
  className?: string;
};

export function ModalCloseButton({
  onClose,
  label = "Close",
  className = "",
}: ModalCloseButtonProps) {
  return (
    <button
      aria-label={label}
      className={["modal-close-btn", className].filter(Boolean).join(" ")}
      onClick={onClose}
      type="button"
    >
      <span aria-hidden className="modal-close-btn-icon">
        ×
      </span>
    </button>
  );
}
