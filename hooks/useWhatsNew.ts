"use client";

import { useWhatsNewContext } from "@/components/whatsnew/WhatsNewProvider";

export function useWhatsNew() {
  return useWhatsNewContext();
}
