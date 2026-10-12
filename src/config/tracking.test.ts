import { describe, expect, it } from 'vitest'
import { getExperience } from './experience'
import { robustTracking } from './tracking'

describe('robust tracking config', () => {
  it('uses faster lock and longer hold than MindAR defaults', () => {
    expect(robustTracking.warmupTolerance).toBeLessThan(5)
    expect(robustTracking.missTolerance).toBeGreaterThan(5)
    expect(robustTracking.filterBeta).toBeGreaterThanOrEqual(1000)
  })

  it('is wired into the Samrāya experience with multi-variant targets', () => {
    const experience = getExperience('samraya')
    expect(experience.tracking).toEqual(robustTracking)
    expect(experience.targetCount).toBe(4)
  })
})
