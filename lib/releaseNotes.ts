export type Locale = "en" | "pt-BR";

export interface ReleaseNoteItem {
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  // Path under /public. Baked-in mockup copy is locale-specific, so each
  // locale gets its own rendered asset rather than one shared image.
  image: Record<Locale, string>;
}

export interface ReleaseNote {
  version: string;
  releasedAt: string; // "YYYY-MM-DD"
  title: Record<Locale, string>;
  items: ReleaseNoteItem[];
}

// Newest first. CURRENT_VERSION always derives from RELEASE_NOTES[0] — never
// hardcode it separately, and never read package.json or a git tag at runtime
// (neither is a reliable source of the deployed version in this repo).
export const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: "1.14.0",
    releasedAt: "2026-07-10",
    title: {
      en: "Here's what you missed",
      "pt-BR": "Veja o que você perdeu",
    },
    items: [
      {
        title: {
          en: "Discuss ideas right on the card",
          "pt-BR": "Discuta ideias direto no card",
        },
        description: {
          en: "No more losing context in chat. Drop a comment on any card or action item and keep the whole discussion right where the idea lives.",
          "pt-BR": "Chega de perder contexto no chat. Comente em qualquer card ou item de ação e mantenha a discussão exatamente onde a ideia nasceu.",
        },
        image: {
          en: "/whatsnew/comments-en.png",
          "pt-BR": "/whatsnew/comments-pt-BR.png",
        },
      },
      {
        title: {
          en: "Know who owns each action",
          "pt-BR": "Saiba quem é o responsável",
        },
        description: {
          en: "Turn vague action items into real commitments. Assign one to a teammate and everyone knows exactly who's driving it.",
          "pt-BR": "Transforme itens de ação vagos em compromissos de verdade. Atribua um responsável e todo mundo sabe quem está tocando aquilo.",
        },
        image: {
          en: "/whatsnew/assignee-en.png",
          "pt-BR": "/whatsnew/assignee-pt-BR.png",
        },
      },
      {
        title: {
          en: "Track every action to the end",
          "pt-BR": "Acompanhe cada ação até o fim",
        },
        description: {
          en: "Mark each action item as pending, done, or keep, so nothing gets lost between one retro and the next.",
          "pt-BR": "Marque cada item como pendente, concluído ou manter, para nada se perder entre uma retro e outra.",
        },
        image: {
          en: "/whatsnew/status-en.png",
          "pt-BR": "/whatsnew/status-pt-BR.png",
        },
      },
      {
        title: {
          en: "Let AI draft the action for you",
          "pt-BR": "Deixe a IA sugerir a ação",
        },
        description: {
          en: "Stuck turning a complaint into a plan? Click \"Suggest with AI\" on any improvement card and get a measurable action item in seconds.",
          "pt-BR": "Travou na hora de transformar uma reclamação em plano? Clique em \"Sugerir com IA\" em qualquer card de melhoria e ganhe um item de ação mensurável em segundos.",
        },
        image: {
          en: "/whatsnew/ai-en.png",
          "pt-BR": "/whatsnew/ai-pt-BR.png",
        },
      },
      {
        title: {
          en: "See who's behind every like",
          "pt-BR": "Veja quem curtiu cada card",
        },
        description: {
          en: "A card's vote count just got more personal. Hover over it to see exactly which teammates liked it.",
          "pt-BR": "A contagem de curtidas de um card ficou mais pessoal. Passe o mouse sobre ela e veja exatamente quem do time curtiu.",
        },
        image: {
          en: "/whatsnew/likes-en.png",
          "pt-BR": "/whatsnew/likes-pt-BR.png",
        },
      },
    ],
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
