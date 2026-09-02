import type { Phase } from "../../state/ExperienceContext";
import type { SceneMode } from "./cameraWaypoints";
import { AtmosphericOverlay } from "./AtmosphericOverlay";
import { EntranceInterface } from "./EntranceInterface";
import { InteriorInterface } from "./interior/hub/InteriorInterface";
import { ContentOverlay } from "../ContentOverlay/ContentOverlay";

interface InterfaceOverlayProps {
  phase: Phase;
  sceneMode: SceneMode;
  archiveReady: boolean;
  onEnter: () => void;
  onExit: () => void;
  onEngagementChange: (engaged: boolean) => void;
}

export function InterfaceOverlay({
  phase,
  sceneMode,
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

  if (sceneMode !== "interior") return null;

  return (
    <>
      <InteriorInterface visible onExit={onExit} />
      <ContentOverlay />
    </>
  );
}
