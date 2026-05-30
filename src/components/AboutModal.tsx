"use client";

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
      closeBackdropLabel={closeLabel}
      closeLabel={closeLabel}
      onClose={onClose}
      open={open}
      scrollBody
      size="fullscreen"
    >
      <AboutContent id="about-modal-title" variant="modal" />
    </AppModal>
  );
}
