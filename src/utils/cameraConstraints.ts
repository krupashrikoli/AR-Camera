import type { TrackingConfig } from '../config/tracking'

/**
 * MindAR hardcodes basic getUserMedia constraints.
 * Temporarily wrap getUserMedia so the rear camera uses lighting-friendly
 * 720p capture (better light per pixel than 4K on weak sensors).
 */
export async function withRobustCameraConstraints<T>(
  tracking: TrackingConfig,
  run: () => Promise<T>,
): Promise<T> {
  const mediaDevices = navigator.mediaDevices
  if (!mediaDevices?.getUserMedia) {
    return run()
  }

  const original = mediaDevices.getUserMedia.bind(mediaDevices)

  mediaDevices.getUserMedia = ((constraints?: MediaStreamConstraints) => {
    const requested =
      constraints && typeof constraints === 'object' ? constraints : {}

    const videoConstraint: MediaTrackConstraints = {
      facingMode: { ideal: 'environment' },
      width: { ideal: tracking.idealWidth, max: 1920 },
      height: { ideal: tracking.idealHeight, max: 1080 },
      frameRate: { ideal: 30, max: 30 },
    }

    // Preserve an explicit deviceId if MindAR already selected one.
    const originalVideo = requested.video
    if (originalVideo && typeof originalVideo === 'object') {
      const deviceId = (originalVideo as MediaTrackConstraints).deviceId
      if (deviceId) {
        videoConstraint.deviceId = deviceId
        delete videoConstraint.facingMode
      }
    }

    return original({
      audio: false,
      video: videoConstraint,
    }).then(async (stream) => {
      await applyAdvancedTrackSettings(stream)
      return stream
    })
  }) as typeof mediaDevices.getUserMedia

  try {
    return await run()
  } finally {
    mediaDevices.getUserMedia = original
  }
}

async function applyAdvancedTrackSettings(stream: MediaStream): Promise<void> {
  const [track] = stream.getVideoTracks()
  if (!track || typeof track.getCapabilities !== 'function') return

  try {
    const caps = track.getCapabilities() as MediaTrackCapabilities & {
      exposureMode?: string[]
      focusMode?: string[]
      whiteBalanceMode?: string[]
    }
    const advanced: Record<string, string> = {}

    if (caps.exposureMode?.includes('continuous')) {
      advanced.exposureMode = 'continuous'
    }
    if (caps.focusMode?.includes('continuous')) {
      advanced.focusMode = 'continuous'
    }
    if (caps.whiteBalanceMode?.includes('continuous')) {
      advanced.whiteBalanceMode = 'continuous'
    }

    if (Object.keys(advanced).length > 0) {
      await track.applyConstraints({
        advanced: [advanced],
      } as MediaTrackConstraints)
    }
  } catch {
    // Advanced constraints are optional — ignore unsupported devices.
  }
}
