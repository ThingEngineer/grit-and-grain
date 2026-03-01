"use client";

import { motion } from "framer-motion";

const quotes = [
  "No spreadsheets. No forms. Just talk.",
  "Every observation you log today becomes context for a question you haven\u2019t thought to ask yet.",
  "Record a voice note in the field. Your history builds itself.",
];

export function CalloutStrip() {
  return (
    <section className="bg-muted py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-8 md:grid-cols-3">
          {quotes.map((quote, i) => (
            <motion.blockquote
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="border-l-2 border-accent pl-5"
            >
              <p className="text-lg font-medium leading-relaxed text-foreground">
                &ldquo;{quote}&rdquo;
              </p>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
