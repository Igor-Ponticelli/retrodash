"use client";

import { useEffect, useState } from "react";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createRemountCache } from "@/lib/remountCache";
import { useAuth } from "@/hooks/useAuth";
import type { OrgJoinRequest } from "@/types";

const requestCache = createRemountCache<OrgJoinRequest | null>();

// Realtime check for "do I already have a pending join request on this
// org" — drives OrgGate's "request sent, waiting for approval" screen so a
// user who already requested doesn't see the Join button again, and so the
// screen updates live the moment their request is approved/rejected.
export function useMyJoinRequest(orgId: string) {
  const { user } = useAuth();
  const cacheKey = user ? `${orgId}:${user.uid}` : null;
  const hasCached = cacheKey !== null && requestCache.has(cacheKey);
  const [request, setRequest] = useState<OrgJoinRequest | null>(() =>
    hasCached ? requestCache.get(cacheKey!)! : null,
  );
  const [loading, setLoading] = useState(() => !hasCached);

  useEffect(() => {
    if (!user) return;
    const key = `${orgId}:${user.uid}`;

    const unsub = onSnapshot(
      doc(db, "organizations", orgId, "joinRequests", user.uid),
      (snap) => {
        const data = snap.exists() ? ({ id: snap.id, ...snap.data() } as OrgJoinRequest) : null;
        setRequest(data);
        requestCache.set(key, data);
        setLoading(false);
      },
      () => {
        setRequest(null);
        setLoading(false);
      },
    );
    return unsub;
  }, [orgId, user]);

  return { request, loading };
}
