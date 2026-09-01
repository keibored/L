import { Suspense, useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ACESFilmicToneMapping, MathUtils, type Group } from "three";
import { ContactShadows, Sparkles } from "@react-three/drei";
import { EffectsPipeline } from "../components/Photobooth/EffectsPipeline";
import { useCurtainAnimation } from "../hooks/useCurtainAnimation";
import { useEntrancePreferences } from "../hooks/useEntrancePreferences";
import { useExperience } from "../state/ExperienceContext";
import { BoothBody } from "../components/Photobooth/BoothBody";
import { Curtains } from "../components/Photobooth/Curtains";
import { BoothInterior } from "../components/Photobooth/BoothInterior";
import { InteriorObjects } from "../components/Photobooth/interior/InteriorObjects";
import { InteriorDecor } from "../components/Photobooth/interior/InteriorDecor";
import { ExteriorEnvironment } from "../components/Photobooth/ExteriorEnvironment";
import { Lighting } from "../components/Photobooth/Lighting";
import { CameraRig } from "../components/Photobooth/CameraRig";
import { EXTERIOR } from "../components/Photobooth/cameraWaypoints";
import { ContentOverlay } from "../components/ContentOverlay/ContentOverlay";
import { AtmosphericOverlay } from "../components/Photobooth/AtmosphericOverlay";
import { EntranceInterface } from "../components/Photobooth/EntranceInterface";
import { ENTRANCE_TUNING } from "../components/Photobooth/entranceConfig";

function BoothStage({ children, reducedMotion }: { children: ReactNode; reducedMotion: boolean }) {
  const groupRef = useRef<Group>(null);
  const { phase } = useExperience();

  useFrame(() => {
    if (!groupRef.current) return;
    const exterior = phase === "loading" || phase === "exterior";
    const target = exterior ? ENTRANCE_TUNING.boothScale : 1;
    const current = groupRef.current.scale.x;
    const next = reducedMotion ? target : MathUtils.lerp(current, target, 0.045);
    groupRef.current.scale.setScalar(next);
  });

  return <group ref={groupRef} scale={ENTRANCE_TUNING.boothScale}>{children}</group>;
}
export function PhotoboothScene() {
  const { reducedMotion, coarsePointer } = useEntrancePreferences();
  const {
    progress,
    dragging,
    ready: curtainOpen,
    handlePointerDown,
    handleClick,
    openCurtain,
  } = useCurtainAnimation(reducedMotion);
  const { phase, beginEntering, arriveInterior } = useExperience();
  const [isEntering, setIsEntering] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const hasTriggeredEntry = useRef(false);
  const entryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startEntry = useCallback(() => {
    if (hasTriggeredEntry.current || phase !== "exterior") return;
    hasTriggeredEntry.current = true;
    setIsEntering(true);
    setEngaged(false);
    document.body.style.cursor = "auto";
    beginEntering();
    openCurtain(reducedMotion ? 0.24 : 1.28);

    entryTimer.current = setTimeout(
      arriveInterior,
      reducedMotion ? 340 : ENTRANCE_TUNING.enterDuration * 1000,
    );
  }, [arriveInterior, beginEntering, openCurtain, phase, reducedMotion]);

  useEffect(() => {
    if (curtainOpen) startEntry();
  }, [curtainOpen, startEntry]);

  useEffect(() => () => {
    if (entryTimer.current) clearTimeout(entryTimer.current);
    document.body.style.cursor = "auto";
  }, []);

  const handleCurtainClick = useCallback(() => {
    if (handleClick()) startEntry();
  }, [handleClick, startEntry]);

  const interiorLit = phase === "interior" || phase === "focused" || phase === "entering";
  const interiorInteractive = phase === "interior";
  const entranceVisible = phase === "exterior" || phase === "entering";
  const curtainInteractive = phase === "exterior" && !isEntering;
  const revealing = phase === "loading";
  const entranceStyle = {
    "--entry-grain-opacity": ENTRANCE_TUNING.grainOpacity,
    "--entry-reveal-duration": `${ENTRANCE_TUNING.revealDuration}s`,
    "--entry-transition-duration": `${ENTRANCE_TUNING.enterDuration}s`,
  } as CSSProperties;

  return (
    <div
      className={`canvas-shell${phase === "entering" ? " canvas-shell--entering" : ""}`}
      style={entranceStyle}
    >
      <Canvas
        shadows
        dpr={[1, 1.75]}
        performance={{ min: 0.55 }}
        camera={{ position: EXTERIOR.position, fov: EXTERIOR.fov, near: 0.05, far: 20 }}
        gl={{ toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.08, antialias: true }}
      >
        <color attach="background" args={["#080706"]} />
        <fog attach="fog" args={["#100b09", 7, 16]} />
        <Suspense fallback={null}>
          <CameraRig
            dragging={dragging}
            engaged={engaged}
            reducedMotion={reducedMotion}
            coarsePointer={coarsePointer}
          />
          <ExteriorEnvironment revealing={revealing} reducedMotion={reducedMotion} />
          <BoothStage reducedMotion={reducedMotion}>
            <BoothBody />
            <Curtains
              progress={progress}
              dragging={dragging}
              interactive={curtainInteractive}
              highlighted={engaged || isEntering}
              reducedMotion={reducedMotion}
              onPointerDown={handlePointerDown}
              onClick={handleCurtainClick}
              onEngagementChange={setEngaged}
            />
            <BoothInterior visible={progress > 0.05} />
            <InteriorDecor visible={progress > 0.05} />
            <InteriorObjects visible={progress > 0.05} interactive={interiorInteractive} />
          </BoothStage>
          <Lighting
            active={interiorLit}
            attention={engaged || isEntering}
            revealing={revealing}
            reducedMotion={reducedMotion}
          />
          <ContactShadows
            position={[0, -2.34, -0.18]}
            opacity={0.72}
            scale={8.5}
            blur={2.8}
            far={3.2}
            color="#050302"
          />
          <Sparkles
            count={coarsePointer ? 9 : interiorLit ? 16 : 22}
            scale={[7, 5, 5]}
            size={1.25}
            speed={reducedMotion ? 0 : 0.1}
            opacity={0.2}
            color="#e7c6a8"
          />
        </Suspense>
        <EffectsPipeline />
      </Canvas>

      <AtmosphericOverlay entering={phase === "entering"} visible={entranceVisible} />
      <EntranceInterface
        entering={phase === "entering"}
        visible={entranceVisible}
        onEnter={startEntry}
        onEngagementChange={setEngaged}
      />
      <ContentOverlay />
    </div>
  );
}
