"use client";

import { useState } from "react";
import { RetroDashLogo } from "@/components/ui/RetroDashLogo";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { hashPassword } from "@/lib/auth";
import { joinRoom } from "@/lib/firestore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import type { Room } from "@/types";

interface JoinRoomProps {
  room: Room;
  userId: string;
  userDisplayName: string;
  userPhotoURL: string | null;
  onJoined: () => void;
}

export function JoinRoom({
  room,
  userId,
  userDisplayName,
  userPhotoURL,
  onJoined,
}: JoinRoomProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const t = useTranslations("joinRoom");

  const handleJoin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!password.trim()) return;

    setJoining(true);
    setError(null);

    const hash = await hashPassword(password.trim());

    if (hash !== room.password) {
      setError(t("incorrectPassword"));
      setJoining(false);
      return;
    }

    await joinRoom(room.id, userId, userDisplayName, userPhotoURL);
    onJoined();
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center px-4 sm:px-6">
      <div className="mb-10">
        <RetroDashLogo width={180} />
      </div>

      <div className="w-full max-w-sm bg-bg-card border border-border rounded-lg p-8">
        <div className="flex items-start gap-3 mb-6">
          <span className="mt-0.5 shrink-0 text-accent-violet">
            <LockIcon />
          </span>
          <div className="min-w-0">
            <p className="text-text-muted text-xs uppercase tracking-widest font-semibold mb-1">
              {t("title")}
            </p>
            <h1 className="text-text-primary font-bold text-lg leading-snug truncate">
              {room.name}
            </h1>
          </div>
        </div>

        <p className="text-text-secondary text-sm mb-6">
          {t("passwordProtected")}
        </p>

        <form onSubmit={handleJoin} noValidate className="space-y-4">
          <Field label={t("passwordLabel")} error={error ?? undefined}>
            <Input
              type="password"
              autoFocus
              placeholder={t("passwordPlaceholder")}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
            />
          </Field>

          <Button
            type="submit"
            size="lg"
            disabled={joining || !password.trim()}
            className="w-full"
          >
            {joining ? t("joining") : t("join")}
          </Button>
        </form>
      </div>

      <Link
        href="/dashboard"
        className="mt-6 text-text-muted hover:text-text-secondary text-sm transition-colors"
      >
        {t("backToDashboard")}
      </Link>
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect
        x="3"
        y="8"
        width="12"
        height="9"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M6 8V6a3 3 0 016 0v2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="9" cy="13" r="1.2" fill="currentColor" />
    </svg>
  );
}
