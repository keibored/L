import type { Phase } from "../../state/ExperienceContext";
import type { SceneMode } from "./cameraWaypoints";
import { AtmosphericOverlay } from "./AtmosphericOverlay";
import { EntranceInterface } from "./EntranceInterface";
import { InteriorInterface } from "./interior/hub/InteriorInterface";
import { ContentOverlay } from "../ContentOverlay/ContentOverlay";

interface InterfaceOverlayProps {
  phase: Phase;
  sceneMode: SceneMode;
  exitProgress: number;
  archiveReady: boolean;
  onEnter: () => void;
  onExit: () => void;
  onEngagementChange: (engaged: boolean) => void;
}

export function InterfaceOverlay({
  phase,
  sceneMode,
  exitProgress,
  archiveReady,
  onEnter,
  onExit,
  onEngagementChange,
}: InterfaceOverlayProps) {
  if (phase === "loading" || phase === "outside" || phase === "entering") {
    const visible = phase === "outside" || phase === "entering";
    return (
      <>
        <AtmosphericOverlay entering={phase === "entering"} visible={visible} />
        <EntranceInterface
          entering={phase === "entering"}
          visible={visible}
          archiveReady={archiveReady}
          onEnter={onEnter}
          onEngagementChange={onEngagementChange}
        />
      </>
    );
  }

  if (phase === "exiting" && sceneMode === "exterior") {
    const revealStart = 2.2 / 3.1;
    const revealEnd = 2.85 / 3.1;
    const rawProgress = Math.min(1, Math.max(0, (exitProgress - revealStart) / (revealEnd - revealStart)));
    const revealProgress = rawProgress * rawProgress * (3 - 2 * rawProgress);
    if (revealProgress <= 0) return null;
    return (
      <>
        <AtmosphericOverlay entering={false} visible />
        <EntranceInterface
          entering={false}
          visible
          interactive={false}
          archiveReady={archiveReady}
          revealProgress={revealProgress}
          onEnter={onEnter}
          onEngagementChange={onEngagementChange}
        />
      </>
    );
  }

  if (sceneMode !== "interior") return null;

  return (
    <>
      <InteriorInterface visible onExit={onExit} />
      <ContentOverlay />
    </>
  );
}
