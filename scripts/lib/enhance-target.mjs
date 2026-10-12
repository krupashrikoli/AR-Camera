/**
 * Build lighting-robust variants of a billboard for MindAR compilation.
 * All variants keep the same dimensions so each maps to the full physical artwork.
 */
import { createCanvas, loadImage } from 'canvas'

function drawBase(img) {
  const canvas = createCanvas(img.width, img.height)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0)
  return { canvas, ctx, data: ctx.getImageData(0, 0, img.width, img.height) }
}

function writePixels(ctx, imageData) {
  ctx.putImageData(imageData, 0, 0)
}

/** Stretch luminance so mid-tones separate — more stable feature points. */
export function contrastStretch(imageData, lowPct = 0.02, highPct = 0.98) {
  const { data } = imageData
  const hist = new Array(256).fill(0)
  const greys = new Uint8Array(data.length / 4)

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const g = Math.round((data[i] + data[i + 1] + data[i + 2]) / 3)
    greys[p] = g
    hist[g]++
  }

  const total = greys.length
  let low = 0
  let high = 255
  let acc = 0
  for (let i = 0; i < 256; i++) {
    acc += hist[i]
    if (acc / total >= lowPct) {
      low = i
      break
    }
  }
  acc = 0
  for (let i = 255; i >= 0; i--) {
    acc += hist[i]
    if (acc / total >= 1 - highPct) {
      high = i
      break
    }
  }
  if (high <= low) {
    low = 0
    high = 255
  }

  const scale = 255 / (high - low)
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const v = Math.max(0, Math.min(255, Math.round((greys[p] - low) * scale)))
    data[i] = v
    data[i + 1] = v
    data[i + 2] = v
  }
  return imageData
}

/** Simulate a dim camera feed so descriptors still match in low light. */
export function darken(imageData, factor = 0.55) {
  const { data } = imageData
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.round(data[i] * factor)
    data[i + 1] = Math.round(data[i + 1] * factor)
    data[i + 2] = Math.round(data[i + 2] * factor)
  }
  return imageData
}

/** Mild unsharp mask via canvas — helps soft / low-res phone cameras. */
export function sharpen(canvas, amount = 0.55) {
  const w = canvas.width
  const h = canvas.height
  const out = createCanvas(w, h)
  const ctx = out.getContext('2d')
  ctx.filter = 'none'
  ctx.drawImage(canvas, 0, 0)
  ctx.globalAlpha = amount
  ctx.filter = 'contrast(1.15) saturate(0.9)'
  ctx.drawImage(canvas, 0, 0)
  ctx.globalAlpha = 1
  ctx.filter = 'none'
  return out
}

/**
 * Downscale then upscale — removes fine noise the phone camera would never see,
 * leaving coarse structures that low-resolution sensors can still match.
 */
export function lowResFriendly(img, scale = 0.5) {
  const smallW = Math.max(320, Math.round(img.width * scale))
  const smallH = Math.max(180, Math.round(img.height * scale))
  const small = createCanvas(smallW, smallH)
  small.getContext('2d').drawImage(img, 0, 0, smallW, smallH)

  const full = createCanvas(img.width, img.height)
  const ctx = full.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.drawImage(small, 0, 0, img.width, img.height)
  return full
}

export async function buildTrackingVariants(inputPath) {
  const img = await loadImage(inputPath)
  const variants = []

  // 0 — original artwork (exact print match)
  {
    const { canvas } = drawBase(img)
    variants.push(await loadImage(canvas.toBuffer('image/png')))
  }

  // 1 — contrast-stretched (feature-rich, lighting-tolerant)
  {
    const { canvas, ctx, data } = drawBase(img)
    contrastStretch(data)
    writePixels(ctx, data)
    variants.push(await loadImage(canvas.toBuffer('image/png')))
  }

  // 2 — darkened + contrast (matches dim indoor / evening camera frames)
  {
    const { canvas, ctx, data } = drawBase(img)
    darken(data, 0.5)
    contrastStretch(data, 0.03, 0.97)
    writePixels(ctx, data)
    variants.push(await loadImage(canvas.toBuffer('image/png')))
  }

  // 3 — low-res friendly (matches soft / noisy phone sensors)
  {
    const soft = lowResFriendly(img, 0.45)
    const ctx = soft.getContext('2d')
    const data = ctx.getImageData(0, 0, soft.width, soft.height)
    contrastStretch(data, 0.02, 0.98)
    writePixels(ctx, data)
    variants.push(await loadImage(soft.toBuffer('image/png')))
  }

  return variants
}
