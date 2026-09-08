import { useRef, type MutableRefObject, type ReactNode } from "react";
import { ContactShadows, Sparkles } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { MathUtils, type Group } from "three";
import type { Phase } from "../state/ExperienceContext";
import { BoothBody } from "../components/Photobooth/BoothBody";
import { BoothMarquee } from "../components/Photobooth/BoothMarquee";
import { Curtains } from "../components/Photobooth/Curtains";
import { ExteriorEnvironment } from "../components/Photobooth/ExteriorEnvironment";
import { Lighting } from "../components/Photobooth/Lighting";
import { ENTRANCE_TUNING } from "../components/Photobooth/entranceConfig";
import type { TransitionRef } from "../hooks/useTransitionDirector";

function ExteriorBoothStage({ children, reducedMotion }: { children: ReactNode; reducedMotion: boolean }) {
  const groupRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const target = ENTRANCE_TUNING.boothScale;
    const next = reducedMotion ? target : MathUtils.damp(groupRef.current.scale.x, target, 2.76, delta);
    groupRef.current.scale.setScalar(next);
  });

  return <group ref={groupRef} scale={ENTRANCE_TUNING.boothScale}>{children}</group>;
}

interface ExteriorPhotoboothSceneProps {
  visible?: boolean;
  transitionRef: TransitionRef;
  phase: Phase;
  curtainProgressRef: MutableRefObject<number>;
  dragging: boolean;
  engaged: boolean;
  revealing: boolean;
  reducedMotion: boolean;
  coarsePointer: boolean;
  curtainInteractive: boolean;
  onPointerDown: (clientX: number) => void;
  onCurtainClick: () => void;
  onEngagementChange: (engaged: boolean) => void;
}

export function ExteriorPhotoboothScene({
  visible = true,
  transitionRef,
  phase,
  curtainProgressRef,
  dragging,
  engaged,
  revealing,
  reducedMotion,
  coarsePointer,
  curtainInteractive,
  onPointerDown,
  onCurtainClick,
  onEngagementChange,
}: ExteriorPhotoboothSceneProps) {
  return (
    <group name="exterior-photobooth-scene" visible={visible}>
      <ExteriorEnvironment revealing={revealing} reducedMotion={reducedMotion} />
      <ExteriorBoothStage reducedMotion={reducedMotion}>
        <BoothBody />
        <BoothMarquee />
        <Curtains
          progressRef={curtainProgressRef}
          dragging={dragging}
          interactive={curtainInteractive}
          highlighted={engaged || phase === "entering"}
          reducedMotion={reducedMotion}
          onPointerDown={onPointerDown}
          onClick={onCurtainClick}
          onEngagementChange={onEngagementChange}
        />
      </ExteriorBoothStage>
      <Lighting
        active={false}
        attention={engaged || phase === "entering"}
        revealing={revealing}
        reducedMotion={reducedMotion}
        transitionRef={transitionRef}
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
        count={coarsePointer ? 9 : 22}
        scale={[7, 5, 5]}
        size={1.25}
        speed={reducedMotion ? 0 : 0.1}
        opacity={0.2}
        color="#e7c6a8"
      />
    </group>
  );
}
