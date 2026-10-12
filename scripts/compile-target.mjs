/**
 * Offline MindAR target compiler with lighting / low-res robust variants.
 *
 * Usage:
 *   npm run compile:target
 *   npm run compile:target -- ./public/images/samraya-billboard.png ./public/targets/samraya.mind
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const require = createRequire(import.meta.url)

const inputPath = path.resolve(
  root,
  process.argv[2] ?? 'public/images/samraya-billboard.png',
)
const outputPath = path.resolve(
  root,
  process.argv[3] ?? 'public/targets/samraya.mind',
)

function resolveCanvasModule() {
  try {
    return require.resolve('canvas', {
      paths: [path.join(root, 'node_modules/mind-ar')],
    })
  } catch {
    return require.resolve('canvas')
  }
}

async function main() {
  console.log('Compiling robust MindAR target (multi-variant)…')
  console.log(`  Input:  ${inputPath}`)
  console.log(`  Output: ${outputPath}`)

  await fs.access(inputPath)

  const canvasPath = resolveCanvasModule()
  console.log(`  Canvas: ${canvasPath}`)

  const canvasModule = await import(pathToFileURL(canvasPath).href)
  const { createCanvas, loadImage } = canvasModule

  const img = await loadImage(inputPath)
  const variants = await buildVariantsWithCanvas(img, { createCanvas, loadImage })

  console.log(`  Variants: ${variants.length} (original, contrast, low-light, low-res)`)

  const offlineModuleUrl = pathToFileURL(
    path.join(root, 'node_modules/mind-ar/src/image-target/offline-compiler.js'),
  ).href

  const { OfflineCompiler } = await import(offlineModuleUrl)
  const compiler = new OfflineCompiler()

  await compiler.compileImageTargets(variants, (percent) => {
    process.stdout.write(`\r  Progress: ${percent.toFixed(1)}%   `)
  })

  const buffer = compiler.exportData()
  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  await fs.writeFile(outputPath, Buffer.from(buffer))
  console.log(`\nWrote ${outputPath} (${buffer.byteLength} bytes)`)
  console.log(
    'Target includes 4 image variants for low light and low-resolution cameras.',
  )
}

function contrastStretch(imageData, lowPct = 0.02, highPct = 0.98) {
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

function darken(imageData, factor = 0.5) {
  const { data } = imageData
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.round(data[i] * factor)
    data[i + 1] = Math.round(data[i + 1] * factor)
    data[i + 2] = Math.round(data[i + 2] * factor)
  }
  return imageData
}

async function buildVariantsWithCanvas(img, { createCanvas, loadImage }) {
  const variants = []

  const clone = async (mutate) => {
    const canvas = createCanvas(img.width, img.height)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0)
    if (mutate) {
      const data = ctx.getImageData(0, 0, img.width, img.height)
      mutate(data, canvas, ctx)
      ctx.putImageData(data, 0, 0)
    }
    return loadImage(canvas.toBuffer('image/png'))
  }

  variants.push(await clone(null))

  variants.push(
    await clone((data) => {
      contrastStretch(data)
    }),
  )

  variants.push(
    await clone((data) => {
      darken(data, 0.5)
      contrastStretch(data, 0.03, 0.97)
    }),
  )

  {
    const scale = 0.45
    const smallW = Math.max(320, Math.round(img.width * scale))
    const smallH = Math.max(180, Math.round(img.height * scale))
    const small = createCanvas(smallW, smallH)
    small.getContext('2d').drawImage(img, 0, 0, smallW, smallH)

    const full = createCanvas(img.width, img.height)
    const ctx = full.getContext('2d')
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(small, 0, 0, img.width, img.height)
    const data = ctx.getImageData(0, 0, img.width, img.height)
    contrastStretch(data, 0.02, 0.98)
    ctx.putImageData(data, 0, 0)
    variants.push(await loadImage(full.toBuffer('image/png')))
  }

  return variants
}

main().catch((error) => {
  console.error('\nTarget compilation failed:')
  console.error(error)
  console.error(
    '\nFallback: open the in-app Target Compiler at /tools/compile after starting the dev server,',
  )
  console.error(
    'or use https://hiukim.github.io/mind-ar-js-doc/tools/compile/',
  )
  process.exit(1)
})
