"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useMyActionItems } from "@/hooks/useMyActionItems";
import { useMyOrganizations } from "@/hooks/useMyOrganizations";
import { roomPath, roomSummaryPath } from "@/lib/roomPath";
import { signOut } from "@/lib/auth";
import { Navbar } from "@/components/ui/Navbar";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { CircleIcon, LoopIcon, PlusIcon } from "@/components/ui/Icons";
import { CreateOrgModal } from "@/components/org/CreateOrgModal";
import { OrgAvatar } from "@/components/org/OrgAvatar";

export function ProfileClient() {
  const { user } = useAuth();
  const t = useTranslations("profile");
  const tBoard = useTranslations("board");
  const tOrg = useTranslations("organizations");
  const {
    items,
    loading: itemsLoading,
    loaded,
    load,
  } = useMyActionItems(user?.uid);
  const { organizations, loading: orgsLoading } = useMyOrganizations(user?.uid);
  const [createOrgOpen, setCreateOrgOpen] = useState(false);

  useEffect(() => {
    if (!loaded) load({ includeAuthored: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  if (!user) return null;

  const groups: {
    status: "pending" | "keep";
    label: string;
    colorClass: string;
    icon: React.ReactNode;
  }[] = [
    {
      status: "pending",
      label: tBoard("statusPending"),
      colorClass: "text-orange-600 dark:text-orange-400",
      icon: <CircleIcon size={12} />,
    },
    {
      status: "keep",
      label: tBoard("statusKeep"),
      colorClass: "text-accent-violet",
      icon: <LoopIcon size={12} />,
    },
  ];

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <Navbar logoHref="/dashboard" />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-10">
        <div className="flex items-center gap-4">
          <Avatar
            photoURL={user.photoURL}
            name={user.displayName ?? "?"}
            size={64}
          />
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              {user.displayName}
            </h1>
            <p className="text-text-secondary text-sm mt-0.5">{user.email}</p>
          </div>
        </div>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-text-primary tracking-tight">
              {t("myOrganizations")}
            </h2>
            <button
              onClick={() => setCreateOrgOpen(true)}
              className="flex items-center gap-1.5 text-accent-primary text-sm font-medium hover:opacity-80 transition-opacity cursor-pointer"
            >
              <PlusIcon size={12} />
              {tOrg("createOrg")}
            </button>
          </div>

          {orgsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12" />
            </div>
          ) : organizations.length === 0 ? (
            <p className="text-text-muted text-sm">
              {t("myOrganizationsEmpty")}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {organizations.map((org) => (
                <Link
                  key={org.id}
                  href={`/org/${org.id}`}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-bg-card border border-border hover:border-accent-violet/40 dark:hover:border-accent-cyan/40 transition-colors"
                >
                  <OrgAvatar colorId={org.colorId} name={org.name} size={40} />
                  <span className="text-text-primary font-semibold text-sm truncate">
                    {org.name}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-bold text-text-primary tracking-tight mb-4">
            {t("myActionItems")}
          </h2>

          {itemsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-text-muted text-sm">{t("myActionItemsEmpty")}</p>
          ) : (
            <div className="space-y-4">
              {groups.map(({ status, label, colorClass, icon }) => {
                const groupItems = items.filter(
                  ({ card }) => card.actionStatus === status,
                );
                if (groupItems.length === 0) return null;

                return (
                  <div key={status}>
                    <p
                      className={`text-[11px] font-semibold uppercase tracking-widest mb-2 ${colorClass}`}
                    >
                      {label}
                    </p>
                    <ul className="space-y-1 lg:grid lg:grid-cols-2 lg:gap-1 lg:space-y-0">
                      {groupItems.map(
                        ({ card, roomId, roomName, roomStatus, roomOrgId }) => (
                          <li key={`${roomId}-${card.id}`}>
                            <Link
                              href={
                                roomStatus === "ended"
                                  ? roomSummaryPath({
                                      id: roomId,
                                      orgId: roomOrgId,
                                    })
                                  : roomPath({ id: roomId, orgId: roomOrgId })
                              }
                              className="flex items-start gap-2 px-3 py-2 rounded-md bg-bg-card border border-border hover:border-text-muted transition-colors"
                            >
                              <span className={`mt-0.5 shrink-0 ${colorClass}`}>
                                {icon}
                              </span>
                              <span className="min-w-0">
                                <span className="block text-sm text-text-primary truncate">
                                  {card.text}
                                </span>
                                <span className="block text-text-muted text-xs truncate">
                                  {roomName}
                                </span>
                              </span>
                            </Link>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="flex items-center gap-3 pt-4 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            disabled
            title={t("helpButtonDisabledHint")}
          >
            {t("helpButton")}
          </Button>
          <Button variant="ghost-text" size="sm" onClick={() => signOut()}>
            {t("signOut")}
          </Button>
        </section>
      </main>

      {createOrgOpen && (
        <CreateOrgModal onClose={() => setCreateOrgOpen(false)} />
      )}
    </div>
  );
}
