export function isDirectInteriorPreview() {
  if (!import.meta.env.DEV || typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("scene") === "interior";
}

export function isTransitionDebug() {
  if (!import.meta.env.DEV || typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("debugTransition") === "1";
}

export function isExitDebug() {
  if (!import.meta.env.DEV || typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("debugExit") === "1";
}

export function isCurtainDebug() {
  if (!import.meta.env.DEV || typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("debugCurtain") === "1";
}
