// Fixed palette for org categories — colorId is stored on the category doc
// and on cards that link to it, never a raw hex value (same reasoning as
// pdfColors.ts's documented static-copy tradeoff: this keeps the palette
// swappable later with zero data migration). Mirrors the
// `bg-{color}-400/20 text-{color}-400 border-{color}-400/30` composition
// already established by ScoreboardSection's POSITION_STYLES.
export interface CategoryColor {
  id: string;
  dot: string;
  bg: string;
  text: string;
  border: string;
}

export const CATEGORY_COLORS: CategoryColor[] = [
  { id: "red", dot: "bg-red-400", bg: "bg-red-400/15", text: "text-red-400", border: "border-red-400/30" },
  { id: "orange", dot: "bg-orange-400", bg: "bg-orange-400/15", text: "text-orange-400", border: "border-orange-400/30" },
  { id: "amber", dot: "bg-amber-400", bg: "bg-amber-400/15", text: "text-amber-400", border: "border-amber-400/30" },
  { id: "lime", dot: "bg-lime-400", bg: "bg-lime-400/15", text: "text-lime-500 dark:text-lime-400", border: "border-lime-400/30" },
  { id: "emerald", dot: "bg-emerald-400", bg: "bg-emerald-400/15", text: "text-emerald-400", border: "border-emerald-400/30" },
  { id: "cyan", dot: "bg-cyan-400", bg: "bg-cyan-400/15", text: "text-cyan-500 dark:text-cyan-400", border: "border-cyan-400/30" },
  { id: "blue", dot: "bg-blue-400", bg: "bg-blue-400/15", text: "text-blue-400", border: "border-blue-400/30" },
  { id: "violet", dot: "bg-violet-400", bg: "bg-violet-400/15", text: "text-violet-400", border: "border-violet-400/30" },
  { id: "pink", dot: "bg-pink-400", bg: "bg-pink-400/15", text: "text-pink-400", border: "border-pink-400/30" },
  { id: "slate", dot: "bg-slate-400", bg: "bg-slate-400/15", text: "text-slate-500 dark:text-slate-400", border: "border-slate-400/30" },
];

export const CATEGORY_COLOR_IDS = CATEGORY_COLORS.map((c) => c.id);

export function getCategoryColor(colorId: string | undefined): CategoryColor | undefined {
  return CATEGORY_COLORS.find((c) => c.id === colorId);
}
