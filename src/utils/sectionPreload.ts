import { STORY_CHAPTERS } from "../data/story";
import { previewImages } from "./imagePreload";
import { preloadFeaturedWindow } from "./memoryPreload";
import { publicAssetUrl } from "./publicAssetUrl";

/** Prepare display images during hover/focus and the camera's travel time. */
export function preloadSectionImages(section: string) {
  if (section === "memories") {
    preloadFeaturedWindow();
  } else if (section === "story") {
    STORY_CHAPTERS.slice(0, 2).forEach((chapter) => {
      void previewImages.preload(publicAssetUrl(chapter.image));
    });
  }
}
