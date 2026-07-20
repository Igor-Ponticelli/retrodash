import type { Metadata } from "next";
import { OrgCategoriesClient } from "@/components/org/OrgCategoriesClient";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function OrgCategoriesPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return <OrgCategoriesClient orgId={orgId} />;
}
