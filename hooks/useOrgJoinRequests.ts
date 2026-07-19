"use client";

import { useEffect, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { orgJoinRequestsQuery } from "@/lib/firestore";
import { createRemountCache } from "@/lib/remountCache";
import { useAuth } from "@/hooks/useAuth";
import type { OrgJoinRequest } from "@/types";

const requestsCache = createRemountCache<OrgJoinRequest[]>();

// Realtime list of pending join requests for an org — only resolves any
// data for an admin/leader (firestore.rules gates list to isOrgManager);
// plain members get an empty list back via the error callback below.
export function useOrgJoinRequests(orgId: string) {
  const { user } = useAuth();
  const cacheKey = user ? `${orgId}:${user.uid}` : null;
  const hasCached = cacheKey !== null && requestsCache.has(cacheKey);
  const [requests, setRequests] = useState<OrgJoinRequest[]>(() =>
    hasCached ? requestsCache.get(cacheKey!)! : [],
  );
  const [loading, setLoading] = useState(() => !hasCached);

  useEffect(() => {
    if (!user) return;
    const key = `${orgId}:${user.uid}`;

    const unsub = onSnapshot(
      orgJoinRequestsQuery(orgId),
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as OrgJoinRequest);
        setRequests(data);
        requestsCache.set(key, data);
        setLoading(false);
      },
      () => {
        setRequests([]);
        setLoading(false);
      },
    );
    return unsub;
  }, [orgId, user]);

  return { requests, loading };
}
