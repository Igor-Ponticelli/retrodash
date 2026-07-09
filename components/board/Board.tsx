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
}: BoardProps) {
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
  };

  return (
    <div className="flex h-full overflow-x-auto scrollbar-thin p-3 gap-3 snap-x snap-mandatory lg:snap-none lg:p-4 lg:gap-4">
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
