"use client";

import { useTranslations } from "next-intl";
import { Avatar } from "@/components/ui/Avatar";
import type { ScoreboardEntry } from "@/types";

const POSITION_STYLES: Record<number, string> = {
  1: "bg-amber-400/20 text-amber-400 border-amber-400/30",
  2: "bg-slate-400/20 text-slate-400 border-slate-400/30",
  3: "bg-amber-700/20 text-amber-600 border-amber-700/30",
};

function TrophyIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden>
      <path
        d="M8.5 11.5c-2.485 0-4.5-2.015-4.5-4.5V2.5h9v4.5c0 2.485-2.015 4.5-4.5 4.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M4 4.5H2.5a1.5 1.5 0 0 0 0 3H4M13 4.5h1.5a1.5 1.5 0 0 0 0-3H13"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M8.5 11.5v2.5M6 14.5h5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ScoreboardSection({
  entries,
  isAnonymous,
}: {
  entries: ScoreboardEntry[];
  isAnonymous: boolean;
}) {
  const t = useTranslations("summary");

  if (isAnonymous) return null;

  return (
    <section>
      <div className="flex items-center gap-2.5 pb-3 border-b border-border">
        <span className="text-accent-primary">
          <TrophyIcon />
        </span>
        <h2 className="text-text-primary font-semibold text-lg">{t("scoreboard")}</h2>
        <span className="text-xs text-text-muted bg-bg-elevated px-2 py-0.5 rounded-full ml-0.5">
          {entries.length}
        </span>
      </div>

      {entries.length === 0 ? (
        <p className="text-text-muted text-sm mt-4 pl-1">{t("scoreboardEmpty")}</p>
      ) : (
        <div className="mt-4 bg-bg-card border border-border rounded-lg overflow-hidden overflow-x-auto">
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] items-center gap-x-4 px-5 py-2 border-b border-border min-w-max">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-text-muted w-7">#</span>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">
              {t("participants")}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-text-muted text-right w-14">
              {t("scoreboardCards")}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-text-muted text-right w-16">
              {t("scoreboardActions")}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-text-muted text-right w-12">
              {t("scoreboardLikes")}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-text-muted text-right w-16">
              {t("scoreboardComments")}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-accent-primary text-right w-14">
              {t("scoreboardPoints")}
            </span>
          </div>

          <div className="divide-y divide-border">
            {entries.map((entry) => {
              const posStyle = POSITION_STYLES[entry.position];
              return (
                <div
                  key={entry.userId}
                  className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] items-center gap-x-4 px-5 py-3.5 min-w-max"
                >
                  <div className="w-7 flex justify-center">
                    {posStyle ? (
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold border ${posStyle}`}
                      >
                        {entry.position}
                      </span>
                    ) : (
                      <span className="text-sm text-text-muted font-medium">{entry.position}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar photoURL={entry.userPhotoURL} name={entry.userName} size={28} />
                    <span className="text-sm text-text-primary truncate">{entry.userName}</span>
                  </div>

                  <span className="text-sm text-text-muted text-right w-14">{entry.cardsCount}</span>
                  <span className="text-sm text-text-muted text-right w-16">{entry.actionItemsCount}</span>
                  <span className="text-sm text-text-muted text-right w-12">{entry.votesReceived}</span>
                  <span className="text-sm text-text-muted text-right w-16">{entry.commentsCount}</span>
                  <span className="text-sm font-semibold text-accent-primary text-right w-14">
                    {entry.totalPoints % 1 === 0 ? entry.totalPoints : entry.totalPoints.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
