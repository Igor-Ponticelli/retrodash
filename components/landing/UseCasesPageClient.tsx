"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { LandingNav } from "./LandingNav";
import { SiteFooter } from "./SiteFooter";
import { Reveal } from "@/components/ui/Reveal";
import { CTALink } from "@/components/ui/CTALink";
import { CheckCircleIcon, PeopleIcon, GlobeIcon, BoardIcon } from "@/components/ui/Icons";

function UseCaseBlock({
  icon,
  label,
  title,
  desc,
  points,
  accent = "cyan",
  flip = false,
}: {
  icon: React.ReactNode;
  label: string;
  title: string;
  desc: string;
  points: string[];
  accent?: "cyan" | "violet";
  flip?: boolean;
}) {
  return (
    <section className={`py-20 border-t border-border ${flip ? "bg-bg-surface" : ""}`}>
      <div className="max-w-6xl mx-auto px-4 lg:px-6">
        <Reveal>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className={flip ? "lg:order-2" : ""}>
              <div className="flex items-center gap-3 mb-5">
                <div
                  className={`size-10 rounded-lg bg-bg-elevated border border-border flex items-center justify-center ${
                    accent === "cyan" ? "text-accent-cyan" : "text-accent-violet"
                  }`}
                >
                  {icon}
                </div>
                <span
                  className={`text-[11px] font-semibold uppercase tracking-widest ${
                    accent === "cyan" ? "text-accent-cyan" : "text-accent-violet"
                  }`}
                >
                  {label}
                </span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight mb-4">{title}</h2>
              <p className="text-text-secondary leading-relaxed mb-6">{desc}</p>
              <ul className="space-y-2.5">
                {points.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm text-text-secondary">
                    <span
                      className={`mt-0.5 shrink-0 ${
                        accent === "cyan" ? "text-accent-cyan" : "text-accent-violet"
                      }`}
                    >
                      <CheckCircleIcon size={15} />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            <div className={`${flip ? "lg:order-1" : ""} flex items-center justify-center`}>
              <div
                className="w-full max-w-sm rounded-2xl bg-bg-card border border-border p-8 flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, var(--color-bg-card) 0%, var(--color-bg-elevated) 100%)",
                }}
              >
                <div
                  className={`size-24 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center ${
                    accent === "cyan" ? "text-accent-cyan" : "text-accent-violet"
                  }`}
                  style={{
                    boxShadow: `0 0 60px ${accent === "cyan" ? "var(--color-accent-cyan)" : "var(--color-accent-violet)"}20`,
                  }}
                >
                  <div className="scale-[2.5]">{icon}</div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function UseCasesPageClient() {
  const { user } = useAuth();
  const t = useTranslations("useCasesPage");
  const tLanding = useTranslations("landing");
  const ctaHref = user ? "/dashboard" : "/login";
  const ctaLabel = tLanding("nav.getStarted");

  const cases = [
    {
      icon: <PeopleIcon size={20} />,
      label: t("scrumLabel"),
      title: t("scrumTitle"),
      desc: t("scrumDesc"),
      points: [t("scrumPoint1"), t("scrumPoint2"), t("scrumPoint3"), t("scrumPoint4")],
      accent: "cyan" as const,
      flip: false,
    },
    {
      icon: <GlobeIcon size={20} />,
      label: t("remoteLabel"),
      title: t("remoteTitle"),
      desc: t("remoteDesc"),
      points: [t("remotePoint1"), t("remotePoint2"), t("remotePoint3"), t("remotePoint4")],
      accent: "violet" as const,
      flip: true,
    },
    {
      icon: <BoardIcon />,
      label: t("productLabel"),
      title: t("productTitle"),
      desc: t("productDesc"),
      points: [t("productPoint1"), t("productPoint2"), t("productPoint3"), t("productPoint4")],
      accent: "cyan" as const,
      flip: false,
    },
  ];

  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex flex-col overflow-x-hidden">
      <LandingNav ctaHref={ctaHref} ctaLabel={ctaLabel} />
      <main className="flex-1">
        <section className="relative py-28 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div
              className="absolute top-1/3 left-1/4 w-130 h-90 rounded-full bg-accent-cyan/5 blur-[130px]"
              style={{ animation: "glow-pulse 9s ease-in-out infinite" }}
            />
            <div
              className="absolute bottom-1/3 right-1/4 w-110 h-80 rounded-full bg-accent-violet/5 blur-[110px]"
              style={{ animation: "glow-pulse 11s ease-in-out infinite 4s" }}
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

        {cases.map((c) => (
          <UseCaseBlock key={c.label} {...c} />
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
