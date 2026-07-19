"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { useOrgInvite } from "@/hooks/useOrgInvite";
import { regenerateOrgInvite, revokeOrgInvite } from "@/lib/firestore";
import { Button } from "@/components/ui/Button";

interface InviteLinkCardProps {
  orgId: string;
  isLeader: boolean;
}

const copiedStyle = {
  background: "color-mix(in srgb, var(--color-accent-primary) 12%, transparent)",
  color: "var(--color-accent-primary)",
};
const defaultStyle = {
  background: "var(--color-accent-primary)",
  color: "var(--color-bg-base)",
};

export function InviteLinkCard({ orgId, isLeader }: InviteLinkCardProps) {
  const { user } = useAuth();
  const { invite, loading } = useOrgInvite(orgId);
  const locale = useLocale();
  const t = useTranslations("organizations");
  const [copied, setCopied] = useState(false);
  const [working, setWorking] = useState(false);

  if (loading) return null;

  const url = invite
    ? `${window.location.origin}/${locale}/org/${orgId}?invite=${invite.id}`
    : null;

  const copy = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerate = async () => {
    if (!user) return;
    setWorking(true);
    try {
      await regenerateOrgInvite(orgId, user.uid, invite?.id ?? null);
    } finally {
      setWorking(false);
    }
  };

  const handleRevoke = async () => {
    if (!invite) return;
    setWorking(true);
    try {
      await revokeOrgInvite(orgId, invite.id);
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="bg-bg-card border border-border rounded-lg p-5">
      <p className="text-text-primary text-sm font-medium mb-1">{t("inviteLink")}</p>
      <p className="text-text-muted text-xs mb-4">{t("inviteLinkHint")}</p>

      {url ? (
        <div className="flex gap-2">
          <div className="flex-1 bg-bg-elevated border border-border rounded-md px-4 py-2.5 text-text-secondary text-sm truncate">
            {url}
          </div>
          <button
            onClick={copy}
            className="h-10 px-4 rounded-md text-xs font-semibold transition-all cursor-pointer shrink-0"
            style={copied ? copiedStyle : defaultStyle}
          >
            {copied ? t("copied") : t("copy")}
          </button>
        </div>
      ) : isLeader ? (
        <Button size="sm" onClick={handleGenerate} disabled={working}>
          {t("regenerateInvite")}
        </Button>
      ) : (
        <p className="text-text-muted text-sm">{t("noActiveInvite")}</p>
      )}

      {isLeader && url && (
        <div className="flex gap-2 mt-3">
          <Button variant="ghost" size="xs" onClick={handleGenerate} disabled={working}>
            {t("regenerateInvite")}
          </Button>
          <Button variant="ghost-text" size="xs" onClick={handleRevoke} disabled={working}>
            {t("revokeInvite")}
          </Button>
        </div>
      )}
    </div>
  );
}
