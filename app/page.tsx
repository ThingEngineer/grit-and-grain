import { LandingNav } from "@/components/landing/landing-nav";
import { Hero } from "@/components/landing/hero";
import { ProblemSection } from "@/components/landing/problem-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { CalloutStrip } from "@/components/landing/callout-strip";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";
import { ForceDarkMode } from "@/components/landing/force-dark-mode";

export default function LandingPage() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-foreground focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>
      <main id="main-content" className="scroll-smooth">
        <ForceDarkMode />
        <LandingNav />
        <Hero />
        <ProblemSection />
        <FeaturesSection />
        <CalloutStrip />
        <CTASection />
        <Footer />
      </main>
    </>
  );
}
