"use client";

import { useEffect, useState } from "react";
import { getDocs } from "firebase/firestore";
import { myOrgMembershipsQuery, orgRoomsQuery } from "@/lib/firestore";
import { createRemountCache } from "@/lib/remountCache";
import type { Room } from "@/types";

const orgRoomsCache = createRemountCache<Room[]>();

// One-shot lookup (not realtime, same reasoning as useMyOrganizations: org
// membership/rooms don't change often enough to justify N-org listeners open
// on the dashboard) powering the dashboard's "Organization rooms" section —
// every room across every org the user belongs to, regardless of role.
// Cached per-user across remounts so revisiting the dashboard renders
// instantly instead of flashing a loading state while refetching.
export function useMyOrgRooms(userId: string | undefined) {
  const hasCached = !!userId && orgRoomsCache.has(userId);
  const [rooms, setRooms] = useState<Room[]>(() => (hasCached ? orgRoomsCache.get(userId!)! : []));
  const [loading, setLoading] = useState(() => !hasCached);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    getDocs(myOrgMembershipsQuery(userId))
      .then(async (snap) => {
        const orgIds = [...new Set(snap.docs.map((d) => d.ref.parent.parent!.id))];
        const roomSnaps = await Promise.all(orgIds.map((orgId) => getDocs(orgRoomsQuery(orgId))));
        if (cancelled) return;
        const allRooms = roomSnaps
          .flatMap((s) => s.docs.map((d) => ({ id: d.id, ...d.data() }) as Room))
          .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
        setRooms(allRooms);
        orgRoomsCache.set(userId, allRooms);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setRooms([]);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { rooms, loading };
}
