"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/hooks/useAuth";
import { createOrganization } from "@/lib/firestore";
import { CATEGORY_COLORS } from "@/lib/categoryColors";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { ArrowRightIcon } from "@/components/ui/Icons";

interface CreateOrgModalProps {
  onClose: () => void;
}

export function CreateOrgModal({ onClose }: CreateOrgModalProps) {
  const { user } = useAuth();
  const router = useRouter();
  const t = useTranslations("organizations");
  const [name, setName] = useState("");
  const [colorId, setColorId] = useState(CATEGORY_COLORS[0].id);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t("orgNameRequired"));
      return;
    }
    if (!user) return;
    setSubmitting(true);
    setServerError(null);
    try {
      const orgId = await createOrganization({
        name: name.trim(),
        colorId,
        ownerId: user.uid,
        ownerName: user.displayName ?? "Member",
        ownerPhotoURL: user.photoURL ?? null,
      });
      onClose();
      router.push(`/org/${orgId}`);
    } catch {
      setServerError(t("serverError"));
      setSubmitting(false);
    }
  };

  return (
    <Modal onClose={onClose} title={t("createOrgTitle")}>
      {serverError && (
        <div className="mb-4 px-4 py-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <Field label={t("createOrg")} error={error ?? undefined}>
          <Input
            autoFocus
            type="text"
            placeholder={t("orgNamePlaceholder")}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
          />
        </Field>

        <div>
          <p className="text-text-muted text-xs font-medium mb-2">{t("pickColor")}</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_COLORS.map((color) => (
              <button
                key={color.id}
                type="button"
                onClick={() => setColorId(color.id)}
                aria-label={color.id}
                className={`size-7 rounded-full ${color.dot} transition-transform cursor-pointer ${
                  colorId === color.id ? "ring-2 ring-offset-2 ring-offset-bg-card ring-text-primary scale-105" : ""
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={submitting}>
            {submitting ? t("creating") : t("createOrg")}
            {!submitting && <ArrowRightIcon size={14} />}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
