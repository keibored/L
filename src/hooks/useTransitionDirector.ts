import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import type { Phase } from "../state/ExperienceContext";
import type { SceneMode } from "../components/Photobooth/cameraWaypoints";
import { isCurtainDebug, isDirectInteriorPreview, isExitDebug, isTransitionDebug } from "../utils/devScenePreview";

const ENTRY_DURATION = 2.6;
const REDUCED_ENTRY_DURATION = 0.48;
const DEBUG_ENTRY_DURATION = 6;
const INTERIOR_HANDOFF_PROGRESS = 2.1 / ENTRY_DURATION;
const EXIT_DURATION = 3.1;
const REDUCED_EXIT_DURATION = 0.48;
const DEBUG_EXIT_DURATION = 7;
const EXIT_SCENE_SWAP_PROGRESS = 1.4 / EXIT_DURATION;
const EXIT_CURTAIN_CLOSE_PROGRESS = 2.45 / EXIT_DURATION;

function smoothstep(value: number) {
  const clamped = Math.min(1, Math.max(0, value));
  return clamped * clamped * (3 - 2 * clamped);
}

interface TransitionDirectorOptions {
  phase: Phase;
  reducedMotion: boolean;
  beginEntering: () => void;
  arriveInside: () => void;
  beginExiting: () => void;
  finishExiting: () => void;
  curtainProgress: number;
  setCurtainProgress: (progress: number) => void;
}

export function useTransitionDirector({
  phase,
  reducedMotion,
  beginEntering,
  arriveInside,
  beginExiting,
  finishExiting,
  curtainProgress,
  setCurtainProgress,
}: TransitionDirectorOptions) {
  const [sceneMode, setSceneMode] = useState<SceneMode>(() => (isDirectInteriorPreview() ? "interior" : "exterior"));
  const [entryProgress, setEntryProgress] = useState(0);
  const [exitProgress, setExitProgress] = useState(0);
  const inputLocked = useRef(false);
  const entryTimeline = useRef<gsap.core.Timeline | null>(null);
  const exitTimeline = useRef<gsap.core.Timeline | null>(null);
  const debugTransition = isTransitionDebug();
  const debugExit = isExitDebug();
  const debugCurtain = isCurtainDebug();
  const entryDuration = reducedMotion
    ? REDUCED_ENTRY_DURATION
    : debugCurtain || debugTransition
      ? DEBUG_ENTRY_DURATION
      : ENTRY_DURATION;
  const exitDuration = reducedMotion
    ? REDUCED_EXIT_DURATION
    : debugCurtain || debugExit
      ? DEBUG_EXIT_DURATION
      : EXIT_DURATION;

  const enterBooth = useCallback(() => {
    if (inputLocked.current || phase !== "outside") return;
    inputLocked.current = true;
    entryTimeline.current?.kill();
    exitTimeline.current?.kill();
    document.body.style.cursor = "auto";
    beginEntering();
    setEntryProgress(0);

    const duration = entryDuration;
    const driver = { progress: 0 };
    const curtainStart = curtainProgress;
    let lastCurtainLog = -1;
    const logPhase = (name: string) => {
      if (debugCurtain || debugTransition) console.info(`[transition] ${name} (${driver.progress.toFixed(3)})`);
    };

    logPhase("activation");
    const timeline = gsap.timeline({
      onComplete() {
        setEntryProgress(1);
        setCurtainProgress(1);
        arriveInside();
        logPhase("inside");
      },
    });
    timeline.to(driver, {
      progress: 1,
      duration,
      ease: "none",
      onUpdate() {
        setEntryProgress(driver.progress);
        const curtainT = smoothstep((driver.progress - 0.2 / ENTRY_DURATION) / (1.2 / ENTRY_DURATION));
        setCurtainProgress(curtainStart + (1 - curtainStart) * curtainT);
        if (debugCurtain) {
          const step = Math.floor(curtainT * 10);
          if (step !== lastCurtainLog) {
            lastCurtainLog = step;
            console.info(`[curtain] opening ${Math.round(curtainT * 100)}%`);
          }
        }
      },
    }, 0);
    timeline.call(() => logPhase("approach"), [], duration * (0.25 / ENTRY_DURATION));
    timeline.call(() => logPhase("threshold"), [], duration * (1 / ENTRY_DURATION));
    timeline.call(() => {
      logPhase("interior handoff");
      setSceneMode("interior");
    }, [], duration * (reducedMotion ? 0.5 : INTERIOR_HANDOFF_PROGRESS));
    timeline.call(() => logPhase("interior reveal"), [], duration * (1.35 / ENTRY_DURATION));
    timeline.call(() => logPhase("settle"), [], duration * (2.1 / ENTRY_DURATION));
    entryTimeline.current = timeline;
  }, [arriveInside, beginEntering, curtainProgress, debugCurtain, debugTransition, entryDuration, phase, reducedMotion, setCurtainProgress]);

  const exitBooth = useCallback(() => {
    if (inputLocked.current || phase === "loading" || phase === "outside" || phase === "entering" || phase === "exiting") return;
    inputLocked.current = true;
    entryTimeline.current?.kill();
    exitTimeline.current?.kill();
    document.body.style.cursor = "auto";
    setSceneMode("exterior");
    beginExiting();
    setExitProgress(0);

    const duration = exitDuration;
    const driver = { progress: 0 };
    const curtainStart = curtainProgress;
    let lastCurtainLog = -1;
    const logPhase = (name: string) => {
      if (debugCurtain || debugExit) console.info(`[exit] ${name} (${driver.progress.toFixed(3)})`);
    };

    logPhase("prepare");
    const timeline = gsap.timeline({
      onComplete() {
        setExitProgress(1);
        setCurtainProgress(0);
        finishExiting();
        logPhase("outside");
      },
    });
    timeline.to(driver, {
      progress: 1,
      duration,
      ease: "none",
      onUpdate() {
        setExitProgress(driver.progress);
        const curtainT = smoothstep((driver.progress - EXIT_CURTAIN_CLOSE_PROGRESS) / (1 - EXIT_CURTAIN_CLOSE_PROGRESS));
        setCurtainProgress(curtainStart * (1 - curtainT));
        if (debugCurtain) {
          const step = Math.floor(curtainT * 10);
          if (step !== lastCurtainLog) {
            lastCurtainLog = step;
            console.info(`[curtain] closing ${Math.round(curtainT * 100)}%`);
          }
        }
      },
    }, 0);
    timeline.call(() => logPhase("recenter inside"), [], duration * (0.25 / EXIT_DURATION));
    timeline.call(() => logPhase("straight interior threshold"), [], duration * (0.7 / EXIT_DURATION));
    timeline.call(() => logPhase("curtain threshold"), [], duration * EXIT_SCENE_SWAP_PROGRESS);
    timeline.call(() => logPhase("straight exterior clear"), [], duration * (1.45 / EXIT_DURATION));
    timeline.call(() => logPhase("exterior settle"), [], duration * (2.2 / EXIT_DURATION));
    timeline.call(() => logPhase("curtain close"), [], duration * EXIT_CURTAIN_CLOSE_PROGRESS);
    exitTimeline.current = timeline;
  }, [beginExiting, curtainProgress, debugCurtain, debugExit, exitDuration, finishExiting, phase, setCurtainProgress]);

  useEffect(() => {
    if (phase === "outside" || phase === "inside") inputLocked.current = false;
  }, [phase]);

  useEffect(() => () => {
    entryTimeline.current?.kill();
    exitTimeline.current?.kill();
    document.body.style.cursor = "auto";
  }, []);

  return {
    sceneMode,
    entryProgress,
    entryDuration,
    exitProgress,
    exitDuration,
    enterBooth,
    exitBooth,
  };
}
