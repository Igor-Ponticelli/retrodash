import { Link } from "@/i18n/navigation";

export interface CTAProps {
  ctaHref: string;
  ctaLabel: string;
}

interface CTALinkProps {
  href: string;
  label: string;
  loading?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "solid" | "gradient";
}

const sizes: Record<"sm" | "md" | "lg", string> = {
  sm: "h-7 px-3.5 text-xs sm:h-8 sm:px-4",
  md: "h-8 px-4 text-sm sm:h-9 sm:px-5",
  lg: "h-10 px-6 text-sm sm:h-11 sm:px-7",
};

export function CTALink({
  href,
  label,
  loading = false,
  size = "md",
  variant = "solid",
}: CTALinkProps) {
  return (
    <Link
      href={href}
      aria-disabled={loading}
      className={`inline-flex items-center justify-center rounded-lg font-semibold text-bg-base hover:opacity-90 transition-opacity ${sizes[size]} ${variant === "solid" ? "bg-cta" : ""} ${loading ? "opacity-50 pointer-events-none" : ""}`}
      style={
        variant === "gradient"
          ? { backgroundImage: "var(--gradient-brand)" }
          : undefined
      }
    >
      {label}
    </Link>
  );
}
