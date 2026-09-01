import { InteractiveObject } from "./InteractiveObject";
import { MemoryObject } from "./MemoryObject";
import { PhotoStripObject } from "./PhotoStripObject";
import { LettersObject } from "./LettersObject";
import { MusicObject } from "./MusicObject";
import { SurpriseObject } from "./SurpriseObject";
import { OBJECT_POSITIONS } from "./interiorLayout";

interface InteriorObjectsProps {
  visible: boolean;
  interactive: boolean;
}

export function InteriorObjects({ visible, interactive }: InteriorObjectsProps) {
  return (
    <group visible={visible}>
      <InteractiveObject id="memories" position={OBJECT_POSITIONS.memories} labelOffsetY={0.24} interactive={interactive}>
        <MemoryObject />
      </InteractiveObject>
      <InteractiveObject id="photostrip" position={OBJECT_POSITIONS.photostrip} labelOffsetY={0.32} interactive={interactive}>
        <PhotoStripObject />
      </InteractiveObject>
      <InteractiveObject id="letters" position={OBJECT_POSITIONS.letters} labelOffsetY={0.18} interactive={interactive}>
        <LettersObject />
      </InteractiveObject>
      <InteractiveObject id="song" position={OBJECT_POSITIONS.song} labelOffsetY={0.12} interactive={interactive}>
        <MusicObject />
      </InteractiveObject>
      <InteractiveObject id="surprise" position={OBJECT_POSITIONS.surprise} labelOffsetY={0.22} interactive={interactive}>
        <SurpriseObject />
      </InteractiveObject>
    </group>
  );
}
