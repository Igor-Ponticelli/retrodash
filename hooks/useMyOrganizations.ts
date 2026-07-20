"use client";

import { useEffect, useState } from "react";
import { getDocs } from "firebase/firestore";
import { myOrgMembershipsQuery, getOrganization } from "@/lib/firestore";
import { createRemountCache } from "@/lib/remountCache";
import type { Organization } from "@/types";

const orgsCache = createRemountCache<Organization[]>();

// One-shot lookup (not realtime) powering the Profile/Dashboard "orgs I
// belong to" lists — same collectionGroup shape as useJoinedRooms, but org
// membership changes rarely enough that a live listener isn't worth keeping
// open on these pages. Cached per-user across remounts (same reasoning as
// useRoom/useParticipants) so revisiting the page renders the known list
// instantly instead of flashing a loading state while refetching.
export function useMyOrganizations(userId: string | undefined) {
  const hasCached = !!userId && orgsCache.has(userId);
  const [organizations, setOrganizations] = useState<Organization[]>(() =>
    hasCached ? orgsCache.get(userId!)! : [],
  );
  const [loading, setLoading] = useState(() => !hasCached);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    getDocs(myOrgMembershipsQuery(userId))
      .then(async (snap) => {
        const orgIds = [...new Set(snap.docs.map((d) => d.ref.parent.parent!.id))];
        const orgs = await Promise.all(orgIds.map((id) => getOrganization(id)));
        if (cancelled) return;
        const data = orgs.filter((o): o is Organization => o !== null);
        setOrganizations(data);
        orgsCache.set(userId, data);
        setLoading(false);
      })
      // Without this, a rejected fetch leaves `loading` stuck true forever
      // instead of resolving to an empty list.
      .catch(() => {
        if (cancelled) return;
        setOrganizations([]);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { organizations, loading };
}
