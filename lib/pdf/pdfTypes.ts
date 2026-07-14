import type { Card, Column, Participant, Room, ScoreboardEntry } from "@/types";

export type PdfTheme = "light" | "dark";

export interface PdfTranslations {
  retroLabel: string;
  participants: string;
  host: string;
  scoreboard: string;
  scoreboardEmpty: string;
  scoreboardCards: string;
  scoreboardActions: string;
  scoreboardLikes: string;
  scoreboardComments: string;
  scoreboardPoints: string;
  actionItems: string;
  noActionItems: string;
  keepGoing: string;
  carriedOver: string;
  fromCard: string;
  returnedCount: (count: number) => string;
  assignedTo: (name: string) => string;
  anonymous: string;
  retroRecap: string;
  noCards: string;
}

export interface RegularColumnGroup {
  column: Column;
  cards: Card[];
}

export interface RoomSummaryPdfData {
  room: Room;
  endedDate: string | null;
  participants: Participant[];
  scoreboard: ScoreboardEntry[];
  actionCards: Card[];
  // On-screen the section badge counts only new (non-carried-over) items,
  // even though carried-over items are still rendered in the list below --
  // kept separate from actionCards.length to mirror that exactly.
  newActionItemsCount: number;
  regularColumns: RegularColumnGroup[];
}
