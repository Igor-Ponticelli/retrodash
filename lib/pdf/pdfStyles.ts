import { StyleSheet } from "@react-pdf/renderer";
import type { PdfColors } from "./pdfColors";

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
    table: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
    },
    tableHeaderRow: {
      flexDirection: "row",
      backgroundColor: colors.bgElevated,
      paddingVertical: 6,
      paddingHorizontal: 8,
    },
    tableRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
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
    itemsCard: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
    },
    actionItemRow: {
      flexDirection: "row",
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    actionItemRowFirst: {
      borderTopWidth: 0,
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
    columnsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 14,
    },
    columnBlock: {
      width: "47%",
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
    summaryCard: {
      backgroundColor: colors.bgCard,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 5,
      padding: 8,
      marginBottom: 6,
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
