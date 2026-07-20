import { OrgLayout } from "@/components/org/OrgLayout";

export default async function OrgDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return <OrgLayout orgId={orgId}>{children}</OrgLayout>;
}
