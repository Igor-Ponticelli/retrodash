import { Font } from "@react-pdf/renderer";

let registered = false;

// The on-screen font (next/font/google) emits hashed build-time filenames
// that aren't stable paths we can reference at PDF-generation time, so the
// PDF embeds its own static copy instead (see public/fonts/).
export function registerPdfFonts() {
  if (registered) return;
  registered = true;
  Font.register({
    family: "Plus Jakarta Sans",
    fonts: [
      { src: "/fonts/PlusJakartaSans-Regular.woff", fontWeight: 400 },
      { src: "/fonts/PlusJakartaSans-Medium.woff", fontWeight: 500 },
      { src: "/fonts/PlusJakartaSans-SemiBold.woff", fontWeight: 600 },
      { src: "/fonts/PlusJakartaSans-Bold.woff", fontWeight: 700 },
      { src: "/fonts/PlusJakartaSans-Italic.woff", fontWeight: 400, fontStyle: "italic" },
    ],
  });
}
