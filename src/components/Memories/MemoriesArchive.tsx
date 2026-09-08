import { memo, useEffect, type RefObject } from "react";
import { MEMORIES } from "../../data/memories";
import { fallBackToOriginal, publicAssetUrl } from "../../utils/publicAssetUrl";
import { originalImages } from "../../utils/imagePreload";

interface MemoriesArchiveProps {
  experienceRef: RefObject<HTMLDivElement | null>;
  onOpen: (photoIndex: number, returnTarget: HTMLElement) => void;
  reducedMotion: boolean;
}

export const MemoriesArchive = memo(function MemoriesArchive({
  experienceRef,
  onOpen,
  reducedMotion,
}: MemoriesArchiveProps) {
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
  }, [experienceRef, reducedMotion]);

  return (
    <>
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
                onClick={(event) => onOpen(index, event.currentTarget)}
                onPointerEnter={() => { void originalImages.preload(publicAssetUrl(photo.src)); }}
                onFocus={() => { void originalImages.preload(publicAssetUrl(photo.src)); }}
                aria-label={`Enlarge ${photo.alt}`}
              >
                <img
                  src={publicAssetUrl(photo.thumbnailSrc)}
                  width={photo.width}
                  height={photo.height}
                  alt={photo.alt}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  onError={(event) => fallBackToOriginal(event.currentTarget, photo.src)}
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
    </>
  );
});
