import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { MEMORIES, type MemoryPhoto } from "../../data/memories";
import "./MemoriesGallery.css";

interface MemoriesGalleryProps {
  onBack: () => void;
}

const FEATURED_MEMORIES = MEMORIES.filter((photo) => photo.featured);
const ROTATIONS = [-3.2, 1.8, -1.1, 2.7, -2.2, 1.2, -2.8, 2.1, -1.5, 3];
const CAROUSEL_TRANSITION_MS = 1050;
const AUTO_ADVANCE_DELAY_MS = 4450;
const decodedPhotos = new Map<string, Promise<void>>();

function wrappedIndex(index: number, length: number) {
  return (index + length) % length;
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

function preloadPhoto(photo: MemoryPhoto) {
  const cached = decodedPhotos.get(photo.id);
  if (cached) return cached;

  const image = new Image();
  image.decoding = "async";
  image.src = photo.src;
  const decoded = image.decode().catch(() => undefined);
  decodedPhotos.set(photo.id, decoded);
  return decoded;
}

function featuredWindow(index: number) {
  if (FEATURED_MEMORIES.length === 0) return [];
  return [
    FEATURED_MEMORIES[wrappedIndex(index - 1, FEATURED_MEMORIES.length)],
    FEATURED_MEMORIES[index],
    FEATURED_MEMORIES[wrappedIndex(index + 1, FEATURED_MEMORIES.length)],
  ];
}

function relativeCarouselOffset(index: number, activeIndex: number) {
  const length = FEATURED_MEMORIES.length;
  const forward = wrappedIndex(index - activeIndex, length);
  if (forward === 0) return 0;
  return forward <= length / 2 ? forward : forward - length;
}

function carouselSlot(offset: number) {
  if (offset === 0) return "current";
  if (offset === -1) return "previous";
  if (offset === 1) return "next";
  return offset < 0 ? "before" : "after";
}

function memoryIndex(photo: MemoryPhoto) {
  return MEMORIES.findIndex((memory) => memory.id === photo.id);
}

export function MemoriesGallery({ onBack }: MemoriesGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hasCarouselFocus, setHasCarouselFocus] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [documentVisible, setDocumentVisible] = useState(() => !document.hidden);
  const [featuredVisible, setFeaturedVisible] = useState(true);
  const [manualResetToken, setManualResetToken] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [loadedFeaturedIds, setLoadedFeaturedIds] = useState<Set<string>>(
    () => new Set(featuredWindow(0).map((photo) => photo.id)),
  );

  const experienceRef = useRef<HTMLDivElement>(null);
  const featuredRef = useRef<HTMLElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const viewerCloseRef = useRef<HTMLButtonElement>(null);
  const activeIndexRef = useRef(0);
  const transitionLockedRef = useRef(false);
  const transitionTimerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const swipeStartX = useRef<number | null>(null);
  const didSwipe = useRef(false);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const pendingPhotoFocus = useRef(false);

  const ensureFeaturedWindow = useCallback(async (index: number) => {
    const photos = featuredWindow(index);
    await Promise.all(photos.map(preloadPhoto));
    if (!mountedRef.current) return;
    setLoadedFeaturedIds((current) => {
      const next = new Set(current);
      photos.forEach((photo) => next.add(photo.id));
      return next;
    });
  }, []);

  const navigateTo = useCallback(async (targetIndex: number, manual = true) => {
    if (FEATURED_MEMORIES.length < 2 || transitionLockedRef.current) return;
    const target = wrappedIndex(targetIndex, FEATURED_MEMORIES.length);
    if (manual) setManualResetToken((token) => token + 1);
    if (target === activeIndexRef.current) return;

    transitionLockedRef.current = true;
    setIsTransitioning(true);
    await ensureFeaturedWindow(target);
    if (!mountedRef.current) return;

    activeIndexRef.current = target;
    setActiveIndex(target);
    if (transitionTimerRef.current !== null) window.clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = window.setTimeout(() => {
      transitionLockedRef.current = false;
      setIsTransitioning(false);
      transitionTimerRef.current = null;
    }, reducedMotion ? 1 : CAROUSEL_TRANSITION_MS);
  }, [ensureFeaturedWindow, reducedMotion]);

  const showPrevious = useCallback(() => {
    void navigateTo(activeIndexRef.current - 1);
  }, [navigateTo]);

  const showNext = useCallback(() => {
    void navigateTo(activeIndexRef.current + 1);
  }, [navigateTo]);

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
    backButtonRef.current?.focus();
    experienceRef.current?.scrollTo({ top: 0 });
    void ensureFeaturedWindow(0);
    return () => {
      mountedRef.current = false;
      if (transitionTimerRef.current !== null) window.clearTimeout(transitionTimerRef.current);
    };
  }, [ensureFeaturedWindow]);

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
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = () => setReducedMotion(media.matches);
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const handleVisibility = () => setDocumentVisible(!document.hidden);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    const featured = featuredRef.current;
    if (!featured || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setFeaturedVisible(entry.isIntersecting),
      { root: experienceRef.current, threshold: 0.25 },
    );
    observer.observe(featured);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = experienceRef.current;
    if (!root) return;
    const entries = Array.from(root.querySelectorAll<HTMLElement>(".memory-archive__entry"));
    if (reducedMotion || typeof IntersectionObserver === "undefined") {
      entries.forEach((entry) => entry.classList.add("memory-archive__entry--visible"));
      return;
    }

    const observer = new IntersectionObserver((observed) => {
      observed.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("memory-archive__entry--visible");
        observer.unobserve(entry.target);
      });
    }, { root, threshold: 0.14 });
    entries.forEach((entry) => observer.observe(entry));
    return () => observer.disconnect();
  }, [reducedMotion]);

  const autoPaused = reducedMotion
    || isHovered
    || hasCarouselFocus
    || isDragging
    || isTransitioning
    || viewerIndex !== null
    || !documentVisible
    || !featuredVisible;

  useEffect(() => {
    if (autoPaused || FEATURED_MEMORIES.length < 2) return;
    const timer = window.setTimeout(() => {
      void navigateTo(activeIndexRef.current + 1, false);
    }, AUTO_ADVANCE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [activeIndex, autoPaused, manualResetToken, navigateTo]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeDialog = viewerIndex === null ? experienceRef.current : viewerRef.current;

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
    void navigateTo(event.key === "Home" ? 0 : FEATURED_MEMORIES.length - 1);
  };

  const handleCarouselBlur = (event: ReactFocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHasCarouselFocus(false);
  };

  const handleCarouselFocus = (event: ReactFocusEvent<HTMLDivElement>) => {
    setHasCarouselFocus(event.target.matches(":focus-visible"));
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch") return;
    event.currentTarget.setPointerCapture(event.pointerId);
    swipeStartX.current = event.clientX;
    didSwipe.current = false;
    setIsDragging(true);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch" || swipeStartX.current === null) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const distance = event.clientX - swipeStartX.current;
    swipeStartX.current = null;
    setIsDragging(false);
    if (Math.abs(distance) < 45) return;
    didSwipe.current = true;
    if (distance > 0) showPrevious();
    else showNext();
  };

  const handlePointerCancel = () => {
    swipeStartX.current = null;
    didSwipe.current = false;
    setIsDragging(false);
  };

  const handlePhotoClick = (
    event: ReactMouseEvent<HTMLButtonElement>,
    photo: MemoryPhoto,
    index: number,
    offset: number,
  ) => {
    if (didSwipe.current) {
      didSwipe.current = false;
      return;
    }
    if (transitionLockedRef.current) return;
    if (offset === 0) openViewer(memoryIndex(photo), event.currentTarget);
    else void navigateTo(index);
  };

  const viewerPhoto = viewerIndex === null ? null : MEMORIES[viewerIndex];
  const currentPhoto = FEATURED_MEMORIES[activeIndex];
  const carouselProgressKey = `${currentPhoto?.id ?? "empty"}-${autoPaused}-${manualResetToken}`;

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
      <section ref={featuredRef} className="memories-gallery" aria-label="Featured memories">
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
            {String(FEATURED_MEMORIES.length).padStart(2, "0")}
          </p>
        </header>

        <div
          className="memories-carousel"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onFocusCapture={handleCarouselFocus}
          onBlurCapture={handleCarouselBlur}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        >
          <div className="memories-stage">
            <span className="memories-stage__glow" aria-hidden="true" />
            {FEATURED_MEMORIES.map((photo, index) => {
              const offset = relativeCarouselOffset(index, activeIndex);
              const slot = carouselSlot(offset);
              const visible = Math.abs(offset) <= 1;
              const photoStyle = {
                "--memory-rotation": `${ROTATIONS[memoryIndex(photo) % ROTATIONS.length]}deg`,
              } as CSSProperties;
              return (
                <button
                  key={photo.id}
                  type="button"
                  className={`memory-photo memory-photo--${slot} memory-photo--${orientation(photo)}`}
                  style={photoStyle}
                  onClick={(event) => handlePhotoClick(event, photo, index, offset)}
                  aria-label={offset === 0 ? `Open ${photo.alt} in focused view` : `Move ${photo.alt} to the featured position`}
                  aria-hidden={!visible ? true : undefined}
                  aria-current={offset === 0 ? "true" : undefined}
                  tabIndex={visible ? 0 : -1}
                >
                  <span className="memory-photo__paper">
                    {loadedFeaturedIds.has(photo.id) && (
                      <img
                        src={photo.src}
                        width={photo.width}
                        height={photo.height}
                        alt={photo.alt}
                        loading={offset === 0 ? "eager" : "lazy"}
                        decoding="async"
                        fetchPriority={offset === 0 ? "high" : "low"}
                        draggable={false}
                      />
                    )}
                    <span className="memory-photo__caption" aria-hidden="true">
                      <i>NO. {String(memoryIndex(photo) + 1).padStart(2, "0")}</i>
                      {photo.caption && <span>{photo.caption}</span>}
                    </span>
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              className="memories-nav memories-nav--previous"
              onClick={showPrevious}
              disabled={isTransitioning}
              aria-label="Show previous memory"
            >
              <span aria-hidden="true">←</span>
            </button>
            <button
              type="button"
              className="memories-nav memories-nav--next"
              onClick={showNext}
              disabled={isTransitioning}
              aria-label="Show next memory"
            >
              <span aria-hidden="true">→</span>
            </button>
          </div>

          <footer className="memories-gallery__footer">
            <div
              className="memories-filmstrip"
              role="group"
              aria-label="Choose a featured memory"
              onKeyDown={handleFilmstripKeyDown}
            >
              {FEATURED_MEMORIES.map((photo, index) => (
                <button
                  key={photo.id}
                  type="button"
                  className={index === activeIndex ? "memories-filmstrip__frame memories-filmstrip__frame--active" : "memories-filmstrip__frame"}
                  onClick={() => void navigateTo(index)}
                  disabled={isTransitioning}
                  aria-label={`Show featured memory ${index + 1}`}
                  aria-current={index === activeIndex ? "true" : undefined}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                </button>
              ))}
            </div>
            <div className={`memories-autoplay${autoPaused ? " memories-autoplay--paused" : ""}`} aria-hidden="true">
              <span key={carouselProgressKey} />
            </div>
            <p>Use arrow keys, swipe, or controls to browse · select a print to enlarge</p>
          </footer>
        </div>

        <button
          type="button"
          className="memories-scroll-cue"
          onClick={() => experienceRef.current?.querySelector("#memories-archive")?.scrollIntoView({
            behavior: reducedMotion ? "auto" : "smooth",
          })}
        >
          <span>Scroll to explore</span><i aria-hidden="true" />
        </button>
      </section>

      <section id="memories-archive" className="memory-archive" aria-labelledby="memory-archive-title">
        <header className="memory-archive__header">
          <p>Chronological collection</p>
          <h3 id="memory-archive-title">The Archive</h3>
          <span>Every photograph remains part of the record.</span>
        </header>

        <div className="memory-archive__timeline">
          {MEMORIES.map((photo, index) => (
            <article key={photo.id} className="memory-archive__entry">
              <button
                type="button"
                className="memory-archive__photo"
                onClick={(event) => openViewer(index, event.currentTarget)}
                aria-label={`Enlarge ${photo.alt}`}
              >
                <img
                  src={photo.src}
                  width={photo.width}
                  height={photo.height}
                  alt={photo.alt}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />
              </button>
              <div className="memory-archive__copy">
                <p className="memory-archive__number">Archive no. {String(index + 1).padStart(2, "0")}</p>
                {photo.date && <p className="memory-archive__date">{photo.date}</p>}
                {photo.title && <h4>{photo.title}</h4>}
                {photo.description && <p className="memory-archive__description">{photo.description}</p>}
                {photo.caption && <p className="memory-archive__caption">{photo.caption}</p>}
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="memories-closing">
        <i aria-hidden="true" />
        <p>The archive continues.</p>
        <span>Snapshot · private collection</span>
      </footer>

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
              src={viewerPhoto.src}
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
