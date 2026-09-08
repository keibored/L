interface CachedImage {
  image: HTMLImageElement;
  ready: boolean;
  promise: Promise<boolean>;
}

/** Keep only a small decoded working set; failed requests can be retried. */
export function createImagePreloader(limit = 6, makeImage = () => new Image()) {
  const cache = new Map<string, CachedImage>();

  const preload = (url: string): Promise<boolean> => {
    const cached = cache.get(url);
    if (cached) {
      cache.delete(url);
      cache.set(url, cached);
      return cached.promise;
    }

    const image = makeImage();
    image.decoding = "async";
    image.fetchPriority = "low";
    let finish: (ready: boolean) => void;
    const entry: CachedImage = {
      image,
      ready: false,
      promise: new Promise<boolean>((resolve) => { finish = resolve; }),
    };
    const settle = (ready: boolean) => {
      image.onload = null;
      image.onerror = null;
      entry.ready = ready;
      if (!ready && cache.get(url) === entry) cache.delete(url);
      finish(ready);
    };
    image.onload = () => {
      if (typeof image.decode !== "function") settle(true);
      else void image.decode().then(() => settle(true), () => settle(image.naturalWidth > 0));
    };
    image.onerror = () => settle(false);
    cache.set(url, entry);
    while (cache.size > limit) cache.delete(cache.keys().next().value!);
    image.src = url;
    return entry.promise;
  };

  return { preload, isReady: (url: string) => cache.get(url)?.ready ?? false };
}

export const previewImages = createImagePreloader();
export const originalImages = createImagePreloader(3);
