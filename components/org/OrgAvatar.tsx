import { getCategoryColor } from "@/lib/categoryColors";

interface OrgAvatarProps {
  name: string;
  colorId?: string;
  size?: number;
  className?: string;
}

// Organizations have no photo source (unlike users, who borrow their Google
// account photo) and image upload is deliberately not implemented yet
// (Firebase Storage CORS isn't configured) — so an org's identity is always
// its initial on a picked color, reusing the same palette as categories.
export function OrgAvatar({ name, colorId, size = 24, className = "" }: OrgAvatarProps) {
  const color = getCategoryColor(colorId);
  const sizeStyle = { width: size, height: size, minWidth: size };
  const fontSize = Math.max(10, Math.round(size * 0.4));

  return (
    <div
      style={{ ...sizeStyle, fontSize }}
      className={`rounded-full flex items-center justify-center shrink-0 font-semibold ${
        color ? `${color.bg} ${color.text}` : "bg-bg-elevated border border-border text-text-muted"
      } ${className}`}
    >
      {name[0]?.toUpperCase() ?? "?"}
    </div>
  );
}
