// Hex literals for Tailwind's default `-400` shade, same static-copy
// tradeoff as pdfColors.ts: react-pdf can't read Tailwind classes or CSS
// custom properties, so each category color needs a real hex value here.
// Keep in sync with lib/categoryColors.ts's CATEGORY_COLORS ids if the
// palette ever changes.
export const PDF_CATEGORY_COLORS: Record<string, string> = {
  red: "#F87171",
  orange: "#FB923C",
  amber: "#FBBF24",
  lime: "#A3E635",
  emerald: "#34D399",
  cyan: "#22D3EE",
  blue: "#60A5FA",
  violet: "#A78BFA",
  pink: "#F472B6",
  slate: "#94A3B8",
};

export function getPdfCategoryColor(colorId: string | undefined): string | undefined {
  return colorId ? PDF_CATEGORY_COLORS[colorId] : undefined;
}
