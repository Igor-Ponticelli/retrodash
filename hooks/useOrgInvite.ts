"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { organizationDoc } from "@/lib/firestore";
import type { OrgInvite } from "@/types";

// Realtime resolution of organizations/{orgId}.activeInviteId -> the invite
// doc itself. Two chained listeners (org doc, then invite doc once the id is
// known) rather than a denormalized copy, so revoking/regenerating the
// invite is reflected live wherever this is rendered (e.g. the members page).
export function useOrgInvite(orgId: string) {
  const [activeInviteId, setActiveInviteId] = useState<string | null>(null);
  const [invite, setInvite] = useState<OrgInvite | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      organizationDoc(orgId),
      (snap) => {
        setActiveInviteId(snap.exists() ? ((snap.data().activeInviteId as string | undefined) ?? null) : null);
      },
      () => setActiveInviteId(null),
    );
    return unsub;
  }, [orgId]);

  useEffect(() => {
    if (!activeInviteId) {
      setInvite(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = onSnapshot(
      doc(db, "organizations", orgId, "invites", activeInviteId),
      (snap) => {
        setInvite(snap.exists() ? ({ id: snap.id, ...snap.data() } as OrgInvite) : null);
        setLoading(false);
      },
      // A rejected listener would otherwise leave `loading` stuck true
      // forever (InviteLinkCard's render gated on `loading`).
      () => {
        setInvite(null);
        setLoading(false);
      },
    );
    return unsub;
  }, [orgId, activeInviteId]);

  return { invite, loading };
}
