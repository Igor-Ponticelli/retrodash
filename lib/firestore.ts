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
  writeBatch,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
} from "firebase/firestore";
import type { Card, FeedbackType } from "@/types";
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
  initialActionItems?: { text: string; actionStatus: "pending" | "keep"; linkedCardText?: string; authorName: string; authorPhotoURL: string | null }[];
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

  initialActionItems.forEach(({ text, actionStatus, linkedCardText, authorName, authorPhotoURL }) => {
    const cardRef = doc(collection(db, "rooms", roomRef.id, "cards"));
    batch.set(cardRef, {
      columnId: actionItemsRef.id,
      text,
      authorId: ownerId,
      authorName: isAnonymous ? "" : authorName,
      authorPhotoURL: isAnonymous ? null : authorPhotoURL,
      votes: 0,
      votedBy: [],
      published: true,
      carriedItem: true,
      actionStatus,
      ...(linkedCardText && { linkedCardText }),
      createdAt: serverTimestamp(),
    });
  });

  await batch.commit();
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

export async function updateCard(
  roomId: string,
  cardId: string,
  text: string
): Promise<void> {
  await updateDoc(doc(db, "rooms", roomId, "cards", cardId), { text });
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
  hasVoted: boolean
): Promise<void> {
  await updateDoc(doc(db, "rooms", roomId, "cards", cardId), {
    votes: increment(hasVoted ? -1 : 1),
    votedBy: hasVoted ? arrayRemove(userId) : arrayUnion(userId),
  });
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
