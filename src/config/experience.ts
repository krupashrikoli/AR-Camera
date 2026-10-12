export type ContentType = 'video' | '3d'

export type Vec3 = {
  x: number
  y: number
  z: number
}

export type ExperienceConfig = {
  id: string
  brandName: string
  experienceTitle: string
  displayName: string
  instructionText: string
  detectedText: string
  lostText: string
  targetSrc: string
  targetIndex: number
  contentType: ContentType
  videoSrc: string
  modelSrc: string
  /** Width/height of the video plane relative to the MindAR target unit size (1 = full target width). */
  videoSize: { width: number; height: number }
  /** When true, video plane covers the full artwork; when false, floats as a smaller panel. */
  overlayFullArtwork: boolean
  position: Vec3
  scale: Vec3
  rotation: Vec3
  videoAutoplay: boolean
  videoLoop: boolean
  muteByDefault: boolean
  pauseOnTrackingLost: boolean
  playModelAnimations: boolean
}

export const DEFAULT_EXPERIENCE_ID = 'samraya'

/**
 * Registry of named AR experiences.
 * Add new billboard designs here — each maps to its own .mind target and media.
 */
export const experiences: Record<string, ExperienceConfig> = {
  samraya: {
    id: 'samraya',
    brandName: 'GHD Hotels',
    experienceTitle: 'Samrāya',
    displayName: 'Samrāya Lifestyle and Wellness Resort',
    instructionText: 'Point your camera at the artwork.',
    detectedText: 'Experience found.',
    lostText: 'Find the artwork again',
    targetSrc: '/targets/samraya.mind',
    targetIndex: 0,
    contentType: 'video',
    videoSrc: '/videos/samraya.mp4',
    modelSrc: '/models/samraya.glb',
    // Billboard artwork is 1280×524 (~2.44:1). MindAR normalizes target width to 1.
    videoSize: { width: 1, height: 0.409 },
    overlayFullArtwork: true,
    position: { x: 0, y: 0, z: 0.01 },
    scale: { x: 1, y: 1, z: 1 },
    rotation: { x: 0, y: 0, z: 0 },
    videoAutoplay: true,
    videoLoop: true,
    muteByDefault: true,
    pauseOnTrackingLost: true,
    playModelAnimations: true,
  },
}

export function getExperience(id: string = DEFAULT_EXPERIENCE_ID): ExperienceConfig {
  const experience = experiences[id]
  if (!experience) {
    throw new Error(`Unknown experience id: ${id}`)
  }
  return experience
}

export function listExperiences(): ExperienceConfig[] {
  return Object.values(experiences)
}

export function validateExperienceConfig(config: ExperienceConfig): string[] {
  const errors: string[] = []

  if (!config.id?.trim()) errors.push('Experience id is required.')
  if (!config.targetSrc?.trim()) errors.push('Target source path is required.')
  if (!config.targetSrc.endsWith('.mind')) {
    errors.push('Target source must be a compiled .mind file.')
  }
  if (config.targetIndex < 0 || !Number.isInteger(config.targetIndex)) {
    errors.push('Target index must be a non-negative integer.')
  }
  if (config.contentType !== 'video' && config.contentType !== '3d') {
    errors.push('Content type must be "video" or "3d".')
  }
  if (config.contentType === 'video' && !config.videoSrc?.trim()) {
    errors.push('Video source is required for video content.')
  }
  if (config.contentType === '3d' && !config.modelSrc?.trim()) {
    errors.push('Model source is required for 3D content.')
  }
  if (config.videoSize.width <= 0 || config.videoSize.height <= 0) {
    errors.push('Video size width and height must be positive.')
  }

  return errors
}

/** Development-only debug panel. Hidden in production builds unless explicitly enabled. */
export const debugConfig = {
  enabled: import.meta.env.DEV && import.meta.env.VITE_DEBUG_AR === 'true',
}
