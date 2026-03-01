"use client";

import { useEffect } from "react";

/**
 * Forces light mode on the <html> element while the landing page is mounted,
 * then restores whatever theme the user had before.
 */
export function ForceLightMode() {
  useEffect(() => {
    const html = document.documentElement;
    const hadDark = html.classList.contains("dark");
    const hadLight = html.classList.contains("light");

    html.classList.remove("dark");
    html.classList.add("light");

    return () => {
      html.classList.remove("light");
      if (hadDark) html.classList.add("dark");
      if (hadLight) html.classList.add("light");
    };
  }, []);

  return null;
}

/** @deprecated Use ForceLightMode instead */
export const ForceDarkMode = ForceLightMode;
