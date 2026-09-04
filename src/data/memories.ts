export interface MemoryPhoto {
  src: string;
  filename: string;
  label: string;
  alt: string;
  width: number;
  height: number;
}

interface MemoryFile {
  filename: string;
  width: number;
  height: number;
  description: string;
}

const MEMORY_FILES: readonly MemoryFile[] = [
  {
    filename: "IMG_1784.PNG",
    width: 1200,
    height: 1800,
    description: "A pink photobooth strip showing a couple posing together with heart filters",
  },
  {
    filename: "IMG_1993.JPG",
    width: 3024,
    height: 4032,
    description: "A couple reclining in cinema seats and looking toward the camera",
  },
  {
    filename: "IMG_2006.JPG",
    width: 4032,
    height: 3024,
    description: "A couple taking a wide-angle cinema selfie while holding popcorn",
  },
  {
    filename: "IMG_2107.JPG",
    width: 4032,
    height: 3024,
    description: "A young man sitting at a warmly lit cafe table",
  },
  {
    filename: "IMG_3615.JPG",
    width: 3024,
    height: 4032,
    description: "A young man at a cafe table beneath red floral decorations",
  },
  {
    filename: "IMG_3636.JPG",
    width: 3088,
    height: 2316,
    description: "A close-up of a couple leaning their heads together",
  },
  {
    filename: "IMG_3723.JPG",
    width: 4032,
    height: 3024,
    description: "A couple taking a cafe selfie as one kisses the other's cheek beside a bouquet",
  },
  {
    filename: "IMG_3741.JPG",
    width: 4032,
    height: 3024,
    description: "A young man smiling from behind white roses and purple flowers",
  },
  {
    filename: "IMG_5372.JPG",
    width: 3088,
    height: 2316,
    description: "A couple posing together in a softly lit interior",
  },
  {
    filename: "IMG_5377.JPG",
    width: 1240,
    height: 1844,
    description: "A pink studio photobooth collage of a couple posing together",
  },
] as const;

function labelFromFilename(filename: string) {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/([A-Za-z])(?=\d)/g, "$1 ")
    .replace(/\s+/g, " ")
    .trim();
}

export const MEMORIES: readonly MemoryPhoto[] = MEMORY_FILES.map((photo) => {
  const label = labelFromFilename(photo.filename);
  return {
    ...photo,
    src: `/memories/${photo.filename}`,
    label,
    alt: `${photo.description} (${label})`,
  };
});
