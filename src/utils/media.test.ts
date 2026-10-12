import { describe, expect, it } from 'vitest'
import { degToRad, createARVideoElement } from './media'

describe('media utils', () => {
  it('converts degrees to radians', () => {
    expect(degToRad(0)).toBe(0)
    expect(degToRad(180)).toBeCloseTo(Math.PI)
  })

  it('creates a mobile-friendly video element', () => {
    const video = createARVideoElement('/videos/samraya.mp4', {
      muted: true,
      loop: true,
    })
    expect(video.muted).toBe(true)
    expect(video.loop).toBe(true)
    expect(video.playsInline).toBe(true)
    expect(video.getAttribute('playsinline')).toBe('true')
    expect(video.getAttribute('webkit-playsinline')).toBe('true')
    video.remove()
  })
})
