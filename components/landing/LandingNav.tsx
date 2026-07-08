"use client";

import { useTranslations } from "next-intl";
import { WordmarkLogo } from "@/components/ui/WordmarkLogo";
import { CTALink, type CTAProps } from "@/components/ui/CTALink";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Link, usePathname } from "@/i18n/navigation";

export function LandingNav({ ctaHref, ctaLabel }: CTAProps) {
  const t = useTranslations("landing");
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 bg-bg-base/80 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
        <WordmarkLogo />
        <nav className="flex items-center gap-5">
          <div className="hidden sm:flex items-center gap-5">
            {(
              [
                { href: "/features", label: t("nav.features") },
                { href: "/how-it-works", label: t("nav.howItWorks") },
                { href: "/use-cases", label: t("nav.useCases") },
              ] as const
            ).map(({ href, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`text-sm transition-colors relative ${
                    active
                      ? "text-text-primary font-medium after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-[1.5px] after:rounded-full after:bg-accent-cyan"
                      : "text-text-muted hover:text-text-secondary"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle variant="dropdown" />
            <LanguageSwitcher />
          </div>
          <span aria-hidden className="text-border hidden sm:block">
            |
          </span>
          <CTALink href={ctaHref} label={ctaLabel} size="sm" />
        </nav>
      </div>
    </header>
  );
}
