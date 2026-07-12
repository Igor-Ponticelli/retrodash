"use client";

import { useEffect, useState } from "react";
import { onSnapshot, getDoc } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { joinedRoomsParticipantQuery, roomDoc } from "@/lib/firestore";
import { createRemountCache } from "@/lib/remountCache";
import type { Room } from "@/types";

const joinedRoomsCache = createRemountCache<Room[]>();

export function useJoinedRooms() {
  const { user } = useAuth();
  const hasCached = !!user && joinedRoomsCache.has(user.uid);
  const [joinedRooms, setJoinedRooms] = useState<Room[]>(() =>
    hasCached ? joinedRoomsCache.get(user!.uid)! : []
  );
  const [loading, setLoading] = useState(() => !hasCached);

  useEffect(() => {
    if (!user) {
      setJoinedRooms([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const unsub = onSnapshot(
      joinedRoomsParticipantQuery(user.uid),
      async (snap) => {
        // Only member participant docs (role !== "facilitator" = rooms I joined, not created)
        const memberDocs = snap.docs.filter(
          (d) => d.data().role !== "facilitator",
        );

        if (memberDocs.length === 0) {
          if (!cancelled) {
            setJoinedRooms([]);
            joinedRoomsCache.set(user.uid, []);
            setLoading(false);
          }
          return;
        }

        const roomIds = memberDocs.map((d) => d.ref.parent.parent!.id);
        const roomSnaps = await Promise.all(roomIds.map((id) => getDoc(roomDoc(id))));

        if (!cancelled) {
          const data = roomSnaps
            .filter((d) => d.exists())
            .map((d) => ({ id: d.id, ...d.data() }) as Room)
            .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
          setJoinedRooms(data);
          joinedRoomsCache.set(user.uid, data);
          setLoading(false);
        }
      },
    );

    return () => {
      cancelled = true;
      unsub();
    };
  }, [user]);

  return { joinedRooms, loading };
}
