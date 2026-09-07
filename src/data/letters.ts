export interface Letter {
  id: string;
  title: string;
  body: string;
}

/**
 * Edit each envelope's title and full letter here. Blank lines in the body
 * become separate paragraphs in the reader.
 */
export const LETTERS: readonly Letter[] = [
  {
    id: "thank-you-for-being-there",
    title: "Thank you for being there",
    body: `I’m really glad I got to know you. When I think about us, I remember the conversations I wanted to stay awake for and how much I looked forward to spending time with you. Those things meant a lot to me.

I overthink so much, but when I was with you, I felt at peace. After losing my mom, I’d struggled to feel at home anywhere, even with family. Being with you gave me some of that feeling again. I don’t know if I ever explained how much that meant to me.

Thank you for the time we had, for talking with me, and for becoming someone I could share my days with. Even with how things are now, I’m still grateful that I met you.`,
  },
  {
    id: "what-i-didnt-know-how-to-say",
    title: "What I didn’t know how to say",
    body: `Sometimes I didn’t know how to explain what I was feeling. I just knew I was sad, or worried, or thinking too much, and you were the person I wanted to talk to.

I was still trying to understand a lot of things about myself. Looking back, I wish I’d been able to tell you what was going on in a way you could understand better. I’m sorry for the times that was hard on you.

I worried that my sadness was becoming too much for you. I never wanted you to feel like you had to make everything okay for me. I cared about how you were feeling too, even when I wasn’t good at showing it.

I don’t have the right words for everything yet. But I wanted you to know that being with you meant so much to me, even when I struggled to express it.`,
  },
  {
    id: "for-the-days-ahead",
    title: "For the days ahead",
    body: `I still wish I could tell you about my day. When something makes me happy, or when I’m having a hard time, I miss being able to talk to you. I’m still getting used to that.

I won’t pretend I’m okay with everything yet. I feel lost sometimes, and it hurts to accept that things are different now. But I don’t want you to feel drained anymore. Knowing you’re at peace matters to me, even while I’m still trying to find that for myself.

I hope you have days you look forward to and people you feel comfortable sharing them with. I hope the things you’re working toward turn out well.

I wish we could have worked out. But I’m still glad I met you. Take care of yourself. I mean that.`,
  },
];
