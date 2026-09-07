import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { LETTERS } from "../../data/letters";
import { ArchiveSection } from "../ContentOverlay/ArchiveSection";
import "./LettersExperience.css";

interface LettersExperienceProps {
  onBack: () => void;
}

function wrappedLetterIndex(index: number) {
  return (index + LETTERS.length) % LETTERS.length;
}

export function LettersExperience({ onBack }: LettersExperienceProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const letterBackRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const envelopeRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const returnIndexRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (selectedIndex === null) {
      if (returnIndexRef.current !== null) {
        envelopeRefs.current[returnIndexRef.current]?.focus();
        returnIndexRef.current = null;
      }
      return;
    }

    letterBackRef.current?.focus({ preventScroll: true });
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(sheetRef.current, { y: 8, opacity: 0.7 }, {
        y: 0,
        opacity: 1,
        duration: 0.24,
        ease: "power2.out",
        clearProps: "transform,opacity",
      });
    });
    return () => media.revert();
  }, [selectedIndex]);

  const closeLetter = useCallback(() => {
    returnIndexRef.current = selectedIndex;
    setSelectedIndex(null);
  }, [selectedIndex]);

  const showPrevious = useCallback(() => {
    setSelectedIndex((current) => current === null ? current : wrappedLetterIndex(current - 1));
  }, []);

  const showNext = useCallback(() => {
    setSelectedIndex((current) => current === null ? current : wrappedLetterIndex(current + 1));
  }, []);

  const handleEscape = useCallback(() => {
    if (selectedIndex !== null) closeLetter();
    else onBack();
  }, [closeLetter, onBack, selectedIndex]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (selectedIndex === null) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showPrevious();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      showNext();
    }
  }, [selectedIndex, showNext, showPrevious]);

  const selectedLetter = selectedIndex === null ? null : LETTERS[selectedIndex];

  return (
    <ArchiveSection
      section="letters"
      eyebrow="Private correspondence · kept with care"
      title="Letters"
      titleId="letters-title"
      onBack={onBack}
      onEscape={handleEscape}
      onWindowKeyDown={handleKeyDown}
    >
      <div className="letters-experience">
        {selectedLetter ? (
          <article className="letter-reader" aria-labelledby="letter-title">
            <div className="letter-reader__envelope" aria-hidden="true"><span /></div>
            <div ref={sheetRef} className="letter-sheet">
              <button ref={letterBackRef} type="button" className="letter-sheet__back" onClick={closeLetter}>
                <span aria-hidden="true">←</span> Back to envelopes
              </button>
              <div key={selectedLetter.id} className="letter-sheet__content" tabIndex={0} role="region" aria-labelledby="letter-title">
                <h3 id="letter-title">{selectedLetter.title}</h3>
                <div className="letter-sheet__body">
                  {selectedLetter.body.split(/\r?\n\r?\n/).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>
              </div>
            </div>
            <nav className="letter-reader__navigation" aria-label="Letter navigation">
              <button type="button" onClick={showPrevious} aria-label="Read previous letter">← <span>Previous</span></button>
              <p aria-live="polite">{(selectedIndex ?? 0) + 1} / {LETTERS.length}</p>
              <button type="button" onClick={showNext} aria-label="Read next letter"><span>Next</span> →</button>
            </nav>
          </article>
        ) : (
          <div className="letters-collection">
            <p className="letters-collection__intro">Choose an envelope to unfold its letter.</p>
            <div className="letters-grid">
              {LETTERS.map((letter, index) => (
                <button
                  key={letter.id}
                  ref={(element) => { envelopeRefs.current[index] = element; }}
                  type="button"
                  data-letter-index={index}
                  className="letter-envelope"
                  onClick={() => setSelectedIndex(index)}
                  aria-label={`Open ${letter.title}`}
                >
                  <span className="letter-envelope__flap" aria-hidden="true" />
                  <span className="letter-envelope__seal" aria-hidden="true">S</span>
                  <span className="letter-envelope__copy">
                    <strong>{letter.title}</strong>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </ArchiveSection>
  );
}
