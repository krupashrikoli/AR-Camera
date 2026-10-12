import { describe, expect, it } from 'vitest'
import { validateTargetImageFile } from './targetCompiler'

describe('targetCompiler utils', () => {
  it('accepts png artwork', () => {
    const file = new File(['fake'], 'billboard.png', { type: 'image/png' })
    Object.defineProperty(file, 'size', { value: 120_000 })
    const issues = validateTargetImageFile(file)
    expect(issues.some((issue) => issue.level === 'error')).toBe(false)
  })

  it('rejects unsupported formats', () => {
    const file = new File(['fake'], 'billboard.gif', { type: 'image/gif' })
    Object.defineProperty(file, 'size', { value: 120_000 })
    const issues = validateTargetImageFile(file)
    expect(issues.some((issue) => issue.level === 'error')).toBe(true)
  })
})
