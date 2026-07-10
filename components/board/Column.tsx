"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { addCard } from "@/lib/firestore";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { CardItem } from "@/components/board/Card";
import type { Column, Card, Participant } from "@/types";

interface ColumnProps {
  column: Column;
  cards: Card[];
  roomId: string;
  userId: string;
  userName: string;
  userPhotoURL: string | null;
  isAnonymous: boolean;
  isFacilitator: boolean;
  isRetroLive?: boolean;
  actionItemsColumnId?: string;
  allVisibleCards?: Card[];
  participants?: Participant[];
  linkingActive?: boolean;
  pendingLinkTarget?: { id: string; text: string } | null;
  linkingSourceCardId?: string | null;
  onStartLinking?: () => void;
  onStartLinkingCard?: (cardId: string) => void;
  onCancelLinking?: () => void;
  onPickLinkTarget?: (card: Card) => void;
}

export function BoardColumn({
  column,
  cards,
  roomId,
  userId,
  userName,
  userPhotoURL,
  isAnonymous,
  isFacilitator,
  isRetroLive = true,
  actionItemsColumnId,
  allVisibleCards = [],
  participants = [],
  linkingActive = false,
  pendingLinkTarget = null,
  linkingSourceCardId = null,
  onStartLinking,
  onStartLinkingCard,
  onCancelLinking,
  onPickLinkTarget,
}: ColumnProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [newText, setNewText] = useState("");
  const [adding, setAdding] = useState(false);
  const [improving, setImproving] = useState(false);
  const [previousText, setPreviousText] = useState<string | null>(null);

  const startClose = () => {
    setIsClosing(true);
    if (column.isActionItems) onCancelLinking?.();
  };
  const handleCloseAnimationEnd = () => {
    if (isClosing) {
      setIsClosing(false);
      setIsAdding(false);
      setNewText("");
      setPreviousText(null);
    }
  };
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const t = useTranslations("board");

  const MAX_CHARS = 320;
  const overLimit = newText.length > MAX_CHARS;

  const handleAddCard = async () => {
    const text = newText.trim();
    if (!text || overLimit) return;
    setAdding(true);
    await addCard(roomId, {
      columnId: column.id,
      text,
      authorId: userId,
      authorName: isAnonymous ? "" : userName,
      authorPhotoURL: isAnonymous ? null : userPhotoURL,
      isActionItem: column.isActionItems,
      ...(column.isActionItems &&
        pendingLinkTarget && {
          linkedCardId: pendingLinkTarget.id,
          linkedCardText: pendingLinkTarget.text,
        }),
    });
    setNewText("");
    setAdding(false);
    startClose();
  };

  const handleAddLinkedActionItem = async (
    linkedCardId: string,
    linkedCardText: string,
    text: string,
  ) => {
    if (!actionItemsColumnId) return;
    await addCard(roomId, {
      columnId: actionItemsColumnId,
      text,
      authorId: userId,
      authorName: isAnonymous ? "" : userName,
      authorPhotoURL: isAnonymous ? null : userPhotoURL,
      isActionItem: true,
      linkedCardId,
      linkedCardText,
    });
  };

  const handleImprove = async () => {
    if (!newText.trim() || improving) return;
    setImproving(true);
    try {
      const res = await fetch("/api/improve-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: newText,
          type: column.isActionItems ? "action" : "card",
        }),
      });
      const data = await res.json();
      if (data.improved) {
        setPreviousText(newText);
        setNewText(data.improved);
      }
    } finally {
      setImproving(false);
    }
  };

  const handleUndoImprove = () => {
    if (previousText === null) return;
    setNewText(previousText);
    setPreviousText(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!overLimit) handleAddCard();
    }
    if (e.key === "Escape") {
      startClose();
    }
  };

  const headerAccent = column.isActionItems
    ? "var(--color-accent-primary)"
    : "var(--color-text-muted)";

  return (
    <div className="relative w-full h-full flex flex-col bg-bg-surface rounded-lg border border-border">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          {column.isActionItems && (
            <span style={{ color: headerAccent }}>
              <CheckIcon />
            </span>
          )}
          <h2 className="font-semibold text-sm text-text-primary">
            {column.isActionItems ? t("actionItems") : column.title}
          </h2>
        </div>
        <span className="text-xs text-text-muted bg-bg-elevated px-2 py-0.5 rounded-full">
          {cards.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2 min-h-0">
        {[...cards]
          .filter((c) => c.published !== false || c.authorId !== userId)
          .sort((a, b) => {
            const aTime = (a.publishedAt ?? a.createdAt)?.seconds ?? 0;
            const bTime = (b.publishedAt ?? b.createdAt)?.seconds ?? 0;
            return aTime - bTime;
          })
          .map((card) => (
            <div key={card.id} className="animate-[card-in_0.22s_ease-out]">
              <CardItem
                card={card}
                roomId={roomId}
                userId={userId}
                currentUserName={userName}
                currentUserPhotoURL={userPhotoURL}
                isAnonymous={isAnonymous}
                isFacilitator={isFacilitator}
                isRetroLive={isRetroLive}
                isActionItem={column.isActionItems}
                linkedActionItems={
                  !column.isActionItems && actionItemsColumnId
                    ? allVisibleCards.filter((c) => c.linkedCardId === card.id)
                    : undefined
                }
                onAddLinkedActionItem={
                  !column.isActionItems && actionItemsColumnId
                    ? (text) =>
                        handleAddLinkedActionItem(card.id, card.text, text)
                    : undefined
                }
                linkedCard={
                  column.isActionItems && card.linkedCardId
                    ? allVisibleCards.find((c) => c.id === card.linkedCardId)
                    : undefined
                }
                participants={participants}
                linkingActive={linkingActive}
                isLinkTarget={!column.isActionItems && card.published !== false}
                onPickLinkTarget={
                  !column.isActionItems ? onPickLinkTarget : undefined
                }
                linkingSourceCardId={linkingSourceCardId}
                onStartLinkingCard={
                  column.isActionItems ? onStartLinkingCard : undefined
                }
              />
            </div>
          ))}
      </div>

      {cards.some((c) => c.published === false && c.authorId === userId) && (
        <div className="shrink-0 border-t border-border">
          <div className="px-3 pt-2 pb-1 flex items-center gap-1.5">
            <DraftPinIcon />
            <span className="text-[11px] font-medium text-text-muted uppercase tracking-wide">
              {t("myDrafts")}
            </span>
          </div>
          <div className="overflow-y-auto scrollbar-thin max-h-[30vh] px-3 pb-3 space-y-2">
            {[...cards]
              .filter((c) => c.published === false && c.authorId === userId)
              .sort(
                (a, b) =>
                  (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0),
              )
              .map((card) => (
                <div key={card.id} className="animate-[card-in_0.22s_ease-out]">
                  <CardItem
                    card={card}
                    roomId={roomId}
                    userId={userId}
                    currentUserName={userName}
                    currentUserPhotoURL={userPhotoURL}
                    isAnonymous={isAnonymous}
                    isFacilitator={isFacilitator}
                    isRetroLive={isRetroLive}
                    isActionItem={column.isActionItems}
                    linkedActionItems={undefined}
                    onAddLinkedActionItem={
                      !column.isActionItems && actionItemsColumnId
                        ? (text) =>
                            handleAddLinkedActionItem(card.id, card.text, text)
                        : undefined
                    }
                    linkedCard={undefined}
                    participants={participants}
                    linkingActive={linkingActive}
                    isLinkTarget={false}
                  />
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="p-3 border-t border-border shrink-0">
        <button
          onClick={() => setIsAdding(true)}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-elevated text-sm transition-colors cursor-pointer"
        >
          <SmallPlusIcon />
          {column.isActionItems ? t("addActionItem") : t("addCard")}
        </button>
      </div>

      {(isAdding || isClosing) && (
        <div
          className={`absolute inset-x-0 bottom-0 z-10 bg-bg-surface border-t border-border rounded-b-lg p-3 ${isClosing ? "animate-[slide-out_0.15s_ease-in_forwards]" : "animate-[slide-in_0.18s_ease-out]"}`}
          onAnimationEnd={handleCloseAnimationEnd}
        >
          <Textarea
            ref={textareaRef}
            autoFocus
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              column.isActionItems
                ? t("actionItemPlaceholder")
                : t("cardPlaceholder")
            }
            rows={3}
          />
          {column.isActionItems &&
            (pendingLinkTarget ? (
              <div className="flex items-center gap-1.5 text-[11px] text-text-muted bg-bg-card border border-border/60 rounded px-2 py-1 mt-3">
                <LinkIcon />
                <span className="italic truncate flex-1">
                  {t("fromCard")} {pendingLinkTarget.text}
                </span>
                <button
                  type="button"
                  onClick={onCancelLinking}
                  aria-label={t("removeLink")}
                  className="text-text-muted hover:text-text-primary cursor-pointer shrink-0"
                >
                  <XIcon />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onStartLinking}
                className={`inline-flex items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer mt-3 ${linkingActive ? "text-accent-primary" : "text-text-muted hover:text-accent-primary"}`}
              >
                <LinkIcon />
                {linkingActive ? t("clickACardToLink") : t("linkToCard")}
              </button>
            ))}
          <div className="flex items-center gap-2 mt-3">
            <Button
              size="xs"
              onClick={handleAddCard}
              disabled={adding || !newText.trim() || overLimit}
            >
              {t("add")}
            </Button>
            <Button size="xs" variant="ghost-text" onClick={startClose}>
              {t("cancel")}
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <span
                className={`text-[10px] tabular-nums ${overLimit ? "text-red-500 font-medium" : "text-text-muted"}`}
              >
                {newText.length}/{MAX_CHARS}
              </span>
              {previousText !== null && (
                <button
                  type="button"
                  onClick={handleUndoImprove}
                  className="inline-flex items-center gap-1 px-2 h-6 rounded text-[11px] font-medium text-text-muted hover:text-text-primary hover:bg-bg-card transition-colors cursor-pointer"
                  title={t("undoImprove")}
                >
                  <UndoIcon />
                  {t("undoImprove")}
                </button>
              )}
              {newText.trim() && (
                <button
                  type="button"
                  onClick={handleImprove}
                  disabled={improving}
                  className="inline-flex items-center gap-1 px-2 h-6 rounded text-[11px] font-medium text-text-muted hover:text-accent-violet hover:bg-bg-card transition-colors cursor-pointer disabled:opacity-50"
                  title={t("improveWithAI")}
                >
                  {improving ? <MiniSpinner /> : <SparkleIcon />}
                  {improving ? t("improving") : t("improveWithAI")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LinkIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <path
        d="M5 6.5a2.5 2.5 0 003.54.04l1.5-1.5A2.5 2.5 0 006.5 1.5L5.75 2.25"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M7 5.5a2.5 2.5 0 00-3.54-.04l-1.5 1.5A2.5 2.5 0 005.5 10.5L6.25 9.75"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path
        d="M1.5 1.5l7 7M8.5 1.5l-7 7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 7v6h6" />
      <path d="M3 13C5 7 11 3 18 5a9 9 0 0 1 3 14" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" />
    </svg>
  );
}

function MiniSpinner() {
  return (
    <svg
      className="animate-spin"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
      <path
        d="M2 7l3.5 3.5L11 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SmallPlusIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
      <path
        d="M6.5 1.5v10M1.5 6.5h10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DraftPinIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-text-muted"
      aria-hidden
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
