import type { Metadata } from "next";
import { OrgScoreboardsClient } from "@/components/org/OrgScoreboardsClient";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function OrgScoreboardsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return <OrgScoreboardsClient orgId={orgId} />;
}
