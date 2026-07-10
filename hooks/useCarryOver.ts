"use client";

import { useState, useEffect } from "react";
import { getUncompletedActionItems } from "@/lib/firestore";
import type { Card, Room } from "@/types";

export interface CarryOverItem {
  text: string;
  actionStatus: "pending" | "keep";
  linkedCardText?: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string | null;
  assigneeId?: string;
  assigneeName?: string;
  assigneePhotoURL?: string | null;
  originRoomId: string;
  originCardId: string;
  returnCount: number;
}

export interface CarryOverState {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  selectedRoomId: string | null;
  setSelectedRoomId: (id: string | null) => void;
  candidateItems: Card[];
  loadingItems: boolean;
  checkedIds: Set<string>;
  toggleItem: (id: string) => void;
  toggleAll: () => void;
  selectedItems: CarryOverItem[];
}

export function useCarryOver(endedRooms: Room[]): CarryOverState {
  const [enabled, setEnabledRaw] = useState(false);
  const [selectedRoomId, setSelectedRoomIdRaw] = useState<string | null>(null);
  const [candidateItems, setCandidateItems] = useState<Card[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!selectedRoomId) {
      setCandidateItems([]);
      setCheckedIds(new Set());
      return;
    }

    let cancelled = false;
    setLoadingItems(true);
    setCandidateItems([]);
    setCheckedIds(new Set());

    getUncompletedActionItems(selectedRoomId).then((items) => {
      if (cancelled) return;
      setCandidateItems(items);
      setCheckedIds(new Set(items.map((i) => i.id)));
      setLoadingItems(false);
    });

    return () => { cancelled = true; };
  }, [selectedRoomId]);

  const setEnabled = (v: boolean) => {
    setEnabledRaw(v);
    if (!v) {
      setSelectedRoomIdRaw(null);
      setCandidateItems([]);
      setCheckedIds(new Set());
    }
  };

  const setSelectedRoomId = (id: string | null) => {
    setSelectedRoomIdRaw(id);
  };

  const toggleItem = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (checkedIds.size === candidateItems.length) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(candidateItems.map((i) => i.id)));
    }
  };

  const selectedItems: CarryOverItem[] = candidateItems
    .filter((item) => checkedIds.has(item.id))
    .map((item) => ({
      text: item.text,
      actionStatus:
        (item.actionStatus ?? (item.done ? "done" : "pending")) === "keep"
          ? "keep"
          : "pending",
      ...(item.linkedCardText && { linkedCardText: item.linkedCardText }),
      authorId: item.authorId,
      authorName: item.authorName,
      authorPhotoURL: item.authorPhotoURL ?? null,
      ...(item.assigneeId && {
        assigneeId: item.assigneeId,
        assigneeName: item.assigneeName,
        assigneePhotoURL: item.assigneePhotoURL ?? null,
      }),
      originRoomId: item.originRoomId ?? selectedRoomId!,
      originCardId: item.originCardId ?? item.id,
      returnCount: (item.returnCount ?? 0) + 1,
    }));

  return {
    enabled,
    setEnabled,
    selectedRoomId,
    setSelectedRoomId,
    candidateItems,
    loadingItems,
    checkedIds,
    toggleItem,
    toggleAll,
    selectedItems,
  };
}
