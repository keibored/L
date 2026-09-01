import { RoundedBox } from "@react-three/drei";

export function SurpriseObject() {
  return (
    <group>
      {/* Box, beveled for a designed rather than primitive feel */}
      <RoundedBox args={[0.24, 0.2, 0.24]} radius={0.014} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color="#5c1f28" roughness={0.42} metalness={0.18} />
      </RoundedBox>
      {/* Ribbon bands */}
      <RoundedBox args={[0.262, 0.032, 0.262]} radius={0.008} smoothness={2} castShadow>
        <meshStandardMaterial color="#e3b9c3" roughness={0.35} metalness={0.28} />
      </RoundedBox>
      <RoundedBox args={[0.032, 0.222, 0.262]} radius={0.008} smoothness={2} castShadow>
        <meshStandardMaterial color="#e3b9c3" roughness={0.35} metalness={0.28} />
      </RoundedBox>
      <RoundedBox args={[0.262, 0.222, 0.032]} radius={0.008} smoothness={2} castShadow>
        <meshStandardMaterial color="#e3b9c3" roughness={0.35} metalness={0.28} />
      </RoundedBox>
      {/* Bow */}
      <mesh position={[-0.045, 0.12, 0]} rotation={[0, 0, 0.6]} castShadow>
        <torusGeometry args={[0.035, 0.014, 8, 16]} />
        <meshStandardMaterial color="#f0cdd6" roughness={0.3} metalness={0.32} />
      </mesh>
      <mesh position={[0.045, 0.12, 0]} rotation={[0, 0, -0.6]} castShadow>
        <torusGeometry args={[0.035, 0.014, 8, 16]} />
        <meshStandardMaterial color="#f0cdd6" roughness={0.3} metalness={0.32} />
      </mesh>
      <mesh position={[0, 0.11, 0]} castShadow>
        <sphereGeometry args={[0.02, 12, 12]} />
        <meshStandardMaterial color="#f0cdd6" roughness={0.3} metalness={0.32} />
      </mesh>
    </group>
  );
}
