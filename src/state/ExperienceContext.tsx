import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type Phase = "loading" | "exterior" | "entering" | "interior" | "focused";

export type ObjectId = "memories" | "photostrip" | "letters" | "song" | "surprise";

interface ExperienceState {
  phase: Phase;
  focusedObject: ObjectId | null;
  hoveredObject: ObjectId | null;
  finishLoading: () => void;
  beginEntering: () => void;
  arriveInterior: () => void;
  focusObject: (id: ObjectId) => void;
  closeContent: () => void;
  setHoveredObject: (id: ObjectId | null) => void;
}

const ExperienceCtx = createContext<ExperienceState | null>(null);

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [focusedObject, setFocusedObject] = useState<ObjectId | null>(null);
  const [hoveredObject, setHoveredObject] = useState<ObjectId | null>(null);

  const finishLoading = useCallback(() => setPhase("exterior"), []);
  const beginEntering = useCallback(() => setPhase((p) => (p === "exterior" ? "entering" : p)), []);
  const arriveInterior = useCallback(() => setPhase("interior"), []);

  const focusObject = useCallback((id: ObjectId) => {
    setFocusedObject(id);
    setPhase("focused");
  }, []);

  const closeContent = useCallback(() => {
    setFocusedObject(null);
    setPhase("interior");
  }, []);

  const value = useMemo(
    () => ({
      phase,
      focusedObject,
      hoveredObject,
      finishLoading,
      beginEntering,
      arriveInterior,
      focusObject,
      closeContent,
      setHoveredObject,
    }),
    [phase, focusedObject, hoveredObject, finishLoading, beginEntering, arriveInterior, focusObject, closeContent],
  );

  return <ExperienceCtx.Provider value={value}>{children}</ExperienceCtx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- hook is tightly coupled to this context/provider
export function useExperience() {
  const ctx = useContext(ExperienceCtx);
  if (!ctx) throw new Error("useExperience must be used within ExperienceProvider");
  return ctx;
}
