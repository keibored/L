import { useEffect, useState } from "react";

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);

  return matches;
}

export function useEntrancePreferences() {
  return {
    reducedMotion: useMediaQuery("(prefers-reduced-motion: reduce)"),
    coarsePointer: useMediaQuery("(hover: none), (pointer: coarse)"),
  };
}
