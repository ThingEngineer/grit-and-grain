"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function CTASection() {
  return (
    <section className="bg-card py-20 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="font-serif text-3xl font-semibold text-foreground md:text-5xl">
            Speak your day. Build your legacy.
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Three years from now, you&apos;ll be able to ask what you did the
            last time you had a dry February — and you&apos;ll get a real
            answer, with receipts.
          </p>
          <p className="mt-4 text-sm font-medium text-accent">
            Free for 30 days — all features, no credit card
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="rounded-full bg-primary px-8 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Get Started Free
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-border px-8 py-3 font-medium text-foreground transition-colors hover:bg-muted"
            >
              Sign In
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
