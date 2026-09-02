import { useCallback, useEffect, useRef, useState, type MutableRefObject, type RefObject } from "react";
import type { ObjectId, Phase } from "../state/ExperienceContext";
import type { SceneMode } from "../components/Photobooth/cameraWaypoints";
import { isDirectInteriorPreview } from "../utils/devScenePreview";

export type CameraState =
  | "outside"
  | "entering"
  | "inside"
  | "focusing"
  | "focused"
  | "returning"
  | "exiting";

export type CameraCommandKind = "enter" | "focus" | "return" | "exit";

export interface CameraCommand {
  id: number;
  kind: CameraCommandKind;
  objectId: ObjectId | null;
}

export interface TransitionValues {
  active: boolean;
  state: CameraState;
  direction: "idle" | "entering" | "exiting";
  /** One authoritative booth coordinate: 0 is outside and 1 is inside. */
  progress: number;
  interiorBlend: number;
  archiveOpacity: number;
  command: CameraCommand | null;
}

export type TransitionRef = MutableRefObject<TransitionValues>;

interface TransitionDirectorOptions {
  phase: Phase;
  beginEntering: () => void;
  arriveInside: () => void;
  openContent: () => void;
  finishRecenter: () => void;
  beginExiting: () => void;
  finishExiting: () => void;
  curtainProgressRef: MutableRefObject<number>;
  shellRef: RefObject<HTMLDivElement | null>;
}

export function useTransitionDirector({
  phase,
  beginEntering,
  arriveInside,
  openContent,
  finishRecenter,
  beginExiting,
  finishExiting,
  curtainProgressRef,
  shellRef,
}: TransitionDirectorOptions) {
  const directInterior = isDirectInteriorPreview();
  const [sceneMode, setSceneMode] = useState<SceneMode>(() => (directInterior ? "interior" : "exterior"));
  const transitionRef = useRef<TransitionValues>({
    active: false,
    state: directInterior ? "inside" : "outside",
    direction: "idle",
    progress: directInterior ? 1 : 0,
    interiorBlend: directInterior ? 1 : 0,
    archiveOpacity: directInterior ? 1 : 0,
    command: null,
  });
  const inputLocked = useRef(false);
  const requestId = useRef(0);

  const issueCommand = useCallback((kind: CameraCommandKind, objectId: ObjectId | null = null) => {
    requestId.current += 1;
    const state: CameraState = kind === "enter"
      ? "entering"
      : kind === "focus"
        ? "focusing"
        : kind === "return"
          ? "returning"
          : "exiting";
    transitionRef.current.active = true;
    transitionRef.current.state = state;
    transitionRef.current.direction = kind === "enter" ? "entering" : kind === "exit" ? "exiting" : "idle";
    transitionRef.current.command = { id: requestId.current, kind, objectId };
    inputLocked.current = true;
    document.body.style.cursor = "auto";
    shellRef.current?.classList.add("canvas-shell--transition-active");
  }, [shellRef]);

  const enterBooth = useCallback(() => {
    if (inputLocked.current || phase !== "outside") return;
    issueCommand("enter");
    beginEntering();
  }, [beginEntering, issueCommand, phase]);

  const focusCamera = useCallback((objectId: ObjectId) => {
    if (transitionRef.current.state === "focusing" && transitionRef.current.command?.objectId === objectId) return;
    issueCommand("focus", objectId);
  }, [issueCommand]);

  const returnCamera = useCallback(() => {
    if (transitionRef.current.state === "returning") return;
    issueCommand("return");
  }, [issueCommand]);

  const exitBooth = useCallback(() => {
    if (inputLocked.current || (phase !== "inside" && phase !== "focusing" && phase !== "content")) return;
    issueCommand("exit");
    beginExiting();
  }, [beginExiting, issueCommand, phase]);

  const completeCameraTransition = useCallback((id: number) => {
    const current = transitionRef.current;
    if (!current.active || current.command?.id !== id) return;
    const kind = current.command.kind;
    current.active = false;
    current.direction = "idle";
    current.command = null;
    shellRef.current?.classList.remove("canvas-shell--transition-active");
    inputLocked.current = false;

    if (kind === "enter") {
      current.state = "inside";
      setSceneMode("interior");
      arriveInside();
    } else if (kind === "focus") {
      current.state = "focused";
      openContent();
    } else if (kind === "return") {
      current.state = "inside";
      finishRecenter();
    } else {
      current.state = "outside";
      setSceneMode("exterior");
      finishExiting();
    }
  }, [arriveInside, finishExiting, finishRecenter, openContent, shellRef]);

  useEffect(() => {
    const initial = directInterior ? 1 : 0;
    curtainProgressRef.current = initial;
    shellRef.current?.style.setProperty("--archive-opacity", String(initial));
  }, [curtainProgressRef, directInterior, shellRef]);

  useEffect(() => () => {
    requestId.current += 1;
    transitionRef.current.active = false;
    transitionRef.current.command = null;
    shellRef.current?.classList.remove("canvas-shell--transition-active");
    document.body.style.cursor = "auto";
  }, [shellRef]);

  return {
    sceneMode,
    transitionRef,
    enterBooth,
    focusCamera,
    returnCamera,
    exitBooth,
    completeCameraTransition,
  };
}
