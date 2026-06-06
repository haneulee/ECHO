import Link from "next/link";

import { AboutCanvasGlow } from "@/components/AboutCanvasGlow";
import { aboutPage } from "@/lib/uiPoetics";
import Image from "next/image";

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
        <div className="about-hero-head">
          <p className="about-eyebrow">{aboutPage.title}</p>
          {/* <h1 className="about-title font-display tracking-[-0.055em]" id={id}>
            {aboutPage.brandName}
          </h1> */}
          <Image
            alt=""
            aria-hidden
            className="h-100 w-full shrink-0 object-contain"
            height={100}
            src="/brand/echo_logo.png"
            width={200}
          />
          <p className="about-tagline font-body text-text-muted">
            {aboutPage.tagline}
          </p>
        </div>

        {lead ? (
          <p className="about-lead about-column--lead font-body text-text/88">
            {lead}
          </p>
        ) : null}

        <div className="about-column about-column--story space-y-10 sm:space-y-12">
          {aboutParagraphs.length > 0 ? (
            <section className="about-block">
              {sections.about ? (
                <h2 className="about-section-title">{sections.about}</h2>
              ) : null}
              <div
                className={
                  sections.about
                    ? "about-prose"
                    : "about-prose about-prose--leadless"
                }
              >
                {aboutParagraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                ))}
              </div>
            </section>
          ) : null}
          {reflection ? (
            <section className="about-block">
              {sections.reflection ? (
                <h2 className="about-section-title">{sections.reflection}</h2>
              ) : null}
              <div
                className={
                  sections.reflection
                    ? "about-prose"
                    : "about-prose about-prose--leadless"
                }
              >
                <p>{reflection}</p>
              </div>
            </section>
          ) : null}
        </div>

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
