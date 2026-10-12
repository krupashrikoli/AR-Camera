type MindARModule = typeof import('mind-ar/dist/mindar-image-three.prod.js')

let mindarPromise: Promise<MindARModule> | null = null
const prefetched = new Set<string>()

export function preloadMindAR(): Promise<MindARModule> {
  if (!mindarPromise) {
    mindarPromise = import('mind-ar/dist/mindar-image-three.prod.js')
  }
  return mindarPromise
}

/** Warm HTTP cache for .mind / media so Start feels instant. */
export function prefetchAsset(url: string): Promise<boolean> {
  if (prefetched.has(url)) return Promise.resolve(true)
  prefetched.add(url)

  return fetch(url, { cache: 'force-cache' })
    .then((response) => response.ok)
    .catch(() => {
      prefetched.delete(url)
      return false
    })
}

export function warmupExperienceAssets(options: {
  targetSrc: string
  videoSrc?: string
  modelSrc?: string
  contentType: 'video' | '3d'
}): void {
  void preloadMindAR()
  void prefetchAsset(options.targetSrc)

  if (options.contentType === 'video' && options.videoSrc) {
    // Metadata-only warmup — do not block the main thread downloading the full file.
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'video'
    link.href = options.videoSrc
    link.setAttribute('data-ar-warmup', 'video')
    if (!document.head.querySelector(`link[data-ar-warmup="video"][href="${options.videoSrc}"]`)) {
      document.head.appendChild(link)
    }
  }

  if (options.contentType === '3d' && options.modelSrc) {
    void prefetchAsset(options.modelSrc)
  }
}
