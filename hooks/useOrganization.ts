"use client";

import { useEffect, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { organizationDoc } from "@/lib/firestore";
import { createRemountCache } from "@/lib/remountCache";
import { useAuth } from "@/hooks/useAuth";
import type { Organization } from "@/types";

const orgCache = createRemountCache<Organization | null>();

// orgId is optional so call sites that only sometimes operate in an org
// context (e.g. SummaryClient, shared between personal and org rooms) can
// call this unconditionally instead of branching on the Rules of Hooks.
export function useOrganization(orgId: string | undefined) {
  const { user } = useAuth();
  const cacheKey = user && orgId ? `${orgId}:${user.uid}` : null;
  const hasCached = cacheKey !== null && orgCache.has(cacheKey);
  const [organization, setOrganization] = useState<Organization | null>(() =>
    hasCached ? orgCache.get(cacheKey!)! : null,
  );
  const [loading, setLoading] = useState(() => !!orgId && !hasCached);

  useEffect(() => {
    if (!user || !orgId) return;
    const key = `${orgId}:${user.uid}`;

    const unsub = onSnapshot(
      organizationDoc(orgId),
      (snap) => {
        const data = snap.exists() ? ({ id: snap.id, ...snap.data() } as Organization) : null;
        setOrganization(data);
        orgCache.set(key, data);
        setLoading(false);
      },
      // Without this, a rejected listener (e.g. permission-denied) never
      // calls back at all, leaving `loading` stuck true forever — OrgGate's
      // skeleton would spin indefinitely instead of resolving to a denied
      // state. Falling back to null/not-loading lets OrgGate's existing
      // "!organization" branch render its normal denied screen.
      () => {
        setOrganization(null);
        setLoading(false);
      },
    );
    return unsub;
  }, [orgId, user]);

  return { organization, loading };
}
