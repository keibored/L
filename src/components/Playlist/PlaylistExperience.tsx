import { useEffect, useState } from "react";
import { ArchiveSection } from "../ContentOverlay/ArchiveSection";
import "./PlaylistExperience.css";

interface PlaylistExperienceProps {
  onBack: () => void;
}

const PLAYLIST_ID = "5DvZbRYS7YNTKs4BEgK1dv";
const SPOTIFY_EMBED_URL = `https://open.spotify.com/embed/playlist/${PLAYLIST_ID}?utm_source=generator&theme=0`;
const SPOTIFY_PLAYLIST_URL = `https://open.spotify.com/playlist/${PLAYLIST_ID}`;

type PlayerStatus = "loading" | "ready" | "error";

export function PlaylistExperience({ onBack }: PlaylistExperienceProps) {
  const [status, setStatus] = useState<PlayerStatus>("loading");

  useEffect(() => {
    if (status !== "loading") return;
    const timeout = window.setTimeout(() => setStatus("error"), 12000);
    return () => window.clearTimeout(timeout);
  }, [status]);

  return (
    <ArchiveSection
      section="playlist"
      eyebrow="Listening room · official Spotify player"
      title="Playlist"
      titleId="playlist-title"
      onBack={onBack}
    >
      <div className="playlist-experience">
        <div className="playlist-console" aria-hidden="true">
          <div className="playlist-console__record"><i /></div>
          <div className="playlist-console__arm"><i /></div>
          <span className="playlist-console__light" />
        </div>

        <section className="playlist-player" aria-labelledby="playlist-player-title">
          <header className="playlist-player__header">
            <div>
              <p>Snapshot selections</p>
              <h3 id="playlist-player-title">Our Playlist</h3>
            </div>
            <span aria-hidden="true">SPOTIFY</span>
          </header>

          <div className="playlist-player__embed" aria-busy={status === "loading"}>
            {status === "loading" && (
              <div className="playlist-player__loading" role="status">
                <i aria-hidden="true" />
                <span>Preparing the player…</span>
              </div>
            )}
            {status === "error" && (
              <div className="playlist-player__fallback" role="status">
                <p>Spotify could not be displayed here.</p>
                <span>You can still open the playlist directly in Spotify.</span>
              </div>
            )}
            <iframe
              className={status === "ready" ? "playlist-player__iframe playlist-player__iframe--ready" : "playlist-player__iframe"}
              src={SPOTIFY_EMBED_URL}
              title="Spotify playlist player"
              width="100%"
              height="352"
              loading="lazy"
              tabIndex={status === "ready" ? 0 : -1}
              aria-hidden={status === "ready" ? undefined : true}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
              onLoad={() => setStatus("ready")}
              onError={() => setStatus("error")}
            />
          </div>

          <footer className="playlist-player__footer">
            <p>Playback begins only when you choose it.</p>
            <a href={SPOTIFY_PLAYLIST_URL} target="_blank" rel="noreferrer">Open in Spotify <span aria-hidden="true">↗</span></a>
          </footer>
        </section>
      </div>
    </ArchiveSection>
  );
}
