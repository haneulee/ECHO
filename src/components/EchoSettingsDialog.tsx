"use client";

import { useEffect, useState } from "react";

import { AppModal, modalBtnPrimary } from "@/components/AppModal";
import { isValidEchoColor, normalizeEchoColor } from "@/lib/echoColor";
import type { EchoDevice } from "@/lib/types";

type EchoSettingsDialogProps = {
  device: EchoDevice;
  open: boolean;
  onClose: () => void;
  onSaved?: (device: EchoDevice) => void;
};

export function EchoSettingsDialog({
  device,
  open,
  onClose,
  onSaved,
}: EchoSettingsDialogProps) {
  const [echoName, setEchoName] = useState(device.echoName);
  const [echoColor, setEchoColor] = useState(device.echoColor);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setEchoName(device.echoName);
    setEchoColor(device.echoColor);
    setError(null);
  }, [device.echoColor, device.echoName, open]);

  async function save() {
    const name = echoName.trim();
    const color = normalizeEchoColor(echoColor);
    if (!name) {
      setError("Name is required.");
      return;
    }
    if (!isValidEchoColor(color)) {
      setError("Use a hex color like #FF9F6E.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/me/echo-device", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: device.id,
          echoName: name,
          echoColor: color,
        }),
      });
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(body?.error ?? "Could not save.");
        return;
      }
      onSaved?.({ ...device, echoName: name, echoColor: color });
      onClose();
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppModal
      closeBackdropLabel="Close settings"
      closeLabel="Close settings"
      footer={
        <button
          className={modalBtnPrimary}
          disabled={saving}
          onClick={() => void save()}
          type="button"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      }
      onClose={onClose}
      open={open}
    >
      <h2 className="font-display text-2xl tracking-[-0.04em]">Your Echo</h2>
      <p className="mt-2 font-body text-sm leading-6 text-text-muted">
        Adjust how your companion appears across the app.
      </p>
      <label className="mt-6 block font-body text-xs uppercase text-text-muted">
        Name
        <input
          className="mt-2 w-full rounded-2xl border border-border bg-white/55 px-4 py-3 font-body text-base text-text outline-none backdrop-blur-sm ring-text/15 focus:ring-2"
          onChange={(e) => setEchoName(e.target.value)}
          value={echoName}
        />
      </label>
      <label className="mt-4 block font-body text-xs uppercase text-text-muted">
        Glow color
        <div className="mt-2 flex items-center gap-3">
          <input
            className="h-11 w-14 cursor-pointer rounded-xl border border-border bg-transparent p-1"
            onChange={(e) => setEchoColor(e.target.value)}
            type="color"
            value={echoColor}
          />
          <input
            className="min-w-0 flex-1 rounded-2xl border border-border bg-white/55 px-4 py-3 font-body text-sm text-text outline-none backdrop-blur-sm ring-text/15 focus:ring-2"
            onChange={(e) => setEchoColor(e.target.value)}
            value={echoColor}
          />
        </div>
      </label>
      {error ? (
        <p className="mt-4 font-body text-sm text-red-800">{error}</p>
      ) : null}
    </AppModal>
  );
}
