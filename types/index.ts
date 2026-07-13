import type { Timestamp } from "firebase/firestore";

export interface Room {
  id: string;
  name: string;
  password: string;
  isPublic: boolean;
  ownerId: string;
  isAnonymous: boolean;
  status: "waiting" | "active" | "ended";
  description?: string;
  createdAt: Timestamp;
}

export interface Column {
  id: string;
  title: string;
  order: number;
  isActionItems: boolean;
}

export interface Card {
  id: string;
  columnId: string;
  text: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string | null;
  votedBy: string[];
  votedByProfiles?: Record<string, { name: string; photoURL: string | null }>;
  done?: boolean;
  actionStatus?: "pending" | "done" | "keep";
  assigneeId?: string;
  assigneeName?: string;
  assigneePhotoURL?: string | null;
  published?: boolean;
  linkedCardId?: string;
  linkedCardText?: string;
  carriedItem?: boolean;
  returnCount?: number;
  originRoomId?: string;
  originCardId?: string;
  carriedToRooms?: { roomId: string; cardId: string }[];
  commentsCount?: number;
  createdAt: Timestamp;
  publishedAt?: Timestamp;
}

export interface CardComment {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string | null;
  text: string;
  createdAt: Timestamp;
}

export interface Participant {
  id: string;
  displayName: string;
  photoURL: string | null;
  joinedAt: Timestamp;
  role: "facilitator" | "member";
}

export interface ScoreboardEntry {
  userId: string;
  userName: string;
  userPhotoURL: string | null;
  cardsCount: number;
  actionItemsCount: number;
  votesReceived: number;
  commentsCount: number;
  totalPoints: number;
  position: number;
}

export type FeedbackType = "bug" | "feature" | "general";

export interface Feedback {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhoto: string | null;
  type: FeedbackType;
  message: string;
  createdAt: Timestamp;
}

// Self-managed profile doc. Fase 4 (Organizations) will extend this with
// more fields (membership, extended profile) — nothing org-related yet.
export interface UserProfile {
  id: string;
  lastSeenVersion: string | null;
}
