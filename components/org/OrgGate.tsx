"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { useMyOrgRole } from "@/hooks/useMyOrgRole";
import { useMyJoinRequest } from "@/hooks/useMyJoinRequest";
import { getOrgInvite, requestToJoinOrg } from "@/lib/firestore";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { OrgAvatar } from "@/components/org/OrgAvatar";

interface OrgGateProps {
  orgId: string;
  children: React.ReactNode;
}

// Single place org-membership logic lives (including invite redemption).
// Every /org/[orgId]/* route wraps its content in this instead of
// re-checking membership itself, so RoomClient/SummaryClient can trust an
// orgId prop without re-verifying it.
export function OrgGate({ orgId, children }: OrgGateProps) {
  const { organization, loading: orgLoading } = useOrganization(orgId);
  const { member, loading: memberLoading } = useMyOrgRole(orgId);
  const { request: joinRequest, loading: requestLoading } = useMyJoinRequest(orgId);
  const searchParams = useSearchParams();
  const inviteId = searchParams.get("invite");
  const t = useTranslations("organizations");

  if (orgLoading || memberLoading || requestLoading) return <GateSkeleton />;

  if (!organization) {
    return <DeniedScreen title={t("orgNotFound")} subtitle={t("orgNotFoundHint")} />;
  }

  if (!member) {
    // Already requested (via this link or an earlier one) — show the
    // pending screen instead of the Join button again. This also
    // automatically transitions once an admin/leader approves or rejects
    // (the underlying doc changing flips this same onSnapshot listener).
    if (joinRequest) {
      return (
        <PendingRequestScreen orgName={organization.name} orgColorId={organization.colorId} />
      );
    }
    if (inviteId) {
      return <JoinPrompt orgId={orgId} orgName={organization.name} orgColorId={organization.colorId} inviteId={inviteId} />;
    }
    return <DeniedScreen title={t("notAMember")} subtitle={t("notAMemberHint")} />;
  }

  return <>{children}</>;
}

function JoinPrompt({
  orgId,
  orgName,
  orgColorId,
  inviteId,
}: {
  orgId: string;
  orgName: string;
  orgColorId: string;
  inviteId: string;
}) {
  const { user } = useAuth();
  const t = useTranslations("organizations");
  const [status, setStatus] = useState<"checking" | "valid" | "invalid">("checking");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getOrgInvite(orgId, inviteId)
      .then((invite) => {
        if (cancelled) return;
        setStatus(invite?.active ? "valid" : "invalid");
      })
      // Without this, a rejected getDoc leaves `status` stuck at "checking"
      // forever instead of resolving to a denied screen.
      .catch(() => {
        if (cancelled) return;
        setStatus("invalid");
      });
    return () => {
      cancelled = true;
    };
  }, [orgId, inviteId]);

  if (status === "checking") return <GateSkeleton />;

  if (status === "invalid") {
    return <DeniedScreen title={t("inviteInvalidOrRevoked")} subtitle={t("notAMemberHint")} />;
  }

  const handleJoin = async () => {
    if (!user) return;
    setJoining(true);
    setJoinError(false);
    try {
      await requestToJoinOrg(orgId, inviteId, {
        uid: user.uid,
        displayName: user.displayName ?? "Member",
        photoURL: user.photoURL ?? null,
      });
      // useMyJoinRequest's onSnapshot picks up the new request doc on its
      // own, and OrgGate switches to PendingRequestScreen automatically —
      // no manual state transition needed here on success.
    } catch {
      setJoining(false);
      setJoinError(true);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="flex justify-center mb-4">
          <OrgAvatar colorId={orgColorId} name={orgName} size={56} />
        </div>
        <h1 className="text-text-primary font-semibold text-lg mb-2">
          {t("joinOrgPrompt", { orgName })}
        </h1>
        <p className="text-text-secondary text-sm leading-relaxed mb-5">
          {t("joinOrgRequestHint")}
        </p>
        <Button onClick={handleJoin} disabled={joining}>
          {joining ? t("joining") : t("joinOrgButton")}
        </Button>
        {joinError && (
          <p className="text-red-400 text-xs mt-3">{t("serverError")}</p>
        )}
      </div>
    </div>
  );
}

function PendingRequestScreen({
  orgName,
  orgColorId,
}: {
  orgName: string;
  orgColorId: string;
}) {
  const t = useTranslations("organizations");
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="flex justify-center mb-4">
          <OrgAvatar colorId={orgColorId} name={orgName} size={56} />
        </div>
        <h1 className="text-text-primary font-semibold text-lg mb-2">
          {t("joinRequestPendingTitle")}
        </h1>
        <p className="text-text-secondary text-sm leading-relaxed mb-6">
          {t("joinRequestPendingHint", { orgName })}
        </p>
        <Link
          href="/dashboard"
          className="text-accent-primary text-sm font-medium hover:underline"
        >
          ← Dashboard
        </Link>
      </div>
    </div>
  );
}

function DeniedScreen({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <h1 className="text-text-primary font-semibold text-lg mb-2">{title}</h1>
        <p className="text-text-secondary text-sm leading-relaxed mb-6">{subtitle}</p>
        <Link
          href="/dashboard"
          className="text-accent-primary text-sm font-medium hover:underline"
        >
          ← Dashboard
        </Link>
      </div>
    </div>
  );
}

function GateSkeleton() {
  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <div className="h-16 bg-bg-surface border-b border-border" />
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
    </div>
  );
}
