export interface StoryChapter {
  id: string;
  period?: string;
  title: string;
  description: string;
  image: string;
  alt: string;
  caption?: string;
}

/**
 * Keep each chapter's text and photo together here. Blank lines in descriptions
 * become separate paragraphs. Omit `period` and `caption` when none is supplied.
 * Image paths are relative to `public`; publicAssetUrl applies Vite's base URL.
 */
export const STORY_CHAPTERS: readonly StoryChapter[] = [
  {
    id: "how-it-started",
    title: "How It Started",
    description: `Meeting you was one of the best things that happened to me. I wasn’t looking for anything when we met, but little by little, I found myself looking forward to you—to our conversations, to spending time together, to staying up a little longer.

I don’t know exactly when you started meaning so much to me. I just know I’m glad we met, and that getting to know you is a part of my life I’ll always be grateful for.`,
    image: "memories/chapter/2c611d69-170c-4e9f-be23-af1c7778d4b6.jpg",
    alt: "Two people reflected together in a vehicle mirror",
  },
  {
    id: "a-place-to-rest",
    title: "A Place to Rest",
    description: `I’ve always been someone who thinks too much, but being with you made things feel a little quieter. I could stop worrying for a while and just enjoy being there with you.

After losing my mom, home hadn’t felt quite the same, even around family. With you, I found some of that comfort again—the feeling of belonging, of being able to rest. You felt like home to me, and I’ll always be grateful for that.`,
    image: "memories/chapter/8a53db9e-45f8-45c6-b503-d50d04c77fdc.jpg",
    alt: "A close-up selfie of two people sitting together",
  },
  {
    id: "without-you",
    title: "Without You",
    description: `I still want to tell you about my day. When something good happens, or when I’m sad or angry, I still wish I could talk to you. Not having you there has been hard, and I haven’t quite figured out what to do with all the things I used to share with you.

But I know things weren’t easy for you either. I was struggling to find happiness for myself, and I worried that it was becoming too much for you. I never wanted being with me to leave you feeling drained.

It hurts that we couldn’t make it work, but knowing you’re at peace means something to me. I’m still sad, and I still miss you. I’m just glad you’re doing okay.`,
    image: "memories/chapter/f57dfda2-9c7c-41e4-b358-789a58e3ec21.jpg",
    alt: "Two people reflected side by side in a window",
  },
];
