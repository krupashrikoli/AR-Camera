/**
 * Offline MindAR target compiler.
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
  console.log('Compiling MindAR target…')
  console.log(`  Input:  ${inputPath}`)
  console.log(`  Output: ${outputPath}`)

  await fs.access(inputPath)

  const canvasPath = resolveCanvasModule()
  console.log(`  Canvas: ${canvasPath}`)
  const { loadImage } = await import(pathToFileURL(canvasPath).href)

  const offlineModuleUrl = pathToFileURL(
    path.join(root, 'node_modules/mind-ar/src/image-target/offline-compiler.js'),
  ).href

  const { OfflineCompiler } = await import(offlineModuleUrl)
  const image = await loadImage(inputPath)
  const compiler = new OfflineCompiler()

  await compiler.compileImageTargets([image], (percent) => {
    process.stdout.write(`\r  Progress: ${percent.toFixed(1)}%   `)
  })

  const buffer = compiler.exportData()
  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  await fs.writeFile(outputPath, Buffer.from(buffer))
  console.log(`\nWrote ${outputPath} (${buffer.byteLength} bytes)`)
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
