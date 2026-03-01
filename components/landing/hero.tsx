"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

const heroImages = [
  "/images/marketing/marketing-5.webp",
  "/images/marketing/marketing-6.webp",
];

export function Hero() {
  const [currentImage, setCurrentImage] = useState(0);
  const [paused, setPaused] = useState(false);

  const nextImage = useCallback(() => {
    setCurrentImage((prev) => (prev + 1) % heroImages.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(nextImage, 6000);
    return () => clearInterval(interval);
  }, [nextImage, paused]);

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative flex min-h-screen items-center overflow-hidden"
    >
      {/* Rotating background images — decorative, hidden from screen readers */}
      <div className="absolute inset-0" aria-hidden="true">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={currentImage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0"
          >
            <Image
              src={heroImages[currentImage]}
              alt=""
              fill
              className="object-cover"
              priority={currentImage === 0}
              sizes="100vw"
            />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-foreground/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-32">
        <div className="max-w-2xl rounded-2xl bg-foreground/25 p-8 backdrop-blur-sm md:p-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="inline-block rounded-full bg-accent/90 px-4 py-1.5 text-sm font-medium text-accent-foreground">
              Free for 30 days — no credit card required
            </span>
          </motion.div>

          <motion.h1
            id="hero-heading"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-6 font-serif text-4xl font-bold leading-tight text-white md:text-6xl"
          >
            Stop relying on memory.{" "}
            <span className="text-accent">Start relying on history.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-6 text-lg leading-relaxed text-white/85 md:text-xl"
          >
            The AI-powered field journal built for ranchers and small-scale
            farmers who carry their operation&apos;s history in their head — and
            need a better place to keep it.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-8 flex flex-col gap-4 sm:flex-row"
          >
            <Link
              href="/signup"
              className="rounded-full bg-primary px-8 py-3 text-center font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              Get Started Free
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-white/30 px-8 py-3 text-center font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              Sign In
            </Link>
          </motion.div>

          {/* Slideshow pause control */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="mt-6"
          >
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-label={
                paused
                  ? "Play background slideshow"
                  : "Pause background slideshow"
              }
              className="flex items-center gap-2 text-xs text-zinc-900/60 transition-colors hover:text-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              <span aria-hidden="true">{paused ? "▶" : "⏸"}</span>
              {paused ? "Resume slideshow" : "Pause slideshow"}
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
