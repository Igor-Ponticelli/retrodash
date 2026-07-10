import { useTranslations } from "next-intl";
import { BoardColumn } from "@/components/board/Column";
import type { Column, Card, Participant } from "@/types";

interface BoardProps {
  columns: Column[];
  cards: Card[];
  roomId: string;
  userId: string;
  userName: string;
  userPhotoURL: string | null;
  isAnonymous: boolean;
  isFacilitator: boolean;
  isRetroLive?: boolean;
  filterAuthorId?: string | null;
  participants?: Participant[];
  linkingActive?: boolean;
  pendingLinkTarget?: { id: string; text: string } | null;
  linkingSourceCardId?: string | null;
  onStartLinking?: () => void;
  onStartLinkingCard?: (cardId: string) => void;
  onCancelLinking?: () => void;
  onPickLinkTarget?: (card: Card) => void;
}

export function Board({
  columns,
  cards,
  roomId,
  userId,
  userName,
  userPhotoURL,
  isAnonymous,
  isFacilitator,
  isRetroLive = true,
  filterAuthorId,
  participants = [],
  linkingActive = false,
  pendingLinkTarget = null,
  linkingSourceCardId = null,
  onStartLinking,
  onStartLinkingCard,
  onCancelLinking,
  onPickLinkTarget,
}: BoardProps) {
  const t = useTranslations("board");
  const regularCols = columns
    .filter((col) => !col.isActionItems)
    .sort((a, b) => a.order - b.order);

  const actionCol = columns.find((col) => col.isActionItems);

  const visibleCards = cards.filter(
    (c) => c.published !== false || c.authorId === userId,
  );

  const filteredCards = filterAuthorId
    ? visibleCards.filter(
        (c) =>
          c.authorId === filterAuthorId ||
          (c.published === false && c.authorId === userId),
      )
    : visibleCards;

  const actionItemsColumnId = actionCol?.id;
  const colProps = {
    roomId,
    userId,
    userName,
    userPhotoURL,
    isAnonymous,
    isFacilitator,
    isRetroLive,
    actionItemsColumnId,
    allVisibleCards: visibleCards,
    participants,
    linkingActive,
    pendingLinkTarget,
    linkingSourceCardId,
    onStartLinking,
    onStartLinkingCard,
    onCancelLinking,
    onPickLinkTarget,
  };

  return (
    <div className="relative flex h-full overflow-x-auto scrollbar-thin p-3 gap-3 snap-x snap-mandatory lg:snap-none lg:p-4 lg:gap-4">
      {linkingActive && (
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-center gap-3 px-4 py-2 bg-accent-primary/10 border-b border-accent-primary/30 text-xs text-text-primary">
          {t("linkPickerBannerHint")}
          <button
            type="button"
            onClick={onCancelLinking}
            className="text-accent-primary font-semibold hover:underline cursor-pointer"
          >
            {t("cancel")}
          </button>
        </div>
      )}
      {regularCols.map((col) => (
        <div
          key={col.id}
          className="w-[85vw] shrink-0 snap-start lg:flex-1 lg:w-auto lg:min-w-48"
        >
          <BoardColumn
            column={col}
            cards={filteredCards.filter((c) => c.columnId === col.id)}
            {...colProps}
          />
        </div>
      ))}

      {actionCol && (
        <div className="w-[85vw] shrink-0 snap-start lg:flex-1 lg:w-auto lg:min-w-48">
          <BoardColumn
            column={actionCol}
            cards={filteredCards.filter((c) => c.columnId === actionCol.id)}
            {...colProps}
          />
        </div>
      )}
    </div>
  );
}
