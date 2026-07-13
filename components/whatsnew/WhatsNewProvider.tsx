"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { getOrCreateUserProfile, updateLastSeenVersion } from "@/lib/firestore";
import { RELEASE_NOTES, CURRENT_VERSION, isVersionNewer, type ReleaseNote } from "@/lib/releaseNotes";

// Firebase sets creationTime and lastSignInTime to the same instant on a
// brand-new account's first sign-in; lastSignInTime only moves forward on a
// later, separate sign-in. Missing metadata defaults to "not first access"
// so a data gap never permanently hides the feature.
function isFirstAccessUser(user: User): boolean {
  const { creationTime, lastSignInTime } = user.metadata;
  if (!creationTime || !lastSignInTime) return false;
  return creationTime === lastSignInTime;
}

interface WhatsNewState {
  loading: boolean;
  unseenNotes: ReleaseNote[];
  // True only during a brand-new account's very first-ever session (Firebase
  // Auth's creationTime === lastSignInTime). Distinct from "just created the
  // users/{uid} doc": an existing user hits that same code path the first
  // time this feature ships, and they should still see the catch-up recap —
  // only a genuinely new signup has nothing to catch up on.
  isFirstAccess: boolean;
  markSeen: () => Promise<void>;
}

const WhatsNewContext = createContext<WhatsNewState>({
  loading: true,
  unseenNotes: [],
  isFirstAccess: false,
  markSeen: async () => {},
});

// Mounted once above [locale], inside AuthProvider, so it survives
// locale-switch remounts and only re-fetches when the signed-in user
// actually changes (the root layout persists across App Router
// client-side navigations, so this is a once-per-session read, not
// once-per-page).
export function WhatsNewProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuthContext();
  const [lastSeenVersion, setLastSeenVersion] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLastSeenVersion(null);
      setProfileLoading(false);
      return;
    }
    let cancelled = false;
    setProfileLoading(true);
    getOrCreateUserProfile(user.uid).then((profile) => {
      if (cancelled) return;
      if (isFirstAccessUser(user) && profile.lastSeenVersion === null) {
        // Brand-new signup: nothing existed before them, so there's nothing
        // to catch up on. Silently mark everything seen instead of showing
        // a recap of features they've only ever known as the default.
        setLastSeenVersion(CURRENT_VERSION);
        void updateLastSeenVersion(user.uid, CURRENT_VERSION);
      } else {
        setLastSeenVersion(profile.lastSeenVersion);
      }
      setProfileLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.uid, authLoading]);

  const isFirstAccess = useMemo(() => (user ? isFirstAccessUser(user) : false), [user]);

  const unseenNotes = useMemo(() => {
    if (!user || profileLoading) return [];
    return RELEASE_NOTES.filter((n) => isVersionNewer(n.version, lastSeenVersion));
  }, [user, profileLoading, lastSeenVersion]);

  const markSeen = async () => {
    if (!user) return;
    setLastSeenVersion(CURRENT_VERSION); // optimistic, closes the modal instantly
    try {
      await updateLastSeenVersion(user.uid, CURRENT_VERSION);
    } catch (err) {
      // Self-healing failure mode: worst case the modal reappears next
      // session because the write didn't stick. Not silent data loss.
      console.error("Failed to persist lastSeenVersion", err);
    }
  };

  return (
    <WhatsNewContext.Provider
      value={{ loading: authLoading || profileLoading, unseenNotes, isFirstAccess, markSeen }}
    >
      {children}
    </WhatsNewContext.Provider>
  );
}

export function useWhatsNewContext() {
  return useContext(WhatsNewContext);
}
