import { Suspense, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { ACESFilmicToneMapping } from "three";
import { ContactShadows, Sparkles } from "@react-three/drei";
import { EffectsPipeline } from "../components/Photobooth/EffectsPipeline";
import { useCurtainAnimation } from "../hooks/useCurtainAnimation";
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

export function PhotoboothScene() {
  const { progress, dragging, ready: curtainOpen, handlePointerDown, handleClick } = useCurtainAnimation();
  const { phase, beginEntering, arriveInterior } = useExperience();
  const hasTriggeredEntry = useRef(false);

  useEffect(() => {
    if (!curtainOpen || hasTriggeredEntry.current) return;
    hasTriggeredEntry.current = true;
    beginEntering();
    const t = setTimeout(() => arriveInterior(), 1600);
    return () => clearTimeout(t);
  }, [curtainOpen, beginEntering, arriveInterior]);

  const interiorLit = phase === "interior" || phase === "focused" || phase === "entering";
  const interactive = phase === "interior";
  const showExteriorCopy = phase === "exterior" || phase === "entering";
  const showEnterHint = phase === "exterior" && progress < 0.05;

  return (
    <div className="canvas-shell">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: EXTERIOR.position, fov: EXTERIOR.fov, near: 0.05, far: 20 }}
        gl={{ toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
      >
        <color attach="background" args={["#0b0705"]} />
        <fog attach="fog" args={["#0b0705", 6, 14]} />
        <Suspense fallback={null}>
          <CameraRig dragging={dragging} />
          <ExteriorEnvironment />
          <BoothBody />
          <Curtains
            progress={progress}
            dragging={dragging}
            onPointerDown={handlePointerDown}
            onClick={handleClick}
          />
          <BoothInterior visible={progress > 0.05} />
          <InteriorDecor visible={progress > 0.05} />
          <InteriorObjects visible={progress > 0.05} interactive={interactive} />
          <Lighting active={interiorLit} />
          <ContactShadows position={[0, -2.05, 0]} opacity={0.65} scale={9} blur={2.4} far={3} color="#000000" />
          <Sparkles count={interiorLit ? 18 : 7} scale={6} size={1.4} speed={0.15} opacity={0.25} color="#ffd9b8" />
        </Suspense>
        <EffectsPipeline />
      </Canvas>

      {showExteriorCopy && (
        <div className={`scene-copy${phase === "entering" ? " scene-copy--fading" : ""}`}>
          <p className="scene-brand">SNAPSHOT</p>
          <p className="scene-tagline">a little place for our memories</p>
        </div>
      )}
      {showEnterHint && <p className="scene-instruction">click to enter</p>}

      <ContentOverlay />
    </div>
  );
}
