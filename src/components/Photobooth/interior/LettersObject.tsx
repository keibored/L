export function LettersObject() {
  return (
    <group rotation={[-Math.PI / 2, 0, 0.08]}>
      {/* Second envelope peeking out underneath, slightly askew */}
      <group position={[-0.05, -0.03, -0.006]} rotation={[0, 0, -0.16]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.3, 0.2, 0.01]} />
          <meshStandardMaterial color="#d8c9b5" roughness={0.8} metalness={0.01} />
        </mesh>
      </group>

      {/* Main envelope body, with real paper thickness */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.32, 0.22, 0.014]} />
        <meshStandardMaterial color="#ece0d2" roughness={0.72} metalness={0.02} />
      </mesh>
      {/* Flap, folded down over the body */}
      <mesh position={[0, 0.04, 0.011]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.17, 0.024, 3]} />
        <meshStandardMaterial color="#e3d4c1" roughness={0.72} metalness={0.02} />
      </mesh>
      {/* A hint of the letter itself, just visible above the flap */}
      <mesh position={[0, 0.095, 0.003]}>
        <planeGeometry args={[0.28, 0.03]} />
        <meshStandardMaterial color="#f6efe4" roughness={0.85} metalness={0} />
      </mesh>
      {/* Wax seal */}
      <mesh position={[0, 0.02, 0.019]}>
        <cylinderGeometry args={[0.025, 0.023, 0.012, 16]} />
        <meshStandardMaterial color="#7a1f22" roughness={0.38} metalness={0.18} />
      </mesh>
    </group>
  );
}
