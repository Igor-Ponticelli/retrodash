import { useTranslations } from "next-intl";
import { Reveal } from "@/components/ui/Reveal";
import { CTALink, type CTAProps } from "@/components/ui/CTALink";

export function FinalCTASection({ ctaHref, ctaLabel }: CTAProps) {
  const t = useTranslations("landing.cta");
  return (
    <section className="py-32 border-t border-border relative overflow-hidden bg-bg-surface">
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-175 h-75 rounded-full bg-accent-cyan/5 blur-[110px]"
          style={{ animation: "glow-pulse 8s ease-in-out infinite" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-100 h-50 rounded-full bg-accent-violet/6 blur-[80px]"
          style={{ animation: "glow-pulse 10s ease-in-out infinite 2s" }}
        />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 lg:px-6 text-center">
        <Reveal>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-accent-cyan mb-6">
              {t("sectionLabel")}
            </p>
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] mb-6">
              {t("title")}{" "}
              <span
                className="block bg-clip-text text-transparent"
                style={{ backgroundImage: "var(--gradient-brand)" }}
              >
                {t("titleGradient")}
              </span>
            </h2>
            <p className="text-text-secondary text-lg mb-10 max-w-md mx-auto leading-relaxed">
              {t("subtitle")}
            </p>
            <div className="flex justify-center">
              <CTALink href={ctaHref} label={ctaLabel} size="lg" variant="gradient" />
            </div>
            <p className="mt-6 text-text-muted text-xs">{t("notice")}</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
