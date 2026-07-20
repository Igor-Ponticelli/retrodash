"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { useOrgMembers } from "@/hooks/useOrgMembers";
import { useMyOrgRole } from "@/hooks/useMyOrgRole";
import { useOrgJoinRequests } from "@/hooks/useOrgJoinRequests";
import {
  approveJoinRequest,
  changeOrgMemberRole,
  rejectJoinRequest,
  removeOrgMember,
  transferOrgLeadership,
} from "@/lib/firestore";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { InviteLinkCard } from "@/components/org/InviteLinkCard";
import { XIcon } from "@/components/ui/Icons";
import type { OrgJoinRequest, OrgMember, OrgRole } from "@/types";

interface OrgMembersClientProps {
  orgId: string;
}

export function OrgMembersClient({ orgId }: OrgMembersClientProps) {
  const { organization } = useOrganization(orgId);
  const { members, loading } = useOrgMembers(orgId);
  const { requests, loading: requestsLoading } = useOrgJoinRequests(orgId);
  const { member: me } = useMyOrgRole(orgId);
  const t = useTranslations("organizations");
  const [linkRegeneratedNotice, setLinkRegeneratedNotice] = useState(false);

  if (!me || !organization) return null;
  const isLeader = me.role === "leader";
  const isManager = me.role === "leader" || me.role === "admin";

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-bold text-text-primary tracking-tight">{t("membersTab")}</h2>

      <InviteLinkCard orgId={orgId} isLeader={isLeader} />

      {isManager && !requestsLoading && requests.length > 0 && (
        <div className="space-y-3">
          <p className="text-text-muted text-xs font-semibold uppercase tracking-widest">
            {t("pendingRequestsTitle", { count: requests.length })}
          </p>

          {linkRegeneratedNotice && (
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-md bg-accent-primary/10 border border-accent-primary/30 text-sm text-text-primary">
              <span>{t("inviteLinkRegeneratedNotice")}</span>
              <button
                onClick={() => setLinkRegeneratedNotice(false)}
                aria-label={t("cancel")}
                className="text-text-muted hover:text-text-primary transition-colors cursor-pointer shrink-0"
              >
                <XIcon size={12} />
              </button>
            </div>
          )}

          <ul className="space-y-1">
            {requests.map((r) => (
              <JoinRequestRow
                key={r.id}
                orgId={orgId}
                request={r}
                activeInviteId={organization.activeInviteId ?? null}
                onRejected={() => setLinkRegeneratedNotice(true)}
              />
            ))}
          </ul>
        </div>
      )}

      {!loading && (
        <ul className="space-y-1">
          {members.map((m) => (
            <MemberRow key={m.id} orgId={orgId} member={m} isLeader={isLeader} myUserId={me.userId} />
          ))}
        </ul>
      )}
    </div>
  );
}

function JoinRequestRow({
  orgId,
  request,
  activeInviteId,
  onRejected,
}: {
  orgId: string;
  request: OrgJoinRequest;
  activeInviteId: string | null;
  onRejected: () => void;
}) {
  const { user } = useAuth();
  const t = useTranslations("organizations");
  const [working, setWorking] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);

  const handleApprove = async () => {
    setWorking(true);
    try {
      await approveJoinRequest(orgId, request);
    } finally {
      setWorking(false);
    }
  };

  const handleReject = async () => {
    if (!user) return;
    setWorking(true);
    try {
      await rejectJoinRequest(orgId, request, user.uid, activeInviteId);
      onRejected();
    } finally {
      setWorking(false);
      setConfirmReject(false);
    }
  };

  return (
    <li className="flex items-center gap-3 px-3 py-3 rounded-md bg-bg-card border border-border">
      <Avatar photoURL={request.photoURL} name={request.displayName} size={32} />
      <span className="flex-1 text-sm text-text-primary truncate">{request.displayName}</span>

      <div className="flex items-center gap-1 shrink-0">
        {confirmReject ? (
          <>
            <Button variant="ghost-text" size="xs" onClick={() => setConfirmReject(false)} disabled={working}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" size="xs" onClick={handleReject} disabled={working}>
              {t("confirmReject")}
            </Button>
          </>
        ) : (
          <>
            <Button variant="cyan" size="xs" onClick={handleApprove} disabled={working}>
              {t("approveRequest")}
            </Button>
            <Button variant="ghost-text" size="xs" onClick={() => setConfirmReject(true)} disabled={working}>
              {t("rejectRequest")}
            </Button>
          </>
        )}
      </div>
    </li>
  );
}

function MemberRow({
  orgId,
  member,
  isLeader,
  myUserId,
}: {
  orgId: string;
  member: OrgMember;
  isLeader: boolean;
  myUserId: string;
}) {
  const t = useTranslations("organizations");
  const [working, setWorking] = useState(false);
  const [confirmTransfer, setConfirmTransfer] = useState(false);

  const roleLabel: Record<OrgRole, string> = {
    leader: t("roleLeader"),
    admin: t("roleAdmin"),
    member: t("roleMember"),
  };

  const handleToggleAdmin = async () => {
    setWorking(true);
    try {
      await changeOrgMemberRole(orgId, member.userId, member.role === "admin" ? "member" : "admin");
    } finally {
      setWorking(false);
    }
  };

  const handleRemove = async () => {
    setWorking(true);
    try {
      await removeOrgMember(orgId, member.userId);
    } finally {
      setWorking(false);
    }
  };

  const handleTransfer = async () => {
    setWorking(true);
    try {
      await transferOrgLeadership(orgId, member.userId, myUserId);
      setConfirmTransfer(false);
    } finally {
      setWorking(false);
    }
  };

  const canManage = isLeader && member.role !== "leader";

  return (
    <li className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-bg-elevated transition-colors">
      <Avatar photoURL={member.photoURL} name={member.displayName} size={32} />
      <span className="flex-1 text-sm text-text-primary truncate">
        {member.displayName}
        {member.userId === myUserId && (
          <span className="text-text-muted"> ({t("you")})</span>
        )}
      </span>

      <span
        className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-sm shrink-0 ${
          member.role === "leader"
            ? "text-accent-primary bg-accent-primary/10"
            : "text-text-muted bg-bg-elevated"
        }`}
      >
        {roleLabel[member.role]}
      </span>

      {canManage && (
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="xs" onClick={handleToggleAdmin} disabled={working}>
            {member.role === "admin" ? t("demoteToMember") : t("promoteToAdmin")}
          </Button>
          {confirmTransfer ? (
            <>
              <Button variant="ghost-text" size="xs" onClick={() => setConfirmTransfer(false)} disabled={working}>
                {t("cancel")}
              </Button>
              <Button variant="destructive" size="xs" onClick={handleTransfer} disabled={working}>
                {t("confirmTransfer")}
              </Button>
            </>
          ) : (
            <Button variant="ghost-text" size="xs" onClick={() => setConfirmTransfer(true)} disabled={working}>
              {t("makeLeader")}
            </Button>
          )}
          <Button variant="ghost-text" size="xs" onClick={handleRemove} disabled={working}>
            {t("removeMember")}
          </Button>
        </div>
      )}
    </li>
  );
}
