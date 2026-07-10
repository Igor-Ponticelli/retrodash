"use client";

import { useEffect, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { participantsQuery } from "@/lib/firestore";
import { createRemountCache } from "@/lib/remountCache";
import { useAuth } from "@/hooks/useAuth";
import type { Participant } from "@/types";

const participantsCache = createRemountCache<Participant[]>();

export function useParticipants(roomId: string) {
  const { user } = useAuth();
  const cacheKey = user ? `${roomId}:${user.uid}` : null;
  const hasCached = cacheKey !== null && participantsCache.has(cacheKey);
  const [participants, setParticipants] = useState<Participant[]>(() =>
    hasCached ? participantsCache.get(cacheKey!)! : []
  );
  const [loading, setLoading] = useState(() => !hasCached);

  useEffect(() => {
    if (!user) return;
    const key = `${roomId}:${user.uid}`;

    const unsub = onSnapshot(participantsQuery(roomId), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Participant);
      setParticipants(data);
      participantsCache.set(key, data);
      setLoading(false);
    });
    return unsub;
  }, [roomId, user]);

  return { participants, loading };
}
