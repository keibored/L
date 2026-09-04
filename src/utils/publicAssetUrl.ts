const EXTERNAL_URL = /^(?:[a-z]+:)?\/\//i;

/** Resolves an exact path inside Vite's public directory against its configured base URL. */
export function publicAssetUrl(publicPath: string) {
  if (EXTERNAL_URL.test(publicPath) || publicPath.startsWith("data:") || publicPath.startsWith("blob:")) {
    return publicPath;
  }
  const baseUrl = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return `${baseUrl}${publicPath.replace(/^\/+/, "")}`;
}

/** Replaces one failed display thumbnail with its original image, at most once. */
export function fallBackToOriginal(image: HTMLImageElement, originalPath: string) {
  if (image.dataset.originalFallback === "true") return;
  image.dataset.originalFallback = "true";
  image.src = publicAssetUrl(originalPath);
}
