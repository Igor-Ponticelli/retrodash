import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Card, Participant, ScoreboardEntry } from "@/types";

export const PARTICIPATION_POINTS = 1;
export const CARD_POINTS = 1;
export const ACTION_ITEM_POINTS = 0.5;
export const VOTE_POINTS = 0.25;
export const COMMENT_POINTS = 0.5;

export function calculateRetroScoreboard(
  cards: Card[],
  actionItemsColumnId: string | undefined,
  participants: Participant[],
  commentsByAuthorId: Record<string, number> = {},
): ScoreboardEntry[] {
  const published = cards.filter((c) => c.published !== false && c.authorName !== "" && !c.carriedItem);

  const entries = participants.map((p) => {
    const mine = published.filter((c) => c.authorId === p.id);
    const cardsCount = mine.filter((c) => c.columnId !== actionItemsColumnId).length;
    const actionItemsCount = mine.filter((c) => c.columnId === actionItemsColumnId).length;
    const votesReceived = mine.reduce((sum, c) => sum + (c.votedBy?.length ?? 0), 0);
    const commentsCount = commentsByAuthorId[p.id] ?? 0;
    const totalPoints = PARTICIPATION_POINTS + cardsCount * CARD_POINTS + actionItemsCount * ACTION_ITEM_POINTS
      + votesReceived * VOTE_POINTS + commentsCount * COMMENT_POINTS;
    return {
      userId: p.id,
      userName: p.displayName,
      userPhotoURL: p.photoURL,
      cardsCount,
      actionItemsCount,
      votesReceived,
      commentsCount,
      totalPoints,
      position: 0,
    };
  });

  entries.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.cardsCount !== a.cardsCount) return b.cardsCount - a.cardsCount;
    return a.userName.localeCompare(b.userName);
  });

  let pos = 1;
  for (let i = 0; i < entries.length; i++) {
    if (i > 0 && entries[i].totalPoints < entries[i - 1].totalPoints) {
      pos = i + 1;
    }
    entries[i].position = pos;
  }

  return entries;
}

export async function saveRetroScoreboard(
  roomId: string,
  entries: ScoreboardEntry[],
): Promise<void> {
  await setDoc(doc(db, "rooms", roomId, "scoreboard", "result"), {
    entries,
    savedAt: serverTimestamp(),
  });
}
