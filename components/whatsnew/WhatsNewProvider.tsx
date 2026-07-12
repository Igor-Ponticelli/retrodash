"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { getOrCreateUserProfile, updateLastSeenVersion } from "@/lib/firestore";
import { RELEASE_NOTES, CURRENT_VERSION, isVersionNewer, type ReleaseNote } from "@/lib/releaseNotes";

interface WhatsNewState {
  loading: boolean;
  unseenNotes: ReleaseNote[];
  markSeen: () => Promise<void>;
}

const WhatsNewContext = createContext<WhatsNewState>({
  loading: true,
  unseenNotes: [],
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
      setLastSeenVersion(profile.lastSeenVersion);
      setProfileLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.uid, authLoading]);

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
    <WhatsNewContext.Provider value={{ loading: authLoading || profileLoading, unseenNotes, markSeen }}>
      {children}
    </WhatsNewContext.Provider>
  );
}

export function useWhatsNewContext() {
  return useContext(WhatsNewContext);
}
