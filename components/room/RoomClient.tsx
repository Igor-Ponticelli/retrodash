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
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import {
  updateRoomStatus,
  subscribeToParticipant,
  joinRoom,
  getParticipant,
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
import type { Room } from "@/types";

interface RoomClientProps {
  roomId: string;
}

export function RoomClient({ roomId }: RoomClientProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [gate, setGate] = useState<"checking" | "ready" | "needs-password">(
    "checking",
  );
  const [roomData, setRoomData] = useState<Room | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;
    (async () => {
      const snap = await getDoc(doc(db, "rooms", roomId));
      if (!snap.exists()) {
        router.replace("/dashboard");
        return;
      }
      const room = { id: snap.id, ...snap.data() } as Room;
      setRoomData(room);

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

      setGate("needs-password");
    })();
  }, [authLoading, user, roomId, router]);

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
  const { participants } = useParticipants(roomId);
  const wasParticipantRef = useRef(false);

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
      router.push(`/room/${roomId}/summary`);
    }
  }, [room?.status, roomId, router]);

  const isFacilitator = userId === room?.ownerId;
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
          </>
        }
        actions={
          <>
            {isFacilitator && room.status === "waiting" && (
              <Button variant="cyan" size="sm" onClick={handleStartRetro}>
                {t("startRetro")}
              </Button>
            )}
            {isFacilitator && room.status === "active" && (
              <EndRetroButton loading={endingRetro} onClick={handleEndRetro} />
            )}
            {room.status === "ended" && (
              <Link
                href={`/room/${roomId}/summary`}
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
          participants={participants}
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
