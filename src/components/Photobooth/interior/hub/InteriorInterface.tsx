import { useCallback, useEffect, useState } from "react";
import { useExperience } from "../../../../state/ExperienceContext";

interface InteriorInterfaceProps {
  visible: boolean;
  onExit: () => void;
}

export function InteriorInterface({ visible, onExit }: InteriorInterfaceProps) {
  const {
    phase,
    visitedObjects,
    closeContent,
    recenterView,
  } = useExperience();
  const [menuOpen, setMenuOpen] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const interactive = phase === "inside";

  const handleExit = useCallback(() => {
    setMenuOpen(false);
    setControlsOpen(false);
    onExit();
  }, [onExit]);

  useEffect(() => {
    if (!visible) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.key !== "Escape") return;
      if (controlsOpen) {
        setControlsOpen(false);
        return;
      }
      if (menuOpen) {
        setMenuOpen(false);
        return;
      }
      if (phase === "content") {
        closeContent();
        return;
      }
      if (phase === "inside") handleExit();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [closeContent, controlsOpen, handleExit, menuOpen, phase, visible]);

  if (!visible) return null;

  return (
    <div
      className={`interior-interface interior-interface--${phase}`}
      aria-hidden={phase === "content" ? true : undefined}
      inert={phase === "content"}
    >
      <div className="interaction-counter" aria-live="polite">
        <span>INTERACTIONS</span>
        <strong>{visitedObjects.length} / 4</strong>
      </div>

      <div className="interior-menu">
        <button
          type="button"
          className="interior-menu__trigger"
          aria-label="Open booth menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <i />
          <i />
          <i />
        </button>
        {menuOpen && (
          <div className="interior-menu__panel">
            <button type="button" onClick={() => { recenterView(); setMenuOpen(false); }} disabled={!interactive}>
              Recenter view
            </button>
            <button type="button" onClick={() => { setControlsOpen(true); setMenuOpen(false); }}>
              Show controls
            </button>
            <button type="button" onClick={handleExit}>Exit booth</button>
          </div>
        )}
      </div>

      <button type="button" className="exit-booth" onClick={handleExit} disabled={phase === "exiting"}>
        <span aria-hidden="true">‹</span> EXIT BOOTH
      </button>

      <p className="interior-controls interior-controls--desktop" aria-hidden="true">
        DRAG TO LOOK&nbsp;&nbsp;·&nbsp;&nbsp;SCROLL TO ZOOM&nbsp;&nbsp;·&nbsp;&nbsp;CLICK TO OPEN
      </p>
      <p className="interior-controls interior-controls--mobile" aria-hidden="true">
        SWIPE TO LOOK&nbsp;&nbsp;·&nbsp;&nbsp;TAP TO OPEN
      </p>

      {controlsOpen && (
        <div className="controls-dialog" role="dialog" aria-modal="true" aria-labelledby="controls-title">
          <div>
            <button type="button" className="controls-dialog__close" onClick={() => setControlsOpen(false)} aria-label="Close controls">
              ×
            </button>
            <h2 id="controls-title">Inside the booth</h2>
            <p>Drag or swipe gently to look around. Scroll or pinch to zoom. Select a physical object to open its archive.</p>
          </div>
        </div>
      )}
    </div>
  );
}
