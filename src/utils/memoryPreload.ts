import { MEMORIES } from "../data/memories";
import { previewImages } from "./imagePreload";
import { publicAssetUrl } from "./publicAssetUrl";

export const FEATURED_MEMORIES = MEMORIES.filter((photo) => photo.featured);

/** Decode only the five thumbnails used by the carousel, nearest first. */
export function preloadFeaturedWindow(index = 0) {
  const length = FEATURED_MEMORIES.length;
  if (length === 0) return;
  [0, -1, 1, -2, 2].forEach((offset) => {
    const photo = FEATURED_MEMORIES[((index + offset) % length + length) % length];
    void previewImages.preload(publicAssetUrl(photo.thumbnailSrc));
  });
}
