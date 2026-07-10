"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import type { Card, Participant } from "@/types";

interface VotersBadgeProps {
  card: Card;
  participants: Participant[];
  currentUserId: string;
}

export function VotersBadge({ card, participants, currentUserId }: VotersBadgeProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("board");
  const count = card.votedBy.length;

  if (count === 0) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={t("viewVotersLabel")}
        className="text-xs font-medium text-text-muted hover:text-text-primary hover:underline transition-colors cursor-pointer"
      >
        {count}
      </button>

      {open && (
        <Modal title={t("whoVotedTitle")} onClose={() => setOpen(false)} size="sm">
          <ul className="space-y-1">
            {card.votedBy.map((id) => {
              const profile = card.votedByProfiles?.[id];
              const participant = participants.find((p) => p.id === id);
              const name =
                id === currentUserId
                  ? t("you")
                  : profile?.name || participant?.displayName || t("unknownVoter");
              const photoURL = profile?.photoURL ?? participant?.photoURL ?? null;

              return (
                <li
                  key={id}
                  className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-bg-elevated transition-colors"
                >
                  <Avatar name={name} photoURL={photoURL} size={28} />
                  <span className="text-sm text-text-primary truncate">{name}</span>
                </li>
              );
            })}
          </ul>
        </Modal>
      )}
    </>
  );
}
