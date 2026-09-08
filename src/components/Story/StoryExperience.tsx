import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { STORY_CHAPTERS } from "../../data/story";
import { publicAssetUrl } from "../../utils/publicAssetUrl";
import { previewImages } from "../../utils/imagePreload";
import { ArchiveSection } from "../ContentOverlay/ArchiveSection";
import "./StoryExperience.css";

interface StoryExperienceProps {
  onBack: () => void;
}

export function StoryExperience({ onBack }: StoryExperienceProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const swipeStartX = useRef<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const restoreContentFocus = useRef(false);

  useLayoutEffect(() => {
    if (restoreContentFocus.current) contentRef.current?.focus({ preventScroll: true });
    restoreContentFocus.current = false;
  }, [activeIndex]);

  useEffect(() => {
    STORY_CHAPTERS.slice(Math.max(0, activeIndex - 1), activeIndex + 2).forEach((chapter) => {
      void previewImages.preload(publicAssetUrl(chapter.image));
    });
  }, [activeIndex]);

  const showPrevious = useCallback(() => {
    setActiveIndex((current) => Math.max(0, current - 1));
  }, []);

  const showNext = useCallback(() => {
    setActiveIndex((current) => Math.min(STORY_CHAPTERS.length - 1, current + 1));
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      restoreContentFocus.current = document.activeElement === contentRef.current;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showPrevious();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      showNext();
    }
  }, [showNext, showPrevious]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === "touch") swipeStartX.current = event.clientX;
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType !== "touch" || swipeStartX.current === null) return;
    const distance = event.clientX - swipeStartX.current;
    swipeStartX.current = null;
    if (Math.abs(distance) < 45) return;
    if (distance > 0) showPrevious();
    else showNext();
  };

  const chapter = STORY_CHAPTERS[activeIndex];

  return (
    <ArchiveSection
      section="story"
      eyebrow="A private chronology · chapter by chapter"
      title="Our Story"
      titleId="story-title"
      onBack={onBack}
      onWindowKeyDown={handleKeyDown}
    >
      <div className="story-experience">
        <div className="story-progress" aria-label={`Chapter ${activeIndex + 1} of ${STORY_CHAPTERS.length}`}>
          <p><span>{String(activeIndex + 1).padStart(2, "0")}</span> / {String(STORY_CHAPTERS.length).padStart(2, "0")}</p>
          <div>
            {STORY_CHAPTERS.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={index === activeIndex ? "story-progress__step story-progress__step--active" : "story-progress__step"}
                onClick={() => setActiveIndex(index)}
                aria-label={`View chapter ${index + 1}: ${item.title}`}
                aria-current={index === activeIndex ? "step" : undefined}
              />
            ))}
          </div>
        </div>

        <article
          key={chapter.id}
          className="story-chapter"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => { swipeStartX.current = null; }}
        >
          <div className="story-chapter__binding" aria-hidden="true"><i /><i /><i /></div>
          <div ref={contentRef} className="story-chapter__content" tabIndex={0} role="region" aria-labelledby={`story-chapter-${chapter.id}`}>
            <p className="story-chapter__number">Chapter {String(activeIndex + 1).padStart(2, "0")}</p>
            {chapter.period && <p className="story-chapter__period">{chapter.period}</p>}
            <h3 id={`story-chapter-${chapter.id}`}>{chapter.title}</h3>
            <span className="story-chapter__rule" aria-hidden="true" />
            <div className="story-chapter__description">
              {chapter.description.split(/\r?\n\r?\n/).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </div>
          <figure className="story-chapter__image">
            <img src={publicAssetUrl(chapter.image)} width={1536} height={2048} alt={chapter.alt} loading="eager" decoding="async" />
            {chapter.caption && <figcaption>{chapter.caption}</figcaption>}
          </figure>
        </article>

        <nav className="story-navigation" aria-label="Story chapter navigation">
          <button type="button" onClick={showPrevious} disabled={activeIndex === 0} aria-label="View previous chapter">
            <span aria-hidden="true">←</span><i>Previous</i>
          </button>
          <p>Swipe or use arrow keys</p>
          <button type="button" onClick={showNext} disabled={activeIndex === STORY_CHAPTERS.length - 1} aria-label="View next chapter">
            <i>Next</i><span aria-hidden="true">→</span>
          </button>
        </nav>
      </div>
    </ArchiveSection>
  );
}
