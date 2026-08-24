import Link from "next/link";
import Image from "next/image";

import { AboutCanvasGlow } from "@/components/AboutCanvasGlow";
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
  const { credits, paragraphs, sections, creditGroups } = aboutPage;
  const inModal = variant === "modal";
  const [lead, ...rest] = paragraphs;
  const reflection = rest.pop();
  const aboutParagraphs = rest;

  return (
    <article
      className={[
        "about-canvas text-left text-text",
        inModal
          ? "about-canvas--modal about-canvas--modal-body w-full"
          : "about-canvas--page",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {!inModal ? <AboutCanvasGlow scope="page" /> : null}

      <div className="about-layout">
        <header className="about-hero-head">
          {inModal ? (
            <p className="about-eyebrow">{aboutPage.title}</p>
          ) : null}
          <Image
            alt="Echo"
            className="about-brand-logo h-auto shrink-0 object-contain"
            height={100}
            priority={!inModal}
            src="/brand/echo_logo.png"
            width={200}
          />
          {inModal ? (
            <h1
              className="about-title font-display tracking-[-0.07em]"
              id={id}
            >
              {aboutPage.tagline}
            </h1>
          ) : (
            <p className="about-title font-display tracking-[-0.07em]">
              {aboutPage.tagline}
            </p>
          )}
        </header>

        {lead ? (
          <p className="about-lead about-column--lead font-body">{lead}</p>
        ) : null}

        {aboutParagraphs.length > 0 ? (
          <div className="about-column about-column--story">
            {aboutParagraphs.map((paragraph, index) => (
              <section
                className={[
                  "about-block",
                  index % 2 === 0
                    ? "about-story-block--origin"
                    : "about-story-block--shift",
                ].join(" ")}
                key={paragraph.slice(0, 48)}
              >
                {index === 0 && sections.about ? (
                  <h2 className="about-section-title">{sections.about}</h2>
                ) : null}
                <div
                  className={
                    index === 0 && sections.about
                      ? "about-prose"
                      : "about-prose about-prose--leadless"
                  }
                >
                  <p>{paragraph}</p>
                </div>
              </section>
            ))}
          </div>
        ) : null}

        {reflection ? (
          <section className="about-reflection">
            {sections.reflection ? (
              <h2 className="about-section-title">{sections.reflection}</h2>
            ) : null}
            <p className="about-reflection-text font-display tracking-[-0.055em]">
              {reflection}
            </p>
          </section>
        ) : null}

        <aside className="about-column about-column--meta">
          <section className="about-meta-group">
            <h3 className="about-meta-label">{creditGroups.team}</h3>
            <ul className="about-meta-list">
              <li>
                <Link
                  className="about-meta-link"
                  href={credits.author.url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {credits.author.name}
                </Link>
              </li>
            </ul>
          </section>

          <section className="about-meta-group">
            <h3 className="about-meta-label">{creditGroups.institution}</h3>
            <ul className="about-meta-list">
              <li>{credits.school}</li>
              <li>{credits.program}</li>
            </ul>
          </section>

          <section className="about-meta-group">
            <h3 className="about-meta-label">{creditGroups.guidance}</h3>
            <ul className="about-meta-list">
              <li>
                <span className="text-text/55">Tutor · </span>
                {credits.tutor}
              </li>
              <li>
                <span className="text-text/55">Professors · </span>
                {credits.professors.join(", ")}
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </article>
  );
}
