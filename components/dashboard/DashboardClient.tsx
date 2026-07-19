"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { useRooms } from "@/hooks/useRooms";
import { useJoinedRooms } from "@/hooks/useJoinedRooms";
import { useMyOrgRooms } from "@/hooks/useMyOrgRooms";
import { useMyOrganizations } from "@/hooks/useMyOrganizations";
import { useWhatsNew } from "@/hooks/useWhatsNew";
import { Navbar } from "@/components/ui/Navbar";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { JoinRoomModal } from "@/components/room/JoinRoomModal";
import { NewRoomModal } from "@/components/room/NewRoomModal";
import { WhatsNewModal } from "@/components/whatsnew/WhatsNewModal";
import { roomSummaryPath } from "@/lib/roomPath";
import { OrgAvatar } from "@/components/org/OrgAvatar";
import { Link } from "@/i18n/navigation";
import { DeleteRoomModal } from "./DeleteRoomModal";
import { PlusIcon, BoardIcon } from "@/components/ui/Icons";
import { RoomCard } from "./RoomCard";
import type { Room } from "@/types";

export function DashboardClient() {
  const { user } = useAuth();
  const { rooms: allRooms, loading } = useRooms();
  const { joinedRooms: allJoinedRooms, loading: joinedLoading } = useJoinedRooms();
  // Org rooms have their own home at /org/[orgId] — this dashboard stays
  // personal-rooms-only for "My Rooms"/"Joined Rooms", exactly as it behaved
  // before Fase 6. Org rooms/orgs get their own dedicated sections below.
  const rooms = allRooms.filter((r) => !r.orgId);
  const joinedRooms = allJoinedRooms.filter((r) => !r.orgId);
  const { rooms: orgRooms, loading: orgRoomsLoading } = useMyOrgRooms(user?.uid);
  const { organizations, loading: organizationsLoading } = useMyOrganizations(user?.uid);
  const orgsById = new Map(organizations.map((org) => [org.id, org]));
  const { loading: whatsNewLoading, unseenNotes } = useWhatsNew();
  const [joinOpen, setJoinOpen] = useState(false);
  const [newRoomOpen, setNewRoomOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);
  const t = useTranslations("dashboard");

  useEffect(() => {
    if (!whatsNewLoading && unseenNotes.length > 0) {
      setWhatsNewOpen(true);
    }
  }, [whatsNewLoading, unseenNotes]);

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-12">
        {/* ── My Rooms ──────────────────────────────────────── */}
        <section>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6 sm:mb-8">
            <div>
              <h1 className="text-3xl font-bold text-text-primary tracking-tight">
                {t("myRooms")}
              </h1>
              <p className="text-text-secondary text-sm mt-1">{t("myRoomsSubtitle")}</p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <Button variant="ghost" onClick={() => setJoinOpen(true)}>
                {t("joinRoom")}
              </Button>
              <button
                onClick={() => setNewRoomOpen(true)}
                className="h-9 px-4 text-xs sm:h-10 sm:px-5 sm:text-sm rounded-md font-semibold flex items-center gap-2 bg-cta text-bg-base transition-opacity hover:opacity-90 cursor-pointer"
              >
                <PlusIcon />
                {t("newRoom")}
              </button>
            </div>
          </div>

          {loading ? (
            <RoomsSkeleton />
          ) : rooms.length === 0 ? (
            <EmptyState onNewRoom={() => setNewRoomOpen(true)} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  href={room.status === "ended" ? roomSummaryPath(room) : undefined}
                  onDelete={room.status === "ended" ? () => setRoomToDelete(room) : undefined}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Joined Rooms ──────────────────────────────────── */}
        <section>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-text-primary tracking-tight">
              {t("joinedRooms")}
            </h2>
            <p className="text-text-secondary text-sm mt-1">{t("joinedRoomsSubtitle")}</p>
          </div>

          {joinedLoading ? (
            <RoomsSkeleton />
          ) : joinedRooms.length === 0 ? (
            <p className="text-text-muted text-sm">
              {t("noJoinedRooms")}{" "}
              <button
                onClick={() => setJoinOpen(true)}
                className="text-accent-primary hover:underline cursor-pointer"
              >
                {t("noJoinedRoomsLink")}
              </button>{" "}
              {t("noJoinedRoomsEnd")}
            </p>
          ) : (
            <JoinedRoomsSection rooms={joinedRooms} />
          )}
        </section>

        {/* ── Organization rooms ────────────────────────────── */}
        {(organizationsLoading || organizations.length > 0) && (
          <section>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-text-primary tracking-tight">
                {t("orgRooms")}
              </h2>
              <p className="text-text-secondary text-sm mt-1">{t("orgRoomsSubtitle")}</p>
            </div>

            {orgRoomsLoading ? (
              <RoomsSkeleton />
            ) : orgRooms.length === 0 ? (
              <p className="text-text-muted text-sm">{t("noOrgRooms")}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {orgRooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    href={room.status === "ended" ? roomSummaryPath(room) : undefined}
                    org={room.orgId ? orgsById.get(room.orgId) : undefined}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── My organizations ─────────────────────────────── */}
        {(organizationsLoading || organizations.length > 0) && (
          <section>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-text-primary tracking-tight">
                {t("myOrganizations")}
              </h2>
            </div>

            {organizationsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[0, 1].map((i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {organizations.map((org) => (
                  <Link
                    key={org.id}
                    href={`/org/${org.id}`}
                    className="flex items-center gap-3 bg-bg-card border border-border rounded-lg px-4 py-3 hover:border-accent-violet/40 dark:hover:border-accent-cyan/40 transition-colors"
                  >
                    <OrgAvatar colorId={org.colorId} name={org.name} size={40} />
                    <span className="text-text-primary font-semibold text-sm truncate">
                      {org.name}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {joinOpen && <JoinRoomModal onClose={() => setJoinOpen(false)} />}
      {newRoomOpen && <NewRoomModal onClose={() => setNewRoomOpen(false)} />}
      {roomToDelete && (
        <DeleteRoomModal room={roomToDelete} onClose={() => setRoomToDelete(null)} />
      )}
      {whatsNewOpen && <WhatsNewModal onClose={() => setWhatsNewOpen(false)} />}
    </div>
  );
}

function JoinedRoomsSection({ rooms }: { rooms: Room[] }) {
  const t = useTranslations("dashboard");
  const active = rooms.filter((r) => r.status !== "ended");
  const ended = rooms.filter((r) => r.status === "ended");

  return (
    <div className="space-y-8">
      {active.length > 0 && (
        <div>
          <p className="text-text-muted text-xs uppercase tracking-widest font-semibold mb-4">
            {t("active")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {active.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        </div>
      )}

      {ended.length > 0 && (
        <div>
          <p className="text-text-muted text-xs uppercase tracking-widest font-semibold mb-4">
            {t("pastSessions")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ended.map((room) => (
              <RoomCard key={room.id} room={room} href={roomSummaryPath(room)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ onNewRoom }: { onNewRoom: () => void }) {
  const t = useTranslations("dashboard");
  return (
    <div className="flex flex-col items-center justify-center py-28 text-center">
      <div className="size-16 rounded-lg border border-border bg-bg-card flex items-center justify-center mb-6">
        <BoardIcon />
      </div>

      <h2 className="text-text-primary font-semibold text-lg mb-2">{t("emptyTitle")}</h2>
      <p className="text-text-secondary text-sm leading-relaxed mb-8 max-w-xs">
        {t("emptySubtitle")}
      </p>

      <button
        onClick={onNewRoom}
        className="h-11 px-6 rounded-md font-semibold text-sm flex items-center gap-2 bg-cta text-bg-base transition-opacity hover:opacity-90 cursor-pointer"
      >
        <PlusIcon />
        {t("createFirstRoom")}
      </button>
    </div>
  );
}

function RoomsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-bg-card border border-border rounded-lg p-6">
          <Skeleton className="h-5 w-16 rounded-sm mb-4" />
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}
