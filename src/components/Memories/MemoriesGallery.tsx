import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MEMORIES, type MemoryPhoto } from "../../data/memories";
import { publicAssetUrl } from "../../utils/publicAssetUrl";
import { FeaturedMemoriesCarousel } from "./FeaturedMemoriesCarousel";
import { MemoriesArchive } from "./MemoriesArchive";
import "./MemoriesGallery.css";

interface MemoriesGalleryProps {
  onBack: () => void;
}

function wrappedIndex(index: number, length: number) {
  return (index + length) % length;
}

function orientation(photo: MemoryPhoto) {
  return photo.width > photo.height ? "landscape" : "portrait";
}

function focusableElements(container: HTMLElement | null) {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute("aria-hidden"));
}

export function MemoriesGallery({ onBack }: MemoriesGalleryProps) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const experienceRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const viewerCloseRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const pendingPhotoFocus = useRef(false);

  const showPreviousInViewer = useCallback(() => {
    setViewerIndex((current) => current === null ? current : wrappedIndex(current - 1, MEMORIES.length));
  }, []);

  const showNextInViewer = useCallback(() => {
    setViewerIndex((current) => current === null ? current : wrappedIndex(current + 1, MEMORIES.length));
  }, []);

  const openViewer = useCallback((index: number, returnTarget: HTMLElement) => {
    returnFocusRef.current = returnTarget;
    setViewerIndex(index);
  }, []);

  const closeViewer = useCallback(() => {
    if (viewerIndex === null) return;
    pendingPhotoFocus.current = true;
    setViewerIndex(null);
  }, [viewerIndex]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = () => setReducedMotion(media.matches);
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (viewerIndex !== null) {
      viewerCloseRef.current?.focus();
      return;
    }
    if (!pendingPhotoFocus.current) return;
    pendingPhotoFocus.current = false;
    requestAnimationFrame(() => returnFocusRef.current?.focus());
  }, [viewerIndex]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (viewerIndex !== null && event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeViewer();
        return;
      }

      if (viewerIndex !== null && event.key === "ArrowLeft") {
        event.preventDefault();
        event.stopPropagation();
        showPreviousInViewer();
        return;
      }

      if (viewerIndex !== null && event.key === "ArrowRight") {
        event.preventDefault();
        event.stopPropagation();
        showNextInViewer();
        return;
      }

      if (event.key !== "Tab") return;
      const activeDialog = viewerIndex === null ? experienceRef.current : viewerRef.current;
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
  }, [closeViewer, showNextInViewer, showPreviousInViewer, viewerIndex]);

  const viewerPhoto = viewerIndex === null ? null : MEMORIES[viewerIndex];

  return (
    <div
      ref={experienceRef}
      className={`memories-experience${viewerPhoto ? " memories-experience--viewing" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-hidden={viewerPhoto ? true : undefined}
      aria-labelledby="memories-title"
      inert={viewerPhoto ? true : undefined}
    >
      <FeaturedMemoriesCarousel
        experienceRef={experienceRef}
        onBack={onBack}
        onOpen={openViewer}
        reducedMotion={reducedMotion}
        viewerOpen={viewerPhoto !== null}
      />

      <MemoriesArchive
        experienceRef={experienceRef}
        onOpen={openViewer}
        reducedMotion={reducedMotion}
      />

      {viewerPhoto && viewerIndex !== null && createPortal(
        <div
          ref={viewerRef}
          className="memory-viewer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="memory-viewer-title"
        >
          <div className="memory-viewer__topbar">
            <p id="memory-viewer-title">
              Memory {String(viewerIndex + 1).padStart(2, "0")}
              {viewerPhoto.title && <span> / {viewerPhoto.title}</span>}
            </p>
            <button ref={viewerCloseRef} type="button" className="memory-viewer__close" onClick={closeViewer} aria-label="Close focused photo">
              <span aria-hidden="true">×</span>
            </button>
          </div>

          <figure className={`memory-viewer__figure memory-viewer__figure--${orientation(viewerPhoto)}`}>
            <img
              key={viewerPhoto.id}
              src={publicAssetUrl(viewerPhoto.src)}
              width={viewerPhoto.width}
              height={viewerPhoto.height}
              alt={viewerPhoto.alt}
              decoding="async"
              draggable={false}
            />
            <figcaption>{viewerPhoto.caption || viewerPhoto.alt}</figcaption>
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
        </div>,
        document.body,
      )}
    </div>
  );
}
