const PHOTO_TONES = ["#d9b3a3", "#c99a8c", "#e0c3ae", "#caa38f"];

export function PhotoStripObject() {
  return (
    <group>
      {/* Clip */}
      <mesh position={[0, 0.24, 0]} castShadow>
        <boxGeometry args={[0.08, 0.03, 0.03]} />
        <meshStandardMaterial color="#8a6a4f" roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Strip backing */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.22, 0.5, 0.012]} />
        <meshStandardMaterial color="#f4ece4" roughness={0.7} metalness={0.02} />
      </mesh>
      {/* Photos */}
      {PHOTO_TONES.map((tone, i) => (
        <mesh key={tone} position={[0, 0.18 - i * 0.12, 0.008]}>
          <planeGeometry args={[0.17, 0.1]} />
          <meshStandardMaterial color={tone} roughness={0.55} metalness={0.02} />
        </mesh>
      ))}
    </group>
  );
}
