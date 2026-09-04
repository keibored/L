export interface Letter {
  id: string;
  title: string;
  date: string;
  preview: string;
  body: string;
  signature?: string;
}

interface EditableLetter extends Letter {
  enabled: boolean;
}

/**
 * Add real letters to this list and set `enabled: true` when each one is ready.
 * The entry below is an editing template only. It is deliberately disabled, so
 * none of its instructional copy appears in the finished Letters experience.
 */
const LETTER_ENTRIES: readonly EditableLetter[] = [
  {
    id: "template-letter",
    enabled: false,
    title: "[Template] Letter title",
    date: "[Month Day, Year]",
    preview: "[Write a short, honest preview of the letter here.]",
    body: "[Replace this instruction with the complete letter. Paragraph breaks are preserved.]",
    signature: "[Optional signature]",
  },
];

export const LETTERS: readonly Letter[] = LETTER_ENTRIES
  .filter((entry) => entry.enabled)
  .map((entry) => ({
    id: entry.id,
    title: entry.title,
    date: entry.date,
    preview: entry.preview,
    body: entry.body,
    signature: entry.signature,
  }));
