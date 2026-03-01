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
    <main className="scroll-smooth">
      <ForceDarkMode />
      <LandingNav />
      <Hero />
      <ProblemSection />
      <FeaturesSection />
      <CalloutStrip />
      <CTASection />
      <Footer />
    </main>
  );
}
