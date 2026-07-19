"use client";

import { useEffect, useRef, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { useRoom } from "@/hooks/useRoom";
import { useCards } from "@/hooks/useCards";
import { useParticipants } from "@/hooks/useParticipants";
import { useCategories } from "@/hooks/useCategories";
import { useMyOrgRole } from "@/hooks/useMyOrgRole";
import { createRemountCache } from "@/lib/remountCache";
import { retryOnPermissionDenied } from "@/lib/retryOnPermissionDenied";
import { roomPath, roomSummaryPath } from "@/lib/roomPath";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { CategoryBadge } from "@/components/org/CategoryBadge";
import {
  updateRoomStatus,
  subscribeToParticipant,
  joinRoom,
  getParticipant,
  setCardLink,
} from "@/lib/firestore";
import { Board } from "@/components/board/Board";
import { JoinRoom } from "@/components/room/JoinRoom";
import { ShareRoomModal } from "@/components/room/ShareRoomModal";
import { ParticipantsModal } from "@/components/room/ParticipantsModal";
import { EndRetroButton } from "@/components/room/EndRetroButton";
import { Navbar } from "@/components/ui/Navbar";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { PeopleIcon, LinkIcon } from "@/components/ui/Icons";
import type { Room, Card } from "@/types";

interface RoomClientProps {
  roomId: string;
  // Set only by /org/[orgId]/room/[roomId], which already verified org
  // membership via OrgGate before rendering this. When present, this
  // component trusts it and skips the password/isPublic gate entirely.
  orgId?: string;
}

const gateCache = createRemountCache<true>(); // stores only the "ready" outcome

export function RoomClient({ roomId, orgId }: RoomClientProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const gateKey = user ? `${roomId}:${user.uid}` : null;
  const [gate, setGate] = useState<"checking" | "ready" | "needs-password">(
    () => (gateKey !== null && gateCache.has(gateKey) ? "ready" : "checking"),
  );
  const [roomData, setRoomData] = useState<Room | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;
    const key = `${roomId}:${user.uid}`;
    let cancelled = false;

    retryOnPermissionDenied(async () => {
      const snap = await getDoc(doc(db, "rooms", roomId));
      if (!snap.exists()) {
        router.replace("/dashboard");
        return;
      }
      const room = { id: snap.id, ...snap.data() } as Room;
      if (cancelled) return;
      setRoomData(room);

      // Reached via the personal /room/[roomId] route but this room actually
      // belongs to an org — bounce to the canonical org-scoped path instead
      // of running the personal gate below (which would otherwise let
      // anyone who resolves this id auto-join it like a public room,
      // bypassing org membership entirely).
      if (!orgId && room.orgId) {
        router.replace(roomPath(room));
        return;
      }

      const participant = await getParticipant(roomId, user.uid);
      if (participant) {
        gateCache.set(key, true);
        if (!cancelled) setGate("ready");
        return;
      }

      // Org rooms: OrgGate already verified membership before this component
      // rendered, so trust the orgId prop and auto-join directly — no
      // isPublic/password check needed (org rooms are always public anyway).
      if (orgId || room.isPublic) {
        await joinRoom(
          roomId,
          user.uid,
          user.displayName ?? "Member",
          user.photoURL ?? null,
        );
        gateCache.set(key, true);
        if (!cancelled) setGate("ready");
        return;
      }

      if (!cancelled) setGate("needs-password");
    }).catch(() => {
      // Exhausted retries on a persistent permission-denied (not the
      // transient just-signed-in token propagation gap this guards
      // against) — fail safe instead of throwing an unhandled rejection
      // that surfaces as a raw runtime error overlay.
      if (!cancelled) router.replace("/dashboard");
    });

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, roomId, router, orgId]);

  if (authLoading || gate === "checking") return <BoardSkeleton />;

  if (gate === "needs-password" && roomData) {
    return (
      <JoinRoom
        room={roomData}
        userId={user!.uid}
        userDisplayName={user!.displayName ?? "Member"}
        userPhotoURL={user!.photoURL ?? null}
        onJoined={() => setGate("ready")}
      />
    );
  }

  return (
    <RoomBoard
      roomId={roomId}
      userId={user!.uid}
      userName={user!.displayName ?? "Anonymous"}
      userPhotoURL={user!.photoURL ?? null}
    />
  );
}

interface RoomBoardProps {
  roomId: string;
  userId: string;
  userName: string;
  userPhotoURL: string | null;
}

function RoomBoard({ roomId, userId, userName, userPhotoURL }: RoomBoardProps) {
  const { room, columns, loading: roomLoading } = useRoom(roomId);
  const { cards, loading: cardsLoading } = useCards(roomId);
  const router = useRouter();
  const t = useTranslations("room");
  const [endingRetro, setEndingRetro] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterAuthorId, setFilterAuthorId] = useState<string | null>(null);
  const [categoryFilterOpen, setCategoryFilterOpen] = useState(false);
  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null);
  const { categories } = useCategories(room?.orgId);
  const { member: orgMember } = useMyOrgRole(room?.orgId);
  const [linkingMode, setLinkingMode] = useState<
    { kind: "composer" } | { kind: "card"; cardId: string } | null
  >(null);
  const [pendingLinkTarget, setPendingLinkTarget] = useState<{ id: string; text: string } | null>(null);
  const { participants } = useParticipants(roomId);
  const wasParticipantRef = useRef(false);

  const linkingActive = linkingMode !== null;
  const linkingSourceCardId = linkingMode?.kind === "card" ? linkingMode.cardId : null;

  const handleStartLinking = () => setLinkingMode({ kind: "composer" });
  const handleStartLinkingCard = (cardId: string) => setLinkingMode({ kind: "card", cardId });
  const handleCancelLinking = () => {
    setLinkingMode(null);
    setPendingLinkTarget(null);
  };
  const handlePickLinkTarget = (card: Card) => {
    if (!linkingMode) return;
    if (linkingMode.kind === "composer") {
      setPendingLinkTarget({ id: card.id, text: card.text });
    } else {
      setCardLink(roomId, linkingMode.cardId, { id: card.id, text: card.text });
    }
    setLinkingMode(null);
  };

  useEffect(() => {
    if (!linkingActive) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLinkingMode(null);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [linkingActive]);

  useEffect(() => {
    return subscribeToParticipant(roomId, userId, (exists) => {
      if (exists) {
        wasParticipantRef.current = true;
      } else if (wasParticipantRef.current) {
        router.replace("/dashboard");
      }
    });
  }, [roomId, userId, router]);

  useEffect(() => {
    if (room?.status === "ended") {
      router.push(roomSummaryPath({ id: roomId, orgId: room.orgId }));
    }
  }, [room?.status, room?.orgId, roomId, router]);

  const isFacilitator = userId === room?.ownerId;
  // Starting/ending a retro is also open to any org admin/leader, not just
  // whoever happens to own the room doc — mirrors the rooms.update rule,
  // which already allows isOrgManager(orgId) alongside isFacilitator(roomId).
  // Board-level permissions (publishing others' cards, assigning roles, etc.)
  // stay tied strictly to isFacilitator: those remain governed by the
  // participant doc's role=="facilitator" in rules, untouched by org role.
  const canManageRetro =
    isFacilitator || orgMember?.role === "leader" || orgMember?.role === "admin";
  const loading = roomLoading || cardsLoading;

  const handleStartRetro = () => updateRoomStatus(roomId, "active");

  const handleEndRetro = async (description: string) => {
    setEndingRetro(true);
    await updateRoomStatus(roomId, "ended", description || undefined);
  };

  if (loading) return <BoardSkeleton />;

  if (!room) return null;

  return (
    <div className="h-screen bg-bg-base flex flex-col overflow-hidden">
      <Navbar
        logoHref="/dashboard"
        showHamburger
        leftActions={
          <>
            {!room.isAnonymous && (
              <button
                onClick={() => setParticipantsOpen(true)}
                title={t("viewParticipants")}
                aria-label={t("viewParticipants")}
                className="w-8 h-8 flex items-center justify-center rounded-md border border-transparent text-text-muted hover:border-border hover:bg-bg-card hover:text-text-secondary transition-colors cursor-pointer"
              >
                <PeopleIcon />
              </button>
            )}
            <button
              onClick={() => setShareOpen(true)}
              title={t("inviteTeammates")}
              aria-label={t("inviteTeammates")}
              className="w-8 h-8 flex items-center justify-center rounded-md border border-transparent text-text-muted hover:border-border hover:bg-bg-card hover:text-text-secondary transition-colors cursor-pointer"
            >
              <LinkIcon />
            </button>
            {!room.isAnonymous && participants.length > 1 && (
              <button
                onClick={() => setFilterOpen(true)}
                title={t("filterParticipants")}
                aria-label={t("filterParticipants")}
                className="relative w-8 h-8 flex items-center justify-center rounded-md border border-transparent text-text-muted hover:border-border hover:bg-bg-card hover:text-text-secondary transition-colors cursor-pointer"
              >
                <FilterIcon active={filterAuthorId !== null} />
              </button>
            )}
            {room.orgId && categories.length > 0 && (
              <button
                onClick={() => setCategoryFilterOpen(true)}
                title={t("filterByCategory")}
                aria-label={t("filterByCategory")}
                className="relative w-8 h-8 flex items-center justify-center rounded-md border border-transparent text-text-muted hover:border-border hover:bg-bg-card hover:text-text-secondary transition-colors cursor-pointer"
              >
                <FilterIcon active={filterCategoryId !== null} />
              </button>
            )}
          </>
        }
        actions={
          <>
            {canManageRetro && room.status === "waiting" && (
              <Button variant="cyan" size="sm" onClick={handleStartRetro}>
                {t("startRetro")}
              </Button>
            )}
            {canManageRetro && room.status === "active" && (
              <EndRetroButton loading={endingRetro} onClick={handleEndRetro} />
            )}
            {room.status === "ended" && (
              <Link
                href={roomSummaryPath(room)}
                className="h-8 px-4 rounded-md text-xs font-semibold border border-border text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors flex items-center"
              >
                {t("viewSummary")}
              </Link>
            )}
          </>
        }
      >
        <h1 className="text-text-primary font-semibold text-sm truncate">
          {room.name}
        </h1>
        <StatusBadge status={room.status} />
      </Navbar>

      <div className="flex-1 min-h-0">
        <Board
          columns={columns}
          cards={cards}
          roomId={roomId}
          userId={userId}
          userName={userName}
          userPhotoURL={userPhotoURL}
          isAnonymous={room.isAnonymous}
          isFacilitator={isFacilitator}
          isRetroLive={room.status === "active"}
          filterAuthorId={filterAuthorId}
          filterCategoryId={filterCategoryId}
          participants={participants}
          categories={categories}
          linkingActive={linkingActive}
          pendingLinkTarget={pendingLinkTarget}
          linkingSourceCardId={linkingSourceCardId}
          onStartLinking={handleStartLinking}
          onStartLinkingCard={handleStartLinkingCard}
          onCancelLinking={handleCancelLinking}
          onPickLinkTarget={handlePickLinkTarget}
        />
      </div>

      {participantsOpen && (
        <ParticipantsModal
          roomId={roomId}
          isFacilitator={isFacilitator}
          onClose={() => setParticipantsOpen(false)}
        />
      )}

      {filterOpen && (
        <Modal
          title={t("filterParticipantsTitle")}
          onClose={() => setFilterOpen(false)}
          size="sm"
        >
          <div className="flex flex-wrap gap-2">
            {participants.map((p) => {
              const isActive = filterAuthorId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setFilterAuthorId(isActive ? null : p.id);
                    setFilterOpen(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? "border-accent-primary bg-accent-primary/10 text-text-primary"
                      : "border-border text-text-secondary hover:text-text-primary hover:border-text-muted"
                  }`}
                >
                  <Avatar
                    photoURL={p.photoURL}
                    name={p.displayName}
                    size={24}
                  />
                  <span className="max-w-40 truncate">{p.displayName}</span>
                  {p.id === userId && (
                    <span className="text-[11px] text-text-muted">
                      ({t("you")})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {filterAuthorId !== null && (
            <button
              onClick={() => {
                setFilterAuthorId(null);
                setFilterOpen(false);
              }}
              className="mt-4 w-full text-sm text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              {t("clearFilter")}
            </button>
          )}
        </Modal>
      )}

      {categoryFilterOpen && (
        <Modal
          title={t("filterByCategory")}
          onClose={() => setCategoryFilterOpen(false)}
          size="sm"
        >
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const isActive = filterCategoryId === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => {
                    setFilterCategoryId(isActive ? null : category.id);
                    setCategoryFilterOpen(false);
                  }}
                  className={`rounded-lg border transition-colors cursor-pointer ${
                    isActive ? "border-accent-primary" : "border-transparent"
                  }`}
                >
                  <CategoryBadge title={category.title} colorId={category.colorId} />
                </button>
              );
            })}
          </div>
          {filterCategoryId !== null && (
            <button
              onClick={() => {
                setFilterCategoryId(null);
                setCategoryFilterOpen(false);
              }}
              className="mt-4 w-full text-sm text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              {t("clearFilter")}
            </button>
          )}
        </Modal>
      )}

      {shareOpen && (
        <ShareRoomModal
          roomId={roomId}
          roomName={room.name}
          isPublic={room.isPublic}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}

function FilterIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
      {active && (
        <circle
          cx="19"
          cy="19"
          r="5"
          fill="var(--color-accent-primary)"
          stroke="none"
        />
      )}
    </svg>
  );
}

function BoardSkeleton() {
  return (
    <div className="h-screen bg-bg-base flex flex-col">
      <div className="h-16 bg-bg-surface border-b border-border" />
      <div className="flex flex-1 gap-3 p-3 overflow-x-auto scrollbar-thin snap-x snap-mandatory lg:snap-none lg:gap-4 lg:p-4">
        <Skeleton className="w-[85vw] shrink-0 snap-start lg:flex-1 lg:w-auto lg:min-w-48 bg-bg-surface border border-border" />
        <Skeleton className="w-[85vw] shrink-0 snap-start lg:flex-1 lg:w-auto lg:min-w-48 bg-bg-surface border border-border" />
        <Skeleton className="w-[85vw] shrink-0 snap-start lg:flex-1 lg:w-auto lg:min-w-48 bg-bg-surface border border-border" />
      </div>
    </div>
  );
}
