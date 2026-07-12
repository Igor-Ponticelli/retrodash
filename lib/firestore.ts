import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  writeBatch,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
} from "firebase/firestore";
import type { Card, FeedbackType, Room, UserProfile } from "@/types";
import { db } from "@/lib/firebase";

// ── Room queries ───────────────────────────────────────────────

export function ownedRoomsQuery(userId: string) {
  return query(collection(db, "rooms"), where("ownerId", "==", userId));
}

export function columnsQuery(roomId: string) {
  return query(
    collection(db, "rooms", roomId, "columns"),
    orderBy("order", "asc")
  );
}

export function cardsQuery(roomId: string) {
  return query(
    collection(db, "rooms", roomId, "cards"),
    orderBy("createdAt", "asc")
  );
}

// ── Room mutations ─────────────────────────────────────────────

export function participantsQuery(roomId: string) {
  return query(
    collection(db, "rooms", roomId, "participants"),
    orderBy("joinedAt", "asc"),
  );
}

export function joinedRoomsParticipantQuery(userId: string) {
  return query(
    collectionGroup(db, "participants"),
    where("userId", "==", userId),
  );
}

export function roomDoc(roomId: string) {
  return doc(db, "rooms", roomId);
}

export async function getUncompletedActionItems(roomId: string): Promise<Card[]> {
  const colSnap = await getDocs(
    query(
      collection(db, "rooms", roomId, "columns"),
      where("isActionItems", "==", true),
    ),
  );
  if (colSnap.empty) return [];
  const actionColId = colSnap.docs[0].id;

  const cardSnap = await getDocs(
    query(
      collection(db, "rooms", roomId, "cards"),
      where("columnId", "==", actionColId),
      orderBy("createdAt", "asc"),
    ),
  );
  return cardSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Card)
    .filter((c) => {
      if (c.actionStatus !== undefined) return c.actionStatus !== "done";
      return !(c.done ?? false);
    });
}

export async function createRoom({
  name,
  passwordHash,
  isPublic,
  ownerId,
  ownerName,
  ownerPhotoURL,
  isAnonymous,
  columnTitles,
  actionItemsTitle,
  initialActionItems = [],
}: {
  name: string;
  passwordHash: string;
  isPublic: boolean;
  ownerId: string;
  ownerName: string;
  ownerPhotoURL: string | null;
  isAnonymous: boolean;
  columnTitles: string[];
  actionItemsTitle: string;
  initialActionItems?: {
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
  }[];
}): Promise<string> {
  const batch = writeBatch(db);
  const roomRef = doc(collection(db, "rooms"));

  batch.set(roomRef, {
    name,
    password: passwordHash,
    isPublic,
    ownerId,
    isAnonymous,
    status: "waiting",
    createdAt: serverTimestamp(),
  });

  columnTitles.forEach((title, index) => {
    const colRef = doc(collection(db, "rooms", roomRef.id, "columns"));
    batch.set(colRef, { title, order: index, isActionItems: false });
  });

  const actionItemsRef = doc(collection(db, "rooms", roomRef.id, "columns"));
  batch.set(actionItemsRef, {
    title: actionItemsTitle,
    order: columnTitles.length,
    isActionItems: true,
  });

  const participantRef = doc(db, "rooms", roomRef.id, "participants", ownerId);
  batch.set(participantRef, {
    userId: ownerId,
    displayName: ownerName,
    photoURL: ownerPhotoURL,
    joinedAt: serverTimestamp(),
    role: "facilitator",
  });

  const pendingChainWrites: { originRoomId: string; originCardId: string; roomId: string; cardId: string }[] = [];

  initialActionItems.forEach((item) => {
    const cardRef = doc(collection(db, "rooms", roomRef.id, "cards"));
    batch.set(cardRef, {
      columnId: actionItemsRef.id,
      text: item.text,
      authorId: item.authorId,
      authorName: isAnonymous ? "" : item.authorName,
      authorPhotoURL: isAnonymous ? null : item.authorPhotoURL,
      votes: 0,
      votedBy: [],
      published: true,
      carriedItem: true,
      actionStatus: item.actionStatus,
      returnCount: item.returnCount,
      originRoomId: item.originRoomId,
      originCardId: item.originCardId,
      ...(item.linkedCardText && { linkedCardText: item.linkedCardText }),
      ...(item.assigneeId && {
        assigneeId: item.assigneeId,
        assigneeName: isAnonymous ? "" : item.assigneeName,
        assigneePhotoURL: isAnonymous ? null : (item.assigneePhotoURL ?? null),
      }),
      createdAt: serverTimestamp(),
    });
    pendingChainWrites.push({
      originRoomId: item.originRoomId,
      originCardId: item.originCardId,
      roomId: roomRef.id,
      cardId: cardRef.id,
    });
  });

  await batch.commit();

  // Best-effort bookkeeping, intentionally decoupled from the batch above:
  // records this hop on the true origin card's chain list. If an ancestor
  // card was since deleted this silently no-ops for that one hop instead
  // of failing the whole room creation.
  void Promise.allSettled(
    pendingChainWrites.map(({ originRoomId, originCardId, roomId, cardId }) =>
      updateDoc(doc(db, "rooms", originRoomId, "cards", originCardId), {
        carriedToRooms: arrayUnion({ roomId, cardId }),
      }),
    ),
  );

  return roomRef.id;
}

export async function getParticipant(roomId: string, userId: string) {
  const snap = await getDoc(doc(db, "rooms", roomId, "participants", userId));
  return snap.exists() ? snap.data() : null;
}

export function subscribeToParticipant(
  roomId: string,
  userId: string,
  callback: (exists: boolean) => void,
): () => void {
  return onSnapshot(doc(db, "rooms", roomId, "participants", userId), (snap) =>
    callback(snap.exists()),
  );
}

export async function joinRoom(
  roomId: string,
  userId: string,
  displayName: string,
  photoURL: string | null,
): Promise<void> {
  await setDoc(doc(db, "rooms", roomId, "participants", userId), {
    userId,
    displayName,
    photoURL,
    joinedAt: serverTimestamp(),
    role: "member",
  });
}

export async function updateRoomStatus(
  roomId: string,
  status: "waiting" | "active" | "ended",
  description?: string,
): Promise<void> {
  await updateDoc(doc(db, "rooms", roomId), {
    status,
    ...(description ? { description } : {}),
  });
}

// ── Card mutations ─────────────────────────────────────────────

export async function addCard(
  roomId: string,
  {
    columnId,
    text,
    authorId,
    authorName,
    authorPhotoURL = null,
    isActionItem = false,
    linkedCardId,
    linkedCardText,
  }: { columnId: string; text: string; authorId: string; authorName: string; authorPhotoURL?: string | null; isActionItem?: boolean; linkedCardId?: string; linkedCardText?: string }
): Promise<void> {
  await addDoc(collection(db, "rooms", roomId, "cards"), {
    columnId,
    text,
    authorId,
    authorName,
    authorPhotoURL,
    votes: 0,
    votedBy: [],
    published: false,
    ...(isActionItem && { actionStatus: "pending" }),
    ...(linkedCardId && { linkedCardId }),
    ...(linkedCardText && { linkedCardText }),
    createdAt: serverTimestamp(),
  });
}

export async function publishCard(roomId: string, cardId: string): Promise<void> {
  await updateDoc(doc(db, "rooms", roomId, "cards", cardId), {
    published: true,
    publishedAt: serverTimestamp(),
  });
}

export async function setActionStatus(
  roomId: string,
  cardId: string,
  status: "pending" | "done" | "keep"
): Promise<void> {
  await updateDoc(doc(db, "rooms", roomId, "cards", cardId), { actionStatus: status });
}

export async function setCardLink(
  roomId: string,
  cardId: string,
  link: { id: string; text: string } | null
): Promise<void> {
  await updateDoc(doc(db, "rooms", roomId, "cards", cardId), {
    linkedCardId: link ? link.id : deleteField(),
    linkedCardText: link ? link.text : deleteField(),
  });
}

export async function updateCard(
  roomId: string,
  cardId: string,
  text: string
): Promise<void> {
  await updateDoc(doc(db, "rooms", roomId, "cards", cardId), { text });
}

export async function setCardAssignee(
  roomId: string,
  cardId: string,
  assignee: { id: string; name: string; photoURL: string | null } | null
): Promise<void> {
  await updateDoc(doc(db, "rooms", roomId, "cards", cardId), {
    assigneeId: assignee ? assignee.id : deleteField(),
    assigneeName: assignee ? assignee.name : deleteField(),
    assigneePhotoURL: assignee ? assignee.photoURL : deleteField(),
  });
}

export interface MyActionItem {
  card: Card;
  roomId: string;
  roomName: string;
  roomStatus: Room["status"];
}

// One-shot (non-realtime) lookup used by the Navbar's "my action items" collapse,
// which only fetches when opened rather than keeping a collectionGroup listener
// alive on every authenticated page.
export async function getMyActionItems(userId: string): Promise<MyActionItem[]> {
  const cardsSnap = await getDocs(
    query(collectionGroup(db, "cards"), where("assigneeId", "==", userId)),
  );
  const cardsWithRoomId = cardsSnap.docs.map((d) => ({
    card: { id: d.id, ...d.data() } as Card,
    roomId: d.ref.parent.parent!.id,
  }));

  // Dedup by chain identity (originRoomId+originCardId, or the card's own
  // room+id when it IS the origin) and keep only the most recently created
  // card per chain, so a chain the user is assigned to at multiple hops
  // shows up once, with its latest status.
  const groups = new Map<string, { card: Card; roomId: string }>();
  for (const entry of cardsWithRoomId) {
    const key = `${entry.card.originRoomId ?? entry.roomId}:${entry.card.originCardId ?? entry.card.id}`;
    const existing = groups.get(key);
    if (!existing || (entry.card.createdAt?.seconds ?? 0) > (existing.card.createdAt?.seconds ?? 0)) {
      groups.set(key, entry);
    }
  }
  const latestPerChain = [...groups.values()];

  const roomIds = [...new Set(latestPerChain.map((c) => c.roomId))];
  const roomEntries = await Promise.all(
    roomIds.map(async (roomId) => {
      const snap = await getDoc(doc(db, "rooms", roomId));
      return [roomId, snap.exists() ? (snap.data() as Room) : null] as const;
    }),
  );
  const roomsById = new Map(roomEntries);

  return latestPerChain
    .map(({ card, roomId }): MyActionItem | null => {
      const room = roomsById.get(roomId);
      if (!room) return null;
      return { card, roomId, roomName: room.name, roomStatus: room.status };
    })
    .filter((i): i is MyActionItem => i !== null);
}

export interface ChainLink {
  roomId: string;
  roomName: string;
  roomStatus: Room["status"];
  cardId: string;
  cardStatus: "pending" | "done" | "keep" | null;
}

// One-shot lookup for the origin card's own "carried to" list, used by the
// Summary page. Room-level existence gates whether the link is shown at
// all; card-level existence only gates the frozen-status chip next to it.
export async function getCarriedToRoomLinks(
  chain: { roomId: string; cardId: string }[],
): Promise<ChainLink[]> {
  const entries = await Promise.all(
    chain.map(async ({ roomId, cardId }) => {
      const [roomSnap, cardSnap] = await Promise.all([
        getDoc(doc(db, "rooms", roomId)),
        getDoc(doc(db, "rooms", roomId, "cards", cardId)),
      ]);
      if (!roomSnap.exists()) return null;
      const room = roomSnap.data() as Room;
      const card = cardSnap.exists() ? (cardSnap.data() as Card) : null;
      return {
        roomId,
        cardId,
        roomName: room.name,
        roomStatus: room.status,
        cardStatus: card ? (card.actionStatus ?? (card.done ? "done" : "pending")) : null,
      } satisfies ChainLink;
    }),
  );
  return entries.filter((e): e is ChainLink => e !== null);
}

// One-shot lookup for the "originally from Room Z" back-link. Only the
// origin ROOM needs to still exist for this to render.
export async function getOriginRoomInfo(
  originRoomId: string,
): Promise<{ roomId: string; roomName: string; roomStatus: Room["status"] } | null> {
  const snap = await getDoc(doc(db, "rooms", originRoomId));
  if (!snap.exists()) return null;
  const room = snap.data() as Room;
  return { roomId: originRoomId, roomName: room.name, roomStatus: room.status };
}

export async function deleteCard(roomId: string, cardId: string): Promise<void> {
  const commentsSnap = await getDocs(
    collection(db, "rooms", roomId, "cards", cardId, "comments"),
  );
  const batch = writeBatch(db);
  commentsSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, "rooms", roomId, "cards", cardId));
  await batch.commit();
}

export async function toggleVote(
  roomId: string,
  cardId: string,
  userId: string,
  hasVoted: boolean,
  isAnonymous: boolean,
  voterName?: string,
  voterPhotoURL?: string | null
): Promise<void> {
  const updates: Record<string, unknown> = {
    votes: increment(hasVoted ? -1 : 1),
    votedBy: hasVoted ? arrayRemove(userId) : arrayUnion(userId),
  };
  if (!isAnonymous) {
    updates[`votedByProfiles.${userId}`] = hasVoted
      ? deleteField()
      : { name: voterName ?? "", photoURL: voterPhotoURL ?? null };
  }
  await updateDoc(doc(db, "rooms", roomId, "cards", cardId), updates);
}

export async function removeParticipant(roomId: string, userId: string): Promise<void> {
  await deleteDoc(doc(db, "rooms", roomId, "participants", userId));
}

export async function deleteRoom(roomId: string): Promise<void> {
  const batch = writeBatch(db);
  const [participantsSnap, columnsSnap, cardsSnap] = await Promise.all([
    getDocs(collection(db, "rooms", roomId, "participants")),
    getDocs(collection(db, "rooms", roomId, "columns")),
    getDocs(collection(db, "rooms", roomId, "cards")),
  ]);
  const commentsSnaps = await Promise.all(
    cardsSnap.docs.map((c) =>
      getDocs(collection(db, "rooms", roomId, "cards", c.id, "comments")),
    ),
  );
  [
    ...participantsSnap.docs,
    ...columnsSnap.docs,
    ...cardsSnap.docs,
    ...commentsSnaps.flatMap((s) => s.docs),
  ].forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, "rooms", roomId));
  await batch.commit();
}

// ── Comment mutations ──────────────────────────────────────────

export function commentsQuery(roomId: string, cardId: string) {
  return query(
    collection(db, "rooms", roomId, "cards", cardId, "comments"),
    orderBy("createdAt", "asc"),
  );
}

export async function addComment(
  roomId: string,
  cardId: string,
  {
    authorId,
    authorName,
    authorPhotoURL = null,
    text,
  }: { authorId: string; authorName: string; authorPhotoURL?: string | null; text: string },
): Promise<void> {
  const batch = writeBatch(db);
  const commentRef = doc(collection(db, "rooms", roomId, "cards", cardId, "comments"));
  batch.set(commentRef, {
    authorId,
    authorName,
    authorPhotoURL,
    text,
    createdAt: serverTimestamp(),
  });
  batch.update(doc(db, "rooms", roomId, "cards", cardId), {
    commentsCount: increment(1),
  });
  await batch.commit();
}

export async function deleteComment(
  roomId: string,
  cardId: string,
  commentId: string,
): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, "rooms", roomId, "cards", cardId, "comments", commentId));
  batch.update(doc(db, "rooms", roomId, "cards", cardId), {
    commentsCount: increment(-1),
  });
  await batch.commit();
}

// ── Users ──────────────────────────────────────────────────────

function userDoc(userId: string) {
  return doc(db, "users", userId);
}

// First "create if missing" helper in this file: reads the profile doc, and
// if it doesn't exist yet (user never triggered a What's New check before),
// creates it with defaults and returns that. Callers never need to know
// whether this was a create or a read.
export async function getOrCreateUserProfile(userId: string): Promise<UserProfile> {
  const ref = userDoc(userId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { id: snap.id, ...(snap.data() as Omit<UserProfile, "id">) };
  }
  const defaults: Omit<UserProfile, "id"> = { lastSeenVersion: null };
  await setDoc(ref, defaults);
  return { id: userId, ...defaults };
}

export async function updateLastSeenVersion(userId: string, version: string): Promise<void> {
  await setDoc(userDoc(userId), { lastSeenVersion: version }, { merge: true });
}

export async function addFeedback({
  userId,
  userName,
  userEmail,
  userPhoto,
  type,
  message,
}: {
  userId: string;
  userName: string;
  userEmail: string;
  userPhoto: string | null;
  type: FeedbackType;
  message: string;
}): Promise<void> {
  await addDoc(collection(db, "feedback"), {
    userId,
    userName,
    userEmail,
    userPhoto,
    type,
    message,
    createdAt: serverTimestamp(),
  });
}
