import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { MEMORIES, type MemoryPhoto } from "../../data/memories";
import "./MemoriesGallery.css";

interface MemoriesGalleryProps {
  onBack: () => void;
}

const ROTATIONS = [-3.2, 1.8, -1.1, 2.7, -2.2, 1.2, -2.8, 2.1, -1.5, 3];

function wrappedIndex(index: number) {
  return (index + MEMORIES.length) % MEMORIES.length;
}

function focusableElements(container: HTMLElement | null) {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute("aria-hidden"));
}

function orientation(photo: MemoryPhoto) {
  return photo.width > photo.height ? "landscape" : "portrait";
}

export function MemoriesGallery({ onBack }: MemoriesGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const viewerCloseRef = useRef<HTMLButtonElement>(null);
  const pendingPhotoFocus = useRef(false);

  const showPrevious = useCallback(() => {
    setActiveIndex((current) => wrappedIndex(current - 1));
  }, []);

  const showNext = useCallback(() => {
    setActiveIndex((current) => wrappedIndex(current + 1));
  }, []);

  const showPreviousInViewer = useCallback(() => {
    setViewerIndex((current) => (current === null ? current : wrappedIndex(current - 1)));
  }, []);

  const showNextInViewer = useCallback(() => {
    setViewerIndex((current) => (current === null ? current : wrappedIndex(current + 1)));
  }, []);

  const closeViewer = useCallback(() => {
    if (viewerIndex === null) return;
    setActiveIndex(viewerIndex);
    pendingPhotoFocus.current = true;
    setViewerIndex(null);
  }, [viewerIndex]);

  const visiblePhotos = useMemo(
    () => [
      { index: wrappedIndex(activeIndex - 1), position: "previous" },
      { index: activeIndex, position: "current" },
      { index: wrappedIndex(activeIndex + 1), position: "next" },
    ] as const,
    [activeIndex],
  );

  useEffect(() => {
    backButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (viewerIndex !== null) {
      viewerCloseRef.current?.focus();
      return;
    }
    if (!pendingPhotoFocus.current) return;
    pendingPhotoFocus.current = false;
    requestAnimationFrame(() => {
      galleryRef.current?.querySelector<HTMLButtonElement>(".memory-photo--current")?.focus();
    });
  }, [activeIndex, viewerIndex]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeDialog = viewerIndex === null ? galleryRef.current : viewerRef.current;

      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        if (viewerIndex !== null) closeViewer();
        else onBack();
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        event.stopPropagation();
        if (viewerIndex !== null) showPreviousInViewer();
        else showPrevious();
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        event.stopPropagation();
        if (viewerIndex !== null) showNextInViewer();
        else showNext();
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = focusableElements(activeDialog);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [closeViewer, onBack, showNext, showNextInViewer, showPrevious, showPreviousInViewer, viewerIndex]);

  const handleFilmstripKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    setActiveIndex(event.key === "Home" ? 0 : MEMORIES.length - 1);
  };

  const viewerPhoto = viewerIndex === null ? null : MEMORIES[viewerIndex];

  return (
    <div className={`memories-experience${viewerPhoto ? " memories-experience--viewing" : ""}`}>
      <div
        ref={galleryRef}
        className="memories-gallery"
        role="dialog"
        aria-modal={viewerPhoto ? undefined : true}
        aria-hidden={viewerPhoto ? true : undefined}
        aria-labelledby="memories-title"
      >
        <header className="memories-gallery__header">
          <button ref={backButtonRef} type="button" className="memories-back" onClick={onBack}>
            <span aria-hidden="true">←</span>
            Back to booth
          </button>
          <div className="memories-heading">
            <p>Snapshot archive · private collection</p>
            <h2 id="memories-title">Memories</h2>
            <span>Little moments, kept close.</span>
          </div>
          <p className="memories-count" aria-live="polite" aria-atomic="true">
            <span>{String(activeIndex + 1).padStart(2, "0")}</span>
            <i aria-hidden="true" />
            {String(MEMORIES.length).padStart(2, "0")}
          </p>
        </header>

        <div className="memories-stage">
          <span className="memories-stage__glow" aria-hidden="true" />
          {visiblePhotos.map(({ index, position }) => {
            const photo = MEMORIES[index];
            const photoStyle = { "--memory-rotation": `${ROTATIONS[index]}deg` } as CSSProperties;
            return (
              <button
                key={`${activeIndex}-${position}-${photo.filename}`}
                type="button"
                className={`memory-photo memory-photo--${position} memory-photo--${orientation(photo)}`}
                style={photoStyle}
                onClick={() => setViewerIndex(index)}
                aria-label={`Open ${photo.alt} in focused view`}
              >
                <span className="memory-photo__paper">
                  <img
                    src={photo.src}
                    width={photo.width}
                    height={photo.height}
                    alt={photo.alt}
                    loading={position === "current" ? "eager" : "lazy"}
                    decoding="async"
                    fetchPriority={position === "current" ? "high" : "low"}
                    draggable={false}
                  />
                  <span className="memory-photo__caption" aria-hidden="true">
                    <i>NO. {String(index + 1).padStart(2, "0")}</i>
                    {photo.label}
                  </span>
                </span>
              </button>
            );
          })}

          <button type="button" className="memories-nav memories-nav--previous" onClick={showPrevious} aria-label="Show previous memory">
            <span aria-hidden="true">←</span>
          </button>
          <button type="button" className="memories-nav memories-nav--next" onClick={showNext} aria-label="Show next memory">
            <span aria-hidden="true">→</span>
          </button>
        </div>

        <footer className="memories-gallery__footer">
          <div
            className="memories-filmstrip"
            role="group"
            aria-label="Choose a memory"
            onKeyDown={handleFilmstripKeyDown}
          >
            {MEMORIES.map((photo, index) => (
              <button
                key={photo.filename}
                type="button"
                className={index === activeIndex ? "memories-filmstrip__frame memories-filmstrip__frame--active" : "memories-filmstrip__frame"}
                onClick={() => setActiveIndex(index)}
                aria-label={`Show memory ${index + 1}: ${photo.label}`}
                aria-current={index === activeIndex ? "true" : undefined}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
              </button>
            ))}
          </div>
          <p>Use arrow keys or controls to browse · select a print to enlarge</p>
        </footer>
      </div>

      {viewerPhoto && viewerIndex !== null && (
        <div
          ref={viewerRef}
          className="memory-viewer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="memory-viewer-title"
        >
          <div className="memory-viewer__topbar">
            <p id="memory-viewer-title">
              Memory {String(viewerIndex + 1).padStart(2, "0")} <span>/ {viewerPhoto.label}</span>
            </p>
            <button ref={viewerCloseRef} type="button" className="memory-viewer__close" onClick={closeViewer} aria-label="Close focused photo">
              <span aria-hidden="true">×</span>
            </button>
          </div>

          <figure className={`memory-viewer__figure memory-viewer__figure--${orientation(viewerPhoto)}`}>
            <img
              key={viewerPhoto.src}
              src={viewerPhoto.src}
              width={viewerPhoto.width}
              height={viewerPhoto.height}
              alt={viewerPhoto.alt}
              decoding="async"
              draggable={false}
            />
            <figcaption>{viewerPhoto.alt}</figcaption>
          </figure>

          <div className="memory-viewer__navigation">
            <button type="button" onClick={showPreviousInViewer} aria-label="View previous photo">
              <span aria-hidden="true">←</span>
              <i>Previous</i>
            </button>
            <p aria-live="polite">{viewerIndex + 1} / {MEMORIES.length}</p>
            <button type="button" onClick={showNextInViewer} aria-label="View next photo">
              <i>Next</i>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
