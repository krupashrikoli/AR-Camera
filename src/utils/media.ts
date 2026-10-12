export function createARVideoElement(src: string, options: {
  muted: boolean
  loop: boolean
}): HTMLVideoElement {
  const video = document.createElement('video')
  video.src = src
  video.crossOrigin = 'anonymous'
  video.playsInline = true
  video.setAttribute('playsinline', 'true')
  video.setAttribute('webkit-playsinline', 'true')
  video.muted = options.muted
  video.loop = options.loop
  video.preload = 'auto'
  video.style.display = 'none'
  return video
}

export async function playVideoSafe(
  video: HTMLVideoElement,
): Promise<{ played: boolean; blocked: boolean; error?: string }> {
  try {
    await video.play()
    return { played: true, blocked: false }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const blocked =
      message.toLowerCase().includes('play') ||
      message.toLowerCase().includes('user') ||
      message.toLowerCase().includes('interact') ||
      (error instanceof DOMException && error.name === 'NotAllowedError')

    return {
      played: false,
      blocked,
      error: message,
    }
  }
}

export function pauseVideo(video: HTMLVideoElement | null): void {
  if (!video) return
  if (!video.paused) {
    video.pause()
  }
}

export function disposeVideo(video: HTMLVideoElement | null): void {
  if (!video) return
  pauseVideo(video)
  video.removeAttribute('src')
  video.load()
  video.remove()
}

export async function assetExists(url: string): Promise<boolean> {
  try {
    // Prefer cached responses so startup checks stay cheap after warmup.
    const response = await fetch(url, { method: 'HEAD', cache: 'force-cache' })
    if (response.ok) return true

    const fallback = await fetch(url, {
      method: 'GET',
      headers: { Range: 'bytes=0-0' },
      cache: 'force-cache',
    })
    return fallback.ok || fallback.status === 206
  } catch {
    return false
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180
}
