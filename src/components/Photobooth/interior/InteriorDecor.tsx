import { CameraPropObject } from "./CameraPropObject";
import { StoolObject } from "./StoolObject";
import { StringLights } from "./StringLights";
import { PhotoFrames } from "./PhotoFrames";
import { CAMERA_PROP_POSITION, STOOL_POSITION } from "./interiorLayout";

interface InteriorDecorProps {
  visible: boolean;
}

export function InteriorDecor({ visible }: InteriorDecorProps) {
  return (
    <group visible={visible}>
      <group position={CAMERA_PROP_POSITION}>
        <CameraPropObject />
      </group>
      <group position={STOOL_POSITION}>
        <StoolObject />
      </group>
      <StringLights />
      <PhotoFrames />
    </group>
  );
}
