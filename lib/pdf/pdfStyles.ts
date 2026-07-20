import { StyleSheet } from "@react-pdf/renderer";
import type { PdfColors } from "./pdfColors";

// Real, derived glue heights for orphan protection (minPresenceAhead props
// in RoomSummaryDocument.tsx) -- each is computed from the actual style
// values below (padding, border, avatar size, font size/line height), not
// an arbitrary guess, so a section's title/header only renders where its
// first content item is guaranteed to fit right after it.

// participantChip: paddingVertical 4*2 + borderWidth 1*2 + avatarCircle height 16
export const PARTICIPANT_CHIP_HEIGHT = 26;
// tableRow: paddingVertical 6*2 + borderTopWidth 1 + avatarCircle height 16
export const SCOREBOARD_ROW_HEIGHT = 29;
// tableHeaderRow: paddingVertical 6*2 + borderTopWidth 1 + tableHeaderCell line height (~8)
const SCOREBOARD_HEAD_HEIGHT = 21;
// The scoreboard title must clear the table header AND its first row combined,
// not just the header -- otherwise the title can pass its own check while the
// separately-evaluated header-vs-row check fails and defers elsewhere, orphaning
// the title one level removed.
export const SCOREBOARD_HEAD_GLUE_HEIGHT = SCOREBOARD_HEAD_HEIGHT + SCOREBOARD_ROW_HEIGHT;
// actionItemRow: paddingVertical 10*2 + borderTopWidth 1, plus a deliberately
// generous allowance for wrapped multi-line text + identity row + badges (real
// card height varies a lot and isn't knowable ahead of render, so this biases
// toward occasionally deferring a bit early over ever orphaning a long first card)
export const ACTION_ITEM_ROW_HEIGHT = 90;
// columnHeaderRow height (~19) + summaryCard height, generously assuming
// 2-line card text (real card height varies with text length)
export const RETRO_CARD_ROW_HEIGHT = 80;

// Layout/spacing is defined once here; only color values vary by theme
// (passed in from pdfColors.ts), so the light/dark documents never drift
// apart structurally.
export function createPdfStyles(colors: PdfColors) {
  return StyleSheet.create({
    page: {
      backgroundColor: colors.bgBase,
      color: colors.textPrimary,
      fontFamily: "Plus Jakarta Sans",
      fontSize: 10,
      paddingTop: 36,
      paddingBottom: 40,
      paddingHorizontal: 36,
    },
    header: {
      marginBottom: 20,
    },
    logo: {
      width: 110,
    },
    titleBlock: {
      marginBottom: 22,
    },
    // Color is overridden per-org at render time (org.colorId, same palette
    // as categories) -- orgLabelRow/orgLabel only define the shared shape.
    orgLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginBottom: 6,
    },
    orgDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    orgLabel: {
      fontSize: 9,
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    roomName: {
      fontSize: 20,
      fontWeight: 700,
      color: colors.textPrimary,
    },
    description: {
      fontSize: 11,
      fontStyle: "italic",
      color: colors.textPrimary,
      marginTop: 6,
    },
    dateLine: {
      fontSize: 9,
      color: colors.textMuted,
      marginTop: 4,
    },
    section: {
      marginBottom: 18,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: 8,
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: 600,
      color: colors.textPrimary,
    },
    sectionTitleAccent: {
      color: colors.accentPrimary,
    },
    sectionCount: {
      fontSize: 8,
      color: colors.textMuted,
      backgroundColor: colors.bgElevated,
      borderRadius: 8,
      paddingVertical: 2,
      paddingHorizontal: 6,
    },
    emptyText: {
      fontSize: 9,
      color: colors.textMuted,
      fontStyle: "italic",
    },
    participantsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    participantChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.bgCard,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingVertical: 4,
      paddingHorizontal: 10,
    },
    avatarCircle: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.bgElevated,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarInitial: {
      fontSize: 7,
      fontWeight: 600,
      color: colors.textMuted,
    },
    participantName: {
      fontSize: 9,
      color: colors.textPrimary,
    },
    hostBadge: {
      fontSize: 7,
      fontWeight: 700,
      textTransform: "uppercase",
      color: colors.accentPrimary,
    },
    tableHeaderRow: {
      flexDirection: "row",
      backgroundColor: colors.bgElevated,
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: colors.border,
      borderTopLeftRadius: 6,
      borderTopRightRadius: 6,
    },
    tableRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: colors.border,
    },
    // Applied to the last row instead of relying on a bounding box around
    // the whole table -- a bordered container that wraps across a page
    // break gets its border redrawn on the continuation fragment, which
    // looks like a floating box. Bordering each row (this file's
    // actionItemRow/actionItemRowLast use the same trick) keeps the frame
    // intact regardless of where a page break falls.
    tableRowLast: {
      borderBottomWidth: 1,
      borderBottomLeftRadius: 6,
      borderBottomRightRadius: 6,
    },
    tableHeaderCell: {
      fontSize: 7,
      fontWeight: 600,
      color: colors.textMuted,
      textTransform: "uppercase",
    },
    tableCell: {
      fontSize: 9,
      color: colors.textPrimary,
    },
    colRank: { width: "8%" },
    colParticipant: { width: "34%", flexDirection: "row", alignItems: "center", gap: 6 },
    colStat: { width: "14.5%", textAlign: "center" },
    // See the comment on tableRowLast: border lives on each row rather than
    // a bounding box around the whole list, so a page break never leaves a
    // floating bordered box behind.
    actionItemRow: {
      flexDirection: "row",
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: colors.border,
    },
    actionItemRowFirst: {
      borderTopLeftRadius: 6,
      borderTopRightRadius: 6,
    },
    actionItemRowLast: {
      borderBottomWidth: 1,
      borderBottomLeftRadius: 6,
      borderBottomRightRadius: 6,
    },
    actionItemBody: {
      flex: 1,
    },
    fromCardText: {
      fontSize: 8,
      fontStyle: "italic",
      color: colors.textMuted,
      marginBottom: 3,
    },
    actionItemText: {
      fontSize: 10,
      lineHeight: 1.4,
      color: colors.textPrimary,
    },
    actionItemTextDone: {
      color: colors.textMuted,
      textDecoration: "line-through",
    },
    actionItemTextKeep: {
      color: colors.statusKeep,
    },
    keepGoingBadge: {
      fontSize: 7,
      fontWeight: 700,
      textTransform: "uppercase",
      color: colors.statusKeep,
      marginTop: 3,
    },
    returnedBadge: {
      fontSize: 8,
      color: colors.textMuted,
      backgroundColor: colors.bgElevated,
      borderRadius: 8,
      paddingVertical: 2,
      paddingHorizontal: 6,
      marginTop: 3,
      alignSelf: "flex-start",
    },
    carriedOverBadge: {
      fontSize: 7,
      fontWeight: 700,
      textTransform: "uppercase",
      color: colors.textMuted,
      backgroundColor: colors.bgElevated,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 3,
      paddingVertical: 1,
      paddingHorizontal: 4,
      marginBottom: 4,
      alignSelf: "flex-start",
    },
    // Color/borderColor are overridden per-category at render time (see
    // PdfCategoryBadge in RoomSummaryDocument.tsx) -- this only defines the
    // shared shape, same split as the on-screen CategoryBadge component.
    categoryBadge: {
      fontSize: 7,
      fontWeight: 600,
      backgroundColor: colors.bgElevated,
      borderWidth: 1,
      borderRadius: 3,
      paddingVertical: 1,
      paddingHorizontal: 4,
      marginTop: 3,
      alignSelf: "flex-start",
    },
    identityRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 6,
    },
    inlineIdentity: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    identityName: {
      fontSize: 8,
      color: colors.textMuted,
    },
    assigneeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginLeft: 10,
      paddingLeft: 10,
      borderLeftWidth: 1,
      borderLeftColor: colors.border,
    },
    voteBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
    },
    voteBadgeText: {
      fontSize: 8,
      color: colors.textMuted,
    },
    // Columns render one after another (full column, then the next), not
    // side by side, so this wrapper no longer needs row/wrap layout -- kept
    // as a named style for symmetry with columnBlock and future spacing hooks.
    columnsGrid: {},
    columnBlock: {
      width: "100%",
      marginBottom: 14,
    },
    columnHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
    },
    columnTitle: {
      fontSize: 10,
      fontWeight: 600,
      color: colors.textPrimary,
    },
    columnCount: {
      fontSize: 8,
      color: colors.textMuted,
      backgroundColor: colors.bgElevated,
      borderRadius: 8,
      paddingVertical: 2,
      paddingHorizontal: 6,
    },
    cardsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    summaryCard: {
      width: "47%",
      backgroundColor: colors.bgCard,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 5,
      padding: 8,
    },
    summaryCardText: {
      fontSize: 9,
      lineHeight: 1.4,
      color: colors.textPrimary,
    },
    summaryCardFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 6,
    },
    pageNumber: {
      position: "absolute",
      bottom: 18,
      left: 0,
      right: 0,
      textAlign: "center",
      fontSize: 8,
      color: colors.textMuted,
    },
  });
}

export type PdfStyles = ReturnType<typeof createPdfStyles>;
