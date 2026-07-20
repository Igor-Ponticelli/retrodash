"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { SunIcon, MoonIcon, CheckIcon } from "@/components/ui/Icons";
import {
  DEFAULT_PDF_SECTION_ORDER,
  type PdfSectionKey,
  type PdfSections,
  type PdfTheme,
  type PdfTranslations,
  type RegularColumnGroup,
} from "@/lib/pdf/pdfTypes";
import type { Card, Organization, Participant, Room, ScoreboardEntry } from "@/types";

interface ExportPdfModalProps {
  room: Room;
  organization: Pick<Organization, "name" | "colorId"> | null;
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
  organization,
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
  const [sectionOrder, setSectionOrder] = useState<PdfSectionKey[]>(() =>
    room.isAnonymous ? DEFAULT_PDF_SECTION_ORDER.filter((key) => key !== "scoreboard") : DEFAULT_PDF_SECTION_ORDER,
  );
  const [selectedColumnIds, setSelectedColumnIds] = useState<Set<string>>(
    () => new Set(regularColumns.map((g) => g.column.id)),
  );
  const [status, setStatus] = useState<"idle" | "generating" | "error">("idle");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function toggleSection(key: keyof PdfSections) {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleSectionDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSectionOrder((prev) => {
      const oldIndex = prev.indexOf(active.id as PdfSectionKey);
      const newIndex = prev.indexOf(over.id as PdfSectionKey);
      return arrayMove(prev, oldIndex, newIndex);
    });
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

  const sectionLabels: Record<PdfSectionKey, string> = {
    participants: t("participants"),
    scoreboard: t("scoreboard"),
    actionItems: t("actionItems"),
    retroRecap: t("retroRecap"),
  };

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
          organization,
          endedDate,
          participants,
          scoreboard,
          actionCards,
          newActionItemsCount,
          regularColumns,
          sections,
          sectionOrder,
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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
            <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
              <div className="space-y-1">
                {sectionOrder.map((key) => (
                  <SortableSectionRow
                    key={key}
                    id={key}
                    checked={sections[key]}
                    label={sectionLabels[key]}
                    dragLabel={t("exportReorderSection", { section: sectionLabels[key] })}
                    onToggle={() => toggleSection(key)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
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

function SortableSectionRow({
  id,
  checked,
  label,
  dragLabel,
  onToggle,
}: {
  id: PdfSectionKey;
  checked: boolean;
  label: string;
  dragLabel: string;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1 rounded-md ${isDragging ? "relative z-10 bg-bg-elevated" : ""}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={dragLabel}
        className="shrink-0 p-1.5 text-text-muted hover:text-text-primary transition-colors cursor-grab active:cursor-grabbing touch-none"
      >
        <GripIcon />
      </button>
      <div className="flex-1 min-w-0">
        <SectionCheckbox checked={checked} label={label} onClick={onToggle} />
      </div>
    </div>
  );
}

function GripIcon() {
  return (
    <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" aria-hidden>
      <circle cx="2.5" cy="2.5" r="1.4" />
      <circle cx="7.5" cy="2.5" r="1.4" />
      <circle cx="2.5" cy="8" r="1.4" />
      <circle cx="7.5" cy="8" r="1.4" />
      <circle cx="2.5" cy="13.5" r="1.4" />
      <circle cx="7.5" cy="13.5" r="1.4" />
    </svg>
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
