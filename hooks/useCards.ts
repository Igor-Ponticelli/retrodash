"use client";

import { useEffect, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { cardsQuery } from "@/lib/firestore";
import { createRemountCache } from "@/lib/remountCache";
import { useAuth } from "@/hooks/useAuth";
import type { Card } from "@/types";

const cardsCache = createRemountCache<Card[]>();

export function useCards(roomId: string) {
  const { user } = useAuth();
  const cacheKey = user ? `${roomId}:${user.uid}` : null;
  const hasCached = cacheKey !== null && cardsCache.has(cacheKey);
  const [cards, setCards] = useState<Card[]>(() =>
    hasCached ? cardsCache.get(cacheKey!)! : []
  );
  const [loading, setLoading] = useState(() => !hasCached);

  useEffect(() => {
    if (!user) return;
    const key = `${roomId}:${user.uid}`;

    const unsubscribe = onSnapshot(cardsQuery(roomId), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Card));
      setCards(data);
      cardsCache.set(key, data);
      setLoading(false);
    });

    return unsubscribe;
  }, [roomId, user]);

  return { cards, loading };
}
