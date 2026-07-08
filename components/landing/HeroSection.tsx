import { useTranslations } from "next-intl";
import { CTALink, type CTAProps } from "@/components/ui/CTALink";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { BoardPreview } from "./BoardPreview";

export function HeroSection({ ctaHref, ctaLabel }: CTAProps) {
  const t = useTranslations("landing");
  return (
    <section className="relative min-h-[88vh] flex items-center overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div
          className="absolute top-1/4 left-1/4 w-130 h-105 rounded-full bg-accent-cyan/6 blur-[130px]"
          style={{ animation: "glow-pulse 9s ease-in-out infinite" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-110 h-90 rounded-full bg-accent-violet/6 blur-[110px]"
          style={{ animation: "glow-pulse 12s ease-in-out infinite 3s" }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 lg:px-6 py-24 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-card border border-border text-[11px] font-semibold uppercase tracking-widest text-text-muted"
            style={{
              animation: "fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0ms both",
            }}
          >
            <span className="size-1.5 rounded-full bg-accent-cyan animate-pulse" />
            {t("hero.badge")}
          </div>

          <div
            style={{
              animation:
                "fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) 100ms both",
            }}
          >
            <h1 className="text-5xl lg:text-[4rem] font-bold leading-[1.1] tracking-tight">
              {t("hero.title")}{" "}
              <span
                className="block bg-clip-text text-transparent"
                style={{ backgroundImage: "var(--gradient-brand)" }}
              >
                {t("hero.titleGradient")}
              </span>
            </h1>
            <p className="mt-6 text-lg text-text-secondary leading-relaxed max-w-md">
              {t("hero.subtitle")}
            </p>
          </div>

          <div
            className="flex items-center gap-5 flex-wrap"
            style={{
              animation:
                "fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) 220ms both",
            }}
          >
            <CTALink href={ctaHref} label={ctaLabel} size="lg" />
            <a
              href="#how-it-works"
              className="text-text-muted hover:text-text-primary text-sm transition-colors inline-flex items-center gap-1.5"
            >
              {t("hero.seeHowItWorks")}
              <ArrowRightIcon />
            </a>
          </div>

          <p
            className="text-text-muted text-xs"
            style={{
              animation:
                "fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) 320ms both",
            }}
          >
            {t("hero.freeNotice")}
          </p>
        </div>

        <div
          className="hidden lg:block"
          style={{
            animation: "fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) 150ms both",
          }}
        >
          <BoardPreview />
        </div>
      </div>
    </section>
  );
}
