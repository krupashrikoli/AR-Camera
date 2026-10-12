export type BrowserSupport = {
  supported: boolean
  reasons: string[]
}

export function isSecureContextForCamera(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.isSecureContext ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  )
}

export function hasMediaDevices(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
}

export function hasWebGL(): boolean {
  if (typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return !!(
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
    )
  } catch {
    return false
  }
}

export function checkBrowserSupport(): BrowserSupport {
  const reasons: string[] = []

  if (!isSecureContextForCamera()) {
    reasons.push(
      'Camera access requires HTTPS or localhost. Open this page over a secure connection.',
    )
  }
  if (!hasMediaDevices()) {
    reasons.push('This browser does not expose a camera API (getUserMedia).')
  }
  if (!hasWebGL()) {
    reasons.push('WebGL is required for AR rendering and is unavailable.')
  }

  return {
    supported: reasons.length === 0,
    reasons,
  }
}

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android/i.test(navigator.userAgent)
}

export function preferRearCameraConstraints(): MediaTrackConstraints {
  return {
    facingMode: { ideal: 'environment' },
    width: { ideal: 1280 },
    height: { ideal: 720 },
  }
}

export function lockBodyScroll(locked: boolean): void {
  if (typeof document === 'undefined') return
  document.body.style.overflow = locked ? 'hidden' : ''
  document.documentElement.style.overscrollBehavior = locked ? 'none' : ''
}
