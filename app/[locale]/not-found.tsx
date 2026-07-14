import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { RetroDashLogo } from "@/components/ui/RetroDashLogo";

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-60 left-1/2 -translate-x-1/2 size-160 rounded-full bg-accent-primary/4 blur-3xl" />
        <div className="absolute -bottom-60 left-1/2 -translate-x-1/2 size-160 rounded-full bg-accent-violet/5 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-md">
        <Link href="/" className="mb-12 opacity-80 hover:opacity-100 transition-opacity">
          <RetroDashLogo width={160} />
        </Link>

        <p
          className="text-[88px] font-extrabold leading-none tracking-tight mb-2"
          style={{
            background: "var(--gradient-brand)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          404
        </p>

        <h1 className="text-2xl font-bold text-text-primary mb-3">{t("title")}</h1>
        <p className="text-text-secondary text-base leading-relaxed mb-10">{t("subtitle")}</p>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-md bg-cta text-bg-base text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            {t("goToDashboard")}
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-md border border-border text-text-secondary text-sm font-semibold hover:border-accent-primary hover:text-text-primary transition-colors"
          >
            {t("backToHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}
