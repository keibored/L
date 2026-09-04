import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";

interface ArchiveSectionProps {
  section: string;
  eyebrow: string;
  title: string;
  titleId: string;
  onBack: () => void;
  onEscape?: () => void;
  onWindowKeyDown?: (event: KeyboardEvent) => void;
  children: ReactNode;
}

function focusableElements(container: HTMLElement | null) {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], iframe, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute("aria-hidden"));
}

export function ArchiveSection({
  section,
  eyebrow,
  title,
  titleId,
  onBack,
  onEscape,
  onWindowKeyDown,
  children,
}: ArchiveSectionProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    backRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        if (onEscape) onEscape();
        else onBack();
        return;
      }

      onWindowKeyDown?.(event);
      if (event.defaultPrevented || event.key !== "Tab") return;

      const focusable = focusableElements(dialogRef.current);
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
  }, [onBack, onEscape, onWindowKeyDown]);

  const stopDialogPropagation = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") event.stopPropagation();
  };

  return (
    <div className={`archive-section archive-section--${section}`}>
      <div className="archive-section__backdrop" aria-hidden="true" />
      <section
        ref={dialogRef}
        className="archive-section__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={stopDialogPropagation}
      >
        <header className="archive-section__header">
          <button ref={backRef} type="button" className="archive-section__back" onClick={onBack}>
            <span aria-hidden="true">←</span> Back to booth
          </button>
          <div className="archive-section__heading">
            <p>{eyebrow}</p>
            <h2 id={titleId}>{title}</h2>
          </div>
          <button type="button" className="archive-section__close" onClick={onBack} aria-label={`Close ${title}`}>
            <span aria-hidden="true">×</span>
          </button>
        </header>
        <div className="archive-section__content">{children}</div>
      </section>
    </div>
  );
}
