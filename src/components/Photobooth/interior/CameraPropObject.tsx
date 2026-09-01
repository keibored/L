const LEG_SPREAD = 0.16;
const LEG_HEIGHT = 0.5;

export function CameraPropObject() {
  return (
    <group>
      {/* Tripod legs */}
      {[0, 1, 2].map((i) => {
        const angle = (i / 3) * Math.PI * 2;
        const x = Math.cos(angle) * LEG_SPREAD;
        const z = Math.sin(angle) * LEG_SPREAD;
        const tilt = Math.atan2(LEG_SPREAD, LEG_HEIGHT);
        return (
          <mesh
            key={i}
            position={[x * 0.55, -LEG_HEIGHT / 2, z * 0.55]}
            rotation={[Math.cos(angle) * 0 + z * tilt * 0, 0, 0]}
            castShadow
          >
            <cylinderGeometry args={[0.012, 0.016, LEG_HEIGHT, 8]} />
            <meshStandardMaterial color="#241a15" roughness={0.6} metalness={0.2} />
          </mesh>
        );
      })}
      {/* Head plate */}
      <mesh position={[0, 0.02, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 0.04, 12]} />
        <meshStandardMaterial color="#3a2a1f" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Camera body */}
      <mesh position={[0, 0.14, 0]} castShadow>
        <boxGeometry args={[0.22, 0.16, 0.14]} />
        <meshStandardMaterial color="#1c1410" roughness={0.45} metalness={0.35} />
      </mesh>
      {/* Lens */}
      <mesh position={[0, 0.14, 0.11]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.045, 0.09, 20]} />
        <meshStandardMaterial color="#0e0b09" roughness={0.25} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.14, 0.16]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.038, 0.038, 0.01, 20]} />
        <meshStandardMaterial color="#182838" roughness={0.15} metalness={0.6} emissive="#3a5a78" emissiveIntensity={0.25} />
      </mesh>
      {/* Flash on top */}
      <mesh position={[0, 0.25, 0.02]} castShadow>
        <boxGeometry args={[0.07, 0.05, 0.06]} />
        <meshStandardMaterial color="#2a1f18" roughness={0.5} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0.25, 0.055]}>
        <planeGeometry args={[0.045, 0.03]} />
        <meshStandardMaterial color="#fff3e0" emissive="#ffd9a8" emissiveIntensity={0.5} roughness={0.4} />
      </mesh>
    </group>
  );
}
