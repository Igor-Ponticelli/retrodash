export type Locale = "en" | "pt-BR";

export interface ReleaseNote {
  // Internal only — drives comparison/ordering against lastSeenVersion.
  // Never rendered in the UI; the visible label is `tag`.
  version: string;
  tag: Record<Locale, string>;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  // Path under /public. Baked-in mockup copy is locale-specific, so each
  // locale gets its own rendered asset rather than one shared image.
  image: Record<Locale, string>;
}

// Newest first. With semantic-release, a version normally ships exactly one
// feature, so this list is normally read one entry at a time — multiple
// entries only surface together for a user who skipped several versions.
// CURRENT_VERSION always derives from RELEASE_NOTES[0] — never hardcode it
// separately, and never read package.json or a git tag at runtime (neither
// is a reliable source of the deployed version in this repo).
export const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: "1.12.0",
    tag: { en: "Likes", "pt-BR": "Curtidas" },
    title: { en: "Who liked it?", "pt-BR": "Quem curtiu?" },
    description: {
      en: "A card's like count just got more personal. Hover over it to see exactly which teammates liked it.",
      "pt-BR": "A contagem de curtidas de um card ficou mais pessoal. Passe o mouse sobre ela e veja exatamente quem do time curtiu.",
    },
    image: {
      en: "/whatsnew/wholikes-en.png",
      "pt-BR": "/whatsnew/wholikes-ptbr.png",
    },
  },
  {
    version: "1.11.0",
    tag: { en: "AI Suggestion", "pt-BR": "Sugestão de IA" },
    title: { en: "An action item suggested by AI", "pt-BR": "Item de ação sugerido por uma IA" },
    description: {
      en: 'Stuck turning a complaint into a plan? Click "Suggest with AI" on any improvement card and get a measurable action item in seconds.',
      "pt-BR": 'Travou na hora de transformar uma reclamação em plano? Clique em "Sugerir com IA" em qualquer card de melhoria e ganhe um item de ação mensurável em segundos.',
    },
    image: {
      en: "/whatsnew/aisuggest-en.png",
      "pt-BR": "/whatsnew/aisuggest-ptbr.png",
    },
  },
  {
    version: "1.10.0",
    tag: { en: "Action Items", "pt-BR": "Itens de Ação" },
    title: { en: "The full action item journey", "pt-BR": "Todo o fluxo dos itens de ação" },
    description: {
      en: "See how many times an action item carried over into other rooms, and track its whole journey from the origin room's summary, with each stop's status shown independently.",
      "pt-BR": "Veja quantas vezes um item retornou para outras salas e, no resumo da sala de origem, acompanhe até onde ele chegou, com o status de cada parada de forma independente.",
    },
    image: {
      en: "/whatsnew/actionitems-en.png",
      "pt-BR": "/whatsnew/actionitems-ptbr.png",
    },
  },
  {
    version: "1.9.0",
    tag: { en: "Assignee", "pt-BR": "Responsável" },
    title: { en: "Action items now have an owner", "pt-BR": "Item de ação com um responsável" },
    description: {
      en: "Turn vague action items into real commitments. Assign an owner and everyone knows exactly who's driving it.",
      "pt-BR": "Transforme itens de ação vagos em compromissos de verdade. Atribua um responsável e todo mundo sabe quem está tocando aquilo.",
    },
    image: {
      en: "/whatsnew/assign-en.png",
      "pt-BR": "/whatsnew/assign-ptbr.png",
    },
  },
  {
    version: "1.8.0",
    tag: { en: "Comments", "pt-BR": "Comentários" },
    title: {
      en: "You can now comment on cards and action items",
      "pt-BR": "Agora é possível comentar nos cards e itens de ação",
    },
    description: {
      en: "No more losing context in chat. Comment on any card or action item and keep the discussion right where the idea lives.",
      "pt-BR": "Chega de perder contexto no chat. Comente em qualquer card ou item de ação e mantenha a discussão exatamente onde a ideia nasceu.",
    },
    image: {
      en: "/whatsnew/comments-en.png",
      "pt-BR": "/whatsnew/comments-ptbr.png",
    },
  },
];

export const CURRENT_VERSION = RELEASE_NOTES[0].version;

// comparedTo === null means "never seen anything" — everything is newer.
export function isVersionNewer(version: string, comparedTo: string | null): boolean {
  if (comparedTo === null) return true;
  const a = version.split(".").map(Number);
  const b = comparedTo.split(".").map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    if (diff !== 0) return diff > 0;
  }
  return false;
}
