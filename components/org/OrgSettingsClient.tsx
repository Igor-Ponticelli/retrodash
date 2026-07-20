"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { useMyOrgRole } from "@/hooks/useMyOrgRole";
import { useOrgRooms } from "@/hooks/useOrgRooms";
import { leaveOrganization, updateOrganizationColor, updateOrganizationName } from "@/lib/firestore";
import { CATEGORY_COLORS } from "@/lib/categoryColors";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { DeleteOrgModal } from "@/components/org/DeleteOrgModal";

interface OrgSettingsClientProps {
  orgId: string;
}

export function OrgSettingsClient({ orgId }: OrgSettingsClientProps) {
  const { user } = useAuth();
  const { organization } = useOrganization(orgId);
  const { member } = useMyOrgRole(orgId);
  const { rooms, loading: roomsLoading } = useOrgRooms(orgId);
  const router = useRouter();
  const t = useTranslations("organizations");

  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savingColor, setSavingColor] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (organization) setName(organization.name);
  }, [organization]);

  if (!organization || !member) return null;
  const isLeader = member.role === "leader";

  const handleSaveName = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === organization.name) return;
    setSavingName(true);
    try {
      await updateOrganizationName(orgId, trimmed);
    } finally {
      setSavingName(false);
    }
  };

  const handlePickColor = async (colorId: string) => {
    if (colorId === organization.colorId) return;
    setSavingColor(true);
    try {
      await updateOrganizationColor(orgId, colorId);
    } finally {
      setSavingColor(false);
    }
  };

  const handleLeave = async () => {
    if (!user) return;
    setLeaving(true);
    await leaveOrganization(orgId, user.uid);
    router.push("/dashboard");
  };

  return (
    <div className="max-w-lg space-y-8">
      <h2 className="text-lg font-bold text-text-primary tracking-tight">{t("settingsTab")}</h2>

      {isLeader ? (
        <>
          <Field label={t("orgNamePlaceholder")}>
            <div className="flex gap-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                disabled={savingName}
                className="flex-1"
              />
            </div>
          </Field>

          <div>
            <p className="text-text-primary text-sm font-medium mb-2">{t("pickColor")}</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => handlePickColor(color.id)}
                  disabled={savingColor}
                  aria-label={color.id}
                  className={`size-7 rounded-full ${color.dot} transition-transform cursor-pointer disabled:opacity-50 ${
                    organization.colorId === color.id
                      ? "ring-2 ring-offset-2 ring-offset-bg-base ring-text-primary scale-105"
                      : ""
                  }`}
                />
              ))}
            </div>
          </div>
        </>
      ) : (
        <p className="text-text-muted text-sm">{organization.name}</p>
      )}

      <div className="pt-4 border-t border-border">
        {isLeader ? (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            disabled={roomsLoading || rooms.length > 0}
            title={rooms.length > 0 ? t("deleteOrgBlockedHasRooms") : undefined}
          >
            {t("orgShellDelete")}
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={handleLeave} disabled={leaving}>
            {t("orgShellLeave")}
          </Button>
        )}
      </div>

      {deleteOpen && (
        <DeleteOrgModal orgId={orgId} orgName={organization.name} onClose={() => setDeleteOpen(false)} />
      )}
    </div>
  );
}
