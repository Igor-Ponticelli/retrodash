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
  // Absent = personal room, exactly as before Fase 6. Present = org room:
  // always isPublic, gate is org membership instead of password.
  orgId?: string;
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
  // Org rooms only (Fase 6): optional link to an organizations/{orgId}/categories
  // doc. categoryTitle is a denormalized snapshot, same pattern as linkedCardText.
  categoryId?: string;
  categoryTitle?: string;
  categoryColorId?: string;
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

// Self-managed profile doc. Org membership/profile is NOT stored here (see
// Organization docs below) — it's always derived via the members
// collectionGroup query, same pattern as joined-rooms membership.
export interface UserProfile {
  id: string;
  lastSeenVersion: string | null;
}

export type OrgRole = "leader" | "admin" | "member";

export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  // Key into lib/categoryColors.ts's palette, same reuse as Category.colorId.
  // No image upload for org avatars (blocked on Storage CORS setup) — just
  // initials on a picked color, set at creation and changeable in Settings.
  colorId: string;
  activeInviteId?: string | null;
  createdAt: Timestamp;
}

export interface OrgMember {
  id: string;
  userId: string;
  displayName: string;
  photoURL: string | null;
  role: OrgRole;
  joinedAt: Timestamp;
  joinedViaInviteId?: string;
}

export interface OrgInvite {
  id: string;
  createdBy: string;
  createdAt: Timestamp;
  active: boolean;
}

// A pending "wants to join" record created when someone redeems an invite
// link — kept separate from OrgMember so isOrgMember()/every rule that
// depends on it never has to account for a "pending, not-yet-approved"
// state. Deleted on approval (an OrgMember doc is created instead) or on
// rejection (nothing is created).
export interface OrgJoinRequest {
  id: string;
  userId: string;
  displayName: string;
  photoURL: string | null;
  requestedAt: Timestamp;
  inviteId: string;
}

export interface Category {
  id: string;
  title: string;
  colorId: string;
  createdAt: Timestamp;
  createdBy: string;
}
