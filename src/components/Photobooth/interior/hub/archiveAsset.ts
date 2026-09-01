import { useEffect, useState } from "react";

export const ARCHIVE_IMAGE_URL = "/assets/interior-archive-base.png";
export const ARCHIVE_ASPECT_RATIO = 16 / 9;

export function useArchiveImagePreload() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const image = new Image();
    image.decoding = "async";

    const markReady = () => {
      const decode = image.decode?.();
      if (!decode) {
        if (active) setReady(true);
        return;
      }
      decode.catch(() => undefined).finally(() => {
        if (active) setReady(true);
      });
    };

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
