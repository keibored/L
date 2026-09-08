import { MEMORIES } from "../data/memories";
import { STORY_CHAPTERS } from "../data/story";
import { previewImages } from "./imagePreload";
import { publicAssetUrl } from "./publicAssetUrl";

/** Prepare display images during hover/focus and the camera's travel time. */
export function preloadSectionImages(section: string) {
  if (section === "memories") {
    const featured = MEMORIES.filter((photo) => photo.featured);
    [featured.at(-1), featured[0], featured[1]].forEach((photo) => {
      if (photo) void previewImages.preload(publicAssetUrl(photo.thumbnailSrc));
    });
  } else if (section === "story") {
    STORY_CHAPTERS.slice(0, 2).forEach((chapter) => {
      void previewImages.preload(publicAssetUrl(chapter.image));
    });
  }
}
