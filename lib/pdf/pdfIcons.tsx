import { Svg, Path, Circle } from "@react-pdf/renderer";

// Hand-ported from components/ui/Icons.tsx (CircleIcon/CheckIcon/LoopIcon/
// ThumbUpIcon) -- react-pdf has no `currentColor`, so color is an explicit prop.
interface PdfIconProps {
  size?: number;
  color: string;
}

export function PdfCircleIcon({ size = 9, color }: PdfIconProps) {
  return (
    <Svg viewBox="0 0 15 15" style={{ width: size, height: size }}>
      <Circle cx={7.5} cy={7.5} r={6} stroke={color} strokeWidth={1.5} fill="none" />
    </Svg>
  );
}

export function PdfCheckIcon({ size = 9, color }: PdfIconProps) {
  return (
    <Svg viewBox="0 0 15 15" style={{ width: size, height: size }}>
      <Path
        d="M2.5 8l4 4L12.5 4"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

export function PdfLoopIcon({ size = 9, color }: PdfIconProps) {
  return (
    <Svg viewBox="0 0 24 24" style={{ width: size, height: size }}>
      <Path d="M17 2l4 4-4 4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M3 11V9a4 4 0 014-4h14" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M7 22l-4-4 4-4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M21 13v2a4 4 0 01-4 4H3" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

export function PdfThumbUpIcon({ size = 9, color }: PdfIconProps) {
  return (
    <Svg viewBox="0 0 12 12" style={{ width: size, height: size }}>
      <Path
        d="M3.5 11V5.5L6 1l.75.375C7 1.5 7 2 6.75 2.5L6 5h4.5a.5.5 0 01.5.5v1a.5.5 0 01-.1.3l-1.5 3.7a.5.5 0 01-.46.5H3.5zM3.5 5.5H1.5V11h2"
        stroke={color}
        strokeWidth={1.1}
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
