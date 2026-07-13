"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { signOut } from "@/lib/auth";
import { lockScroll, unlockScroll } from "@/lib/scrollLock";
import { useAuth } from "@/hooks/useAuth";
import { useMyActionItems } from "@/hooks/useMyActionItems";
import { useWhatsNew } from "@/hooks/useWhatsNew";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { RetroDashLogo, RetroDashIcon } from "@/components/ui/RetroDashLogo";
import { MenuIcon, MessageIcon, CircleIcon, CheckIcon, LoopIcon, SparkleIcon } from "@/components/ui/Icons";
import { WhatsNewModal } from "@/components/whatsnew/WhatsNewModal";

interface NavbarProps {
  logoHref?: string;
  children?: React.ReactNode;
  leftActions?: React.ReactNode;
  actions?: React.ReactNode;
  showHamburger?: boolean;
}

export function Navbar({
  logoHref,
  children,
  actions,
  leftActions,
  showHamburger,
}: NavbarProps) {
  const { user } = useAuth();
  const { isFirstAccess } = useWhatsNew();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("navbar");
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerClosing, setDrawerClosing] = useState(false);
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);
  const [, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  useEffect(() => {
    if (!drawerOpen) return;
    lockScroll();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") startCloseDrawer();
    };
    document.addEventListener("keydown", handler);
    return () => {
      unlockScroll();
      document.removeEventListener("keydown", handler);
    };
  }, [drawerOpen]);

  const startCloseDrawer = () => setDrawerClosing(true);
  const handleDrawerAnimEnd = () => {
    if (drawerClosing) {
      setDrawerClosing(false);
      setDrawerOpen(false);
    }
  };

  const handleSignOut = async () => {
    startCloseDrawer();
    await signOut();
    router.push("/login");
  };

  const switchLocale = (next: string) => {
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
    setMenuOpen(false);
  };

  const logo = (
    <>
      <span className="min-[450px]:hidden shrink-0">
        <RetroDashIcon size={28} />
      </span>
      <span className="hidden min-[450px]:block shrink-0">
        <RetroDashLogo className="w-20.5 lg:w-27.5" />
      </span>
    </>
  );

  const avatarButton = user && (
    <button
      onClick={() => setDrawerOpen(true)}
      aria-label={t("myAccount")}
      title={t("myAccount")}
      className="shrink-0 rounded-full ring-2 ring-transparent hover:ring-accent-primary transition-all cursor-pointer"
    >
      {user.photoURL ? (
        <Image
          src={user.photoURL}
          alt={user.displayName ?? "User"}
          width={32}
          height={32}
          className="rounded-full block"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-bg-elevated border border-border flex items-center justify-center text-xs font-semibold text-text-muted">
          {user.displayName?.[0]?.toUpperCase() ?? "?"}
        </div>
      )}
    </button>
  );

  return (
    <>
      <header className="bg-bg-surface border-b border-border px-4 sm:px-6 h-16 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          {logoHref ? (
            <Link href={logoHref} className="shrink-0">
              {logo}
            </Link>
          ) : (
            logo
          )}
          {(children || leftActions) && (
            <>
              <span
                aria-hidden
                className="text-border hidden lg:block shrink-0"
              >
                |
              </span>
              <div className="flex items-center gap-2.5 min-w-0">
                {children && (
                  <div
                    className={`flex items-center gap-2.5 min-w-0 ${showHamburger ? "hidden lg:flex" : "flex"}`}
                  >
                    {children}
                  </div>
                )}
                {leftActions}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {actions}

          <div
            className={`flex items-center gap-3 ${showHamburger ? "hidden lg:flex" : "flex"}`}
          >
            <ThemeToggle variant="dropdown" />
            <LanguageSwitcher />
            <span aria-hidden className="text-border hidden lg:block">
              |
            </span>
            <Link
              href="/feedback"
              title={t("feedback")}
              className="hidden lg:flex w-8 h-8 items-center justify-center rounded-md border border-transparent text-text-muted hover:border-border hover:bg-bg-card hover:text-text-secondary transition-colors"
            >
              <MessageIcon size={16} />
            </Link>
            <span aria-hidden className="text-border hidden lg:block">
              |
            </span>
          </div>

          {avatarButton}

          {showHamburger && (
            <div ref={menuRef} className="relative lg:hidden">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Menu"
                aria-expanded={menuOpen}
                className={`w-8 h-8 flex items-center justify-center rounded-md border transition-colors cursor-pointer ${
                  menuOpen
                    ? "border-border bg-bg-card text-accent-primary"
                    : "border-transparent text-text-muted hover:border-border hover:bg-bg-card hover:text-text-secondary"
                }`}
              >
                <MenuIcon />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-bg-surface border border-border rounded-lg shadow-lg overflow-hidden z-50 py-1">
                  <div className="px-3 py-2.5">
                    <ThemeToggle variant="inline" />
                  </div>

                  <div className="mx-3 h-px bg-border" />

                  <div className="px-3 py-2.5 flex">
                    <button
                      onClick={() => switchLocale("en")}
                      className={`flex-1 h-7 rounded text-xs font-medium transition-colors cursor-pointer ${
                        locale === "en"
                          ? "bg-accent-primary/15 text-accent-primary"
                          : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                      }`}
                    >
                      EN
                    </button>
                    <button
                      onClick={() => switchLocale("pt-BR")}
                      className={`flex-1 h-7 rounded text-xs font-medium transition-colors cursor-pointer ${
                        locale === "pt-BR"
                          ? "bg-accent-primary/15 text-accent-primary"
                          : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                      }`}
                    >
                      PT
                    </button>
                  </div>

                  <div className="mx-3 h-px bg-border" />

                  <div className="px-3 py-2.5">
                    <Link
                      href="/feedback"
                      onClick={() => setMenuOpen(false)}
                      className="block text-sm text-text-secondary hover:text-text-primary transition-colors"
                    >
                      {t("feedback")}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {(drawerOpen || drawerClosing) && (
        <>
          <div
            aria-hidden
            onClick={startCloseDrawer}
            className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm ${
              drawerClosing
                ? "animate-[backdrop-out_0.22s_ease-in_forwards]"
                : "animate-[backdrop-in_0.22s_ease-out]"
            }`}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("myAccount")}
            onAnimationEnd={handleDrawerAnimEnd}
            className={`fixed right-0 top-0 z-50 h-full w-72 max-w-[85vw] bg-bg-surface border-l border-border flex flex-col shadow-2xl ${
              drawerClosing
                ? "animate-[drawer-out_0.22s_ease-in_forwards]"
                : "animate-[drawer-in_0.22s_ease-out]"
            }`}
          >
            <div className="flex items-center justify-end px-4 pt-4 shrink-0">
              <button
                onClick={startCloseDrawer}
                aria-label="Close"
                className="w-8 h-8 flex items-center justify-center rounded-md border border-transparent text-text-muted hover:border-border hover:bg-bg-card hover:text-text-secondary transition-colors cursor-pointer"
              >
                <XIcon />
              </button>
            </div>

            <div className="flex flex-col items-center gap-3 px-6 pt-6 pb-8 shrink-0">
              {user?.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt={user.displayName ?? "User"}
                  width={64}
                  height={64}
                  className="rounded-full ring-2 ring-border"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-bg-elevated border border-border flex items-center justify-center text-xl font-semibold text-text-muted">
                  {user?.displayName?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              <div className="text-center">
                <p className="text-text-primary font-semibold text-base leading-snug">
                  {user?.displayName}
                </p>
                {user?.email && (
                  <p className="text-text-muted text-sm mt-0.5">{user.email}</p>
                )}
              </div>
            </div>

            <div className="mx-6 h-px bg-border shrink-0" />

            {!isFirstAccess && (
              <>
                <div className="px-6 pt-4 shrink-0">
                  <button
                    onClick={() => setWhatsNewOpen(true)}
                    className="w-full flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer py-1"
                  >
                    <SparkleIcon size={15} />
                    {t("whatsNew")}
                  </button>
                </div>

                <div className="mx-6 mt-3 h-px bg-border shrink-0" />
              </>
            )}

            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin px-6 py-4">
              <MyActionItemsCollapse onNavigate={startCloseDrawer} />
            </div>

            <div className="px-6 pb-8 shrink-0">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 h-9 rounded-md border border-border text-text-secondary hover:border-red-500/50 hover:text-red-500 hover:bg-red-500/5 text-sm font-medium transition-colors cursor-pointer"
              >
                <SignOutIcon />
                {t("signOut")}
              </button>
            </div>
          </div>
        </>
      )}

      {whatsNewOpen && <WhatsNewModal initialShowAll onClose={() => setWhatsNewOpen(false)} />}
    </>
  );
}

function MyActionItemsCollapse({ onNavigate }: { onNavigate: () => void }) {
  const { user } = useAuth();
  const t = useTranslations("navbar");
  const tBoard = useTranslations("board");
  const [open, setOpen] = useState(false);
  const { items, loading, loaded, load } = useMyActionItems(user?.uid);

  const handleToggle = () => {
    if (!open && !loaded) load();
    setOpen((v) => !v);
  };

  const groups: {
    status: "pending" | "done" | "keep";
    label: string;
    colorClass: string;
    icon: React.ReactNode;
  }[] = [
    { status: "pending", label: tBoard("statusPending"), colorClass: "text-orange-600 dark:text-orange-400", icon: <CircleIcon size={12} /> },
    { status: "done", label: tBoard("statusDone"), colorClass: "text-green-700 dark:text-green-400", icon: <CheckIcon size={12} /> },
    { status: "keep", label: tBoard("statusKeep"), colorClass: "text-accent-violet", icon: <LoopIcon size={12} /> },
  ];

  return (
    <div>
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between text-sm font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer py-1"
      >
        {t("myActionItems")}
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="mt-2 space-y-3">
          {loading ? (
            <div className="space-y-2">
              <div className="h-8 rounded bg-bg-elevated animate-pulse" />
              <div className="h-8 rounded bg-bg-elevated animate-pulse" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-xs text-text-muted">{t("myActionItemsEmpty")}</p>
          ) : (
            groups.map(({ status, label, colorClass, icon }) => {
              const groupItems = items.filter(
                ({ card }) => (card.actionStatus ?? "pending") === status,
              );
              if (groupItems.length === 0) return null;

              return (
                <div key={status}>
                  <p className={`text-[10px] font-semibold uppercase tracking-widest mb-1 ${colorClass}`}>
                    {label}
                  </p>
                  <ul className="space-y-0.5">
                    {groupItems.map(({ card, roomId, roomName, roomStatus }) => (
                      <li key={`${roomId}-${card.id}`}>
                        <Link
                          href={roomStatus === "ended" ? `/room/${roomId}/summary` : `/room/${roomId}`}
                          onClick={onNavigate}
                          className="flex items-start gap-1.5 px-1.5 py-1 -mx-1.5 rounded-md hover:bg-bg-elevated transition-colors"
                        >
                          <span className={`mt-0.5 shrink-0 ${colorClass}`}>{icon}</span>
                          <span className="min-w-0">
                            <span
                              className={`block text-xs leading-snug truncate ${
                                status === "done" ? "line-through text-text-muted" : "text-text-primary"
                              }`}
                            >
                              {card.text}
                            </span>
                            <span className="block text-text-muted text-[10px] truncate">
                              {roomName}
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
