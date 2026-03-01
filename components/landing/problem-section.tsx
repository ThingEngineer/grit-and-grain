"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" } as const,
  transition: { duration: 0.7 },
};

export function ProblemSection() {
  return (
    <section
      aria-labelledby="problem-heading"
      className="bg-card py-20 md:py-32"
    >
      <div className="mx-auto max-w-6xl px-6">
        <motion.div {...fadeInUp} className="mx-auto max-w-3xl text-center">
          <h2
            id="problem-heading"
            className="font-serif text-3xl font-semibold text-foreground md:text-4xl"
          >
            Decades of knowledge, stored entirely in your head
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Ranchers carry decades of hard-won knowledge entirely in their
            heads. When did the back pasture last rest? What were hay yields the
            year before the drought? Which rotation held up best through a wet
            spring? That institutional memory disappears when an operator
            retires, gets hurt, or simply forgets — and existing farm-management
            software makes the problem worse by demanding structured data entry
            at the end of a long day&apos;s work.
          </p>
          <p className="mt-4 text-lg font-medium text-foreground">
            There has never been a tool built for the way ranchers actually
            operate in the field.
          </p>
        </motion.div>

        {/* Small decorative images */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-12 flex justify-center gap-6"
        >
          <div
            className="relative h-32 w-48 overflow-hidden rounded-lg md:h-40 md:w-56"
            aria-hidden="true"
          >
            <Image
              src="/images/marketing/marketing-5.webp"
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 192px, 224px"
            />
          </div>
          <div
            className="relative h-32 w-48 overflow-hidden rounded-lg md:h-40 md:w-56"
            aria-hidden="true"
          >
            <Image
              src="/images/marketing/marketing-6.webp"
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 192px, 224px"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
