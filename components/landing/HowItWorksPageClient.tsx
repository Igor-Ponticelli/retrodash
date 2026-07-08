"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { LandingNav } from "./LandingNav";
import { SiteFooter } from "./SiteFooter";
import { Reveal } from "@/components/ui/Reveal";
import { CTALink } from "@/components/ui/CTALink";

function PhaseStep({
  number,
  title,
  desc,
  delay,
}: {
  number: string;
  title: string;
  desc: string;
  delay: number;
}) {
  return (
    <Reveal delay={delay}>
      <div className="flex gap-5">
        <div className="flex flex-col items-center">
          <div
            className="size-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-text-primary"
            style={{
              background:
                "linear-gradient(var(--color-bg-surface), var(--color-bg-surface)) padding-box, var(--gradient-brand) border-box",
              border: "1.5px solid transparent",
            }}
          >
            {number}
          </div>
          <div className="w-px flex-1 mt-3 bg-border last:hidden" />
        </div>
        <div className="pb-10">
          <h3 className="font-semibold text-text-primary text-base mb-1.5">{title}</h3>
          <p className="text-text-secondary text-sm leading-relaxed">{desc}</p>
        </div>
      </div>
    </Reveal>
  );
}

export function HowItWorksPageClient() {
  const { user } = useAuth();
  const t = useTranslations("howItWorksPage");
  const tLanding = useTranslations("landing");
  const ctaHref = user ? "/dashboard" : "/login";
  const ctaLabel = tLanding("nav.getStarted");

  const phases = [
    {
      label: t("phase1Label"),
      title: t("phase1Title"),
      steps: [
        { n: "01", title: t("step1Title"), desc: t("step1Desc") },
        { n: "02", title: t("step2Title"), desc: t("step2Desc") },
        { n: "03", title: t("step3Title"), desc: t("step3Desc") },
      ],
    },
    {
      label: t("phase2Label"),
      title: t("phase2Title"),
      steps: [
        { n: "04", title: t("step4Title"), desc: t("step4Desc") },
        { n: "05", title: t("step5Title"), desc: t("step5Desc") },
        { n: "06", title: t("step6Title"), desc: t("step6Desc") },
        { n: "07", title: t("step7Title"), desc: t("step7Desc") },
      ],
    },
    {
      label: t("phase3Label"),
      title: t("phase3Title"),
      steps: [
        { n: "08", title: t("step8Title"), desc: t("step8Desc") },
        { n: "09", title: t("step9Title"), desc: t("step9Desc") },
        { n: "10", title: t("step10Title"), desc: t("step10Desc") },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex flex-col overflow-x-hidden">
      <LandingNav ctaHref={ctaHref} ctaLabel={ctaLabel} />
      <main className="flex-1">
        <section className="relative py-28 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div
              className="absolute top-1/4 right-1/3 w-120 h-80 rounded-full bg-accent-violet/5 blur-[120px]"
              style={{ animation: "glow-pulse 10s ease-in-out infinite" }}
            />
            <div
              className="absolute bottom-1/4 left-1/3 w-100 h-70 rounded-full bg-accent-cyan/5 blur-[100px]"
              style={{ animation: "glow-pulse 8s ease-in-out infinite 2s" }}
            />
          </div>
          <div className="relative max-w-3xl mx-auto px-4 lg:px-6 text-center">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-card border border-border text-[11px] font-semibold uppercase tracking-widest text-text-muted mb-6"
              style={{ animation: "fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0ms both" }}
            >
              <span className="size-1.5 rounded-full bg-accent-cyan animate-pulse" />
              {t("heroBadge")}
            </div>
            <h1
              className="text-4xl lg:text-5xl font-bold leading-[1.1] tracking-tight mb-6"
              style={{ animation: "fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) 100ms both" }}
            >
              {t("heroTitle")}{" "}
              <span
                className="block bg-clip-text text-transparent"
                style={{ backgroundImage: "var(--gradient-brand)" }}
              >
                {t("heroGradient")}
              </span>
            </h1>
            <p
              className="text-lg text-text-secondary leading-relaxed max-w-xl mx-auto"
              style={{ animation: "fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) 200ms both" }}
            >
              {t("heroSubtitle")}
            </p>
          </div>
        </section>

        {phases.map((phase, pi) => (
          <section
            key={phase.label}
            className={`py-20 border-t border-border ${pi % 2 === 1 ? "bg-bg-surface" : ""}`}
          >
            <div className="max-w-6xl mx-auto px-4 lg:px-6">
              <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12 items-start">
                <Reveal>
                  <div className="lg:sticky lg:top-24">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-accent-cyan mb-2">
                      {phase.label}
                    </p>
                    <h2 className="text-2xl font-bold tracking-tight">{phase.title}</h2>
                  </div>
                </Reveal>

                <div>
                  {phase.steps.map((step, si) => (
                    <PhaseStep
                      key={step.n}
                      number={step.n}
                      title={step.title}
                      desc={step.desc}
                      delay={si * 80}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>
        ))}

        <section className="py-20 border-t border-border bg-bg-surface">
          <div className="max-w-3xl mx-auto px-4 lg:px-6 text-center">
            <Reveal>
              <h2 className="text-3xl font-bold tracking-tight mb-4">{t("ctaTitle")}</h2>
              <p className="text-text-secondary mb-8">{t("ctaSubtitle")}</p>
              <CTALink href={ctaHref} label={ctaLabel} size="lg" variant="gradient" />
            </Reveal>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
