"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ExportIcon, ChevronDownIcon } from "@/components/ui/Icons";
import { Spinner } from "@/components/ui/Spinner";
import type { RegularColumnGroup, PdfTheme, PdfTranslations } from "@/lib/pdf/pdfTypes";
import type { Card, Participant, Room, ScoreboardEntry } from "@/types";

interface ExportPdfMenuProps {
  room: Room;
  endedDate: string | null;
  participants: Participant[];
  scoreboard: ScoreboardEntry[];
  actionCards: Card[];
  newActionItemsCount: number;
  regularColumns: RegularColumnGroup[];
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
  return slug || "retro";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ExportPdfMenu({
  room,
  endedDate,
  participants,
  scoreboard,
  actionCards,
  newActionItemsCount,
  regularColumns,
}: ExportPdfMenuProps) {
  const t = useTranslations("summary");
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "generating" | "error">("idle");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleExport = async (theme: PdfTheme) => {
    setOpen(false);
    setStatus("generating");
    try {
      const { generateSummaryPdf } = await import("@/lib/pdf/generateSummaryPdf");
      const translations: PdfTranslations = {
        retroLabel: t("retroLabel"),
        participants: t("participants"),
        host: t("host"),
        scoreboard: t("scoreboard"),
        scoreboardEmpty: t("scoreboardEmpty"),
        scoreboardCards: t("scoreboardCards"),
        scoreboardActions: t("scoreboardActions"),
        scoreboardLikes: t("scoreboardLikes"),
        scoreboardComments: t("scoreboardComments"),
        scoreboardPoints: t("scoreboardPoints"),
        actionItems: t("actionItems"),
        noActionItems: t("noActionItems"),
        keepGoing: t("keepGoing"),
        carriedOver: t("carriedOver"),
        fromCard: t("fromCard"),
        returnedCount: (count) => t("returnedCount", { count }),
        assignedTo: (name) => t("assignedTo", { name }),
        anonymous: t("anonymous"),
        retroRecap: t("retroRecap"),
        noCards: t("noCards"),
      };
      const blob = await generateSummaryPdf(
        { room, endedDate, participants, scoreboard, actionCards, newActionItemsCount, regularColumns },
        theme,
        translations,
      );
      const dateSlug = room.createdAt.toDate().toISOString().slice(0, 10);
      downloadBlob(blob, `retrodash-${slugify(room.name)}-${dateSlug}.pdf`);
      setStatus("idle");
    } catch (err) {
      console.error("Failed to generate summary PDF", err);
      setStatus("error");
    }
  };

  return (
    <div ref={ref} className="relative self-start shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={status === "generating"}
        aria-expanded={open}
        className="h-9 px-4 rounded-md border border-border text-text-secondary hover:text-text-primary hover:bg-bg-card text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === "generating" ? <Spinner size={14} /> : <ExportIcon />}
        {status === "generating" ? t("exportGenerating") : t("export")}
        {status !== "generating" && <ChevronDownIcon />}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-40 bg-bg-surface border border-border rounded-md shadow-lg overflow-hidden z-50">
          <button
            onClick={() => handleExport("light")}
            className="w-full flex items-center px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-card transition-colors cursor-pointer"
          >
            {t("exportModeLight")}
          </button>
          <button
            onClick={() => handleExport("dark")}
            className="w-full flex items-center px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-card transition-colors cursor-pointer"
          >
            {t("exportModeDark")}
          </button>
        </div>
      )}

      {status === "error" && (
        <p className="absolute right-0 top-full mt-1 text-xs text-red-400 whitespace-nowrap">
          {t("exportError")}
        </p>
      )}
    </div>
  );
}
