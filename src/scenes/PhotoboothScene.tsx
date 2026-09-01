import { Suspense, useCallback, useEffect, useState, type CSSProperties } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Preload } from "@react-three/drei";
import { ACESFilmicToneMapping, Color, Fog } from "three";
import { EffectsPipeline } from "../components/Photobooth/EffectsPipeline";
import { useCurtainAnimation } from "../hooks/useCurtainAnimation";
import { useEntrancePreferences } from "../hooks/useEntrancePreferences";
import { useTransitionDirector } from "../hooks/useTransitionDirector";
import { useExperience } from "../state/ExperienceContext";
import { CameraRig } from "../components/Photobooth/CameraRig";
import { EXTERIOR } from "../components/Photobooth/cameraWaypoints";
import { ENTRANCE_TUNING } from "../components/Photobooth/entranceConfig";
import { InterfaceOverlay } from "../components/Photobooth/InterfaceOverlay";
import { ArchivePortal } from "../components/Photobooth/ArchivePortal";
import { InteriorArchiveHub } from "../components/Photobooth/interior/hub/InteriorArchiveHub";
import { useArchiveImagePreload } from "../components/Photobooth/interior/hub/archiveAsset";
import { ExteriorPhotoboothScene } from "./ExteriorPhotoboothScene";

const EXTERIOR_BACKGROUND = new Color("#080706");
const INTERIOR_BACKGROUND = new Color("#160b09");
const EXTERIOR_FOG = new Color("#100b09");
const INTERIOR_FOG = new Color("#25120f");

function smoothstep(value: number) {
  const clamped = Math.min(1, Math.max(0, value));
  return clamped * clamped * (3 - 2 * clamped);
}

function ContinuousAtmosphere({ interiorBlend }: { interiorBlend: number }) {
  const { scene } = useThree();
  const background = useState(() => new Color())[0];
  const fogColor = useState(() => new Color())[0];

  useFrame(() => {
    background.lerpColors(EXTERIOR_BACKGROUND, INTERIOR_BACKGROUND, interiorBlend);
    fogColor.lerpColors(EXTERIOR_FOG, INTERIOR_FOG, interiorBlend);
    if (scene.background instanceof Color) scene.background.copy(background);
    if (scene.fog instanceof Fog) scene.fog.color.copy(fogColor);
  });

  return null;
}

export function PhotoboothScene() {
  const { reducedMotion, coarsePointer } = useEntrancePreferences();
  const {
    progress,
    dragging,
    handlePointerDown,
    handleClick,
    setCurtainProgress,
  } = useCurtainAnimation(reducedMotion);
  const {
    phase,
    focusedObject,
    beginEntering,
    arriveInside,
    openContent,
    finishRecenter,
    beginExiting,
    finishExiting,
  } = useExperience();
  const [engaged, setEngaged] = useState(false);
  const archiveReady = useArchiveImagePreload();
  const {
    sceneMode,
    entryProgress,
    exitProgress,
    enterBooth,
    exitBooth,
  } = useTransitionDirector({
    phase,
    reducedMotion,
    beginEntering,
    arriveInside,
    beginExiting,
    finishExiting,
    curtainProgress: progress,
    setCurtainProgress,
  });

  const requestEntry = useCallback(() => {
    if (!archiveReady) return;
    setEngaged(false);
    enterBooth();
  }, [archiveReady, enterBooth]);

  useEffect(() => {
    if (phase !== "focusing") return;
    const timer = setTimeout(
      focusedObject ? openContent : finishRecenter,
      reducedMotion ? 180 : focusedObject ? 720 : 680,
    );
    return () => clearTimeout(timer);
  }, [finishRecenter, focusedObject, openContent, phase, reducedMotion]);

  const handleCurtainClick = useCallback(() => {
    if (handleClick()) requestEntry();
  }, [handleClick, requestEntry]);

  const revealing = phase === "loading";
  const interiorBlend = phase === "entering"
    ? smoothstep(entryProgress)
    : phase === "exiting"
      ? 1 - smoothstep(exitProgress)
      : phase === "inside" || phase === "focusing" || phase === "content"
        ? 1
        : 0;
  const archiveHtmlOpacity = phase === "entering"
    ? smoothstep((entryProgress - (reducedMotion ? 0.46 : 0.75)) / (reducedMotion ? 0.08 : 0.09))
    : phase === "exiting"
      ? 1 - smoothstep((exitProgress - (reducedMotion ? 0.08 : 0.04)) / (reducedMotion ? 0.1 : 0.12))
      : phase === "inside" || phase === "focusing" || phase === "content"
        ? 1
        : 0;
  const liveCurtainOpacity = phase === "entering"
    ? 1 - smoothstep((entryProgress - 0.6) / 0.12)
    : phase === "exiting"
      ? smoothstep((exitProgress - 0.5) / 0.1)
      : phase === "inside" || phase === "focusing" || phase === "content"
        ? 0
        : 1;
  const entranceStyle = {
    "--entry-grain-opacity": ENTRANCE_TUNING.grainOpacity,
    "--entry-reveal-duration": `${ENTRANCE_TUNING.revealDuration}s`,
    "--entry-transition-duration": "2.2s",
  } as CSSProperties;

  return (
    <div className={`canvas-shell canvas-shell--${phase}`} style={entranceStyle}>
      <Canvas
        shadows
        dpr={[1, 1.65]}
        performance={{ min: 0.55 }}
        camera={{ position: EXTERIOR.position, fov: EXTERIOR.fov, near: 0.05, far: 24 }}
        gl={{ toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.08, antialias: true, stencil: true }}
      >
        <color attach="background" args={["#080706"]} />
        <fog attach="fog" args={["#100b09", 8, 18]} />
        <Suspense fallback={null}>
          <ContinuousAtmosphere interiorBlend={interiorBlend} />
          <CameraRig
            sceneMode={sceneMode}
            entryProgress={entryProgress}
            exitProgress={exitProgress}
            dragging={dragging}
            engaged={engaged}
            reducedMotion={reducedMotion}
            coarsePointer={coarsePointer}
          />

          <ArchivePortal
            phase={phase}
            entryProgress={entryProgress}
            exitProgress={exitProgress}
            reducedMotion={reducedMotion}
          />

          <ExteriorPhotoboothScene
            visible={sceneMode === "exterior" || phase === "entering" || phase === "exiting"}
            lightingStrength={1 - interiorBlend}
            phase={phase}
            progress={progress}
            curtainOpacity={liveCurtainOpacity}
            dragging={dragging}
            engaged={engaged}
            revealing={revealing}
            reducedMotion={reducedMotion}
            coarsePointer={coarsePointer}
            curtainInteractive={phase === "outside"}
            onPointerDown={handlePointerDown}
            onCurtainClick={handleCurtainClick}
            onEngagementChange={setEngaged}
          />
          <Preload all />
        </Suspense>
        <EffectsPipeline />
      </Canvas>

      <InteriorArchiveHub
        phase={phase}
        opacity={archiveHtmlOpacity}
        imageReady={archiveReady}
        reducedMotion={reducedMotion}
      />

      <InterfaceOverlay
        phase={phase}
        sceneMode={sceneMode}
        exitProgress={exitProgress}
        archiveReady={archiveReady}
        onEnter={requestEntry}
        onExit={exitBooth}
        onEngagementChange={setEngaged}
      />
    </div>
  );
}
