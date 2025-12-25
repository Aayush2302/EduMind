import { HeroScene } from "@/components/landing/HeroScene";
import { HeroContent } from "@/components/landing/HeroContent";
import { LandingNav } from "@/components/landing/LandingNav";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      
      <section className="relative min-h-screen grid-pattern">
        <HeroScene />
        <HeroContent />
      </section>

      <FeaturesSection />
      
      <div id="how-it-works">
        <HowItWorksSection />
      </div>
      
      <CTASection />
      <Footer />
    </div>
  );
};

export default Landing;
