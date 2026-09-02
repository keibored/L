import { useEffect, useState } from "react";

export const ARCHIVE_IMAGE_URL = "/assets/interior-archive-base.png";
export const ARCHIVE_ASPECT_RATIO = 16 / 9;

export function useInteriorAssetsPreload() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const image = new Image();
    image.decoding = "async";

    const decodeAssets = async () => {
      if (image.decode) await image.decode();
      await document.fonts?.ready;
      if (active) setReady(true);
    };

    const markReady = () => void decodeAssets().catch(() => undefined);

    image.addEventListener("load", markReady, { once: true });
    image.src = ARCHIVE_IMAGE_URL;
    if (image.complete && image.naturalWidth > 0) markReady();

    return () => {
      active = false;
      image.removeEventListener("load", markReady);
    };
  }, []);

  return ready;
}
