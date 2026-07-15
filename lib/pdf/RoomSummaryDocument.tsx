import { Fragment, type ReactNode } from "react";
import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import type { Card, Participant, ScoreboardEntry } from "@/types";
import type { PdfColors } from "./pdfColors";
import { PDF_COLORS } from "./pdfColors";
import type { PdfStyles } from "./pdfStyles";
import {
  createPdfStyles,
  ACTION_ITEM_ROW_HEIGHT,
  PARTICIPANT_CHIP_HEIGHT,
  RETRO_CARD_ROW_HEIGHT,
  SCOREBOARD_HEAD_GLUE_HEIGHT,
  SCOREBOARD_ROW_HEIGHT,
} from "./pdfStyles";
import { PdfCircleIcon, PdfCheckIcon, PdfLoopIcon, PdfThumbUpIcon } from "./pdfIcons";
import type { PdfSectionKey, PdfTheme, PdfTranslations, RoomSummaryPdfData } from "./pdfTypes";

interface RoomSummaryDocumentProps extends RoomSummaryPdfData {
  theme: PdfTheme;
  translations: PdfTranslations;
}

export function RoomSummaryDocument({
  room,
  endedDate,
  participants,
  scoreboard,
  actionCards,
  newActionItemsCount,
  regularColumns,
  theme,
  translations,
  sections,
  sectionOrder,
  selectedColumnIds,
}: RoomSummaryDocumentProps) {
  const colors = PDF_COLORS[theme];
  const styles = createPdfStyles(colors);
  // logotipo-dark.svg has light wordmark text (reads on dark bg); logotipo-white.svg
  // has dark wordmark text (reads on light bg) -- names refer to the background
  // they're designed for, not their own tone.
  const logoSrc = theme === "dark" ? "/pdf/logotipo-dark.png" : "/pdf/logotipo-white.png";

  const filteredColumns = regularColumns.filter((g) => selectedColumnIds.includes(g.column.id));
  const retroRecapCount = filteredColumns.reduce((sum, g) => sum + g.cards.length, 0);

  // Keyed by PdfSectionKey so sectionOrder (user-configurable) can render
  // these in any order below. Each SectionHeading gets a minPresenceAhead
  // sized to the real height of "one following item" (see pdfStyles.ts) --
  // small buffer on a small node, unlike the old whole-section minPresenceAhead
  // that caused blank pages (see commit f7cf611). Since a heading and
  // whatever comes after it are the only two children of the section's View,
  // react-pdf defers both together if the heading doesn't clear that buffer,
  // which also covers the empty-state text branches below for free -- no
  // separate handling needed. wrap={false} on each card/row still prevents
  // mid-item splits.
  const sectionContent: Record<PdfSectionKey, ReactNode> = {
    participants: sections.participants && participants.length > 0 && (
      <View style={styles.section}>
        <SectionHeading
          label={translations.participants}
          count={participants.length}
          styles={styles}
          minPresenceAhead={PARTICIPANT_CHIP_HEIGHT}
        />
        <View style={styles.participantsRow}>
          {participants.map((p) => (
            <ParticipantChip key={p.id} participant={p} hostLabel={translations.host} styles={styles} />
          ))}
        </View>
      </View>
    ),
    scoreboard: sections.scoreboard && !room.isAnonymous && (
      <View style={styles.section}>
        <SectionHeading
          label={translations.scoreboard}
          count={scoreboard.length}
          accent
          styles={styles}
          minPresenceAhead={SCOREBOARD_HEAD_GLUE_HEIGHT}
        />
        {scoreboard.length === 0 ? (
          <Text style={styles.emptyText}>{translations.scoreboardEmpty}</Text>
        ) : (
          <ScoreboardTable entries={scoreboard} translations={translations} styles={styles} />
        )}
      </View>
    ),
    actionItems: sections.actionItems && (
      <View style={styles.section}>
        <SectionHeading
          label={translations.actionItems}
          count={newActionItemsCount}
          accent
          styles={styles}
          minPresenceAhead={ACTION_ITEM_ROW_HEIGHT}
        />
        {actionCards.length === 0 ? (
          <Text style={styles.emptyText}>{translations.noActionItems}</Text>
        ) : (
          <View>
            {actionCards.map((card, i) => (
              <PdfActionItemRow
                key={card.id}
                card={card}
                isAnonymous={room.isAnonymous}
                isFirst={i === 0}
                isLast={i === actionCards.length - 1}
                translations={translations}
                colors={colors}
                styles={styles}
              />
            ))}
          </View>
        )}
      </View>
    ),
    retroRecap: sections.retroRecap && filteredColumns.length > 0 && (
      <View style={styles.section}>
        <SectionHeading
          label={translations.retroRecap}
          count={retroRecapCount}
          styles={styles}
          minPresenceAhead={RETRO_CARD_ROW_HEIGHT}
        />
        <View style={styles.columnsGrid}>
          {filteredColumns.map(({ column, cards }) => (
            <View key={column.id} style={styles.columnBlock}>
              <PdfGlueSentinel />
              <View style={styles.columnHeaderRow} minPresenceAhead={RETRO_CARD_ROW_HEIGHT}>
                <Text style={styles.columnTitle}>{column.title}</Text>
                <Text style={styles.columnCount}>{cards.length}</Text>
              </View>
              {cards.length === 0 ? (
                <Text style={styles.emptyText}>{translations.noCards}</Text>
              ) : (
                <View style={styles.cardsGrid}>
                  {cards.map((card) => (
                    <PdfSummaryCard
                      key={card.id}
                      card={card}
                      isAnonymous={room.isAnonymous}
                      translations={translations}
                      colors={colors}
                      styles={styles}
                    />
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      </View>
    ),
  };

  return (
    <Document title={`${room.name} - RetroDash`} author="RetroDash">
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image has no alt prop, not a DOM img */}
          <Image src={logoSrc} style={styles.logo} />
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.roomName}>{room.name}</Text>
          {room.description && (
            <Text style={styles.description}>&ldquo;{room.description}&rdquo;</Text>
          )}
          {endedDate && (
            <Text style={styles.dateLine}>
              {translations.retroLabel} · {endedDate}
            </Text>
          )}
        </View>

        {sectionOrder.map((key) => (
          <Fragment key={key}>{sectionContent[key]}</Fragment>
        ))}

        <Text
          style={styles.pageNumber}
          fixed
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        />
      </Page>
    </Document>
  );
}

function SectionHeading({
  label,
  count,
  accent = false,
  styles,
  minPresenceAhead,
}: {
  label: string;
  count: number;
  accent?: boolean;
  styles: PdfStyles;
  minPresenceAhead: number;
}) {
  return (
    <>
      <PdfGlueSentinel />
      <View style={styles.sectionHeaderRow} minPresenceAhead={minPresenceAhead}>
        <Text style={accent ? [styles.sectionTitle, styles.sectionTitleAccent] : styles.sectionTitle}>
          {label}
        </Text>
        <Text style={styles.sectionCount}>{count}</Text>
      </View>
    </>
  );
}

// react-pdf's minPresenceAhead only breaks a node when there's a previous
// non-fixed sibling already placed in that same split pass (see
// shouldBreak/breakingImprovesPresence in @react-pdf/layout) -- for a node
// that's the very first child of its parent, that's always false, so
// minPresenceAhead on a first child (every heading here) is silently a
// no-op. This zero-height spacer gives the heading a previous sibling so its
// minPresenceAhead actually takes effect. Verified empirically: without it,
// a heading can render alone with its content pushed entirely to the next
// page; with it, heading and content defer together as intended.
function PdfGlueSentinel() {
  return <View style={{ height: 0 }} />;
}

function PdfAvatarInitial({ name, styles }: { name: string; styles: PdfStyles }) {
  return (
    <View style={styles.avatarCircle}>
      <Text style={styles.avatarInitial}>{(name || "?")[0]?.toUpperCase() ?? "?"}</Text>
    </View>
  );
}

function AnonymousChip({ label, styles }: { label: string; styles: PdfStyles }) {
  return (
    <View style={styles.inlineIdentity}>
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarInitial}>?</Text>
      </View>
      <Text style={styles.identityName}>{label}</Text>
    </View>
  );
}

function ParticipantChip({
  participant,
  hostLabel,
  styles,
}: {
  participant: Participant;
  hostLabel: string;
  styles: PdfStyles;
}) {
  return (
    <View style={styles.participantChip} wrap={false}>
      <PdfAvatarInitial name={participant.displayName} styles={styles} />
      <Text style={styles.participantName}>{participant.displayName}</Text>
      {participant.role === "facilitator" && <Text style={styles.hostBadge}>{hostLabel}</Text>}
    </View>
  );
}

function ScoreboardTable({
  entries,
  translations,
  styles,
}: {
  entries: ScoreboardEntry[];
  translations: PdfTranslations;
  styles: PdfStyles;
}) {
  return (
    <View>
      <PdfGlueSentinel />
      <View style={styles.tableHeaderRow} minPresenceAhead={SCOREBOARD_ROW_HEIGHT}>
        <Text style={[styles.tableHeaderCell, styles.colRank]}>#</Text>
        <Text style={[styles.tableHeaderCell, styles.colParticipant]}>{translations.participants}</Text>
        <Text style={[styles.tableHeaderCell, styles.colStat]}>{translations.scoreboardCards}</Text>
        <Text style={[styles.tableHeaderCell, styles.colStat]}>{translations.scoreboardActions}</Text>
        <Text style={[styles.tableHeaderCell, styles.colStat]}>{translations.scoreboardLikes}</Text>
        <Text style={[styles.tableHeaderCell, styles.colStat]}>{translations.scoreboardComments}</Text>
        <Text style={[styles.tableHeaderCell, styles.colStat]}>{translations.scoreboardPoints}</Text>
      </View>
      {entries.map((entry, i) => (
        <View
          key={entry.userId}
          style={i === entries.length - 1 ? [styles.tableRow, styles.tableRowLast] : styles.tableRow}
          wrap={false}
        >
          <Text style={[styles.tableCell, styles.colRank]}>{entry.position}</Text>
          <View style={styles.colParticipant}>
            <PdfAvatarInitial name={entry.userName} styles={styles} />
            <Text style={styles.tableCell}>{entry.userName}</Text>
          </View>
          <Text style={[styles.tableCell, styles.colStat]}>{entry.cardsCount}</Text>
          <Text style={[styles.tableCell, styles.colStat]}>{entry.actionItemsCount}</Text>
          <Text style={[styles.tableCell, styles.colStat]}>{entry.votesReceived}</Text>
          <Text style={[styles.tableCell, styles.colStat]}>{entry.commentsCount}</Text>
          <Text style={[styles.tableCell, styles.colStat]}>
            {Number.isInteger(entry.totalPoints) ? entry.totalPoints : entry.totalPoints.toFixed(2)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function IdentityRow({
  card,
  isAnonymous,
  translations,
  styles,
}: {
  card: Card;
  isAnonymous: boolean;
  translations: PdfTranslations;
  styles: PdfStyles;
}) {
  if (isAnonymous) return null;
  return (
    <View style={styles.identityRow}>
      {card.authorName ? (
        <View style={styles.inlineIdentity}>
          <PdfAvatarInitial name={card.authorName} styles={styles} />
          <Text style={styles.identityName}>{card.authorName}</Text>
        </View>
      ) : (
        <AnonymousChip label={translations.anonymous} styles={styles} />
      )}
      {card.assigneeId && (
        <View style={styles.assigneeRow}>
          <PdfAvatarInitial name={card.assigneeName ?? "?"} styles={styles} />
          <Text style={styles.identityName}>{translations.assignedTo(card.assigneeName ?? "")}</Text>
        </View>
      )}
    </View>
  );
}

function VoteBadge({ count, colors, styles }: { count: number; colors: PdfColors; styles: PdfStyles }) {
  if (count === 0) return null;
  return (
    <View style={styles.voteBadge}>
      <PdfThumbUpIcon size={8} color={colors.textMuted} />
      <Text style={styles.voteBadgeText}>{count}</Text>
    </View>
  );
}

function PdfActionItemRow({
  card,
  isAnonymous,
  isFirst,
  isLast,
  translations,
  colors,
  styles,
}: {
  card: Card;
  isAnonymous: boolean;
  isFirst: boolean;
  isLast: boolean;
  translations: PdfTranslations;
  colors: PdfColors;
  styles: PdfStyles;
}) {
  const status: "pending" | "done" | "keep" = card.actionStatus ?? (card.done ? "done" : "pending");
  const statusColor =
    status === "done" ? colors.statusDone : status === "keep" ? colors.statusKeep : colors.statusPending;
  const rowStyle = [
    styles.actionItemRow,
    ...(isFirst ? [styles.actionItemRowFirst] : []),
    ...(isLast ? [styles.actionItemRowLast] : []),
  ];

  return (
    <View style={rowStyle} wrap={false}>
      <View style={{ marginTop: 2 }}>
        {status === "done" ? (
          <PdfCheckIcon size={9} color={statusColor} />
        ) : status === "keep" ? (
          <PdfLoopIcon size={9} color={statusColor} />
        ) : (
          <PdfCircleIcon size={9} color={statusColor} />
        )}
      </View>
      <View style={styles.actionItemBody}>
        {card.carriedItem && <Text style={styles.carriedOverBadge}>{translations.carriedOver}</Text>}
        {card.linkedCardText && (
          <Text style={styles.fromCardText}>
            {translations.fromCard} {card.linkedCardText}
          </Text>
        )}
        <Text
          style={
            status === "done"
              ? [styles.actionItemText, styles.actionItemTextDone]
              : status === "keep"
                ? [styles.actionItemText, styles.actionItemTextKeep]
                : styles.actionItemText
          }
        >
          {card.text}
        </Text>
        {status === "keep" && <Text style={styles.keepGoingBadge}>{translations.keepGoing}</Text>}
        {(card.returnCount ?? 0) >= 1 && (
          <Text style={styles.returnedBadge}>{translations.returnedCount(card.returnCount ?? 0)}</Text>
        )}
        <IdentityRow card={card} isAnonymous={isAnonymous} translations={translations} styles={styles} />
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <VoteBadge count={card.votedBy.length} colors={colors} styles={styles} />
      </View>
    </View>
  );
}

function PdfSummaryCard({
  card,
  isAnonymous,
  translations,
  colors,
  styles,
}: {
  card: Card;
  isAnonymous: boolean;
  translations: PdfTranslations;
  colors: PdfColors;
  styles: PdfStyles;
}) {
  return (
    <View style={styles.summaryCard} wrap={false}>
      <Text style={styles.summaryCardText}>{card.text}</Text>
      <View style={styles.summaryCardFooter}>
        {!isAnonymous ? (
          card.authorName ? (
            <View style={styles.inlineIdentity}>
              <PdfAvatarInitial name={card.authorName} styles={styles} />
              <Text style={styles.identityName}>{card.authorName}</Text>
            </View>
          ) : (
            <AnonymousChip label={translations.anonymous} styles={styles} />
          )
        ) : (
          <View />
        )}
        <VoteBadge count={card.votedBy.length} colors={colors} styles={styles} />
      </View>
    </View>
  );
}
