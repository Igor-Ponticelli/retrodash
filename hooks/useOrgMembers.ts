"use client";

import { useEffect, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { orgMembersQuery } from "@/lib/firestore";
import { createRemountCache } from "@/lib/remountCache";
import { useAuth } from "@/hooks/useAuth";
import type { OrgMember } from "@/types";

const membersCache = createRemountCache<OrgMember[]>();

export function useOrgMembers(orgId: string) {
  const { user } = useAuth();
  const cacheKey = user ? `${orgId}:${user.uid}` : null;
  const hasCached = cacheKey !== null && membersCache.has(cacheKey);
  const [members, setMembers] = useState<OrgMember[]>(() =>
    hasCached ? membersCache.get(cacheKey!)! : [],
  );
  const [loading, setLoading] = useState(() => !hasCached);

  useEffect(() => {
    if (!user) return;
    const key = `${orgId}:${user.uid}`;

    const unsub = onSnapshot(
      orgMembersQuery(orgId),
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as OrgMember);
        setMembers(data);
        membersCache.set(key, data);
        setLoading(false);
      },
      () => {
        setMembers([]);
        setLoading(false);
      },
    );
    return unsub;
  }, [orgId, user]);

  return { members, loading };
}
