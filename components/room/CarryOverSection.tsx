"use client";

import { useTranslations } from "next-intl";
import { Toggle } from "@/components/ui/Toggle";
import { Skeleton } from "@/components/ui/Skeleton";
import { Avatar } from "@/components/ui/Avatar";
import type { CarryOverState } from "@/hooks/useCarryOver";
import type { Room } from "@/types";

interface CarryOverSectionProps {
  carryOver: CarryOverState;
  endedRooms: Room[];
  roomsLoading: boolean;
}

export function CarryOverSection({ carryOver, endedRooms, roomsLoading }: CarryOverSectionProps) {
  const {
    enabled, setEnabled,
    selectedRoomId, setSelectedRoomId,
    candidateItems, loadingItems,
    checkedIds, toggleItem, toggleAll,
    selectedItems,
  } = carryOver;
  const t = useTranslations("carryOver");

  const allChecked = candidateItems.length > 0 && checkedIds.size === candidateItems.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 py-1">
        <div>
          <p className="text-text-primary text-sm font-medium">{t("title")}</p>
          <p className="text-text-muted text-xs mt-0.5">{t("hint")}</p>
        </div>
        <Toggle checked={enabled} onChange={setEnabled} aria-label={t("title")} />
      </div>

      {enabled && (
        <div className="space-y-3 pl-0">
          {roomsLoading ? (
            <Skeleton className="h-11 w-full" />
          ) : endedRooms.length === 0 ? (
            <p className="text-text-muted text-sm">{t("noEndedRooms")}</p>
          ) : (
            <select
              value={selectedRoomId ?? ""}
              onChange={(e) => setSelectedRoomId(e.target.value || null)}
              className="w-full h-11 px-3 rounded-md bg-bg-elevated border border-border text-sm text-text-primary outline-none focus:border-accent-primary transition-colors cursor-pointer"
            >
              <option value="" disabled>{t("pickRoom")}</option>
              {endedRooms.map((room) => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>
          )}

          {selectedRoomId && (
            loadingItems ? (
              <div className="space-y-2">
                <Skeleton className="h-9 w-full rounded-md" />
                <Skeleton className="h-9 w-full rounded-md" />
              </div>
            ) : candidateItems.length === 0 ? (
              <p className="text-text-muted text-sm">{t("noItems")}</p>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={toggleAll}
                    className="text-accent-primary text-sm font-medium hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    {allChecked ? t("deselectAll") : t("selectAll")}
                  </button>
                  <span className="text-xs text-text-muted">
                    {t("selectedCount", { selected: selectedItems.length, total: candidateItems.length })}
                  </span>
                </div>

                <div className="space-y-1">
                  {candidateItems.map((item) => {
                    const checked = checkedIds.has(item.id);
                    const status: "pending" | "keep" =
                      (item.actionStatus ?? (item.done ? "done" : "pending")) === "keep"
                        ? "keep"
                        : "pending";
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleItem(item.id)}
                        className="w-full flex items-start gap-3 px-3 py-2.5 rounded-md hover:bg-bg-elevated transition-colors text-left cursor-pointer"
                      >
                        <span
                          className={`mt-0.5 shrink-0 size-4 rounded-sm border flex items-center justify-center transition-colors ${
                            checked
                              ? "bg-accent-primary border-accent-primary"
                              : "border-border bg-bg-elevated"
                          }`}
                          aria-hidden
                        >
                          {checked && <CheckIcon />}
                        </span>
                        <span className="flex-1 min-w-0">
                          {item.linkedCardText && (
                            <span className="block text-[11px] text-text-muted italic truncate mb-0.5">
                              {t("fromCard")} {item.linkedCardText}
                            </span>
                          )}
                          <span className="text-sm text-text-primary leading-snug">{item.text}</span>
                        </span>
                        {item.assigneeId && (
                          <span
                            className="shrink-0"
                            title={t("assignedTo", { name: item.assigneeName ?? "" })}
                          >
                            <Avatar
                              photoURL={item.assigneePhotoURL}
                              name={item.assigneeName ?? "?"}
                              size={20}
                            />
                          </span>
                        )}
                        {status === "keep" && (
                          <span className="shrink-0 inline-flex items-center gap-1 px-1.5 h-5 rounded text-[10px] font-semibold bg-accent-violet/15 text-accent-violet">
                            <LoopIcon />
                            {t("statusKeep")}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path d="M1.5 5l2.5 2.5L8.5 2" stroke="var(--color-bg-base)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LoopIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11V9a4 4 0 014-4h14" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 01-4 4H3" />
    </svg>
  );
}
