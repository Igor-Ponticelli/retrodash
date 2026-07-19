import type { Metadata } from "next";
import { OrgSettingsClient } from "@/components/org/OrgSettingsClient";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function OrgSettingsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return <OrgSettingsClient orgId={orgId} />;
}
