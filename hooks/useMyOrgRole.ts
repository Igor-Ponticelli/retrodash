"use client";

import { useEffect, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { orgMemberDoc } from "@/lib/firestore";
import { createRemountCache } from "@/lib/remountCache";
import { useAuth } from "@/hooks/useAuth";
import type { OrgMember } from "@/types";

const roleCache = createRemountCache<OrgMember | null>();

// Realtime membership doc for the CURRENT user in a given org. `member` is
// `null` once resolved and the user isn't (or is no longer) a member —
// drives OrgGate and every "am I admin/leader" UI check. orgId is optional so
// call sites that only sometimes operate in an org context (e.g.
// NewRoomModal) can call this unconditionally instead of branching on the
// Rules of Hooks.
export function useMyOrgRole(orgId: string | undefined) {
  const { user } = useAuth();
  const cacheKey = user && orgId ? `${orgId}:${user.uid}` : null;
  const hasCached = cacheKey !== null && roleCache.has(cacheKey);
  const [member, setMember] = useState<OrgMember | null>(() =>
    hasCached ? roleCache.get(cacheKey!)! : null,
  );
  const [loading, setLoading] = useState(() => !!orgId && !hasCached);

  useEffect(() => {
    if (!user || !orgId) return;
    const key = `${orgId}:${user.uid}`;

    const unsub = onSnapshot(
      orgMemberDoc(orgId, user.uid),
      (snap) => {
        const data = snap.exists() ? ({ id: snap.id, ...snap.data() } as OrgMember) : null;
        setMember(data);
        roleCache.set(key, data);
        setLoading(false);
      },
      // A rejected listener would otherwise leave `loading` stuck true
      // forever (OrgGate's skeleton spinning indefinitely). Resolve to "not
      // a member" instead, same outcome as a clean non-existent doc.
      () => {
        setMember(null);
        setLoading(false);
      },
    );
    return unsub;
  }, [orgId, user]);

  return { member, loading };
}
