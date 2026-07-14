import { pdf } from "@react-pdf/renderer";
import { registerPdfFonts } from "./pdfFonts";
import { RoomSummaryDocument } from "./RoomSummaryDocument";
import type { PdfTheme, PdfTranslations, RoomSummaryPdfData } from "./pdfTypes";

export async function generateSummaryPdf(
  data: RoomSummaryPdfData,
  theme: PdfTheme,
  translations: PdfTranslations,
): Promise<Blob> {
  registerPdfFonts();
  const doc = <RoomSummaryDocument {...data} theme={theme} translations={translations} />;
  return pdf(doc).toBlob();
}
