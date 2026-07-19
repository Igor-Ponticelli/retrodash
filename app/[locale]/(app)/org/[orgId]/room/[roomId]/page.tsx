import type { Metadata } from "next";
import { OrgGate } from "@/components/org/OrgGate";
import { RoomClient } from "@/components/room/RoomClient";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function OrgRoomPage({
  params,
}: {
  params: Promise<{ orgId: string; roomId: string }>;
}) {
  const { orgId, roomId } = await params;
  return (
    <OrgGate orgId={orgId}>
      <RoomClient roomId={roomId} orgId={orgId} />
    </OrgGate>
  );
}
