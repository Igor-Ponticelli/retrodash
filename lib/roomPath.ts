// Canonical room URL for a given room doc: org rooms live under
// /org/[orgId]/room/[roomId], personal rooms under /room/[roomId]. Centralizing
// this here means every list/link site (dashboard, navbar, profile, summary
// chain links) automatically points at the right route as soon as a room
// gains an orgId, instead of each call site re-deriving it.
export function roomPath(room: { id: string; orgId?: string }): string {
  return room.orgId ? `/org/${room.orgId}/room/${room.id}` : `/room/${room.id}`;
}

export function roomSummaryPath(room: { id: string; orgId?: string }): string {
  return room.orgId ? `/org/${room.orgId}/room/${room.id}/summary` : `/room/${room.id}/summary`;
}
