import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type WheelEvent } from "react";
import type { Phase, ObjectId } from "../../../../state/ExperienceContext";
import { useExperience } from "../../../../state/ExperienceContext";
import { ARCHIVE_IMAGE_URL } from "./archiveAsset";
import "./InteriorArchiveHub.css";

interface HotspotDefinition {
  id: ObjectId;
  label: string;
  left: number;
  top: number;
  width: number;
  height: number;
  focusX: number;
}

const HOTSPOTS: HotspotDefinition[] = [
  { id: "memories", label: "Memories", left: 16.4, top: 43.4, width: 12.4, height: 31.7, focusX: 9 },
  { id: "letters", label: "Letters", left: 29.3, top: 43.4, width: 18.8, height: 31.7, focusX: 3 },
  { id: "playlist", label: "Playlist", left: 49, top: 43.4, width: 19.4, height: 31.7, focusX: -3 },
  { id: "story", label: "Our Story", left: 69, top: 43.4, width: 16.4, height: 31.7, focusX: -9 },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

interface InteriorArchiveHubProps {
  phase: Phase;
  opacity: number;
  imageReady: boolean;
  reducedMotion: boolean;
}

export function InteriorArchiveHub({ phase, opacity, imageReady, reducedMotion }: InteriorArchiveHubProps) {
  const {
    focusedObject,
    hoveredObject,
    visitedObjects,
    recenterToken,
    focusObject,
    setHoveredObject,
  } = useExperience();
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const drag = useRef<{ pointerId: number; x: number; y: number; startX: number; startY: number } | null>(null);
  const interactive = phase === "inside" && imageReady && opacity > 0.98;
  const focusedHotspot = useMemo(
    () => HOTSPOTS.find((hotspot) => hotspot.id === focusedObject),
    [focusedObject],
  );

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setParallax({ x: 0, y: 0 });
      setZoom(1);
    });
    return () => cancelAnimationFrame(frame);
  }, [recenterToken]);

  useEffect(() => {
    if (phase === "inside") return;
    const frame = requestAnimationFrame(() => {
      setParallax({ x: 0, y: 0 });
      setZoom(1);
    });
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!interactive || reducedMotion || (event.target as HTMLElement).closest("button")) return;
    drag.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      startX: parallax.x,
      startY: parallax.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!interactive || reducedMotion) return;
    if (drag.current?.pointerId === event.pointerId) {
      setParallax({
        x: clamp(drag.current.startX + (event.clientX - drag.current.x) * 0.06, -9, 9),
        y: clamp(drag.current.startY + (event.clientY - drag.current.y) * 0.05, -7, 7),
      });
      return;
    }
    if (event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    setParallax({ x: x * 12, y: y * 9 });
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointerId !== event.pointerId) return;
    drag.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!interactive || reducedMotion) return;
    event.preventDefault();
    setZoom((current) => clamp(current - event.deltaY * 0.00008, 1, 1.04));
  };

  const focusScale = focusedObject && (phase === "focusing" || phase === "content") ? 1.04 : zoom;
  const focusX = focusedHotspot && phase !== "inside" ? focusedHotspot.focusX : 0;
  const style = {
    opacity,
    "--archive-x": `${reducedMotion ? focusX : parallax.x + focusX}px`,
    "--archive-y": `${reducedMotion ? 0 : parallax.y + (focusedObject && phase !== "inside" ? -4 : 0)}px`,
    "--archive-scale": focusScale,
    "--archive-tilt-x": `${reducedMotion ? 0 : parallax.y * -0.025}deg`,
    "--archive-tilt-y": `${reducedMotion ? 0 : parallax.x * 0.025}deg`,
  } as CSSProperties;

  return (
    <div
      className={`archive-hub archive-hub--${phase}${interactive ? " archive-hub--interactive" : ""}`}
      style={style}
      aria-hidden={opacity < 0.98 ? "true" : undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
    >
      <div className="archive-hub__ambient" aria-hidden="true" />
      <div className="archive-hub__viewport">
        <div className="archive-hub__stage">
          <img
            className="archive-hub__image"
            src={ARCHIVE_IMAGE_URL}
            alt=""
            draggable={false}
            decoding="async"
          />
          {HOTSPOTS.map((hotspot) => {
            const hovered = hoveredObject === hotspot.id;
            const visited = visitedObjects.includes(hotspot.id);
            return (
              <button
                key={hotspot.id}
                type="button"
                className={`archive-hotspot${hovered ? " archive-hotspot--active" : ""}${visited ? " archive-hotspot--visited" : ""}`}
                style={{ left: `${hotspot.left}%`, top: `${hotspot.top}%`, width: `${hotspot.width}%`, height: `${hotspot.height}%` }}
                aria-label={`Open ${hotspot.label}`}
                aria-current={focusedObject === hotspot.id ? "true" : undefined}
                disabled={!interactive}
                onClick={() => focusObject(hotspot.id)}
                onPointerEnter={() => interactive && setHoveredObject(hotspot.id)}
                onPointerLeave={() => interactive && setHoveredObject(null)}
                onFocus={() => interactive && setHoveredObject(hotspot.id)}
                onBlur={() => setHoveredObject(null)}
              >
                <span className="archive-hotspot__hint">Click to open</span>
                <span className="archive-hotspot__indicator" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
