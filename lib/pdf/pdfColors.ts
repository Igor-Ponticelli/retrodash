import type { PdfTheme } from "./pdfTypes";

export interface PdfColors {
  bgBase: string;
  bgSurface: string;
  bgCard: string;
  bgElevated: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accentPrimary: string;
  statusPending: string;
  statusDone: string;
  statusKeep: string;
}

// Hex literals transcribed 1:1 from app/globals.css -- the one place these
// values live for the PDF, since react-pdf's StyleSheet can't reference CSS
// custom properties.
export const PDF_COLORS: Record<PdfTheme, PdfColors> = {
  light: {
    bgBase: "#F8F9FC",
    bgSurface: "#F0F2F8",
    bgCard: "#E8EBF4",
    bgElevated: "#ECEEF6",
    border: "#D0D5E8",
    textPrimary: "#0F1117",
    textSecondary: "#4A4F68",
    textMuted: "#8B90A7",
    accentPrimary: "#7B61FF",
    statusPending: "#EA580C",
    statusDone: "#15803D",
    statusKeep: "#7B61FF",
  },
  dark: {
    bgBase: "#0A0B0F",
    bgSurface: "#0F1117",
    bgCard: "#1C1E28",
    bgElevated: "#171921",
    border: "#252836",
    textPrimary: "#F0F2F5",
    textSecondary: "#8B90A7",
    textMuted: "#737899",
    accentPrimary: "#00E5CC",
    statusPending: "#FB923C",
    statusDone: "#4ADE80",
    statusKeep: "#7B61FF",
  },
};
