"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

/**
 * Forces light mode while the landing page is mounted.
 * Uses next-themes' setTheme so localStorage is updated too,
 * preventing dark-mode re-application on next hydration.
 * Restores the previous theme when the user navigates away.
 */
export function ForceLightMode() {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const previous = theme;
    setTheme("light");
    return () => {
      if (previous && previous !== "light") {
        setTheme(previous);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

/** @deprecated Use ForceLightMode instead */
export const ForceDarkMode = ForceLightMode;
