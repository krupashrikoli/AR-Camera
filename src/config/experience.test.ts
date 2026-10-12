import { describe, expect, it } from 'vitest'
import {
  getExperience,
  listExperiences,
  validateExperienceConfig,
} from './experience'

describe('experience config', () => {
  it('returns the default Samrāya experience', () => {
    const experience = getExperience('samraya')
    expect(experience.contentType).toBe('video')
    expect(experience.targetSrc).toBe('/targets/samraya.mind')
    expect(experience.videoSrc).toBe('/videos/samraya.mp4')
  })

  it('lists registered experiences', () => {
    const all = listExperiences()
    expect(all.length).toBeGreaterThan(0)
    expect(all.some((item) => item.id === 'samraya')).toBe(true)
  })

  it('validates a correct config', () => {
    const errors = validateExperienceConfig(getExperience('samraya'))
    expect(errors).toEqual([])
  })

  it('rejects raw image targets and missing media', () => {
    const experience = getExperience('samraya')
    const errors = validateExperienceConfig({
      ...experience,
      targetSrc: '/targets/samraya.png',
      contentType: 'video',
      videoSrc: '',
    })
    expect(errors).toContain('Target source must be a compiled .mind file.')
    expect(errors).toContain('Video source is required for video content.')
  })

  it('throws for unknown experience ids', () => {
    expect(() => getExperience('missing')).toThrow(/Unknown experience/)
  })
})
