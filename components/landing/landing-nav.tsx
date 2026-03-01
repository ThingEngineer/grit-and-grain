"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-background/80 shadow backdrop-blur-md"
          : "bg-foreground/20 backdrop-blur-sm"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className={`font-serif text-xl font-semibold transition-colors ${
            scrolled ? "text-foreground" : "text-white"
          }`}
        >
          Grit &amp; Grain
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors sm:px-4 sm:py-2 ${
              scrolled
                ? "border-border text-foreground hover:bg-muted"
                : "border-white/30 text-white hover:bg-white/10"
            }`}
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:px-4 sm:py-2"
          >
            Get Started Free
          </Link>
        </div>
      </nav>
    </header>
  );
}
