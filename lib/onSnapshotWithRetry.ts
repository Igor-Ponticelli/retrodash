import {
  onSnapshot,
  type DocumentReference,
  type DocumentSnapshot,
  type FirestoreError,
  type Query,
  type QuerySnapshot,
  type Unsubscribe,
} from "firebase/firestore";

// Firestore doesn't guarantee a listener's rule evaluation sees this same
// client's own just-committed write instantly — e.g. joining a room, then
// immediately listening to its columns/cards/participants, whose rules check
// for that exact participant doc. A `permission-denied` right after a
// legitimate join is transient in that case, not a real access issue, but
// onSnapshot never retries a terminal error on its own. Retry a few times
// with backoff before treating it as a real denial.
const RETRY_DELAYS_MS = [300, 800, 1500];

export function onSnapshotWithRetry<T>(
  ref: DocumentReference<T>,
  onNext: (snap: DocumentSnapshot<T>) => void,
  onError: (err: FirestoreError) => void,
): Unsubscribe;
export function onSnapshotWithRetry<T>(
  ref: Query<T>,
  onNext: (snap: QuerySnapshot<T>) => void,
  onError: (err: FirestoreError) => void,
): Unsubscribe;
export function onSnapshotWithRetry<T>(
  ref: DocumentReference<T> | Query<T>,
  onNext: (snap: DocumentSnapshot<T> & QuerySnapshot<T>) => void,
  onError: (err: FirestoreError) => void,
): Unsubscribe {
  let attempt = 0;
  let cancelled = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let unsub: Unsubscribe = () => {};

  const subscribe = () => {
    unsub = onSnapshot(
      ref as Query<T>,
      (snap) => {
        attempt = 0;
        onNext(snap as unknown as DocumentSnapshot<T> & QuerySnapshot<T>);
      },
      (err) => {
        if (cancelled) return;
        if (err.code === "permission-denied" && attempt < RETRY_DELAYS_MS.length) {
          const delay = RETRY_DELAYS_MS[attempt];
          attempt += 1;
          timeoutId = setTimeout(() => {
            if (!cancelled) subscribe();
          }, delay);
          return;
        }
        onError(err);
      },
    );
  };

  subscribe();

  return () => {
    cancelled = true;
    if (timeoutId !== null) clearTimeout(timeoutId);
    unsub();
  };
}
