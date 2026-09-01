import { useEffect, useState, type ReactElement } from "react";
import { useExperience } from "../../state/ExperienceContext";
import "./ContentOverlay.css";

const PHOTO_TONES = ["#d9b3a3", "#c99a8c", "#e0c3ae", "#caa38f"];

function MemoriesContent() {
  return (
    <>
      <h2 className="overlay-title">♡ Our Memories</h2>
      <p className="overlay-sub">a handful of moments worth keeping</p>
      <div className="memories-grid">
        {PHOTO_TONES.map((tone, i) => (
          <div key={tone} className="memories-tile" style={{ background: tone }}>
            <span>{["First trip", "That evening", "Rainy day", "Home"][i]}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function PhotoStripContent() {
  return (
    <>
      <h2 className="overlay-title">♡ Photo Strip</h2>
      <p className="overlay-sub">a collection of moments we want to keep forever</p>
      <div className="photostrip-frame">
        {PHOTO_TONES.map((tone) => (
          <div key={tone} className="photostrip-tile" style={{ background: tone }} />
        ))}
      </div>
    </>
  );
}

function LettersContent() {
  return (
    <>
      <h2 className="overlay-title">♡ Letters</h2>
      <p className="overlay-sub">written and kept, just for you</p>
      <div className="letter-paper">
        <p>
          Every little moment we've shared has a place here — tucked away like a photograph
          in a drawer, waiting to be found again. This is just a small note to say: thank you
          for being part of the story.
        </p>
        <p className="letter-signoff">with love,{"\n"}always</p>
      </div>
    </>
  );
}

function SongContent() {
  const [playing, setPlaying] = useState(false);
  return (
    <>
      <h2 className="overlay-title">♡ Our Song</h2>
      <p className="overlay-sub">the one that plays in the background of everything</p>
      <div className="song-player">
        <button
          type="button"
          className="song-play"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? "❚❚" : "▶"}
        </button>
        <div className="song-meta">
          <p className="song-name">a little place for our memories</p>
          <p className="song-artist">snapshot — original score</p>
          <div className="song-progress">
            <div className={`song-progress-fill${playing ? " song-progress-fill--playing" : ""}`} />
          </div>
        </div>
      </div>
    </>
  );
}

function SurpriseContent() {
  const [revealed, setRevealed] = useState(false);
  return (
    <>
      <h2 className="overlay-title">♡ Little Surprise</h2>
      {!revealed ? (
        <button type="button" className="surprise-button" onClick={() => setRevealed(true)}>
          open it
        </button>
      ) : (
        <p className="overlay-sub surprise-reveal">
          you found it. this whole little booth was built with you in mind — every corner,
          every object, a small piece of us.
        </p>
      )}
    </>
  );
}

const CONTENT: Record<string, () => ReactElement> = {
  memories: MemoriesContent,
  photostrip: PhotoStripContent,
  letters: LettersContent,
  song: SongContent,
  surprise: SurpriseContent,
};

export function ContentOverlay() {
  const { phase, focusedObject, closeContent } = useExperience();
  const open = phase === "focused" && !!focusedObject;
  const [lastObject, setLastObject] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  if (focusedObject && focusedObject !== lastObject) {
    setLastObject(focusedObject);
  }
  if (open && !mounted) {
    setMounted(true);
  }

  useEffect(() => {
    if (open) return;
    const t = setTimeout(() => setMounted(false), 500);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeContent();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeContent]);

  if (!mounted || !lastObject) return null;

  const Content = CONTENT[lastObject];

  return (
    <div className={`overlay-backdrop${open ? " overlay-backdrop--open" : ""}`}>
      <div className="overlay-card">
        <button type="button" className="overlay-close" onClick={closeContent} aria-label="Close">
          ×
        </button>
        <Content />
      </div>
    </div>
  );
}
