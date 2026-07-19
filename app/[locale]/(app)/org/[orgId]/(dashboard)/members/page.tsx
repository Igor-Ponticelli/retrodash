import type { Metadata } from "next";
import { OrgMembersClient } from "@/components/org/OrgMembersClient";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function OrgMembersPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return <OrgMembersClient orgId={orgId} />;
}
