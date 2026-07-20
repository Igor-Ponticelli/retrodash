"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getOrgScoreboard } from "@/lib/scoreboard";
import { createRemountCache } from "@/lib/remountCache";
import { ScoreboardSection } from "@/components/room/ScoreboardSection";
import { Skeleton } from "@/components/ui/Skeleton";
import type { ScoreboardEntry } from "@/types";

interface OrgScoreboardsClientProps {
  orgId: string;
}

const scoreboardCache = createRemountCache<ScoreboardEntry[]>();

export function OrgScoreboardsClient({ orgId }: OrgScoreboardsClientProps) {
  const t = useTranslations("organizations");
  const hasCached = scoreboardCache.has(orgId);
  // Cached across remounts (same pattern as useRoom/useParticipants): a tab
  // switch away and back re-renders the last known ranking immediately
  // while a fresh fetch runs quietly behind it, instead of flashing the
  // skeleton then "no rooms yet" for a result that resolves in milliseconds.
  const [entries, setEntries] = useState<ScoreboardEntry[] | null>(() =>
    hasCached ? scoreboardCache.get(orgId)! : null,
  );

  useEffect(() => {
    let cancelled = false;
    getOrgScoreboard(orgId).then((result) => {
      if (cancelled) return;
      setEntries(result);
      scoreboardCache.set(orgId, result);
    });
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-text-primary tracking-tight">
        {t("allTimeRanking")}
      </h2>

      {entries === null ? (
        <Skeleton className="h-64 rounded-lg" />
      ) : entries.length === 0 ? (
        <p className="text-text-muted text-sm">{t("scoreboardsEmpty")}</p>
      ) : (
        <ScoreboardSection entries={entries} isAnonymous={false} />
      )}
    </div>
  );
}
