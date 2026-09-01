import { Text, RoundedBox } from "@react-three/drei";

export function MemoryObject() {
  return (
    <group>
      {/* Stand base */}
      <RoundedBox args={[0.16, 0.03, 0.11]} radius={0.008} smoothness={2} position={[0, -0.29, 0.02]} castShadow receiveShadow>
        <meshStandardMaterial color="#241914" roughness={0.55} metalness={0.25} />
      </RoundedBox>
      <mesh position={[0, -0.22, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.018, 0.11, 10]} />
        <meshStandardMaterial color="#2f221a" roughness={0.45} metalness={0.35} />
      </mesh>

      {/* Monitor body, beveled rather than a raw box */}
      <RoundedBox args={[0.46, 0.34, 0.055]} radius={0.014} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color="#1e150f" roughness={0.42} metalness={0.3} />
      </RoundedBox>

      {/* Thin bezel ring around the screen */}
      <mesh position={[0, 0, 0.024]}>
        <planeGeometry args={[0.41, 0.29]} />
        <meshStandardMaterial color="#100b08" roughness={0.5} metalness={0.2} />
      </mesh>

      {/* Screen, slightly recessed behind the bezel with a glassy response */}
      <mesh position={[0, 0, 0.029]}>
        <planeGeometry args={[0.38, 0.26]} />
        <meshPhysicalMaterial
          color="#1a0f0c"
          emissive="#ffb27a"
          emissiveIntensity={0.5}
          roughness={0.25}
          metalness={0.1}
          clearcoat={0.6}
          clearcoatRoughness={0.3}
        />
      </mesh>
      <Text position={[0, 0.03, 0.033]} fontSize={0.043} color="#ffe3c9" anchorX="center" anchorY="middle" letterSpacing={0.08}>
        SNAPSHOT
      </Text>
      <Text position={[0, -0.05, 0.033]} fontSize={0.019} color="#e0a789" anchorX="center" anchorY="middle" letterSpacing={0.04}>
        a little place for our memories
      </Text>
    </group>
  );
}
