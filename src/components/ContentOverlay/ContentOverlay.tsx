import { useEffect, useRef } from "react";
import { useExperience } from "../../state/ExperienceContext";
import { STATION_BY_ID } from "../Photobooth/interior/hub/stationData";
import { MemoriesGallery } from "../Memories/MemoriesGallery";
import "./ContentOverlay.css";

export function ContentOverlay() {
  const { phase, focusedObject, closeContent } = useExperience();
  const closeButton = useRef<HTMLButtonElement>(null);
  const open = phase === "content" && !!focusedObject;

  useEffect(() => {
    if (open) closeButton.current?.focus();
  }, [open]);

  if (!open || !focusedObject) return null;

  if (focusedObject === "memories") {
    return <MemoriesGallery onBack={closeContent} />;
  }

  const station = STATION_BY_ID[focusedObject];

  return (
    <div className="overlay-backdrop overlay-backdrop--open">
      <div className="overlay-card" role="dialog" aria-modal="true" aria-labelledby="archive-panel-title">
        <button
          ref={closeButton}
          type="button"
          className="overlay-close"
          onClick={closeContent}
          aria-label="Close archive panel"
        >
          ×
        </button>
        <p className="overlay-kicker">SNAPSHOT ARCHIVE / PHASE 01</p>
        <h2 id="archive-panel-title" className="overlay-title">{station.label}</h2>
        <p className="overlay-sub">{station.message}</p>
        <div className="overlay-placeholder" aria-hidden="true">
          <i />
          <span>THE ARCHIVE WILL OPEN HERE</span>
          <i />
        </div>
      </div>
    </div>
  );
}
