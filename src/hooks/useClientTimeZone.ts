"use client";

import { useEffect, useState } from "react";

/** Stable on server + first client paint; resolves to the browser zone after mount. */
export function useClientTimeZone() {
  const [timeZone, setTimeZone] = useState<string | null>(null);

  useEffect(() => {
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  return timeZone;
}
