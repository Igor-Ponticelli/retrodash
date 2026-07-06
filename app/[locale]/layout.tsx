import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { routing } from "@/i18n/routing";
import "../globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
});

const BASE_URL = "https://retrodash.vercel.app";

const meta = {
  en: {
    title: "RetroDash — Reflect Together. Improve Always.",
    description:
      "Run structured retrospectives with your Scrum or Kanban team in real time. Private rooms, cards, voting, and action items — all in one place.",
    alt: "RetroDash — Reflect Together. Improve Always.",
  },
  "pt-BR": {
    title: "RetroDash — Reflita Juntos. Melhore Sempre.",
    description:
      "Conduza retrospectivas estruturadas com seu time Scrum ou Kanban em tempo real. Salas privadas, cards, votação e itens de ação — tudo em um só lugar.",
    alt: "RetroDash — Reflita Juntos. Melhore Sempre.",
  },
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = meta[locale as keyof typeof meta] ?? meta[routing.defaultLocale];

  return {
    title: t.title,
    description: t.description,
    metadataBase: new URL(BASE_URL),
    robots: { index: true, follow: true },
    openGraph: {
      title: t.title,
      description: t.description,
      url: BASE_URL,
      siteName: "RetroDash",
      locale: locale === "pt-BR" ? "pt_BR" : "en_US",
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: t.alt }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t.title,
      description: t.description,
      images: ["/og-image.png"],
    },
  };
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "pt-BR" }];
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${jakarta.variable} h-full`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans antialiased">
        <ThemeProvider>
          <NextIntlClientProvider messages={messages}>
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
