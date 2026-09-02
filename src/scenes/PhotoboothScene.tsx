import { Suspense, useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Preload } from "@react-three/drei";
import { ACESFilmicToneMapping, Color, Fog } from "three";
import { EffectsPipeline } from "../components/Photobooth/EffectsPipeline";
import { useCurtainAnimation } from "../hooks/useCurtainAnimation";
import { useEntrancePreferences } from "../hooks/useEntrancePreferences";
import { useTransitionDirector, type TransitionRef } from "../hooks/useTransitionDirector";
import { useExperience } from "../state/ExperienceContext";
import { CameraRig } from "../components/Photobooth/CameraRig";
import { EXTERIOR } from "../components/Photobooth/cameraWaypoints";
import { ENTRANCE_TUNING } from "../components/Photobooth/entranceConfig";
import { InterfaceOverlay } from "../components/Photobooth/InterfaceOverlay";
import { ArchivePortal } from "../components/Photobooth/ArchivePortal";
import { InteriorArchiveHub } from "../components/Photobooth/interior/hub/InteriorArchiveHub";
import { useInteriorAssetsPreload } from "../components/Photobooth/interior/hub/archiveAsset";
import { ExteriorPhotoboothScene } from "./ExteriorPhotoboothScene";

const EXTERIOR_BACKGROUND = new Color("#080706");
const INTERIOR_BACKGROUND = new Color("#160b09");
const EXTERIOR_FOG = new Color("#100b09");
const INTERIOR_FOG = new Color("#25120f");

function ContinuousAtmosphere({ transitionRef }: { transitionRef: TransitionRef }) {
  const { scene } = useThree();
  const background = useState(() => new Color())[0];
  const fogColor = useState(() => new Color())[0];

  useFrame(() => {
    const interiorBlend = transitionRef.current.interiorBlend;
    background.lerpColors(EXTERIOR_BACKGROUND, INTERIOR_BACKGROUND, interiorBlend);
    fogColor.lerpColors(EXTERIOR_FOG, INTERIOR_FOG, interiorBlend);
    if (scene.background instanceof Color) scene.background.copy(background);
    if (scene.fog instanceof Fog) scene.fog.color.copy(fogColor);
  });

  return null;
}

function CanvasReadySignal({ onReady }: { onReady: () => void }) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    let active = true;
    let secondFrame = 0;
    let firstFrame = 0;
    const warmScene = async () => {
      try {
        await gl.compileAsync(scene, camera);
      } catch (error) {
        // A rejected parallel compile must not strand the entrance control;
        // the renderer can still compile synchronously on its normal frames.
        console.warn("[photobooth] scene warm-up fell back to live compilation", error);
      }
      if (!active) return;
      firstFrame = requestAnimationFrame(() => {
        secondFrame = requestAnimationFrame(() => active && onReady());
      });
    };
    void warmScene();
    return () => {
      active = false;
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, [camera, gl, onReady, scene]);
  return null;
}

export function PhotoboothScene() {
  const { reducedMotion, coarsePointer } = useEntrancePreferences();
  const {
    progressRef: curtainProgressRef,
    dragging,
    handlePointerDown,
    handleClick,
    takeProgrammaticControl,
  } = useCurtainAnimation(reducedMotion);
  const {
    phase,
    assetsReady,
    focusedObject,
    markAssetsReady,
    beginEntering,
    arriveInside,
    openContent,
    finishRecenter,
    beginExiting,
    finishExiting,
  } = useExperience();
  const shellRef = useRef<HTMLDivElement>(null);
  const [engaged, setEngaged] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const interiorAssetsReady = useInteriorAssetsPreload();
  const markCanvasReady = useCallback(() => setCanvasReady(true), []);
  const {
    sceneMode,
    transitionRef,
    enterBooth,
    focusCamera,
    returnCamera,
    exitBooth,
    completeCameraTransition,
  } = useTransitionDirector({
    phase,
    beginEntering,
    arriveInside,
    openContent,
    finishRecenter,
    beginExiting,
    finishExiting,
    curtainProgressRef,
    shellRef,
  });

  useEffect(() => {
    if (canvasReady && interiorAssetsReady) markAssetsReady();
  }, [canvasReady, interiorAssetsReady, markAssetsReady]);

  const requestEntry = useCallback(() => {
    if (!assetsReady) return;
    setEngaged(false);
    takeProgrammaticControl();
    enterBooth();
  }, [assetsReady, enterBooth, takeProgrammaticControl]);

  useEffect(() => {
    if (phase !== "focusing") return;
    if (focusedObject) focusCamera(focusedObject);
    else returnCamera();
  }, [focusCamera, focusedObject, phase, returnCamera]);

  const handleCurtainClick = useCallback(() => {
    if (handleClick()) requestEntry();
  }, [handleClick, requestEntry]);

  const revealing = phase === "loading";
  const entranceStyle = {
    "--entry-grain-opacity": ENTRANCE_TUNING.grainOpacity,
    "--entry-reveal-duration": `${ENTRANCE_TUNING.revealDuration}s`,
    "--entry-transition-duration": "2.6s",
  } as CSSProperties;

  return (
    <div ref={shellRef} className={`canvas-shell canvas-shell--${phase}`} style={entranceStyle}>
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
          <ContinuousAtmosphere transitionRef={transitionRef} />
          <CameraRig
            transitionRef={transitionRef}
            curtainProgressRef={curtainProgressRef}
            shellRef={shellRef}
            reducedMotion={reducedMotion}
            onTransitionComplete={completeCameraTransition}
          />
          <ArchivePortal phase={phase} transitionRef={transitionRef} reducedMotion={reducedMotion} />
          <ExteriorPhotoboothScene
            transitionRef={transitionRef}
            phase={phase}
            curtainProgressRef={curtainProgressRef}
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
          <CanvasReadySignal onReady={markCanvasReady} />
        </Suspense>
        <EffectsPipeline />
      </Canvas>

      <InteriorArchiveHub
        phase={phase}
        imageReady={assetsReady}
        reducedMotion={reducedMotion}
      />

      <InterfaceOverlay
        phase={phase}
        sceneMode={sceneMode}
        archiveReady={assetsReady}
        onEnter={requestEntry}
        onExit={exitBooth}
        onEngagementChange={setEngaged}
      />
    </div>
  );
}
