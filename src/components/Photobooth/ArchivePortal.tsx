import { useMemo, useRef } from "react";
import { useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import {
  AlwaysStencilFunc,
  EqualStencilFunc,
  KeepStencilOp,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  ReplaceStencilOp,
  ShapeGeometry,
  SRGBColorSpace,
  Vector3,
} from "three";
import type { Phase } from "../../state/ExperienceContext";
import type { TransitionRef } from "../../hooks/useTransitionDirector";
import { BOOTH } from "./boothConfig";
import { ENTRANCE_TUNING } from "./entranceConfig";
import { roundedRectShape } from "../../utils/roundedRect";
import { ARCHIVE_ASPECT_RATIO, ARCHIVE_IMAGE_URL } from "./interior/hub/archiveAsset";
import { INTERIOR_WORLD } from "./worldLayout";
import { interiorWaypointForViewport } from "./cameraWaypoints";

useTexture.preload(ARCHIVE_IMAGE_URL);

interface ArchivePortalProps {
  phase: Phase;
  transitionRef: TransitionRef;
  reducedMotion: boolean;
}

/**
 * The archive is a real plane in the shared Three.js world. It stays put while
 * the camera travels and focuses; it never follows the camera like a HUD plane.
 */
export function ArchivePortal(props: ArchivePortalProps) {
  // Retained in the public component contract for debug routes; the portal's
  // world pose deliberately no longer changes with application phase.
  void props.phase;
  void props.transitionRef;
  void props.reducedMotion;
  const maskRef = useRef<Mesh>(null);
  const materialRef = useRef<MeshBasicMaterial>(null);
  const sourceTexture = useTexture(ARCHIVE_IMAGE_URL);
  const { camera, size } = useThree();
  const texture = useMemo(() => {
    const configured = sourceTexture.clone();
    configured.colorSpace = SRGBColorSpace;
    configured.minFilter = LinearFilter;
    configured.magFilter = LinearFilter;
    configured.generateMipmaps = true;
    configured.needsUpdate = true;
    return configured;
  }, [sourceTexture]);
  const apertureGeometry = useMemo(() => {
    const inset = 0.018;
    return new ShapeGeometry(roundedRectShape(
      BOOTH.openingWidth - inset * 2,
      BOOTH.openingHeight - inset * 2,
      BOOTH.openingRadius - inset,
      0,
      BOOTH.openingCenterY,
    ), 28);
  }, []);
  const planeCenter = useMemo(
    () => new Vector3(INTERIOR_WORLD.position[0], INTERIOR_WORLD.position[1] - 0.4, INTERIOR_WORLD.position[2] - 0.18),
    [],
  );
  const interiorHome = interiorWaypointForViewport(size.width, size.height);
  const homeDistance = planeCenter.distanceTo(new Vector3(...interiorHome.position));
  const viewportHeight = 2 * Math.tan((interiorHome.fov * Math.PI) / 360) * homeDistance;
  const viewportAspect = size.width / Math.max(size.height, 1);
  const planeHeight = Math.max(viewportHeight, viewportHeight * viewportAspect / ARCHIVE_ASPECT_RATIO) * 1.015;
  const planeWidth = planeHeight * ARCHIVE_ASPECT_RATIO;
  const apertureWorldZ = (BOOTH.frameDepth / 2 + 0.035) * ENTRANCE_TUNING.boothScale;

  useFrame(() => {
    const mask = maskRef.current;
    const material = materialRef.current;
    if (!mask || !material) return;
    const cameraOutside = camera.position.z > apertureWorldZ;
    mask.visible = cameraOutside;
    material.stencilWrite = cameraOutside;
    material.stencilFunc = cameraOutside ? EqualStencilFunc : AlwaysStencilFunc;
  });

  return (
    <>
      <group scale={ENTRANCE_TUNING.boothScale}>
        <mesh
          ref={maskRef}
          geometry={apertureGeometry}
          position={[0, 0, BOOTH.frameDepth / 2 + 0.035]}
          renderOrder={-100}
          frustumCulled={false}
        >
          <meshBasicMaterial
            colorWrite={false}
            depthWrite={false}
            depthTest={false}
            stencilWrite
            stencilRef={1}
            stencilFunc={AlwaysStencilFunc}
            stencilFail={ReplaceStencilOp}
            stencilZFail={ReplaceStencilOp}
            stencilZPass={ReplaceStencilOp}
            toneMapped={false}
          />
        </mesh>
      </group>
      <mesh
        position={planeCenter}
        scale={[planeWidth, planeHeight, 1]}
        renderOrder={-90}
        frustumCulled={false}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          ref={materialRef}
          map={texture}
          toneMapped={false}
          depthTest
          depthWrite
          stencilWrite
          stencilRef={1}
          stencilFunc={EqualStencilFunc}
          stencilFail={KeepStencilOp}
          stencilZFail={KeepStencilOp}
          stencilZPass={KeepStencilOp}
        />
      </mesh>
    </>
  );
}
