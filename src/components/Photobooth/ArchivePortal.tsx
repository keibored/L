import { useMemo, useRef } from "react";
import { useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import {
  AlwaysStencilFunc,
  EqualStencilFunc,
  KeepStencilOp,
  LinearFilter,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  Quaternion,
  ReplaceStencilOp,
  ShapeGeometry,
  SRGBColorSpace,
  Vector3,
} from "three";
import type { Phase } from "../../state/ExperienceContext";
import { BOOTH, INTERIOR_BACK_Z } from "./boothConfig";
import { ENTRANCE_TUNING } from "./entranceConfig";
import { roundedRectShape } from "../../utils/roundedRect";
import {
  ARCHIVE_ASPECT_RATIO,
  ARCHIVE_IMAGE_URL,
} from "./interior/hub/archiveAsset";

useTexture.preload(ARCHIVE_IMAGE_URL);

function smoothstep(value: number) {
  const clamped = MathUtils.clamp(value, 0, 1);
  return clamped * clamped * (3 - 2 * clamped);
}

interface ArchivePortalProps {
  phase: Phase;
  entryProgress: number;
  exitProgress: number;
  reducedMotion: boolean;
}

export function ArchivePortal({ phase, entryProgress, exitProgress, reducedMotion }: ArchivePortalProps) {
  const meshRef = useRef<Mesh>(null);
  const maskRef = useRef<Mesh>(null);
  const materialRef = useRef<MeshBasicMaterial>(null);
  const sourceTexture = useTexture(ARCHIVE_IMAGE_URL);
  const texture = useMemo(() => {
    const configured = sourceTexture.clone();
    configured.colorSpace = SRGBColorSpace;
    configured.minFilter = LinearFilter;
    configured.magFilter = LinearFilter;
    configured.generateMipmaps = true;
    configured.needsUpdate = true;
    return configured;
  }, [sourceTexture]);
  const { camera, size } = useThree();
  const fixedPosition = useMemo(
    () => new Vector3(
      0,
      BOOTH.openingCenterY * ENTRANCE_TUNING.boothScale,
      (INTERIOR_BACK_Z - 0.18) * ENTRANCE_TUNING.boothScale,
    ),
    [],
  );
  const fixedQuaternion = useMemo(() => new Quaternion(), []);
  const alignedPosition = useMemo(() => new Vector3(), []);
  const cameraDirection = useMemo(() => new Vector3(), []);
  const targetQuaternion = useMemo(() => new Quaternion(), []);
  const apertureGeometry = useMemo(() => {
    const inset = 0.018;
    const shape = roundedRectShape(
      BOOTH.openingWidth - inset * 2,
      BOOTH.openingHeight - inset * 2,
      BOOTH.openingRadius - inset,
      0,
      BOOTH.openingCenterY,
    );
    return new ShapeGeometry(shape, 28);
  }, []);
  const apertureWorldZ = (BOOTH.frameDepth / 2 + 0.035) * ENTRANCE_TUNING.boothScale;

  useFrame(() => {
    const mesh = meshRef.current;
    const material = materialRef.current;
    const mask = maskRef.current;
    if (!mesh || !material || !mask) return;

    const cameraOutside = camera.position.z > apertureWorldZ;
    mask.visible = cameraOutside;
    material.stencilWrite = cameraOutside;
    material.stencilFunc = cameraOutside ? EqualStencilFunc : AlwaysStencilFunc;

    const alignment = phase === "entering"
      ? smoothstep((entryProgress - (reducedMotion ? 0.42 : 0.58)) / (reducedMotion ? 0.12 : 0.14))
      : phase === "exiting"
        ? 1 - smoothstep((exitProgress - (reducedMotion ? 0.28 : 0.3)) / (reducedMotion ? 0.14 : 0.18))
        : phase === "inside" || phase === "focusing" || phase === "content"
          ? 1
          : 0;

    camera.getWorldDirection(cameraDirection);
    const alignedDistance = 1.25;
    alignedPosition.copy(camera.position).addScaledVector(cameraDirection, alignedDistance);
    targetQuaternion.copy(camera.quaternion);

    const fov = "fov" in camera ? MathUtils.degToRad(camera.fov) : MathUtils.degToRad(45);
    const viewportHeight = 2 * Math.tan(fov / 2) * alignedDistance;
    const viewportAspect = size.width / Math.max(size.height, 1);
    const alignedHeight = viewportAspect > ARCHIVE_ASPECT_RATIO
      ? viewportHeight * (viewportAspect / ARCHIVE_ASPECT_RATIO)
      : viewportHeight;
    const alignedWidth = alignedHeight * ARCHIVE_ASPECT_RATIO;
    const fixedHeight = BOOTH.openingHeight * ENTRANCE_TUNING.boothScale * 1.22;
    const fixedWidth = fixedHeight * ARCHIVE_ASPECT_RATIO;

    mesh.position.lerpVectors(fixedPosition, alignedPosition, alignment);
    mesh.quaternion.slerpQuaternions(fixedQuaternion, targetQuaternion, alignment);
    mesh.scale.set(
      MathUtils.lerp(fixedWidth, alignedWidth, alignment),
      MathUtils.lerp(fixedHeight, alignedHeight, alignment),
      1,
    );
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
      <mesh ref={meshRef} renderOrder={-90} frustumCulled={false}>
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
