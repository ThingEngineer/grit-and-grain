import { LandingNav } from "@/components/landing/landing-nav";
import { Hero } from "@/components/landing/hero";
import { ProblemSection } from "@/components/landing/problem-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { CalloutStrip } from "@/components/landing/callout-strip";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";
import { ForceLightMode } from "@/components/landing/force-dark-mode";

export default function LandingPage() {
  return (
    <>
      {/* Runs synchronously before hydration to prevent dark-mode flash on the landing page */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.classList.remove('dark');document.documentElement.classList.add('light');`,
        }}
      />
      <main className="scroll-smooth">
        <ForceLightMode />
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
