import { createPortal } from "react-dom";
import { useExperience } from "../../state/ExperienceContext";
import { LettersExperience } from "../Letters/LettersExperience";
import { MemoriesGallery } from "../Memories/MemoriesGallery";
import { PlaylistExperience } from "../Playlist/PlaylistExperience";
import { StoryExperience } from "../Story/StoryExperience";
import "./ContentOverlay.css";

export function ContentOverlay() {
  const { phase, focusedObject, closeContent } = useExperience();
  const open = phase === "content" && !!focusedObject;

  if (!open || !focusedObject) return null;

  if (focusedObject === "memories") {
    return <MemoriesGallery onBack={closeContent} />;
  }

  const experience = focusedObject === "letters"
    ? <LettersExperience onBack={closeContent} />
    : focusedObject === "playlist"
      ? <PlaylistExperience onBack={closeContent} />
      : <StoryExperience onBack={closeContent} />;

  return createPortal(experience, document.body);
}
