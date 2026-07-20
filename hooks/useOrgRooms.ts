"use client";

import { useEffect, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { orgRoomsQuery } from "@/lib/firestore";
import { createRemountCache } from "@/lib/remountCache";
import type { Room } from "@/types";

const orgRoomsCache = createRemountCache<Room[]>();

// orgId is optional so call sites that only sometimes operate in an org
// context (e.g. NewRoomModal, shared between personal and org room creation)
// can call this unconditionally instead of branching on the Rules of Hooks.
export function useOrgRooms(orgId: string | undefined) {
  const { user } = useAuth();
  const cacheKey = user && orgId ? `${orgId}:${user.uid}` : null;
  const hasCached = cacheKey !== null && orgRoomsCache.has(cacheKey);
  const [rooms, setRooms] = useState<Room[]>(() =>
    hasCached ? orgRoomsCache.get(cacheKey!)! : [],
  );
  const [loading, setLoading] = useState(() => !!orgId && !hasCached);

  useEffect(() => {
    if (!user || !orgId) return;
    const key = `${orgId}:${user.uid}`;

    const unsubscribe = onSnapshot(
      orgRoomsQuery(orgId),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Room);
        data.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
        setRooms(data);
        orgRoomsCache.set(key, data);
        setLoading(false);
      },
      // A rejected listener would otherwise leave `loading` stuck true
      // forever (the Rooms tab's skeleton spinning indefinitely).
      () => {
        setRooms([]);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [orgId, user]);

  return { rooms, loading };
}
