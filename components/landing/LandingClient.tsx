"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { LandingNav } from "./LandingNav";
import { HeroSection } from "./HeroSection";
import { FeaturesSection } from "./FeaturesSection";
import { WhySection } from "./WhySection";
import { HowItWorksSection } from "./HowItWorksSection";
import { UseCasesSection } from "./UseCasesSection";
import { FinalCTASection } from "./FinalCTASection";
import { SiteFooter } from "./SiteFooter";

export function LandingClient() {
  const { user } = useAuth();
  const t = useTranslations("landing");
  const ctaHref = user ? "/dashboard" : "/login";
  const ctaLabel = t("nav.getStarted");

  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex flex-col overflow-x-hidden">
      <LandingNav ctaHref={ctaHref} ctaLabel={ctaLabel} />
      <main className="flex-1">
        <HeroSection ctaHref={ctaHref} ctaLabel={ctaLabel} />
        <FeaturesSection />
        <WhySection />
        <HowItWorksSection />
        <UseCasesSection />
        <FinalCTASection ctaHref={ctaHref} ctaLabel={ctaLabel} />
      </main>
      <SiteFooter />
    </div>
  );
}
