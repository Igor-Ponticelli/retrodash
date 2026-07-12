"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useWhatsNew } from "@/hooks/useWhatsNew";
import {
  RELEASE_NOTES,
  type ReleaseNote,
  type Locale,
} from "@/lib/releaseNotes";

interface WhatsNewModalProps {
  onClose: () => void;
  initialShowAll?: boolean;
}

export function WhatsNewModal({
  onClose,
  initialShowAll = false,
}: WhatsNewModalProps) {
  const t = useTranslations("whatsNewModal");
  const locale = useLocale() as Locale;
  const { unseenNotes, markSeen } = useWhatsNew();
  const [showAll, setShowAll] = useState(initialShowAll);

  const notesToShow = showAll ? RELEASE_NOTES : unseenNotes;
  const canOfferHistory = !showAll && RELEASE_NOTES.length > unseenNotes.length;

  const handleConfirm = () => {
    void markSeen();
    onClose();
  };

  return (
    <Modal title={t("title")} onClose={onClose} size="3xl">
      <div className="space-y-6">
        {notesToShow.map((note) => (
          <ReleaseNoteSection key={note.version} note={note} locale={locale} />
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 mt-6">
        {canOfferHistory ? (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="text-sm text-accent-primary hover:underline cursor-pointer"
          >
            {t("viewHistory")}
          </button>
        ) : (
          <span />
        )}
        <Button onClick={handleConfirm}>{t("gotIt")}</Button>
      </div>
    </Modal>
  );
}

function ReleaseNoteSection({
  note,
  locale,
}: {
  note: ReleaseNote;
  locale: Locale;
}) {
  const dateLocale = locale === "pt-BR" ? "pt-BR" : "en-US";
  // Parse the "YYYY-MM-DD" literally into a local-time Date instead of
  // `new Date(note.releasedAt)`, which reads it as UTC midnight and can
  // display as the previous day in timezones behind UTC (e.g. America/Sao_Paulo).
  const [year, month, day] = note.releasedAt.split("-").map(Number);
  const releasedAt = new Date(year, month - 1, day).toLocaleDateString(
    dateLocale,
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  );

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <h3 className="text-text-primary font-semibold text-sm">
          {note.title[locale]}
        </h3>
        <span className="text-text-muted text-xs shrink-0">{releasedAt}</span>
      </div>
      <ul className="space-y-6">
        {note.items.map((item) => (
          <li key={item.title[locale]}>
            <Image
              src={item.image[locale]}
              alt={item.title[locale]}
              width={800}
              height={300}
              className="w-full h-auto rounded-md border border-border"
            />
            <span className="inline-flex items-center h-5 px-2 mt-3 rounded-full bg-accent-primary/15 text-accent-primary text-[10px] font-semibold">
              v{note.version}
            </span>
            <h4 className="text-text-primary font-semibold text-base mt-1.5">
              {item.title[locale]}
            </h4>
            <p className="text-sm text-text-secondary leading-relaxed mt-1">
              {item.description[locale]}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
