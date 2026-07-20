"use client";

import { useState } from "react";
import { getMyActionItems, type MyActionItem } from "@/lib/firestore";

export function useMyActionItems(userId: string | undefined) {
  const [items, setItems] = useState<MyActionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = async (opts: { includeAuthored?: boolean } = {}) => {
    if (!userId || loading) return;
    setLoading(true);
    try {
      setItems(await getMyActionItems(userId, opts));
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  return { items, loading, loaded, load };
}
