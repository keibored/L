import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import { MEMORIES, type MemoryPhoto } from "../../data/memories";
import { fallBackToOriginal, publicAssetUrl } from "../../utils/publicAssetUrl";

interface FeaturedMemoriesCarouselProps {
  experienceRef: RefObject<HTMLDivElement | null>;
  onBack: () => void;
  onOpen: (photoIndex: number, returnTarget: HTMLElement) => void;
  reducedMotion: boolean;
  viewerOpen: boolean;
}

const FEATURED_MEMORIES = MEMORIES.filter((photo) => photo.featured);
const MEMORY_INDEX_BY_ID = new Map(MEMORIES.map((photo, index) => [photo.id, index]));
const ROTATIONS = [-3.2, 1.8, -1.1, 2.7, -2.2, 1.2, -2.8, 2.1, -1.5, 3];
const CAROUSEL_TRANSITION_MS = 700;
const AUTO_ADVANCE_DELAY_MS = 4450;
const decodedPhotos = new Map<string, Promise<void>>();

function wrappedIndex(index: number, length: number) {
  return (index + length) % length;
}

function orientation(photo: MemoryPhoto) {
  return photo.width > photo.height ? "landscape" : "portrait";
}

function preloadPhoto(photo: MemoryPhoto) {
  const cached = decodedPhotos.get(photo.id);
  if (cached) return cached;

  const image = new Image();
  image.decoding = "async";
  const decoded = (async () => {
    for (const path of [photo.thumbnailSrc, photo.src]) {
      image.src = publicAssetUrl(path);
      try {
        await image.decode();
        return;
      } catch {
        // The second attempt is the original image; a display <img> also has
        // its own one-shot fallback in case preload support differs.
      }
    }
  })();
  decodedPhotos.set(photo.id, decoded);
  return decoded;
}

function preloadFeaturedWindow(index: number) {
  if (FEATURED_MEMORIES.length === 0) return;
  [-1, 0, 1].forEach((offset) => {
    void preloadPhoto(FEATURED_MEMORIES[wrappedIndex(index + offset, FEATURED_MEMORIES.length)]);
  });
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

export const FeaturedMemoriesCarousel = memo(function FeaturedMemoriesCarousel({
  experienceRef,
  onBack,
  onOpen,
  reducedMotion,
  viewerOpen,
}: FeaturedMemoriesCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hasCarouselFocus, setHasCarouselFocus] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [documentVisible, setDocumentVisible] = useState(() => !document.hidden);
  const [featuredVisible, setFeaturedVisible] = useState(true);
  const [manualResetToken, setManualResetToken] = useState(0);

  const featuredRef = useRef<HTMLElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const activeIndexRef = useRef(0);
  const transitionTimerRef = useRef<number | null>(null);
  const autoAdvanceTimerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const swipeStartX = useRef<number | null>(null);
  const didSwipe = useRef(false);

  const visibleCards = useMemo(() => FEATURED_MEMORIES
    .map((photo, index) => ({
      index,
      offset: relativeCarouselOffset(index, activeIndex),
      photo,
    }))
    .filter(({ offset }) => Math.abs(offset) <= 2), [activeIndex]);

  const finishTransition = useCallback(() => {
    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    if (mountedRef.current) setIsTransitioning(false);
  }, []);

  const navigate = useCallback((
    resolveTarget: (current: number) => number,
    manual = true,
  ) => {
    if (FEATURED_MEMORIES.length < 2) return;

    if (manual && autoAdvanceTimerRef.current !== null) {
      window.clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }

    const target = wrappedIndex(resolveTarget(activeIndexRef.current), FEATURED_MEMORIES.length);
    if (target === activeIndexRef.current) {
      if (manual) setManualResetToken((token) => token + 1);
      return;
    }

    activeIndexRef.current = target;
    setIsTransitioning(true);
    setActiveIndex((current) => wrappedIndex(resolveTarget(current), FEATURED_MEMORIES.length));

    if (transitionTimerRef.current !== null) window.clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = window.setTimeout(
      finishTransition,
      reducedMotion ? 1 : CAROUSEL_TRANSITION_MS,
    );
  }, [finishTransition, reducedMotion]);

  const navigateTo = useCallback((targetIndex: number, manual = true) => {
    navigate(() => targetIndex, manual);
  }, [navigate]);

  const navigateBy = useCallback((delta: number, manual = true) => {
    navigate((current) => current + delta, manual);
  }, [navigate]);

  const showPrevious = useCallback(() => navigateBy(-1), [navigateBy]);
  const showNext = useCallback(() => navigateBy(1), [navigateBy]);

  useEffect(() => {
    mountedRef.current = true;
    backButtonRef.current?.focus();
    experienceRef.current?.scrollTo({ top: 0 });
    return () => {
      mountedRef.current = false;
      if (transitionTimerRef.current !== null) window.clearTimeout(transitionTimerRef.current);
      if (autoAdvanceTimerRef.current !== null) window.clearTimeout(autoAdvanceTimerRef.current);
    };
  }, [experienceRef]);

  useEffect(() => {
    preloadFeaturedWindow(activeIndex);
  }, [activeIndex]);

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
  }, [experienceRef]);

  const autoPaused = reducedMotion
    || isHovered
    || hasCarouselFocus
    || isDragging
    || isTransitioning
    || viewerOpen
    || !documentVisible
    || !featuredVisible;

  useEffect(() => {
    if (autoAdvanceTimerRef.current !== null) {
      window.clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    if (autoPaused || FEATURED_MEMORIES.length < 2) return;

    autoAdvanceTimerRef.current = window.setTimeout(() => {
      autoAdvanceTimerRef.current = null;
      navigateBy(1, false);
    }, AUTO_ADVANCE_DELAY_MS);

    return () => {
      if (autoAdvanceTimerRef.current !== null) {
        window.clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }
    };
  }, [activeIndex, autoPaused, manualResetToken, navigateBy]);

  useEffect(() => {
    if (viewerOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onBack();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        event.stopPropagation();
        showPrevious();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        event.stopPropagation();
        showNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [onBack, showNext, showPrevious, viewerOpen]);

  const handleFilmstripKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    navigateTo(event.key === "Home" ? 0 : FEATURED_MEMORIES.length - 1);
  };

  const handleCarouselBlur = (event: ReactFocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHasCarouselFocus(false);
  };

  const handleCarouselFocus = (event: ReactFocusEvent<HTMLDivElement>) => {
    setHasCarouselFocus(event.target.matches(":focus-visible"));
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch") return;
    swipeStartX.current = event.clientX;
    didSwipe.current = false;
    setIsDragging(true);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch" || swipeStartX.current === null) return;
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
    if (offset === 0) onOpen(MEMORY_INDEX_BY_ID.get(photo.id) ?? 0, event.currentTarget);
    else if (Math.abs(offset) === 1) navigateTo(index);
  };

  const currentPhoto = FEATURED_MEMORIES[activeIndex];
  const carouselProgressKey = `${currentPhoto?.id ?? "empty"}-${autoPaused}-${manualResetToken}`;

  return (
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
          {visibleCards.map(({ photo, index, offset }) => {
            const slot = carouselSlot(offset);
            const interactive = Math.abs(offset) <= 1;
            const memoryIndex = MEMORY_INDEX_BY_ID.get(photo.id) ?? 0;
            const photoStyle = {
              "--memory-rotation": `${ROTATIONS[memoryIndex % ROTATIONS.length]}deg`,
            } as CSSProperties;
            return (
              <button
                key={photo.id}
                type="button"
                className={`memory-photo memory-photo--${slot} memory-photo--${orientation(photo)}`}
                style={photoStyle}
                onClick={(event) => handlePhotoClick(event, photo, index, offset)}
                onTransitionEnd={(event) => {
                  if (offset === 0 && event.target === event.currentTarget && event.propertyName === "transform") {
                    finishTransition();
                  }
                }}
                aria-label={offset === 0 ? `Open ${photo.alt} in focused view` : `Move ${photo.alt} to the featured position`}
                aria-hidden={!interactive ? true : undefined}
                aria-current={offset === 0 ? "true" : undefined}
                tabIndex={interactive ? 0 : -1}
              >
                <span className="memory-photo__paper">
                  <img
                    src={publicAssetUrl(photo.thumbnailSrc)}
                    width={photo.width}
                    height={photo.height}
                    alt={photo.alt}
                    loading={Math.abs(offset) <= 1 ? "eager" : "lazy"}
                    decoding="async"
                    fetchPriority={offset === 0 ? "high" : "low"}
                    draggable={false}
                    onError={(event) => fallBackToOriginal(event.currentTarget, photo.src)}
                  />
                  <span className="memory-photo__caption" aria-hidden="true">
                    <i>NO. {String(memoryIndex + 1).padStart(2, "0")}</i>
                    {photo.caption && <span>{photo.caption}</span>}
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
          <div className="memories-filmstrip" role="group" aria-label="Choose a featured memory" onKeyDown={handleFilmstripKeyDown}>
            {FEATURED_MEMORIES.map((photo, index) => (
              <button
                key={photo.id}
                type="button"
                className={index === activeIndex ? "memories-filmstrip__frame memories-filmstrip__frame--active" : "memories-filmstrip__frame"}
                onClick={() => navigateTo(index)}
                onPointerEnter={() => preloadFeaturedWindow(index)}
                onFocus={() => preloadFeaturedWindow(index)}
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
  );
});
