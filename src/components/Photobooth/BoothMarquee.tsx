import { Text } from "@react-three/drei";

export function BoothMarquee() {
  return (
    <group position={[0, 0, 0.292]}>
      <Text
        position={[0, 1.91, 0]}
        fontSize={0.19}
        letterSpacing={0.19}
        color="#f2e4d7"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.004}
        outlineColor="#5f3f2d"
      >
        SNAPSHOT
      </Text>
      <Text
        position={[0, 1.68, 0.002]}
        fontSize={0.054}
        letterSpacing={0.065}
        color="#f0d5c1"
        anchorX="center"
        anchorY="middle"
      >
        a little place for our memories
      </Text>
    </group>
  );
}
