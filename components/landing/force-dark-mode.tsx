"use client";

import { useEffect } from "react";

/**
 * Forces dark mode on the <html> element while the landing page is mounted,
 * then restores whatever theme the user had before.
 */
export function ForceDarkMode() {
  useEffect(() => {
    const html = document.documentElement;
    const hadDark = html.classList.contains("dark");
    const hadLight = html.classList.contains("light");

    html.classList.add("dark");
    html.classList.remove("light");

    return () => {
      html.classList.remove("dark");
      if (hadDark) html.classList.add("dark");
      if (hadLight) html.classList.add("light");
    };
  }, []);

  return null;
}
