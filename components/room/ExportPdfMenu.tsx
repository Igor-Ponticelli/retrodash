"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ExportIcon } from "@/components/ui/Icons";
import { ExportPdfModal } from "@/components/room/ExportPdfModal";
import type { RegularColumnGroup } from "@/lib/pdf/pdfTypes";
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

  return (
    <div className="relative self-start shrink-0">
      <button
        onClick={() => setOpen(true)}
        className="h-9 px-4 rounded-md border border-border text-text-secondary hover:text-text-primary hover:bg-bg-card text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer"
      >
        <ExportIcon />
        {t("export")}
      </button>

      {open && (
        <ExportPdfModal
          room={room}
          endedDate={endedDate}
          participants={participants}
          scoreboard={scoreboard}
          actionCards={actionCards}
          newActionItemsCount={newActionItemsCount}
          regularColumns={regularColumns}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
