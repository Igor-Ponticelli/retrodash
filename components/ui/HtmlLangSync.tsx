"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";

// Root layout can't know the locale server-side; this corrects <html lang> after hydration.
export function HtmlLangSync() {
  const locale = useLocale();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
