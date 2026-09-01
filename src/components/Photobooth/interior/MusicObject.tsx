export function MusicObject() {
  return (
    <group>
      {/* Body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.34, 0.09, 0.22]} />
        <meshStandardMaterial color="#3a2a1f" roughness={0.55} metalness={0.25} />
      </mesh>
      {/* Window */}
      <mesh position={[0, 0.046, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.24, 0.11]} />
        <meshStandardMaterial color="#171010" roughness={0.3} metalness={0.3} />
      </mesh>
      {/* Reels */}
      {[-0.06, 0.06].map((x) => (
        <mesh key={x} position={[x, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.01, 16]} />
          <meshStandardMaterial color="#c9a67e" roughness={0.4} metalness={0.4} />
        </mesh>
      ))}
      {/* Buttons */}
      {[-0.1, -0.02, 0.06].map((x) => (
        <mesh key={x} position={[x, 0.046, 0.1]} castShadow>
          <boxGeometry args={[0.04, 0.012, 0.02]} />
          <meshStandardMaterial color="#c8a5a8" roughness={0.5} metalness={0.2} />
        </mesh>
      ))}
    </group>
  );
}
