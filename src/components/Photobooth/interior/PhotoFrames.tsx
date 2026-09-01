import { PHOTO_FRAME_POSITIONS } from "./interiorLayout";

const TONES = ["#c99a8c", "#d9b3a3"];

export function PhotoFrames() {
  return (
    <group>
      {PHOTO_FRAME_POSITIONS.map(([x, y, z, rot], i) => (
        <group key={`${x}-${y}`} position={[x, y, z]} rotation={[0, 0, rot]}>
          <mesh castShadow>
            <boxGeometry args={[0.16, 0.2, 0.015]} />
            <meshStandardMaterial color="#4a3527" roughness={0.55} metalness={0.15} />
          </mesh>
          <mesh position={[0, 0, 0.009]}>
            <planeGeometry args={[0.12, 0.16]} />
            <meshStandardMaterial color={TONES[i % TONES.length]} roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
