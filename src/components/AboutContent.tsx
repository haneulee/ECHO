import Link from "next/link";

import { aboutPage } from "@/lib/uiPoetics";

type AboutContentVariant = "page" | "modal";

type AboutContentProps = {
  className?: string;
  id?: string;
  variant?: AboutContentVariant;
};

export function AboutContent({
  className = "",
  id,
  variant = "page",
}: AboutContentProps) {
  const { credits } = aboutPage;
  const inModal = variant === "modal";

  return (
    <article className={["text-left text-text", className].join(" ")}>
      <header>
        <h2
          className={
            inModal
              ? "font-display text-2xl tracking-[-0.04em]"
              : "font-display text-2xl leading-tight tracking-[-0.04em] sm:text-3xl"
          }
          id={id}
        >
          {aboutPage.brandName}
        </h2>
        <p className="mt-2 font-body text-sm leading-6 text-text-muted">
          {aboutPage.tagline}
        </p>
      </header>

      <div
        className={
          inModal
            ? "mt-6 space-y-4 font-body text-sm leading-6 text-text/90"
            : "mt-6 space-y-4 font-body text-xs leading-6 text-text/90 sm:text-sm sm:leading-7"
        }
      >
        {aboutPage.paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 48)}>{paragraph}</p>
        ))}
      </div>

      <footer
        className={
          inModal
            ? "mt-6 border-t border-text/10 pt-4 font-body text-sm leading-6 text-text-muted"
            : "mt-8 border-t border-text/10 pt-6 font-body text-xs leading-6 text-text-muted sm:text-sm sm:leading-7"
        }
      >
        <dl className="space-y-1.5">
          <div>
            <dt className="sr-only">Author</dt>
            <dd>
              Made by{" "}
              <Link
                className="text-text underline decoration-text/25 underline-offset-2 transition hover:decoration-text/50"
                href={credits.author.url}
                rel="noopener noreferrer"
                target="_blank"
              >
                {credits.author.name}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-text/55">School</dt>
            <dd className="text-text/80">{credits.school}</dd>
          </div>
          <div>
            <dt className="text-text/55">Program</dt>
            <dd className="text-text/80">{credits.program}</dd>
          </div>
          <div>
            <dt className="text-text/55">Tutor</dt>
            <dd className="text-text/80">{credits.tutor}</dd>
          </div>
          <div>
            <dt className="text-text/55">Professors</dt>
            <dd className="text-text/80">{credits.professors.join(", ")}</dd>
          </div>
        </dl>
      </footer>
    </article>
  );
}
