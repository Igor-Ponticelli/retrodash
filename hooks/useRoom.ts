"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { columnsQuery } from "@/lib/firestore";
import { createRemountCache } from "@/lib/remountCache";
import { useAuth } from "@/hooks/useAuth";
import type { Room, Column } from "@/types";

type RoomCacheEntry = { room: Room | null; columns: Column[] };
const roomCache = createRemountCache<RoomCacheEntry>();

export function useRoom(roomId: string) {
  const { user } = useAuth();
  const cacheKey = user ? `${roomId}:${user.uid}` : null;
  const hasCached = cacheKey !== null && roomCache.has(cacheKey);
  const cached = hasCached ? roomCache.get(cacheKey!)! : undefined;

  const [room, setRoom]       = useState<Room | null>(() => cached?.room ?? null);
  const [columns, setColumns] = useState<Column[]>(() => cached?.columns ?? []);
  const [loading, setLoading] = useState(() => !hasCached);

  useEffect(() => {
    if (!user) return;
    const key = `${roomId}:${user.uid}`;

    let roomReady    = false;
    let columnsReady = false;
    let latestRoom: Room | null = roomCache.get(key)?.room ?? null;
    let latestColumns: Column[] = roomCache.get(key)?.columns ?? [];

    const trySetLoaded = () => {
      if (roomReady && columnsReady) setLoading(false);
    };

    const unsubRoom = onSnapshot(doc(db, "rooms", roomId), (snap) => {
      latestRoom = snap.exists() ? ({ id: snap.id, ...snap.data() } as Room) : null;
      setRoom(latestRoom);
      roomCache.set(key, { room: latestRoom, columns: latestColumns });
      roomReady = true;
      trySetLoaded();
    });

    const unsubColumns = onSnapshot(columnsQuery(roomId), (snap) => {
      latestColumns = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Column));
      setColumns(latestColumns);
      roomCache.set(key, { room: latestRoom, columns: latestColumns });
      columnsReady = true;
      trySetLoaded();
    });

    return () => {
      unsubRoom();
      unsubColumns();
    };
  }, [roomId, user]);

  return { room, columns, loading };
}
