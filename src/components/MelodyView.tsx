type MelodyViewProps = {
  melody: string[];
  label?: string;
  large?: boolean;
};

export function MelodyView({ melody, label, large = false }: MelodyViewProps) {
  return (
    <div>
      {label ? (
        <p className="mb-3 font-body text-xs uppercase tracking-[0.26em] text-text-muted">
          {label}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {melody.map((note, index) => (
          <span
            className={[
              "font-body text-text-muted",
              large ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-xs",
            ].join(" ")}
            key={`${note}-${index}`}
          >
            {note}
          </span>
        ))}
      </div>
    </div>
  );
}
