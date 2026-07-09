"use client";

import { useEffect, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { commentsQuery } from "@/lib/firestore";
import type { CardComment } from "@/types";

export function useComments(roomId: string, cardId: string, enabled: boolean) {
  const [comments, setComments] = useState<CardComment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = onSnapshot(commentsQuery(roomId, cardId), (snap) => {
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CardComment)));
      setLoading(false);
    });

    return unsubscribe;
  }, [roomId, cardId, enabled]);

  return { comments, loading: enabled ? loading : true };
}
