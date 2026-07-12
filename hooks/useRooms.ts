"use client";

import { useEffect, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { ownedRoomsQuery } from "@/lib/firestore";
import { createRemountCache } from "@/lib/remountCache";
import type { Room } from "@/types";

const roomsCache = createRemountCache<Room[]>();

export function useRooms() {
  const { user } = useAuth();
  const hasCached = !!user && roomsCache.has(user.uid);
  const [rooms, setRooms] = useState<Room[]>(() =>
    hasCached ? roomsCache.get(user!.uid)! : []
  );
  const [loading, setLoading] = useState(() => !hasCached);

  useEffect(() => {
    if (!user) {
      setRooms([]);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(ownedRoomsQuery(user.uid), (snapshot) => {
      const data = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Room)
      );
      data.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
      setRooms(data);
      roomsCache.set(user.uid, data);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  return { rooms, loading };
}
