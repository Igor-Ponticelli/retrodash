import type { Metadata } from "next";
import { OrgGate } from "@/components/org/OrgGate";
import { SummaryClient } from "@/components/room/SummaryClient";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function OrgRoomSummaryPage({
  params,
}: {
  params: Promise<{ orgId: string; roomId: string }>;
}) {
  const { orgId, roomId } = await params;
  return (
    <OrgGate orgId={orgId}>
      <SummaryClient roomId={roomId} orgId={orgId} />
    </OrgGate>
  );
}
