import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { isDirectInteriorPreview } from "../utils/devScenePreview";

export type Phase = "loading" | "outside" | "entering" | "inside" | "focusing" | "content" | "exiting";

export type ObjectId = "memories" | "letters" | "playlist" | "story";

interface ExperienceState {
  phase: Phase;
  focusedObject: ObjectId | null;
  hoveredObject: ObjectId | null;
  visitedObjects: ObjectId[];
  recenterToken: number;
  finishLoading: () => void;
  beginEntering: () => void;
  arriveInside: () => void;
  focusObject: (id: ObjectId) => void;
  openContent: () => void;
  closeContent: () => void;
  finishRecenter: () => void;
  recenterView: () => void;
  beginExiting: () => void;
  finishExiting: () => void;
  setHoveredObject: (id: ObjectId | null) => void;
}

const ExperienceCtx = createContext<ExperienceState | null>(null);

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>(() => (isDirectInteriorPreview() ? "inside" : "loading"));
  const [focusedObject, setFocusedObject] = useState<ObjectId | null>(null);
  const [hoveredObject, setHoveredObject] = useState<ObjectId | null>(null);
  const [visitedObjects, setVisitedObjects] = useState<ObjectId[]>(() => {
    try {
      const saved = sessionStorage.getItem("snapshot-visited-stations");
      return saved ? (JSON.parse(saved) as ObjectId[]) : [];
    } catch {
      return [];
    }
  });
  const [recenterToken, setRecenterToken] = useState(0);

  useEffect(() => {
    try {
      sessionStorage.setItem("snapshot-visited-stations", JSON.stringify(visitedObjects));
    } catch {
      // Session storage is an enhancement; private browsing may disable it.
    }
  }, [visitedObjects]);

  const finishLoading = useCallback(() => setPhase("outside"), []);
  const beginEntering = useCallback(() => setPhase((p) => (p === "outside" ? "entering" : p)), []);
  const arriveInside = useCallback(() => setPhase((p) => (p === "entering" ? "inside" : p)), []);

  const focusObject = useCallback((id: ObjectId) => {
    setFocusedObject(id);
    setHoveredObject(null);
    setVisitedObjects((visited) => (visited.includes(id) ? visited : [...visited, id]));
    setPhase((p) => (p === "inside" ? "focusing" : p));
  }, []);

  const openContent = useCallback(() => setPhase((p) => (p === "focusing" ? "content" : p)), []);

  const closeContent = useCallback(() => {
    setFocusedObject(null);
    setPhase((p) => (p === "content" ? "focusing" : p));
  }, []);

  const finishRecenter = useCallback(() => setPhase((p) => (p === "focusing" ? "inside" : p)), []);
  const recenterView = useCallback(() => setRecenterToken((token) => token + 1), []);

  const beginExiting = useCallback(() => {
    setFocusedObject(null);
    setHoveredObject(null);
    setPhase((p) => (p === "inside" || p === "focusing" || p === "content" ? "exiting" : p));
  }, []);

  const finishExiting = useCallback(() => {
    setFocusedObject(null);
    setHoveredObject(null);
    setPhase((p) => (p === "exiting" ? "outside" : p));
  }, []);

  const value = useMemo(
    () => ({
      phase,
      focusedObject,
      hoveredObject,
      visitedObjects,
      recenterToken,
      finishLoading,
      beginEntering,
      arriveInside,
      focusObject,
      openContent,
      closeContent,
      finishRecenter,
      recenterView,
      beginExiting,
      finishExiting,
      setHoveredObject,
    }),
    [
      phase,
      focusedObject,
      hoveredObject,
      visitedObjects,
      recenterToken,
      finishLoading,
      beginEntering,
      arriveInside,
      focusObject,
      openContent,
      closeContent,
      finishRecenter,
      recenterView,
      beginExiting,
      finishExiting,
    ],
  );

  return <ExperienceCtx.Provider value={value}>{children}</ExperienceCtx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- hook is tightly coupled to this context/provider
export function useExperience() {
  const ctx = useContext(ExperienceCtx);
  if (!ctx) throw new Error("useExperience must be used within ExperienceProvider");
  return ctx;
}
