import type { FirestoreError } from "firebase/firestore";

// A freshly-issued Firebase Auth ID token isn't always immediately honored by
// Firestore's rules engine for the first request or two right after sign-in —
// most visible right after clicking a shared link cold (no existing session)
// then auto-joining a public/org room with no human delay in between, unlike
// the private-room flow where typing a password naturally absorbs this same
// window. A `permission-denied` in that narrow window is transient, not a
// real access issue — retry a few times with backoff before treating it as one.
const RETRY_DELAYS_MS = [400, 900, 1800];

export async function retryOnPermissionDenied<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const code = (err as FirestoreError)?.code;
      if (code !== "permission-denied" || attempt >= RETRY_DELAYS_MS.length) throw err;
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
    }
  }
}
