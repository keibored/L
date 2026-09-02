import { useCallback, useEffect, useMemo, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent, type WheelEvent } from "react";
import type { Phase, ObjectId } from "../../../../state/ExperienceContext";
import { useExperience } from "../../../../state/ExperienceContext";
import { ARCHIVE_IMAGE_URL } from "./archiveAsset";
import "./InteriorArchiveHub.css";

interface CropDefinition {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface HotspotDefinition extends CropDefinition {
  id: ObjectId;
  label: string;
  focusX: number;
  object: CropDefinition;
}

const HOTSPOTS: HotspotDefinition[] = [
  {
    id: "memories",
    label: "Memories",
    left: 16.4,
    top: 43.4,
    width: 12.4,
    height: 31.7,
    focusX: 9,
    object: { left: 18.5, top: 46.5, width: 8.5, height: 18.2 },
  },
  {
    id: "letters",
    label: "Letters",
    left: 29.3,
    top: 43.4,
    width: 18.8,
    height: 31.7,
    focusX: 3,
    object: { left: 33.5, top: 51.7, width: 12.8, height: 12.4 },
  },
  {
    id: "playlist",
    label: "Playlist",
    left: 49,
    top: 43.4,
    width: 19.4,
    height: 31.7,
    focusX: -3,
    object: { left: 51.2, top: 49.8, width: 11.5, height: 17.5 },
  },
  {
    id: "story",
    label: "Our Story",
    left: 69,
    top: 43.4,
    width: 16.4,
    height: 31.7,
    focusX: -9,
    object: { left: 70.5, top: 49.1, width: 11.5, height: 18.8 },
  },
];

const VIEW_PROPERTIES = [
  "--archive-bg-x",
  "--archive-bg-y",
  "--archive-mid-x",
  "--archive-mid-y",
  "--archive-fg-x",
  "--archive-fg-y",
  "--archive-scale",
  "--archive-tilt-x",
  "--archive-tilt-y",
] as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function cropStyle(crop: CropDefinition, parent?: CropDefinition) {
  const localLeft = parent ? ((crop.left - parent.left) / parent.width) * 100 : 0;
  const localTop = parent ? ((crop.top - parent.top) / parent.height) * 100 : 0;
  const localWidth = parent ? (crop.width / parent.width) * 100 : 100;
  const localHeight = parent ? (crop.height / parent.height) * 100 : 100;
  return {
    left: `${localLeft}%`,
    top: `${localTop}%`,
    width: `${localWidth}%`,
    height: `${localHeight}%`,
    "--crop-size-x": `${10000 / crop.width}%`,
    "--crop-size-y": `${10000 / crop.height}%`,
    "--crop-position-x": `${(crop.left / (100 - crop.width)) * 100}%`,
    "--crop-position-y": `${(crop.top / (100 - crop.height)) * 100}%`,
  } as CSSProperties;
}

interface InteriorArchiveHubProps {
  phase: Phase;
  imageReady: boolean;
  reducedMotion: boolean;
}

export function InteriorArchiveHub({ phase, imageReady, reducedMotion }: InteriorArchiveHubProps) {
  const {
    focusedObject,
    hoveredObject,
    visitedObjects,
    recenterToken,
    focusObject,
    setHoveredObject,
  } = useExperience();
  const rootRef = useRef<HTMLDivElement>(null);
  const view = useRef({ x: 0, y: 0, zoom: 1 });
  const appliedRecenterToken = useRef(recenterToken);
  const drag = useRef<{ pointerId: number; x: number; y: number; startX: number; startY: number } | null>(null);
  const interactive = phase === "inside" && imageReady;
  const focusedHotspot = useMemo(
    () => HOTSPOTS.find((hotspot) => hotspot.id === focusedObject),
    [focusedObject],
  );

  const applyView = useCallback((x: number, y: number, zoom: number) => {
    const root = rootRef.current;
    if (!root) return;
    const focusX = focusedHotspot && phase !== "inside" ? focusedHotspot.focusX : 0;
    const focusY = focusedObject && phase !== "inside" ? -3 : 0;
    const safeX = reducedMotion ? 0 : x;
    const safeY = reducedMotion ? 0 : y;
    root.style.setProperty("--archive-bg-x", `${safeX * 0.12 + focusX * 0.45}px`);
    root.style.setProperty("--archive-bg-y", `${safeY * 0.1 + focusY * 0.45}px`);
    root.style.setProperty("--archive-mid-x", `${safeX * 0.34 + focusX}px`);
    root.style.setProperty("--archive-mid-y", `${safeY * 0.28 + focusY}px`);
    root.style.setProperty("--archive-fg-x", `${safeX * 0.55 + focusX * 1.08}px`);
    root.style.setProperty("--archive-fg-y", `${safeY * 0.44 + focusY * 1.08}px`);
    // Focus is a real Three.js camera move. This scale is reserved for the
    // small idle wheel gesture and must never impersonate camera navigation.
    root.style.setProperty("--archive-scale", `${zoom}`);
    root.style.setProperty("--archive-tilt-x", `${safeY * -0.008}deg`);
    root.style.setProperty("--archive-tilt-y", `${safeX * 0.008}deg`);
  }, [focusedHotspot, focusedObject, phase, reducedMotion]);

  const resetView = useCallback((removeInlineValues = false) => {
    view.current = { x: 0, y: 0, zoom: 1 };
    drag.current = null;
    const root = rootRef.current;
    if (!root) return;
    if (removeInlineValues) {
      VIEW_PROPERTIES.forEach((property) => root.style.removeProperty(property));
      return;
    }
    applyView(0, 0, 1);
  }, [applyView]);

  useEffect(() => {
    if (appliedRecenterToken.current === recenterToken) return;
    appliedRecenterToken.current = recenterToken;
    resetView();
  }, [recenterToken, resetView]);

  useEffect(() => {
    if (phase === "exiting") {
      drag.current = null;
      return;
    }
    if (phase === "inside" || phase === "focusing" || phase === "content") {
      applyView(view.current.x, view.current.y, view.current.zoom);
      return;
    }
    resetView(true);
  }, [applyView, phase, resetView]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!interactive || reducedMotion || (event.target as HTMLElement).closest("button")) return;
    drag.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      startX: view.current.x,
      startY: view.current.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!interactive || reducedMotion) return;
    let x: number;
    let y: number;
    if (drag.current?.pointerId === event.pointerId) {
      x = clamp(drag.current.startX + (event.clientX - drag.current.x) * 0.035, -6, 6);
      y = clamp(drag.current.startY + (event.clientY - drag.current.y) * 0.03, -4.5, 4.5);
    } else {
      if (event.pointerType !== "mouse") return;
      const bounds = event.currentTarget.getBoundingClientRect();
      x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 8;
      y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 6;
    }
    view.current.x = x;
    view.current.y = y;
    applyView(x, y, view.current.zoom);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointerId !== event.pointerId) return;
    drag.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!interactive || reducedMotion) return;
    event.preventDefault();
    view.current.zoom = clamp(view.current.zoom - event.deltaY * 0.00006, 1, 1.025);
    applyView(view.current.x, view.current.y, view.current.zoom);
  };

  return (
    <div
      ref={rootRef}
      className={`archive-hub archive-hub--${phase}${interactive ? " archive-hub--interactive" : ""}`}
      aria-hidden={!interactive ? "true" : undefined}
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
            loading="eager"
            fetchPriority="high"
          />
          <div className="archive-depth-layer archive-depth-layer--center" aria-hidden="true" />
          <div className="archive-depth-layer archive-depth-layer--console" aria-hidden="true" />
          <div className="archive-depth-layer archive-depth-layer--curtain-left" aria-hidden="true" />
          <div className="archive-depth-layer archive-depth-layer--curtain-right" aria-hidden="true" />
          <div className="archive-ceiling-falloff" aria-hidden="true" />
          <span className="archive-lens-reflection" aria-hidden="true" />
          <span className="archive-camera-indicator" aria-hidden="true" />
          {HOTSPOTS.map((hotspot) => {
            const hovered = hoveredObject === hotspot.id;
            const visited = visitedObjects.includes(hotspot.id);
            return (
              <button
                key={hotspot.id}
                type="button"
                className={`archive-hotspot archive-hotspot--${hotspot.id}${hovered ? " archive-hotspot--active" : ""}${visited ? " archive-hotspot--visited" : ""}`}
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
                <span className="archive-hotspot__art" style={cropStyle(hotspot)} aria-hidden="true" />
                <span className="archive-hotspot__object" style={cropStyle(hotspot.object, hotspot)} aria-hidden="true" />
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
