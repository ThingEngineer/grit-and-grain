"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const features = [
  {
    title: "Voice-First Capture",
    description:
      "Recording a diary entry takes seconds. Tap the microphone, speak naturally about what you saw in the field today, and Grit & Grain handles the rest. Your note is transcribed, automatically tagged to the right pasture or herd, and saved — no forms, no keyboards, no extra steps.",
    callout: "Built for people whose hands are too dirty to type.",
    image: "/images/marketing/marketing-1.webp",
  },
  {
    title: "Farm Memory",
    description:
      "Ask questions about your own ranch the way you\u2019d ask a knowledgeable foreman who was there for every day of it. Farm Memory searches across your entire diary history and surfaces the exact entries that answer your question — with inline citations so you always know where the answer came from.",
    callout: "Answers grounded in your data — not guesswork.",
    image: "/images/marketing/marketing-2.webp",
  },
  {
    title: "Weekly Review",
    description:
      "Every week, Grit & Grain synthesizes everything you logged into a structured summary: rainfall totals, rotation moves, hay activity, herd health observations, and trends worth watching heading into the next week. It turns a scattered week of notes into a clear operational picture in seconds.",
    callout: "The more you log, the smarter it gets.",
    image: "/images/marketing/marketing-3.webp",
  },
  {
    title: "Pasture & Herd Management",
    description:
      "Organize your operation the way it works on the ground. Add your pastures and herd groups once, and every diary entry links back to them — giving you a clean timeline for each piece of land and each group of animals over months and years.",
    callout:
      "Your institutional knowledge, preserved and searchable — forever.",
    image: "/images/marketing/marketing-4.webp",
  },
];

export function FeaturesSection() {
  return (
    <section
      aria-labelledby="features-heading"
      className="bg-background py-20 md:py-32"
    >
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="mb-16 text-center"
        >
          <h2
            id="features-heading"
            className="font-serif text-3xl font-semibold text-foreground md:text-4xl"
          >
            The field journal that listens, remembers, and thinks alongside you
          </h2>
        </motion.div>

        <div className="flex flex-col gap-20 md:gap-32">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: i % 2 === 0 ? -60 : 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
              className={`flex flex-col items-center gap-8 md:flex-row md:gap-12 ${
                i % 2 !== 0 ? "md:flex-row-reverse" : ""
              }`}
            >
              {/* Image */}
              <div className="w-full overflow-hidden rounded-xl md:w-1/2">
                <Image
                  src={feature.image}
                  alt={feature.title}
                  width={1366}
                  height={744}
                  className="h-auto w-full"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>

              {/* Text */}
              <div className="w-full md:w-1/2">
                <h3 className="font-serif text-2xl font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
                <p className="mt-4 border-l-2 border-accent pl-4 text-sm font-medium italic text-foreground">
                  {feature.callout}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
