"use client";

import { useEffect, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { categoriesQuery } from "@/lib/firestore";
import { createRemountCache } from "@/lib/remountCache";
import { useAuth } from "@/hooks/useAuth";
import type { Category } from "@/types";

const categoriesCache = createRemountCache<Category[]>();

// orgId is optional so call sites that only sometimes operate in an org
// context (e.g. RoomClient/Board, shared between personal and org rooms)
// can call this unconditionally instead of branching on the Rules of Hooks.
export function useCategories(orgId: string | undefined) {
  const { user } = useAuth();
  const cacheKey = user && orgId ? `${orgId}:${user.uid}` : null;
  const hasCached = cacheKey !== null && categoriesCache.has(cacheKey);
  const [categories, setCategories] = useState<Category[]>(() =>
    hasCached ? categoriesCache.get(cacheKey!)! : [],
  );
  const [loading, setLoading] = useState(() => !!orgId && !hasCached);

  useEffect(() => {
    if (!user || !orgId) return;
    const key = `${orgId}:${user.uid}`;

    const unsub = onSnapshot(
      categoriesQuery(orgId),
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Category);
        setCategories(data);
        categoriesCache.set(key, data);
        setLoading(false);
      },
      () => {
        setCategories([]);
        setLoading(false);
      },
    );
    return unsub;
  }, [orgId, user]);

  return { categories, loading };
}
