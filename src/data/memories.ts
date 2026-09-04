export interface MemoryPhoto {
  id: string;
  src: string;
  thumbnailSrc: string;
  filename: string;
  title: string;
  date: string;
  description: string;
  caption?: string;
  alt: string;
  featured: boolean;
  width: number;
  height: number;
}

/**
 * Edit `title`, `date`, `description`, and `caption` on each photo below.
 * Empty fields are hidden cleanly by the UI, so no invented relationship
 * details appear on the website. Keep `src`, `thumbnailSrc`, `width`, and
 * `height` matched to the files in `public/memories`. The display-sized
 * thumbnail is used in the carousel and archive; the original `src` is always
 * used by the focused viewer. Set `featured: false` to keep a
 * photo in the journal while removing it from the opening carousel.
 */
export const MEMORIES: readonly MemoryPhoto[] = [
  {
    id: "memory-01",
    src: "memories/IMG_1784.PNG",
    thumbnailSrc: "memories/thumbnails/IMG_1784.jpg",
    filename: "IMG_1784.PNG",
    title: "",
    date: "",
    description: "",
    caption: "",
    alt: "A pink photobooth strip showing a couple posing together with heart filters",
    featured: true,
    width: 1200,
    height: 1800,
  },
  {
    id: "memory-02",
    src: "memories/IMG_1993.JPG",
    thumbnailSrc: "memories/thumbnails/IMG_1993.jpg",
    filename: "IMG_1993.JPG",
    title: "",
    date: "",
    description: "",
    caption: "",
    alt: "A couple reclining in cinema seats and looking toward the camera",
    featured: true,
    width: 3024,
    height: 4032,
  },
  {
    id: "memory-03",
    src: "memories/IMG_2006.JPG",
    thumbnailSrc: "memories/thumbnails/IMG_2006.jpg",
    filename: "IMG_2006.JPG",
    title: "",
    date: "",
    description: "",
    caption: "",
    alt: "A couple taking a wide-angle cinema selfie while holding popcorn",
    featured: true,
    width: 4032,
    height: 3024,
  },
  {
    id: "memory-04",
    src: "memories/IMG_2107.JPG",
    thumbnailSrc: "memories/thumbnails/IMG_2107.jpg",
    filename: "IMG_2107.JPG",
    title: "",
    date: "",
    description: "",
    caption: "",
    alt: "A young man sitting at a warmly lit cafe table",
    featured: true,
    width: 3024,
    height: 4032,
  },
  {
    id: "memory-05",
    src: "memories/IMG_3615.JPG",
    thumbnailSrc: "memories/thumbnails/IMG_3615.jpg",
    filename: "IMG_3615.JPG",
    title: "",
    date: "",
    description: "",
    caption: "",
    alt: "A young man at a cafe table beneath red floral decorations",
    featured: true,
    width: 3024,
    height: 4032,
  },
  {
    id: "memory-06",
    src: "memories/IMG_3636.JPG",
    thumbnailSrc: "memories/thumbnails/IMG_3636.jpg",
    filename: "IMG_3636.JPG",
    title: "",
    date: "",
    description: "",
    caption: "",
    alt: "A close-up of a couple leaning their heads together",
    featured: true,
    width: 2316,
    height: 3088,
  },
  {
    id: "memory-07",
    src: "memories/IMG_3723.JPG",
    thumbnailSrc: "memories/thumbnails/IMG_3723.jpg",
    filename: "IMG_3723.JPG",
    title: "",
    date: "",
    description: "",
    caption: "",
    alt: "A couple taking a cafe selfie as one kisses the other's cheek beside a bouquet",
    featured: true,
    width: 4032,
    height: 3024,
  },
  {
    id: "memory-08",
    src: "memories/IMG_3741.JPG",
    thumbnailSrc: "memories/thumbnails/IMG_3741.jpg",
    filename: "IMG_3741.JPG",
    title: "",
    date: "",
    description: "",
    caption: "",
    alt: "A young man smiling from behind white roses and purple flowers",
    featured: true,
    width: 3024,
    height: 4032,
  },
  {
    id: "memory-09",
    src: "memories/IMG_5372.JPG",
    thumbnailSrc: "memories/thumbnails/IMG_5372.jpg",
    filename: "IMG_5372.JPG",
    title: "",
    date: "",
    description: "",
    caption: "",
    alt: "A couple posing together in a softly lit interior",
    featured: true,
    width: 2316,
    height: 3088,
  },
  {
    id: "memory-10",
    src: "memories/IMG_5377.JPG",
    thumbnailSrc: "memories/thumbnails/IMG_5377.jpg",
    filename: "IMG_5377.JPG",
    title: "",
    date: "",
    description: "",
    caption: "",
    alt: "A pink studio photobooth collage of a couple posing together",
    featured: true,
    width: 1240,
    height: 1844,
  },
];
