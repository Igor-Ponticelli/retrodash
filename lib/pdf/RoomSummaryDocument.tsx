import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import type { Card, Participant, ScoreboardEntry } from "@/types";
import type { PdfColors } from "./pdfColors";
import { PDF_COLORS } from "./pdfColors";
import type { PdfStyles } from "./pdfStyles";
import { createPdfStyles } from "./pdfStyles";
import { PdfCircleIcon, PdfCheckIcon, PdfLoopIcon, PdfThumbUpIcon } from "./pdfIcons";
import type { PdfTheme, PdfTranslations, RoomSummaryPdfData } from "./pdfTypes";

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

  // No minPresenceAhead on the sections below: react-pdf demands that much
  // *extra* room after a section's full height fits, or defers the whole
  // section to the next page (blank space left behind) -- easy to hit now
  // that any section can be last and retro recap got taller (sequential
  // columns). wrap={false} on each card/row still prevents mid-item splits.
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

        {sections.participants && participants.length > 0 && (
          <View style={styles.section}>
            <SectionHeading label={translations.participants} count={participants.length} styles={styles} />
            <View style={styles.participantsRow}>
              {participants.map((p) => (
                <ParticipantChip key={p.id} participant={p} hostLabel={translations.host} styles={styles} />
              ))}
            </View>
          </View>
        )}

        {sections.scoreboard && !room.isAnonymous && (
          <View style={styles.section}>
            <SectionHeading
              label={translations.scoreboard}
              count={scoreboard.length}
              accent
              styles={styles}
            />
            {scoreboard.length === 0 ? (
              <Text style={styles.emptyText}>{translations.scoreboardEmpty}</Text>
            ) : (
              <ScoreboardTable entries={scoreboard} translations={translations} styles={styles} />
            )}
          </View>
        )}

        {sections.actionItems && (
          <View style={styles.section}>
            <SectionHeading
              label={translations.actionItems}
              count={newActionItemsCount}
              accent
              styles={styles}
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
        )}

        {sections.retroRecap && filteredColumns.length > 0 && (
          <View style={styles.section}>
            <SectionHeading label={translations.retroRecap} count={retroRecapCount} styles={styles} />
            <View style={styles.columnsGrid}>
              {filteredColumns.map(({ column, cards }) => (
                <View key={column.id} style={styles.columnBlock}>
                  <View style={styles.columnHeaderRow}>
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
        )}

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
}: {
  label: string;
  count: number;
  accent?: boolean;
  styles: PdfStyles;
}) {
  return (
    <View style={styles.sectionHeaderRow}>
      <Text style={accent ? [styles.sectionTitle, styles.sectionTitleAccent] : styles.sectionTitle}>
        {label}
      </Text>
      <Text style={styles.sectionCount}>{count}</Text>
    </View>
  );
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
      <View style={styles.tableHeaderRow}>
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
