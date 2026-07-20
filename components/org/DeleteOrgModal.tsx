"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { deleteOrganization } from "@/lib/firestore";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface DeleteOrgModalProps {
  orgId: string;
  orgName: string;
  onClose: () => void;
}

export function DeleteOrgModal({ orgId, orgName, onClose }: DeleteOrgModalProps) {
  const t = useTranslations("organizations");
  const router = useRouter();
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  const confirmWord = t("deleteOrgConfirmWord");
  const isConfirmed = value.trim().toUpperCase() === confirmWord;

  async function handleDelete() {
    if (!isConfirmed) return;
    setLoading(true);
    await deleteOrganization(orgId);
    router.push("/dashboard");
  }

  return (
    <Modal title={t("deleteOrgTitle")} onClose={onClose} size="sm">
      <p className="text-sm text-text-secondary leading-relaxed mb-1">
        <span className="font-semibold text-text-primary">{orgName}</span>
      </p>
      <p className="text-sm text-text-secondary leading-relaxed mb-4">
        {t("deleteOrgSubtitle", { confirmWord })}
      </p>
      <Input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t("deleteOrgPlaceholder")}
        spellCheck={false}
        autoComplete="off"
      />
      <div className="flex gap-2 mt-4 justify-end">
        <Button variant="ghost-text" size="sm" onClick={onClose} disabled={loading}>
          {t("cancel")}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={!isConfirmed || loading}
        >
          {loading ? t("deleting") : t("deleteOrgConfirmButton")}
        </Button>
      </div>
    </Modal>
  );
}
