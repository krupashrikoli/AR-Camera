import { describe, expect, it } from 'vitest'
import { checkBrowserSupport, preferRearCameraConstraints } from './device'

describe('device utils', () => {
  it('reports rear-camera preference', () => {
    const constraints = preferRearCameraConstraints()
    expect(constraints.facingMode).toEqual({ ideal: 'environment' })
  })

  it('returns a browser support result object', () => {
    const result = checkBrowserSupport()
    expect(typeof result.supported).toBe('boolean')
    expect(Array.isArray(result.reasons)).toBe(true)
  })
})
