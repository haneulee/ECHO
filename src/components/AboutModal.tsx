"use client";

import { AboutCanvasGlow } from "@/components/AboutCanvasGlow";
import { AboutContent } from "@/components/AboutContent";
import { AppModal } from "@/components/AppModal";
import { aboutPage } from "@/lib/uiPoetics";

type AboutModalProps = {
  open: boolean;
  onClose: () => void;
};

export function AboutModal({ open, onClose }: AboutModalProps) {
  const closeLabel = `Close ${aboutPage.title.toLowerCase()}`;

  return (
    <AppModal
      bodyClassName="about-modal-body relative z-[1] p-0"
      panelBackdrop={<AboutCanvasGlow scope="modal" />}
      closeBackdropLabel={closeLabel}
      closeLabel={closeLabel}
      onClose={onClose}
      open={open}
      panelClassName="about-modal-panel"
      scrollBody
      size="fullscreen"
    >
      <AboutContent id="about-modal-title" variant="modal" />
    </AppModal>
  );
}
