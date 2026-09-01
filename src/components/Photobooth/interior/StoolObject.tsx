import { RoundedBox } from "@react-three/drei";

const SEAT_Y = 0.42;

export function StoolObject() {
  return (
    <group>
      <RoundedBox args={[0.26, 0.05, 0.26]} radius={0.02} smoothness={2} position={[0, SEAT_Y, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#2a1c15" roughness={0.55} metalness={0.15} />
      </RoundedBox>
      {[
        [0.09, 0.09],
        [-0.09, 0.09],
        [0.09, -0.09],
        [-0.09, -0.09],
      ].map(([x, z]) => (
        <mesh key={`${x}-${z}`} position={[x, SEAT_Y / 2, z]} castShadow>
          <cylinderGeometry args={[0.014, 0.014, SEAT_Y, 8]} />
          <meshStandardMaterial color="#1c130f" roughness={0.5} metalness={0.25} />
        </mesh>
      ))}
    </group>
  );
}
