"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useRooms } from "@/hooks/useRooms";
import { useOrgRooms } from "@/hooks/useOrgRooms";
import { useMyOrgRole } from "@/hooks/useMyOrgRole";
import { useCarryOver } from "@/hooks/useCarryOver";
import { hashPassword } from "@/lib/auth";
import { createRoom } from "@/lib/firestore";
import { roomPath } from "@/lib/roomPath";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Toggle } from "@/components/ui/Toggle";
import { CarryOverSection } from "@/components/room/CarryOverSection";
import {
  ArrowRightIcon,
  XIcon,
  PlusIcon,
  LockIcon,
  GlobeIcon,
  EyeIcon,
  EyeOffIcon,
} from "@/components/ui/Icons";

type ColumnEntry = { id: string; title: string };

interface NewRoomModalProps {
  onClose: () => void;
  // Set only when opened from /org/[orgId]: forces a public, passwordless
  // room gated by org membership instead of a password.
  orgId?: string;
}

export function NewRoomModal({ onClose, orgId }: NewRoomModalProps) {
  const { user } = useAuth();
  const router = useRouter();
  const t = useTranslations("newRoom");
  const { rooms, loading: roomsLoading } = useRooms();
  const { rooms: orgRooms, loading: orgRoomsLoading } = useOrgRooms(orgId);
  const { member: myOrgMember } = useMyOrgRole(orgId);
  const isOrgManager = myOrgMember?.role === "leader" || myOrgMember?.role === "admin";

  // Org admins/leaders can carry over pending/keep items from ANY ended room
  // in the org, not just rooms they personally created — a plain "own rooms"
  // list (useRooms, ownerId-scoped) would miss rooms other admins created.
  const endedRooms = (orgId && isOrgManager ? orgRooms : rooms).filter(
    (r) => r.status === "ended",
  );
  const carryOverRoomsLoading = orgId ? orgRoomsLoading : roomsLoading;
  const carryOver = useCarryOver(endedRooms);

  const DEFAULT_COLUMNS: ColumnEntry[] = [
    { id: "1", title: t("defaultCol1") },
    { id: "2", title: t("defaultCol2") },
  ];

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isPublic, setIsPublic] = useState(!!orgId);
  const [isAnonymous, setAnonymous] = useState(false);
  const [columns, setColumns] = useState<ColumnEntry[]>(DEFAULT_COLUMNS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [created, setCreated] = useState<{
    roomId: string;
    password: string;
    isPublic: boolean;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const addColumn = () =>
    setColumns((prev) => [...prev, { id: crypto.randomUUID(), title: "" }]);

  const removeColumn = (id: string) =>
    setColumns((prev) => prev.filter((c) => c.id !== id));

  const updateColumn = (id: string, title: string) =>
    setColumns((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = t("nameRequired");
    if (!isPublic) {
      if (!password.trim()) next.password = t("passwordRequired");
      else if (password.trim().length < 4) next.password = t("passwordMinLength");
    }
    if (columns.some((c) => !c.title.trim())) next.columns = t("columnsRequired");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate() || !user) return;
    setSubmitting(true);
    setServerError(null);
    try {
      const passwordHash = isPublic ? "" : await hashPassword(password.trim());
      const roomId = await createRoom({
        name: name.trim(),
        passwordHash,
        isPublic,
        ownerId: user.uid,
        ownerName: user.displayName ?? "Facilitator",
        ownerPhotoURL: user.photoURL ?? null,
        isAnonymous,
        orgId,
        columnTitles: columns.map((c) => c.title.trim()),
        actionItemsTitle: t("actionItems"),
        initialActionItems: carryOver.enabled ? carryOver.selectedItems : [],
      });
      setCreated({ roomId, password: password.trim(), isPublic });
    } catch {
      setServerError(t("serverError"));
      setSubmitting(false);
    }
  };

  const copy = async (text: string, setter: (v: boolean) => void) => {
    await navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const copiedStyle = {
    background: "color-mix(in srgb, var(--color-accent-primary) 12%, transparent)",
    color: "var(--color-accent-primary)",
    borderColor: "var(--color-accent-primary)",
  };

  const defaultCopyStyle = {
    background: "transparent",
    color: "var(--color-text-secondary)",
    borderColor: "var(--color-border)",
  };

  return (
    <Modal
      onClose={onClose}
      title={created ? t("createdHeader") : t("title")}
      size="lg"
    >
      {created ? (
        <div className="space-y-6">
          <div>
            <p className="text-text-primary font-bold text-xl leading-snug">{name}</p>
            <p className="text-text-secondary text-sm mt-1">
              {created.isPublic ? t("createdSharePublic") : t("createdShare")}
            </p>
          </div>

          {!created.isPublic && (
            <div>
              <label className="text-text-muted text-[11px] font-semibold uppercase tracking-widest mb-2 block">
                {t("passwordLabel")}
              </label>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center bg-bg-elevated border border-border rounded-md px-4 py-2.5 font-mono text-text-primary text-sm tracking-widest min-w-0">
                  <span className="truncate">
                    {showPassword ? created.password : "•".repeat(created.password.length)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="ml-2 shrink-0 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOffIcon size={15} /> : <EyeIcon />}
                  </button>
                </div>
                <button
                  onClick={() => copy(created.password, setCopiedPassword)}
                  className="h-10 px-4 rounded-md text-xs font-semibold transition-all cursor-pointer shrink-0 border"
                  style={copiedPassword ? copiedStyle : defaultCopyStyle}
                >
                  {copiedPassword ? t("copied") : t("copy")}
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="text-text-muted text-[11px] font-semibold uppercase tracking-widest mb-2 block">
              {t("codeLabel")}
            </label>
            <div className="flex gap-2">
              <div className="flex-1 bg-bg-elevated border border-border rounded-md px-4 py-2.5 font-mono text-accent-primary text-sm tracking-widest truncate">
                {created.roomId}
              </div>
              <button
                onClick={() => copy(created.roomId, setCopiedCode)}
                className="h-10 px-4 rounded-md text-xs font-semibold transition-all cursor-pointer shrink-0 border"
                style={copiedCode ? copiedStyle : defaultCopyStyle}
              >
                {copiedCode ? t("copied") : t("copy")}
              </button>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              onClose();
              router.push(roomPath({ id: created.roomId, orgId }));
            }}
          >
            {t("openRoom")}
            <ArrowRightIcon size={14} />
          </Button>
        </div>
      ) : (
        <>
          {serverError && (
            <div className="mb-6 px-4 py-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <Field label={t("roomName")} error={errors.name}>
              <Input
                type="text"
                placeholder={t("roomNamePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>

            {orgId ? (
              <p className="text-text-muted text-xs -mt-2 px-3 py-2 rounded-md border border-dashed border-border bg-bg-elevated/50">
                {t("orgRoomHint")}
              </p>
            ) : (
              <>
                <div>
                  <p className="text-text-primary text-sm font-medium mb-2">{t("visibility")}</p>
                  <div className="flex rounded-md border border-border overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setIsPublic(false)}
                      className={`flex-1 flex items-center justify-center cursor-pointer gap-2 py-2.5 text-sm font-medium transition-colors border-r border-border ${
                        !isPublic
                          ? "bg-accent-violet/10 text-accent-violet"
                          : "text-text-muted hover:text-text-secondary"
                      }`}
                    >
                      <LockIcon size={14} />
                      {t("private")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPublic(true)}
                      className={`flex-1 flex items-center justify-center cursor-pointer gap-2 py-2.5 text-sm font-medium transition-colors ${
                        isPublic
                          ? "bg-accent-primary/10 text-accent-primary"
                          : "text-text-muted hover:text-text-secondary"
                      }`}
                    >
                      <GlobeIcon size={14} />
                      {t("public")}
                    </button>
                  </div>
                  <p className="text-text-muted text-xs mt-1.5">
                    {isPublic ? t("publicHint") : t("privateHint")}
                  </p>
                </div>

                {!isPublic && (
                  <Field label={t("password")} error={errors.password} hint={t("passwordHint")}>
                    <Input
                      type="password"
                      placeholder={t("passwordPlaceholder")}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </Field>
                )}
              </>
            )}

            <div className="flex items-center justify-between gap-4 py-1">
              <div>
                <p className="text-text-primary text-sm font-medium">{t("anonymousMode")}</p>
                <p className="text-text-muted text-xs mt-0.5">{t("anonymousModeHint")}</p>
              </div>
              <Toggle checked={isAnonymous} onChange={setAnonymous} />
            </div>

            <Divider />

            <div>
              <p className="text-text-primary text-sm font-medium mb-1">{t("columnsTitle")}</p>
              <p className="text-text-muted text-xs mb-4">{t("columnsHint")}</p>

              <div className="space-y-2">
                {columns.map((col) => (
                  <div key={col.id} className="flex items-center gap-2">
                    <Input
                      type="text"
                      size="sm"
                      placeholder={t("columnPlaceholder")}
                      value={col.title}
                      onChange={(e) => updateColumn(col.id, e.target.value)}
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => removeColumn(col.id)}
                      disabled={columns.length === 1}
                      className="size-10 flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-bg-elevated disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      aria-label="Remove column"
                    >
                      <XIcon />
                    </button>
                  </div>
                ))}
              </div>

              {errors.columns && (
                <p className="mt-2 text-xs text-red-400">{errors.columns}</p>
              )}

              <button
                type="button"
                onClick={addColumn}
                className="mt-3 flex items-center gap-1.5 text-accent-primary text-sm font-medium hover:opacity-80 transition-opacity cursor-pointer"
              >
                <PlusIcon size={12} />
                {t("addColumn")}
              </button>

              <div className="mt-4 flex items-center gap-3 h-10 px-3 rounded-md border border-dashed border-border bg-bg-elevated/50">
                <LockIcon size={13} />
                <span className="text-text-muted text-sm flex-1">{t("actionItems")}</span>
                <span className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">
                  {t("autoAdded")}
                </span>
              </div>
            </div>

            <Divider />

            <CarryOverSection
              carryOver={carryOver}
              endedRooms={endedRooms}
              roomsLoading={carryOverRoomsLoading}
            />

            <Divider />

            <div className="flex justify-end">
              <Button type="submit" size="lg" disabled={submitting}>
                {submitting ? t("creating") : t("createRoom")}
                {!submitting && <ArrowRightIcon size={14} />}
              </Button>
            </div>
          </form>
        </>
      )}
    </Modal>
  );
}

function Divider() {
  return <div className="h-px bg-border" />;
}
