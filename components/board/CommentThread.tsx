"use client";

import { Avatar } from "@/components/ui/Avatar";
import { TrashIcon } from "@/components/ui/Icons";
import type { CardComment } from "@/types";

interface CommentThreadProps {
  comments: CardComment[];
  isAnonymous: boolean;
  anonymousLabel: string;
  youLabel?: string;
  currentUserId?: string;
  currentUserName?: string;
  currentUserPhotoURL?: string | null;
  emptyLabel: string;
  deleteLabel?: string;
  canModerate?: boolean;
  onDelete?: (commentId: string) => void;
}

export function CommentThread({
  comments,
  isAnonymous,
  anonymousLabel,
  youLabel = "",
  currentUserId,
  currentUserName,
  currentUserPhotoURL,
  emptyLabel,
  deleteLabel,
  canModerate = false,
  onDelete,
}: CommentThreadProps) {
  if (comments.length === 0) {
    return <p className="text-text-muted text-sm italic">{emptyLabel}</p>;
  }

  return (
    <ul className="space-y-3">
      {comments.map((comment) => {
        const isOwn = !!currentUserId && comment.authorId === currentUserId;
        const showAsAnonymous = isAnonymous || !comment.authorName;
        const displayName = isOwn && comment.authorName === currentUserName ? youLabel : comment.authorName;
        const photoURL = isOwn && comment.authorName === currentUserName ? currentUserPhotoURL : comment.authorPhotoURL;
        const canDeleteThis = onDelete && (canModerate || isOwn);

        return (
          <li key={comment.id} className="group flex items-start gap-2.5">
            {showAsAnonymous ? (
              <div className="size-6 rounded-full bg-bg-card border border-border flex items-center justify-center shrink-0 mt-0.5">
                <MaskIcon />
              </div>
            ) : (
              <Avatar photoURL={photoURL} name={displayName} size={24} className="mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <span className="text-text-primary text-xs font-medium truncate block">
                {showAsAnonymous ? anonymousLabel : displayName}
              </span>
              <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap wrap-break-word mt-0.5">
                {comment.text}
              </p>
            </div>
            {canDeleteThis && (
              <button
                onClick={() => onDelete!(comment.id)}
                aria-label={deleteLabel}
                className="size-6 flex items-center justify-center rounded text-text-muted hover:text-red-400 hover:bg-bg-card transition-colors cursor-pointer opacity-0 group-hover:opacity-100 shrink-0"
              >
                <TrashIcon size={12} />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function MaskIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5" />
      <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5" />
    </svg>
  );
}
