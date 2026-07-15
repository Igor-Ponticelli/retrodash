"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { SunIcon, MoonIcon, CheckIcon } from "@/components/ui/Icons";
import type { PdfSections, PdfTheme, PdfTranslations, RegularColumnGroup } from "@/lib/pdf/pdfTypes";
import type { Card, Participant, Room, ScoreboardEntry } from "@/types";

interface ExportPdfModalProps {
  room: Room;
  endedDate: string | null;
  participants: Participant[];
  scoreboard: ScoreboardEntry[];
  actionCards: Card[];
  newActionItemsCount: number;
  regularColumns: RegularColumnGroup[];
  onClose: () => void;
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

export function ExportPdfModal({
  room,
  endedDate,
  participants,
  scoreboard,
  actionCards,
  newActionItemsCount,
  regularColumns,
  onClose,
}: ExportPdfModalProps) {
  const t = useTranslations("summary");
  const [theme, setTheme] = useState<PdfTheme>("light");
  const [sections, setSections] = useState<PdfSections>({
    participants: true,
    scoreboard: !room.isAnonymous,
    actionItems: true,
    retroRecap: true,
  });
  const [selectedColumnIds, setSelectedColumnIds] = useState<Set<string>>(
    () => new Set(regularColumns.map((g) => g.column.id)),
  );
  const [status, setStatus] = useState<"idle" | "generating" | "error">("idle");

  function toggleSection(key: keyof PdfSections) {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function toggleColumn(columnId: string) {
    setSelectedColumnIds((prev) => {
      const next = new Set(prev);
      if (next.has(columnId)) next.delete(columnId);
      else next.add(columnId);
      return next;
    });
  }

  const allColumnsSelected = regularColumns.length > 0 && selectedColumnIds.size === regularColumns.length;
  function toggleAllColumns() {
    setSelectedColumnIds(allColumnsSelected ? new Set() : new Set(regularColumns.map((g) => g.column.id)));
  }

  async function handleGenerate() {
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
        {
          room,
          endedDate,
          participants,
          scoreboard,
          actionCards,
          newActionItemsCount,
          regularColumns,
          sections,
          selectedColumnIds: Array.from(selectedColumnIds),
        },
        theme,
        translations,
      );
      const dateSlug = room.createdAt.toDate().toISOString().slice(0, 10);
      downloadBlob(blob, `retrodash-${slugify(room.name)}-${dateSlug}.pdf`);
      onClose();
    } catch (err) {
      console.error("Failed to generate summary PDF", err);
      setStatus("error");
    }
  }

  return (
    <Modal title={t("exportConfigTitle")} onClose={onClose} size="md">
      <div className="space-y-5">
        <div>
          <p className="text-text-primary text-sm font-medium mb-2">{t("exportAppearance")}</p>
          <div className="flex gap-2">
            <ThemePill
              active={theme === "light"}
              label={t("exportModeLight")}
              icon={<SunIcon size={13} />}
              onClick={() => setTheme("light")}
            />
            <ThemePill
              active={theme === "dark"}
              label={t("exportModeDark")}
              icon={<MoonIcon size={13} />}
              onClick={() => setTheme("dark")}
            />
          </div>
        </div>

        <div>
          <p className="text-text-primary text-sm font-medium mb-2">{t("exportSections")}</p>
          <div className="space-y-1">
            <SectionCheckbox
              checked={sections.participants}
              label={t("participants")}
              onClick={() => toggleSection("participants")}
            />
            {!room.isAnonymous && (
              <SectionCheckbox
                checked={sections.scoreboard}
                label={t("scoreboard")}
                onClick={() => toggleSection("scoreboard")}
              />
            )}
            <SectionCheckbox
              checked={sections.actionItems}
              label={t("actionItems")}
              onClick={() => toggleSection("actionItems")}
            />
            <SectionCheckbox
              checked={sections.retroRecap}
              label={t("retroRecap")}
              onClick={() => toggleSection("retroRecap")}
            />
          </div>
        </div>

        {sections.retroRecap && regularColumns.length > 0 && (
          <div className="pl-4 border-l border-border space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-text-secondary text-xs font-medium">{t("exportColumns")}</p>
              <button
                type="button"
                onClick={toggleAllColumns}
                className="text-accent-primary text-xs font-medium hover:opacity-80 transition-opacity cursor-pointer"
              >
                {allColumnsSelected ? t("exportDeselectAllColumns") : t("exportSelectAllColumns")}
              </button>
            </div>
            <div className="space-y-1">
              {regularColumns.map(({ column }) => (
                <SectionCheckbox
                  key={column.id}
                  checked={selectedColumnIds.has(column.id)}
                  label={column.title}
                  onClick={() => toggleColumn(column.id)}
                />
              ))}
            </div>
          </div>
        )}

        {status === "error" && <p className="text-xs text-red-400">{t("exportError")}</p>}

        <div className="flex gap-2 justify-end pt-1">
          <Button variant="ghost-text" size="sm" onClick={onClose} disabled={status === "generating"}>
            {t("exportCancel")}
          </Button>
          <Button size="sm" onClick={handleGenerate} disabled={status === "generating"}>
            {status === "generating" && <Spinner size={14} />}
            {status === "generating" ? t("exportGenerating") : t("exportGenerate")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ThemePill({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex-1 flex items-center justify-center gap-2 h-9 rounded-md border text-sm font-medium transition-colors cursor-pointer ${
        active
          ? "border-accent-primary text-accent-primary bg-accent-primary/10"
          : "border-border text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function SectionCheckbox({
  checked,
  label,
  onClick,
}: {
  checked: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-bg-elevated transition-colors text-left cursor-pointer"
    >
      <span
        className={`shrink-0 size-4 rounded-sm border flex items-center justify-center transition-colors ${
          checked ? "bg-accent-primary border-accent-primary text-bg-base" : "border-border bg-bg-elevated"
        }`}
        aria-hidden
      >
        {checked && <CheckIcon size={10} />}
      </span>
      <span className="text-sm text-text-primary">{label}</span>
    </button>
  );
}
