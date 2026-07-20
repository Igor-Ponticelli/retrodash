import { getCategoryColor } from "@/lib/categoryColors";

interface CategoryBadgeProps {
  title: string;
  colorId?: string;
}

// Renders a card's denormalized category snapshot. If colorId no longer
// resolves in lib/categoryColors.ts (palette changed, category deleted),
// falls back to a neutral badge instead of breaking — the title snapshot
// alone is still meaningful.
export function CategoryBadge({ title, colorId }: CategoryBadgeProps) {
  const color = getCategoryColor(colorId);
  const classes = color
    ? `${color.bg} ${color.text} ${color.border}`
    : "bg-bg-elevated text-text-muted border-border";

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 h-5 rounded text-[10px] font-semibold border shrink-0 ${classes}`}
    >
      {color && <span className={`size-1.5 rounded-full ${color.dot}`} aria-hidden />}
      {title}
    </span>
  );
}
