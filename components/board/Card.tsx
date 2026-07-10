"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { CardComments } from "@/components/board/CardComments";
import {
  updateCard,
  deleteCard,
  toggleVote,
  setActionStatus,
  setCardAssignee,
  setCardLink,
  publishCard,
} from "@/lib/firestore";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import type { Card, Participant } from "@/types";

interface CardProps {
  card: Card;
  roomId: string;
  userId: string;
  currentUserName?: string;
  currentUserPhotoURL?: string | null;
  isAnonymous: boolean;
  isFacilitator: boolean;
  isRetroLive?: boolean;
  isActionItem?: boolean;
  linkedActionItems?: Card[];
  onAddLinkedActionItem?: (text: string) => Promise<void>;
  linkedCard?: Card;
  participants?: Participant[];
  linkingActive?: boolean;
  isLinkTarget?: boolean;
  onPickLinkTarget?: (card: Card) => void;
  linkingSourceCardId?: string | null;
  onStartLinkingCard?: (cardId: string) => void;
}

export function CardItem({
  card,
  roomId,
  userId,
  currentUserName,
  currentUserPhotoURL,
  isAnonymous,
  isFacilitator,
  isRetroLive = true,
  isActionItem = false,
  linkedActionItems,
  onAddLinkedActionItem,
  linkedCard,
  participants = [],
  linkingActive = false,
  isLinkTarget = false,
  onPickLinkTarget,
  linkingSourceCardId = null,
  onStartLinkingCard,
}: CardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(card.text);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [improving, setImproving] = useState(false);
  const [isAddingLinkedItem, setIsAddingLinkedItem] = useState(false);
  const [linkedItemText, setLinkedItemText] = useState("");
  const [addingLinkedItem, setAddingLinkedItem] = useState(false);
  const [linkedCardOpen, setLinkedCardOpen] = useState(false);
  const [previousEditText, setPreviousEditText] = useState<string | null>(null);
  const t = useTranslations("board");

  const MAX_CHARS = 320;
  const editOverLimit = editText.length > MAX_CHARS;
  const linkedOverLimit = linkedItemText.length > MAX_CHARS;

  const isOwnCard = card.authorId === userId;
  const isDraft = card.published === false;
  const hasVoted = card.votedBy.includes(userId);
  const canVote = !isOwnCard && !isDraft;
  const canEdit = isOwnCard && !card.carriedItem;
  const canDelete = isFacilitator || (isOwnCard && !card.carriedItem);
  const actionStatus: "pending" | "done" | "keep" =
    card.actionStatus ?? (card.done ? "done" : "pending");
  const isLinkingThisCard = linkingSourceCardId === card.id;
  const pickable = linkingActive && isLinkTarget;
  const linkingDimmed = linkingActive && !isLinkTarget && !isLinkingThisCard;

  const handlePick = () => {
    if (pickable) onPickLinkTarget?.(card);
  };

  const voteClass = !canVote
    ? "text-text-muted cursor-default opacity-50"
    : hasVoted
      ? "bg-accent-primary/15 text-accent-primary hover:bg-accent-primary/25 cursor-pointer"
      : "text-text-muted hover:text-text-primary hover:bg-bg-card cursor-pointer";

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await publishCard(roomId, card.id);
    } finally {
      setPublishing(false);
    }
  };

  const handleSaveEdit = async () => {
    const trimmed = editText.trim();
    if (!trimmed || trimmed === card.text) {
      setIsEditing(false);
      return;
    }
    setSaving(true);
    try {
      await updateCard(roomId, card.id, trimmed);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditText(card.text);
    setPreviousEditText(null);
    setIsEditing(false);
  };

  const handleVote = () => {
    if (!canVote) return;
    toggleVote(roomId, card.id, userId, hasVoted);
  };

  const handleDelete = () => deleteCard(roomId, card.id);

  const handleAddLinkedItem = async () => {
    const text = linkedItemText.trim();
    if (!text || !onAddLinkedActionItem) return;
    setAddingLinkedItem(true);
    await onAddLinkedActionItem(text);
    setLinkedItemText("");
    setIsAddingLinkedItem(false);
    setAddingLinkedItem(false);
  };

  const handleImprove = async () => {
    if (!editText.trim() || improving) return;
    setImproving(true);
    try {
      const res = await fetch("/api/improve-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: editText,
          type: isActionItem ? "action" : "card",
        }),
      });
      const data = await res.json();
      if (data.improved) {
        setPreviousEditText(editText);
        setEditText(data.improved);
      }
    } finally {
      setImproving(false);
    }
  };

  const handleUndoImprove = () => {
    if (previousEditText === null) return;
    setEditText(previousEditText);
    setPreviousEditText(null);
  };

  return (
    <div
      onClick={pickable ? handlePick : undefined}
      onKeyDown={
        pickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handlePick();
              }
            }
          : undefined
      }
      role={pickable ? "button" : undefined}
      tabIndex={pickable ? 0 : undefined}
      className={`group relative bg-bg-elevated rounded-md p-3 border transition-all ${
        pickable
          ? "border-accent-primary ring-2 ring-accent-primary/40 cursor-pointer hover:ring-accent-primary/70"
          : linkingDimmed
            ? "opacity-40 pointer-events-none border-transparent"
            : isDraft
              ? "border-dashed border-border/60 opacity-80"
              : isActionItem && actionStatus === "done"
                ? "border-accent-primary/20"
                : isActionItem && actionStatus === "keep"
                  ? "border-accent-violet/20"
                  : "border-transparent hover:border-border"
      }`}
    >
      {!isEditing && (
        <div
          className={`absolute top-2 right-2 flex sm:opacity-0 sm:group-hover:opacity-100 transition-opacity items-center gap-1 ${linkingActive ? "pointer-events-none" : ""}`}
        >
          {canEdit && (
            <button
              onClick={() => {
                setEditText(card.text);
                setIsEditing(true);
              }}
              className="size-6 flex items-center justify-center rounded text-text-muted hover:text-text-primary cursor-pointer hover:bg-bg-card transition-colors"
              aria-label={t("editLabel")}
            >
              <PencilIcon />
            </button>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              className="size-6 flex items-center justify-center rounded cursor-pointer text-text-muted hover:text-red-400 hover:bg-bg-card transition-colors"
              aria-label={t("deleteLabel")}
            >
              <TrashIcon />
            </button>
          )}
        </div>
      )}

      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            autoFocus
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") handleCancelEdit();
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey))
                handleSaveEdit();
            }}
            rows={3}
            className="bg-bg-card border-accent-primary"
          />
          <div className="flex items-center gap-2">
            <Button
              size="xs"
              variant="cyan"
              onClick={handleSaveEdit}
              disabled={saving || !editText.trim() || editOverLimit}
            >
              {t("save")}
            </Button>
            <Button size="xs" variant="ghost-text" onClick={handleCancelEdit}>
              {t("cancel")}
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <span
                className={`text-[10px] tabular-nums ${editOverLimit ? "text-red-500 font-medium" : "text-text-muted"}`}
              >
                {editText.length}/{MAX_CHARS}
              </span>
              {previousEditText !== null && (
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
              {editText.trim() && (
                <button
                  type="button"
                  onClick={handleImprove}
                  disabled={improving}
                  className="inline-flex items-center gap-1 px-2 h-6 rounded text-[11px] font-medium text-text-muted hover:text-accent-violet hover:bg-bg-card transition-colors cursor-pointer disabled:opacity-50"
                >
                  {improving ? <MiniSpinner /> : <SparkleIcon />}
                  {improving ? t("improving") : t("improveWithAI")}
                </button>
              )}
            </div>
          </div>
          {editText.trim() && (
            <p className="text-[10px] text-text-muted text-right leading-tight mt-1">
              {t("improveWithAIHint")}{" "}
              <Link
                href="/privacy#ai-text-improvement"
                className="hover:underline transition-colors"
              >
                {t("improveWithAIHintLink")}
              </Link>
            </p>
          )}
        </div>
      ) : isActionItem ? (
        <div className="pr-14">
          {(card.returnCount ?? 0) >= 1 && (
            <span className="inline-block mb-1.5 text-[10px] text-text-muted bg-bg-elevated py-0.5 rounded-full">
              {t("returnedCount", { count: card.returnCount ?? 0 })}
            </span>
          )}
          {(linkedCard ?? card.linkedCardText) ? (
            <button
              onClick={() => setLinkedCardOpen(true)}
              className="mb-1.5 flex items-center gap-1 text-[10px] text-text-muted hover:text-text-secondary transition-colors cursor-pointer max-w-full"
            >
              <LinkIcon />
              <span className="truncate italic">
                {linkedCard?.text ?? card.linkedCardText}
              </span>
            </button>
          ) : (
            !isDraft &&
            !card.carriedItem && (
              <button
                type="button"
                onClick={() => onStartLinkingCard?.(card.id)}
                className={`mb-1.5 inline-flex items-center gap-1 text-[10px] font-medium transition-colors cursor-pointer ${
                  isLinkingThisCard
                    ? "text-accent-primary"
                    : "text-text-muted hover:text-accent-primary"
                }`}
              >
                <LinkIcon />
                {isLinkingThisCard ? t("clickACardToLink") : t("linkToCard")}
              </button>
            )
          )}
          {linkedCardOpen && (
            <Modal
              title={t("linkedCard")}
              onClose={() => setLinkedCardOpen(false)}
              size="sm"
            >
              <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
                {linkedCard?.text ?? card.linkedCardText}
              </p>
              {!card.carriedItem && (
                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setLinkedCardOpen(false);
                      onStartLinkingCard?.(card.id);
                    }}
                    className="text-xs font-medium text-accent-primary hover:underline cursor-pointer"
                  >
                    {t("changeLink")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCardLink(roomId, card.id, null);
                      setLinkedCardOpen(false);
                    }}
                    className="text-xs font-medium text-text-muted hover:text-red-400 transition-colors cursor-pointer"
                  >
                    {t("removeLink")}
                  </button>
                </div>
              )}
            </Modal>
          )}
          <p
            className={`text-sm leading-relaxed whitespace-pre-wrap wrap-break-word transition-colors ${
              actionStatus === "done"
                ? "line-through text-text-muted"
                : actionStatus === "keep"
                  ? "text-accent-violet"
                  : "text-text-primary"
            }`}
          >
            {card.text}
          </p>
        </div>
      ) : (
        <>
          <p className="text-text-primary text-sm leading-relaxed pr-14 whitespace-pre-wrap wrap-break-word">
            {card.text}
          </p>
          {!isDraft && (linkedActionItems?.length ?? 0) > 0 && (
            <div className="mt-2 pt-2 border-t border-border/40 space-y-1">
              {linkedActionItems!.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-1.5 text-xs text-text-muted"
                >
                  <span
                    className={`mt-px shrink-0 ${item.actionStatus === "done" ? "text-green-700 dark:text-green-400" : item.actionStatus === "pending" ? "text-orange-600 dark:text-orange-400" : ""}`}
                  >
                    <MiniCheckIcon done={item.actionStatus === "done"} />
                  </span>
                  <span
                    className={`leading-relaxed ${item.actionStatus === "done" ? "line-through" : ""}`}
                  >
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          )}
          {!isDraft && onAddLinkedActionItem && !isEditing && (
            <div className="mt-2">
              {isAddingLinkedItem ? (
                <div className="space-y-1.5">
                  <input
                    autoFocus
                    value={linkedItemText}
                    onChange={(e) => setLinkedItemText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddLinkedItem();
                      if (e.key === "Escape") {
                        setIsAddingLinkedItem(false);
                        setLinkedItemText("");
                      }
                    }}
                    placeholder={t("actionItemPlaceholder")}
                    className="w-full text-xs bg-bg-card border border-border rounded px-2 py-1 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary"
                  />
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleAddLinkedItem}
                      disabled={
                        addingLinkedItem ||
                        !linkedItemText.trim() ||
                        linkedOverLimit
                      }
                      className="px-2 h-5 rounded text-[10px] font-semibold bg-accent-primary/15 text-accent-primary hover:bg-accent-primary/25 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {t("add")}
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingLinkedItem(false);
                        setLinkedItemText("");
                      }}
                      className="px-2 h-5 rounded text-[10px] text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                    >
                      {t("cancel")}
                    </button>
                    <span
                      className={`ml-auto text-[10px] tabular-nums ${linkedOverLimit ? "text-red-500 font-medium" : "text-text-muted"}`}
                    >
                      {linkedItemText.length}/{MAX_CHARS}
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingLinkedItem(true)}
                  className="flex items-center gap-1 text-[11px] text-text-muted hover:text-accent-primary transition-colors cursor-pointer"
                >
                  <SmallPlusIcon />
                  {t("addActionItem")}
                </button>
              )}
            </div>
          )}
        </>
      )}

      {!isEditing && (
        <div
          className={`flex items-center justify-between mt-3 ${pickable ? "pointer-events-none" : ""}`}
        >
          {!isAnonymous &&
            (card.authorName ? (
              <AuthorChip
                name={
                  isOwnCard && card.authorName === currentUserName
                    ? t("you")
                    : card.authorName
                }
                photoURL={
                  isOwnCard && card.authorName === currentUserName
                    ? currentUserPhotoURL
                    : card.authorPhotoURL
                }
              />
            ) : (
              <AnonymousChip label={t("anonymous")} />
            ))}

          <div
            className={`flex items-center gap-2 ${isAnonymous ? "ml-auto" : ""}`}
          >
            {!isDraft && (
              <CardComments
                roomId={roomId}
                card={card}
                userId={userId}
                currentUserName={currentUserName}
                currentUserPhotoURL={currentUserPhotoURL}
                isAnonymous={isAnonymous}
                isFacilitator={isFacilitator}
              />
            )}

            {isDraft && isOwnCard ? (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                  {t("draft")}
                </span>
                <button
                  onClick={handlePublish}
                  disabled={
                    publishing || !isRetroLive || card.text.length > MAX_CHARS
                  }
                  className="inline-flex items-center gap-1 px-2 h-6 rounded text-xs font-semibold bg-accent-primary/15 text-accent-primary hover:bg-accent-primary/25 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {publishing ? t("publishing") : t("publish")}
                </button>
              </div>
            ) : !isActionItem ? (
              <button
                onClick={handleVote}
                disabled={!canVote}
                aria-label={hasVoted ? t("removeVote") : t("vote")}
                className={`inline-flex items-center gap-1.5 px-2 h-6 rounded text-xs font-medium transition-colors ${voteClass}`}
              >
                <ThumbUpIcon filled={hasVoted} />
                {card.votedBy.length > 0 && <span>{card.votedBy.length}</span>}
              </button>
            ) : (
              <>
                {!isAnonymous &&
                  (card.carriedItem ? (
                    card.assigneeId && (
                      <span
                        className="shrink-0"
                        title={t("assignedTo", {
                          name: card.assigneeName ?? "",
                        })}
                      >
                        <Avatar
                          photoURL={card.assigneePhotoURL}
                          name={card.assigneeName ?? "?"}
                          size={22}
                        />
                      </span>
                    )
                  ) : (
                    <AssigneeSelector
                      roomId={roomId}
                      card={card}
                      participants={participants}
                      t={t}
                    />
                  ))}
                <ActionStatusSegment
                  status={actionStatus}
                  onChange={(s) => setActionStatus(roomId, card.id, s)}
                  t={t}
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ActionStatusSegment({
  status,
  onChange,
  t,
}: {
  status: "pending" | "done" | "keep";
  onChange: (s: "pending" | "done" | "keep") => void;
  t: ReturnType<typeof import("next-intl").useTranslations<"board">>;
}) {
  const options = [
    { value: "pending" as const, label: t("statusPending") },
    { value: "done" as const, label: t("statusDone") },
    { value: "keep" as const, label: t("statusKeep") },
  ];

  return (
    <div className="flex items-center gap-px bg-bg-card border border-border rounded p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-2 h-5 rounded-sm text-[10px] font-medium transition-colors cursor-pointer ${
            status === opt.value
              ? opt.value === "done"
                ? "bg-green-600/15 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                : opt.value === "keep"
                  ? "bg-accent-violet/20 text-accent-violet"
                  : "bg-orange-500/15 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400"
              : "text-text-muted hover:text-text-primary"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function AssigneeSelector({
  roomId,
  card,
  participants,
  t,
}: {
  roomId: string;
  card: Card;
  participants: Participant[];
  t: ReturnType<typeof import("next-intl").useTranslations<"board">>;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSelect = async (participant: Participant | null) => {
    setSaving(true);
    try {
      await setCardAssignee(
        roomId,
        card.id,
        participant
          ? {
              id: participant.id,
              name: participant.displayName,
              photoURL: participant.photoURL,
            }
          : null,
      );
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={saving}
        aria-label={
          card.assigneeName
            ? t("assignedTo", { name: card.assigneeName })
            : t("assign")
        }
        title={
          card.assigneeName
            ? t("assignedTo", { name: card.assigneeName })
            : t("assign")
        }
        className="flex items-center justify-center rounded-full ring-2 ring-transparent hover:ring-accent-primary transition-all cursor-pointer disabled:opacity-50"
      >
        {card.assigneeId ? (
          <Avatar
            photoURL={card.assigneePhotoURL}
            name={card.assigneeName ?? "?"}
            size={22}
          />
        ) : (
          <span className="size-5.5 rounded-full border border-dashed border-border flex items-center justify-center text-text-muted hover:text-text-primary hover:border-text-muted transition-colors">
            <PersonPlusIcon />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 bottom-full mb-2 z-10 w-48 max-h-56 overflow-y-auto bg-bg-card border border-border rounded-lg shadow-xl p-1.5">
          {card.assigneeId && (
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className="w-full flex items-center px-2 py-1.5 rounded-md text-xs text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors cursor-pointer"
            >
              {t("unassign")}
            </button>
          )}
          {participants.length === 0 ? (
            <p className="px-2 py-1.5 text-xs text-text-muted">
              {t("noParticipants")}
            </p>
          ) : (
            participants.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelect(p)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                  card.assigneeId === p.id
                    ? "bg-accent-primary/15 text-accent-primary"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                }`}
              >
                <Avatar photoURL={p.photoURL} name={p.displayName} size={20} />
                <span className="truncate">{p.displayName}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function PersonPlusIcon() {
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
      <path d="M15 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1" />
      <circle cx="8.5" cy="7.5" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  );
}

function AuthorChip({
  name,
  photoURL,
}: {
  name: string;
  photoURL?: string | null;
}) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <Avatar photoURL={photoURL} name={name} size={24} />
      <span className="text-text-muted text-xs truncate max-w-28">{name}</span>
    </div>
  );
}

function AnonymousChip({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <div className="size-6 rounded-full bg-bg-card border border-border flex items-center justify-center shrink-0">
        <MaskIcon />
      </div>
      <span className="text-text-muted text-xs truncate max-w-28">{label}</span>
    </div>
  );
}

function MaskIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5" />
      <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M8.5 1.5l2 2-7 7H1.5v-2l7-7z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M1.5 3h9M4.5 3V2h3v1M2.5 3l.7 7h5.6l.7-7"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

function SmallPlusIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 13 13" fill="none" aria-hidden>
      <path
        d="M6.5 1.5v10M1.5 6.5h10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
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

function MiniCheckIcon({ done }: { done: boolean }) {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
      <rect
        x="1"
        y="1"
        width="10"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.2"
        fill={done ? "currentColor" : "none"}
        fillOpacity={done ? 0.2 : 0}
      />
      {done && (
        <path
          d="M3.5 6l2 2 3-3"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

function ThumbUpIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M3.5 11V5.5L6 1l.75.375C7 1.5 7 2 6.75 2.5L6 5h4.5a.5.5 0 01.5.5v1a.5.5 0 01-.1.3l-1.5 3.7a.5.5 0 01-.46.5H3.5zM3.5 5.5H1.5V11h2"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
        fill={filled ? "currentColor" : "none"}
        fillOpacity={filled ? 0.25 : 0}
      />
    </svg>
  );
}
