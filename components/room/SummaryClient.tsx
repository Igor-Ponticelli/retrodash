"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/hooks/useAuth";
import { useRoom } from "@/hooks/useRoom";
import { useCards } from "@/hooks/useCards";
import { useParticipants } from "@/hooks/useParticipants";
import { getParticipant, joinRoom, commentsQuery } from "@/lib/firestore";
import {
  calculateRetroScoreboard,
  saveRetroScoreboard,
} from "@/lib/scoreboard";
import { ScoreboardSection } from "@/components/room/ScoreboardSection";
import { CommentThread } from "@/components/board/CommentThread";
import { Modal } from "@/components/ui/Modal";
import { Navbar } from "@/components/ui/Navbar";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  CheckIcon,
  CircleIcon,
  LoopIcon,
  ThumbUpIcon,
  ExportIcon,
  PeopleIcon,
  CommentIcon,
} from "@/components/ui/Icons";
import type { Card, CardComment, Column, Room } from "@/types";

export function SummaryClient({ roomId }: { roomId: string }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [gate, setGate] = useState<"checking" | "ready">("checking");

  useEffect(() => {
    if (authLoading || !user) return;
    (async () => {
      const snap = await getDoc(doc(db, "rooms", roomId));
      if (!snap.exists()) {
        router.replace("/dashboard");
        return;
      }
      const room = { id: snap.id, ...snap.data() } as Room;

      if (room.status !== "ended") {
        router.replace(`/room/${roomId}`);
        return;
      }

      const participant = await getParticipant(roomId, user.uid);
      if (participant) {
        setGate("ready");
        return;
      }

      if (room.isPublic) {
        await joinRoom(
          roomId,
          user.uid,
          user.displayName ?? "Member",
          user.photoURL ?? null,
        );
        setGate("ready");
        return;
      }

      router.replace(`/room/${roomId}`);
    })();
  }, [authLoading, user, roomId, router]);

  if (authLoading || gate === "checking") return <SummarySkeleton />;
  return <SummaryContent roomId={roomId} />;
}

function SummaryContent({ roomId }: { roomId: string }) {
  const { room, columns, loading: roomLoading } = useRoom(roomId);
  const { cards, loading: cardsLoading } = useCards(roomId);
  const { participants } = useParticipants(roomId);
  const t = useTranslations("summary");
  const locale = useLocale();

  const [commentsByCardId, setCommentsByCardId] = useState<Record<string, CardComment[]>>({});
  const [commentsByAuthorId, setCommentsByAuthorId] = useState<Record<string, number>>({});
  const [commentsLoaded, setCommentsLoaded] = useState(false);

  const loading = roomLoading || cardsLoading;

  const actionItemsCol = columns.find((c) => c.isActionItems);
  const regularCols = columns.filter((c) => !c.isActionItems);
  const publishedCards = cards.filter((c) => c.published !== false);
  const scoreboard = calculateRetroScoreboard(
    publishedCards,
    actionItemsCol?.id,
    participants,
    commentsByAuthorId,
  );

  useEffect(() => {
    if (cardsLoading) return;
    const cardsWithComments = cards.filter((c) => (c.commentsCount ?? 0) > 0);
    let cancelled = false;
    (async () => {
      const snaps = await Promise.all(
        cardsWithComments.map((c) => getDocs(commentsQuery(roomId, c.id))),
      );
      if (cancelled) return;
      const byCardId: Record<string, CardComment[]> = {};
      const byAuthorId: Record<string, number> = {};
      snaps.forEach((snap, i) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CardComment));
        byCardId[cardsWithComments[i].id] = list;
        list.forEach((c) => {
          byAuthorId[c.authorId] = (byAuthorId[c.authorId] ?? 0) + 1;
        });
      });
      setCommentsByCardId(byCardId);
      setCommentsByAuthorId(byAuthorId);
      setCommentsLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, cardsLoading]);

  useEffect(() => {
    if (!room || participants.length === 0 || !commentsLoaded) return;
    saveRetroScoreboard(roomId, scoreboard);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, commentsLoaded]);

  if (loading) return <SummarySkeleton />;
  if (!room) return null;

  const actionCards = sortByVotes(
    actionItemsCol
      ? publishedCards.filter((c) => c.columnId === actionItemsCol.id)
      : [],
  );
  const newActionCards = actionCards.filter((c) => !c.carriedItem);

  const dateLocale = locale === "pt-BR" ? "pt-BR" : "en-US";
  const endedDate = room.createdAt
    ? room.createdAt.toDate().toLocaleDateString(dateLocale, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <Navbar logoHref="/dashboard">
        <span className="text-text-primary font-semibold text-sm truncate">
          {room.name}
        </span>
        <span className="inline-flex text-[11px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-sm shrink-0 text-text-muted bg-bg-elevated">
          {t("ended")}
        </span>
      </Navbar>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-text-muted hover:text-text-secondary text-xs mb-3 transition-colors"
            >
              <ArrowLeftIcon size={12} />
              {t("myRooms")}
            </Link>
            <h1 className="text-3xl font-bold text-text-primary tracking-tight">
              {room.name}
            </h1>
            {room.description && (
              <p className="text-text-primary text-base italic mt-2">
                &ldquo;{room.description}&rdquo;
              </p>
            )}
            {endedDate && (
              <p className="text-text-muted text-sm mt-1">
                {t("retroLabel")} · {endedDate}
              </p>
            )}
          </div>

          <button
            disabled
            title={t("comingSoon")}
            className="self-start h-9 px-4 rounded-md border border-border text-text-muted text-sm font-medium flex items-center gap-2 opacity-50 cursor-not-allowed shrink-0"
          >
            <ExportIcon />
            {t("export")}
          </button>
        </div>

        {participants.length > 0 && (
          <section>
            <SectionHeader
              icon={<PeopleIcon size={18} />}
              title={t("participants")}
              count={participants.length}
            />
            <div className="mt-4 flex flex-wrap gap-3">
              {participants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 bg-bg-card border border-border rounded-full pl-1 pr-3 py-1"
                >
                  {p.photoURL ? (
                    <Image
                      src={p.photoURL}
                      alt={p.displayName}
                      width={24}
                      height={24}
                      className="size-6 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="size-6 rounded-full bg-bg-elevated border border-border flex items-center justify-center text-[10px] font-semibold text-text-muted shrink-0">
                      {(p.displayName ?? "?")[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm text-text-primary">
                    {p.displayName}
                  </span>
                  {p.role === "facilitator" && (
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-accent-primary">
                      {t("host")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <ScoreboardSection
          entries={scoreboard}
          isAnonymous={room.isAnonymous}
        />

        <section>
          <SectionHeader
            icon={<CheckCircleIcon />}
            title={t("actionItems")}
            count={newActionCards.length}
            accent
          />

          {actionCards.length === 0 ? (
            <p className="text-text-muted text-sm mt-4 pl-1">
              {t("noActionItems")}
            </p>
          ) : (
            <div className="mt-4 bg-bg-card border border-border rounded-lg divide-y divide-border overflow-hidden">
              {actionCards.map((card) => (
                <ActionItemRow
                  key={card.id}
                  card={card}
                  isAnonymous={room.isAnonymous}
                  allCards={publishedCards}
                  comments={commentsByCardId[card.id] ?? []}
                />
              ))}
            </div>
          )}
        </section>

        {regularCols.length > 0 && (
          <section>
            <SectionHeader
              icon={<BoardIcon />}
              title={t("retroRecap")}
              count={
                publishedCards.filter(
                  (c) => !actionCards.includes(c) && !c.carriedItem,
                ).length
              }
            />

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              {regularCols.map((col) => (
                <ColumnSummary
                  key={col.id}
                  column={col}
                  cards={sortByVotes(
                    publishedCards.filter((c) => c.columnId === col.id),
                  )}
                  isAnonymous={room.isAnonymous}
                  commentsByCardId={commentsByCardId}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function sortByVotes(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => b.votedBy.length - a.votedBy.length);
}

function SectionHeader({
  icon,
  title,
  count,
  accent = false,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 pb-3 border-b border-border">
      <span className={accent ? "text-accent-primary" : "text-text-muted"}>
        {icon}
      </span>
      <h2 className="text-text-primary font-semibold text-lg">{title}</h2>
      <span className="text-xs text-text-muted bg-bg-elevated px-2 py-0.5 rounded-full ml-0.5">
        {count}
      </span>
    </div>
  );
}

function ActionItemRow({
  card,
  isAnonymous,
  allCards,
  comments,
}: {
  card: Card;
  isAnonymous: boolean;
  allCards: Card[];
  comments: CardComment[];
}) {
  const t = useTranslations("summary");
  const status: "pending" | "done" | "keep" =
    card.actionStatus ?? (card.done ? "done" : "pending");

  const sourceCardText = card.linkedCardId
    ? (allCards.find((c) => c.id === card.linkedCardId)?.text ??
      card.linkedCardText)
    : card.linkedCardText;

  return (
    <div className="relative flex items-start gap-3 px-5 py-4">
      {card.carriedItem && (
        <span className="absolute top-4 right-4 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wider text-text-muted bg-bg-elevated border border-border/60 rounded">
          {t("carriedOver")}
        </span>
      )}
      <span
        className={`mt-0.5 shrink-0 ${
          status === "done"
            ? "text-green-700 dark:text-green-400"
            : status === "keep"
              ? "text-accent-violet"
              : "text-orange-600 dark:text-orange-400"
        }`}
      >
        {status === "done" ? (
          <CheckIcon />
        ) : status === "keep" ? (
          <LoopIcon />
        ) : (
          <CircleIcon />
        )}
      </span>
      <div className="flex-1 min-w-0">
        {sourceCardText && (
          <p className="text-[11px] text-text-muted italic mb-1">
            {t("fromCard")} {sourceCardText}
          </p>
        )}
        <p
          className={`text-sm leading-relaxed whitespace-pre-wrap wrap-break-word ${
            status === "done"
              ? "line-through text-text-muted"
              : status === "keep"
                ? "text-accent-violet"
                : "text-text-primary"
          }`}
        >
          {card.text}
        </p>
        {status === "keep" && (
          <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-widest text-accent-violet/70">
            {t("keepGoing")}
          </span>
        )}
        {!isAnonymous && (
          <div className="flex items-center gap-1.5 mt-1.5">
            {card.authorName ? (
              <>
                <Avatar
                  photoURL={card.authorPhotoURL}
                  name={card.authorName}
                  size={24}
                />
                <span className="text-text-muted text-xs">
                  {card.authorName}
                </span>
              </>
            ) : (
              <AnonymousChip label={t("anonymous")} />
            )}
            {card.assigneeId && (
              <span className="flex items-center gap-1.5 ml-3 pl-3 border-l border-border/60">
                <Avatar
                  photoURL={card.assigneePhotoURL}
                  name={card.assigneeName ?? "?"}
                  size={24}
                />
                <span className="text-text-muted text-xs">
                  {t("assignedTo", { name: card.assigneeName ?? "" })}
                </span>
              </span>
            )}
          </div>
        )}
      </div>
      <div className="shrink-0 flex flex-col items-end gap-1.5">
        {card.votedBy.length > 0 && (
          <span className="flex items-center gap-1 text-xs text-text-muted">
            <ThumbUpIcon />
            {card.votedBy.length}
          </span>
        )}
        <CommentsToggle comments={comments} />
      </div>
    </div>
  );
}

function ColumnSummary({
  column,
  cards,
  isAnonymous,
  commentsByCardId,
}: {
  column: Column;
  cards: Card[];
  isAnonymous: boolean;
  commentsByCardId: Record<string, CardComment[]>;
}) {
  const t = useTranslations("summary");
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-text-primary font-semibold text-sm">
          {column.title}
        </h3>
        <span className="text-xs text-text-muted bg-bg-elevated px-2 py-0.5 rounded-full">
          {cards.length}
        </span>
      </div>

      {cards.length === 0 ? (
        <p className="text-text-muted text-xs italic">{t("noCards")}</p>
      ) : (
        <div className="space-y-2">
          {cards.map((card) => (
            <SummaryCard
              key={card.id}
              card={card}
              isAnonymous={isAnonymous}
              comments={commentsByCardId[card.id] ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  card,
  isAnonymous,
  comments,
}: {
  card: Card;
  isAnonymous: boolean;
  comments: CardComment[];
}) {
  const t = useTranslations("summary");
  return (
    <div className="bg-bg-card border border-border rounded-md px-4 py-3">
      <p className="text-text-primary text-sm leading-relaxed whitespace-pre-wrap wrap-break-word">
        {card.text}
      </p>
      <div className="flex items-center justify-between mt-2">
        {!isAnonymous ? (
          card.authorName ? (
            <div className="flex items-center gap-1.5">
              <Avatar
                photoURL={card.authorPhotoURL}
                name={card.authorName}
                size={24}
              />
              <span className="text-text-muted text-xs">{card.authorName}</span>
            </div>
          ) : (
            <AnonymousChip label={t("anonymous")} />
          )
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3">
          {card.votedBy.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-text-muted">
              <ThumbUpIcon />
              {card.votedBy.length}
            </span>
          )}
          <CommentsToggle comments={comments} />
        </div>
      </div>
    </div>
  );
}

function CommentsToggle({ comments }: { comments: CardComment[] }) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("comments");
  const tSummary = useTranslations("summary");

  if (comments.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={t("viewLabel")}
        className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors cursor-pointer"
      >
        <CommentIcon size={12} />
        {comments.length}
      </button>
      {open && (
        <Modal title={t("title")} onClose={() => setOpen(false)} size="md">
          <CommentThread
            comments={comments}
            isAnonymous={false}
            anonymousLabel={tSummary("anonymous")}
            emptyLabel={t("empty")}
          />
        </Modal>
      )}
    </>
  );
}

function SummarySkeleton() {
  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <div className="h-16 bg-bg-surface border-b border-border" />
      <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        <Skeleton className="h-8 w-72 bg-bg-card" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-32 bg-bg-card" />
          <Skeleton className="h-24 bg-bg-card rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[0, 1].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-5 w-24 bg-bg-card" />
              <Skeleton className="h-16 bg-bg-card rounded-md" />
              <Skeleton className="h-16 bg-bg-card rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BoardIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden>
      <rect
        x="1.5"
        y="2.5"
        width="14"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <line
        x1="1.5"
        y1="7"
        x2="15.5"
        y2="7"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <line
        x1="7"
        y1="7"
        x2="7"
        y2="14.5"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  );
}

function AnonymousChip({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <div className="size-6 rounded-full bg-bg-elevated border border-border flex items-center justify-center shrink-0">
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
