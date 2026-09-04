import { useCallback, useEffect, useRef, useState } from "react";
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
  const [openingIndex, setOpeningIndex] = useState<number | null>(null);
  const openingTimer = useRef<number | null>(null);
  const letterCloseRef = useRef<HTMLButtonElement>(null);

  useEffect(() => () => {
    if (openingTimer.current !== null) window.clearTimeout(openingTimer.current);
  }, []);

  useEffect(() => {
    if (selectedIndex !== null) letterCloseRef.current?.focus();
  }, [selectedIndex]);

  const openLetter = useCallback((index: number) => {
    if (openingIndex !== null || selectedIndex !== null) return;
    setOpeningIndex(index);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    openingTimer.current = window.setTimeout(() => {
      setOpeningIndex(null);
      setSelectedIndex(index);
      openingTimer.current = null;
    }, reducedMotion ? 0 : 520);
  }, [openingIndex, selectedIndex]);

  const closeLetter = useCallback(() => {
    if (openingTimer.current !== null) {
      window.clearTimeout(openingTimer.current);
      openingTimer.current = null;
    }
    const returnIndex = selectedIndex ?? openingIndex;
    setOpeningIndex(null);
    setSelectedIndex(null);
    if (returnIndex !== null) {
      requestAnimationFrame(() => {
        document.querySelector<HTMLButtonElement>(`[data-letter-index="${returnIndex}"]`)?.focus();
      });
    }
  }, [openingIndex, selectedIndex]);

  const showPrevious = useCallback(() => {
    setSelectedIndex((current) => current === null ? current : wrappedLetterIndex(current - 1));
  }, []);

  const showNext = useCallback(() => {
    setSelectedIndex((current) => current === null ? current : wrappedLetterIndex(current + 1));
  }, []);

  const handleEscape = useCallback(() => {
    if (selectedIndex !== null || openingIndex !== null) closeLetter();
    else onBack();
  }, [closeLetter, onBack, openingIndex, selectedIndex]);

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
        {LETTERS.length === 0 ? (
          <div className="letters-empty">
            <div className="letters-empty__stack" aria-hidden="true">
              <span />
              <span />
              <div className="letters-envelope-art"><i /></div>
            </div>
            <p className="letters-empty__kicker">The correspondence box is waiting</p>
            <h3>Some letters take time to find their words.</h3>
            <p className="letters-empty__note">When they are ready, they will be kept here.</p>
          </div>
        ) : selectedLetter ? (
          <article className="letter-reader" aria-live="polite">
            <div className="letter-reader__envelope" aria-hidden="true"><span /></div>
            <div className="letter-sheet">
              <button ref={letterCloseRef} type="button" className="letter-sheet__close" onClick={closeLetter} aria-label="Close this letter">
                <span aria-hidden="true">×</span>
              </button>
              <p className="letter-sheet__date">{selectedLetter.date}</p>
              <h3>{selectedLetter.title}</h3>
              <div className="letter-sheet__body" tabIndex={0}>{selectedLetter.body}</div>
              {selectedLetter.signature && <p className="letter-sheet__signature">{selectedLetter.signature}</p>}
            </div>
            <nav className="letter-reader__navigation" aria-label="Letter navigation">
              <button type="button" onClick={showPrevious} aria-label="Read previous letter">← <span>Previous</span></button>
              <p>{(selectedIndex ?? 0) + 1} / {LETTERS.length}</p>
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
                  type="button"
                  data-letter-index={index}
                  className={`letter-envelope${openingIndex === index ? " letter-envelope--opening" : ""}`}
                  onClick={() => openLetter(index)}
                  disabled={openingIndex !== null}
                  aria-label={`Open ${letter.title}, dated ${letter.date}`}
                >
                  <span className="letter-envelope__flap" aria-hidden="true" />
                  <span className="letter-envelope__seal" aria-hidden="true">S</span>
                  <span className="letter-envelope__copy">
                    <i>{letter.date}</i>
                    <strong>{letter.title}</strong>
                    <small>{letter.preview}</small>
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
