"use client";

import { AppProgressBar } from "next-nprogress-bar";

export function ProgressBar() {
  return (
    <AppProgressBar
      height="2px"
      color="oklch(0.62 0.18 35)"
      options={{ showSpinner: false }}
      shallowRouting
    />
  );
}
