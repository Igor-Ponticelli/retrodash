"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CommentIcon } from "@/components/ui/Icons";
import { CommentThread } from "@/components/board/CommentThread";
import { useComments } from "@/hooks/useComments";
import { addComment, deleteComment } from "@/lib/firestore";
import type { Card } from "@/types";

const MAX_CHARS = 500;

interface CardCommentsProps {
  roomId: string;
  card: Card;
  userId: string;
  currentUserName?: string;
  currentUserPhotoURL?: string | null;
  isAnonymous: boolean;
  isFacilitator: boolean;
}

export function CardComments({
  roomId,
  card,
  userId,
  currentUserName,
  currentUserPhotoURL,
  isAnonymous,
  isFacilitator,
}: CardCommentsProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const t = useTranslations("comments");
  const tBoard = useTranslations("board");

  const { comments, loading } = useComments(roomId, card.id, open);
  const overLimit = text.length > MAX_CHARS;
  const count = card.commentsCount ?? 0;

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || overLimit || sending) return;
    setSending(true);
    try {
      await addComment(roomId, card.id, {
        authorId: userId,
        authorName: isAnonymous ? "" : (currentUserName ?? ""),
        authorPhotoURL: isAnonymous ? null : currentUserPhotoURL,
        text: trimmed,
      });
      setText("");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = (commentId: string) =>
    deleteComment(roomId, card.id, commentId);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={t("viewLabel")}
        className="inline-flex items-center gap-1.5 px-2 h-6 rounded-full text-xs font-medium text-text-muted hover:text-text-primary hover:bg-bg-card transition-colors cursor-pointer"
      >
        <CommentIcon size={12} />
        {count > 0 && <span>{count}</span>}
      </button>

      {open && (
        <Modal title={t("title")} onClose={() => setOpen(false)} size="md">
          <div className="space-y-4">
            {loading ? (
              <p className="text-text-muted text-sm">…</p>
            ) : (
              <CommentThread
                comments={comments}
                isAnonymous={isAnonymous}
                anonymousLabel={tBoard("anonymous")}
                youLabel={tBoard("you")}
                currentUserId={userId}
                currentUserName={currentUserName}
                currentUserPhotoURL={currentUserPhotoURL}
                emptyLabel={t("empty")}
                deleteLabel={t("deleteLabel")}
                canModerate={isFacilitator}
                onDelete={handleDelete}
              />
            )}

            <div className="space-y-1.5 pt-2 border-t border-border/60">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t("placeholder")}
                rows={2}
              />
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] tabular-nums ${overLimit ? "text-red-500 font-medium" : "text-text-muted"}`}
                >
                  {text.length}/{MAX_CHARS}
                </span>
                <Button
                  size="xs"
                  variant="cyan"
                  onClick={handleSend}
                  disabled={sending || !text.trim() || overLimit}
                >
                  {t("send")}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
