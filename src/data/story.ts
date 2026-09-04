export interface StoryChapter {
  id: string;
  period: string;
  title: string;
  description: string;
  image?: string;
  caption?: string;
}

/**
 * Replace the instructional descriptions below with the real story. Dates,
 * names, and events are intentionally not guessed. To add an image, copy it to
 * `public/story` and use a public path such as `/story/chapter-one.jpg`.
 */
export const STORY_CHAPTERS: readonly StoryChapter[] = [
  {
    id: "how-it-started",
    period: "ADD DATE OR PERIOD",
    title: "How It Started",
    description: "Replace this note with the true beginning of the relationship: the time, place, and details you want to remember.",
  },
  {
    id: "the-moments-between",
    period: "ADD DATE OR PERIOD",
    title: "The Moments Between",
    description: "Replace this note with the real moments that shaped the relationship. Add only memories that belong to your story.",
  },
  {
    id: "how-it-ended",
    period: "ADD DATE OR PERIOD",
    title: "How It Ended",
    description: "Replace this note with the ending in your own words. No event, conversation, or feeling has been assumed for you.",
  },
];
