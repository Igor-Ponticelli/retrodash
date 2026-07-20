"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useOrganization } from "@/hooks/useOrganization";
import { OrgGate } from "@/components/org/OrgGate";
import { Navbar } from "@/components/ui/Navbar";
import { OrgAvatar } from "@/components/org/OrgAvatar";
import { ArrowLeftIcon } from "@/components/ui/Icons";

interface OrgLayoutProps {
  orgId: string;
  children: React.ReactNode;
}

// Single shared shell for every /org/[orgId]/* route: Navbar, back-to-dashboard
// link, org identity header, and the Rooms/Scoreboard/Categories/Members
// subnav with an active-tab indicator. Each tab's own page only renders its
// content — membership gating (OrgGate) and the width/shell live here once,
// instead of every org page duplicating (and drifting from) its own version.
export function OrgLayout({ orgId, children }: OrgLayoutProps) {
  return (
    <OrgGate orgId={orgId}>
      <OrgLayoutShell orgId={orgId}>{children}</OrgLayoutShell>
    </OrgGate>
  );
}

function OrgLayoutShell({ orgId, children }: OrgLayoutProps) {
  const { organization } = useOrganization(orgId);
  const pathname = usePathname();
  const t = useTranslations("organizations");

  if (!organization) return null;

  const tabs = [
    { href: `/org/${orgId}`, label: t("roomsTab") },
    { href: `/org/${orgId}/scoreboards`, label: t("scoreboardsTab") },
    { href: `/org/${orgId}/categories`, label: t("categoriesTab") },
    { href: `/org/${orgId}/members`, label: t("membersTab") },
    { href: `/org/${orgId}/settings`, label: t("settingsTab") },
  ];

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <Navbar logoHref="/dashboard" />

      <div className="border-b border-border">
        <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-text-muted hover:text-text-secondary text-xs mb-4 transition-colors"
          >
            <ArrowLeftIcon size={12} />
            {t("backToDashboard")}
          </Link>

          <div className="flex items-center gap-3 mb-5">
            <OrgAvatar colorId={organization.colorId} name={organization.name} size={40} />
            <h1 className="text-xl font-bold text-text-primary tracking-tight truncate">
              {organization.name}
            </h1>
          </div>

          <nav className="flex gap-1 -mb-px overflow-x-auto scrollbar-thin">
            {tabs.map((tab) => {
              const active = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={`shrink-0 px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
                    active
                      ? "border-accent-primary text-text-primary"
                      : "border-transparent text-text-muted hover:text-text-secondary"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {children}
      </main>
    </div>
  );
}
