import type { Metadata } from "next";
import { OrgClient } from "@/components/org/OrgClient";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function OrgPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return <OrgClient orgId={orgId} />;
}
