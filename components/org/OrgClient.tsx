"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMyOrgRole } from "@/hooks/useMyOrgRole";
import { useOrgRooms } from "@/hooks/useOrgRooms";
import { roomSummaryPath } from "@/lib/roomPath";
import { Skeleton } from "@/components/ui/Skeleton";
import { RoomCard } from "@/components/dashboard/RoomCard";
import { DeleteRoomModal } from "@/components/dashboard/DeleteRoomModal";
import { NewRoomModal } from "@/components/room/NewRoomModal";
import { PlusIcon } from "@/components/ui/Icons";
import type { Room } from "@/types";

interface OrgClientProps {
  orgId: string;
}

export function OrgClient({ orgId }: OrgClientProps) {
  const { member } = useMyOrgRole(orgId);
  const { rooms, loading: roomsLoading } = useOrgRooms(orgId);
  const t = useTranslations("organizations");
  const [newRoomOpen, setNewRoomOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);

  if (!member) return null;
  const isManager = member.role === "leader" || member.role === "admin";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-text-primary tracking-tight">{t("roomsTab")}</h2>
        {isManager && (
          <button
            onClick={() => setNewRoomOpen(true)}
            className="h-9 px-4 text-sm rounded-md font-semibold flex items-center gap-2 bg-cta text-bg-base transition-opacity hover:opacity-90 cursor-pointer"
          >
            <PlusIcon />
            {t("newRoomInOrg")}
          </button>
        )}
      </div>

      {roomsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <p className="text-text-muted text-sm">
          {isManager ? t("roomsEmpty") : t("onlyAdminsCanCreate")}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              href={room.status === "ended" ? roomSummaryPath(room) : undefined}
              onDelete={
                isManager && room.status === "ended" ? () => setRoomToDelete(room) : undefined
              }
            />
          ))}
        </div>
      )}

      {newRoomOpen && <NewRoomModal orgId={orgId} onClose={() => setNewRoomOpen(false)} />}
      {roomToDelete && (
        <DeleteRoomModal room={roomToDelete} onClose={() => setRoomToDelete(null)} />
      )}
    </div>
  );
}
