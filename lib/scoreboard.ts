import { doc, getDoc, getDocs, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { orgRoomsQuery } from "@/lib/firestore";
import type { Card, Participant, Room, ScoreboardEntry } from "@/types";

export const PARTICIPATION_POINTS = 1;
export const CARD_POINTS = 1;
export const ACTION_ITEM_POINTS = 0.5;
export const VOTE_POINTS = 0.25;
export const COMMENT_POINTS = 0.5;

// Shared by both the per-room scoreboard and the org-wide all-time
// aggregate, so the two views can never drift on tie-break rules.
function sortAndRankEntries(entries: ScoreboardEntry[]): ScoreboardEntry[] {
  const sorted = [...entries].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.cardsCount !== a.cardsCount) return b.cardsCount - a.cardsCount;
    return a.userName.localeCompare(b.userName);
  });

  let pos = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].totalPoints < sorted[i - 1].totalPoints) {
      pos = i + 1;
    }
    sorted[i].position = pos;
  }

  return sorted;
}

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

  return sortAndRankEntries(entries);
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

// All-time ranking across every ended, non-anonymous room in an org, summed
// by userId from each room's already-saved rooms/{roomId}/scoreboard/result
// doc. Anonymous org rooms are excluded entirely (decided up front, per the
// same policy ScoreboardSection already applies to a single anonymous
// room's own summary) — filtered out before even fetching their scoreboard
// doc, since userId-keyed aggregation would otherwise quietly reveal
// identity a single anonymous room deliberately hides.
export async function getOrgScoreboard(orgId: string): Promise<ScoreboardEntry[]> {
  const roomsSnap = await getDocs(orgRoomsQuery(orgId));
  const eligibleRoomIds = roomsSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Room)
    .filter((r) => r.status === "ended" && !r.isAnonymous)
    .map((r) => r.id);

  // Direct doc reads, one per room — scoreboard/result always lives at a
  // known, fixed sub-path per room, so there's nothing to query for, same
  // fan-out pattern already used by getCarriedToRoomLinks/useJoinedRooms.
  const resultDocs = await Promise.all(
    eligibleRoomIds.map((roomId) => getDoc(doc(db, "rooms", roomId, "scoreboard", "result"))),
  );

  const totals = new Map<string, ScoreboardEntry>();
  for (const snap of resultDocs) {
    if (!snap.exists()) continue; // room ended but summary never opened yet
    const entries = snap.data().entries as ScoreboardEntry[];
    for (const entry of entries) {
      const acc = totals.get(entry.userId) ?? {
        ...entry,
        cardsCount: 0,
        actionItemsCount: 0,
        votesReceived: 0,
        commentsCount: 0,
        totalPoints: 0,
        position: 0,
      };
      acc.userName = entry.userName; // latest-seen wins, same trust level
      acc.userPhotoURL = entry.userPhotoURL; // as denormalized profile snapshots elsewhere
      acc.cardsCount += entry.cardsCount;
      acc.actionItemsCount += entry.actionItemsCount;
      acc.votesReceived += entry.votesReceived;
      acc.commentsCount += entry.commentsCount;
      acc.totalPoints += entry.totalPoints;
      totals.set(entry.userId, acc);
    }
  }

  return sortAndRankEntries([...totals.values()]);
}
