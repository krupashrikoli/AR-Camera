import { downloadBlob } from './media'

export type ImageQualityIssue = {
  level: 'error' | 'warning' | 'info'
  message: string
}

export type CompileProgress = {
  percent: number
  stage: string
}

const MAX_FILE_BYTES = 15 * 1024 * 1024
const MIN_DIMENSION = 480
const RECOMMENDED_MIN = 1000

export function validateTargetImageFile(file: File): ImageQualityIssue[] {
  const issues: ImageQualityIssue[] = []
  const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']

  if (!allowed.includes(file.type) && !/\.(png|jpe?g|webp)$/i.test(file.name)) {
    issues.push({
      level: 'error',
      message: 'Use a PNG or JPG of the actual printed billboard artwork.',
    })
  }

  if (file.size > MAX_FILE_BYTES) {
    issues.push({
      level: 'error',
      message: 'Image exceeds 15 MB. Compress the artwork before compiling.',
    })
  }

  if (file.size < 40_000) {
    issues.push({
      level: 'warning',
      message:
        'File is very small. Low-resolution artwork often tracks poorly.',
    })
  }

  return issues
}

export async function inspectImageDimensions(
  file: File,
): Promise<{ width: number; height: number; issues: ImageQualityIssue[] }> {
  const url = URL.createObjectURL(file)
  try {
    const img = await loadHtmlImage(url)
    const issues: ImageQualityIssue[] = []

    if (img.width < MIN_DIMENSION || img.height < MIN_DIMENSION) {
      issues.push({
        level: 'error',
        message: `Image is ${img.width}×${img.height}. Minimum recommended size is ${MIN_DIMENSION}px on the shortest side.`,
      })
    } else if (img.width < RECOMMENDED_MIN || img.height < RECOMMENDED_MIN) {
      issues.push({
        level: 'warning',
        message: `Image is ${img.width}×${img.height}. For billboards, ${RECOMMENDED_MIN}px+ on the shortest side improves tracking.`,
      })
    } else {
      issues.push({
        level: 'info',
        message: `Image resolution ${img.width}×${img.height} looks suitable for compilation.`,
      })
    }

    issues.push({
      level: 'info',
      message:
        'Good targets have high contrast, sharp detail, and unique visual features. Avoid large flat color areas.',
    })

    return { width: img.width, height: img.height, issues }
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image for compilation.'))
    img.src = src
  })
}

export async function compileMindTarget(
  files: File[],
  onProgress?: (progress: CompileProgress) => void,
): Promise<ArrayBuffer> {
  if (files.length === 0) {
    throw new Error('Select at least one image to compile.')
  }

  for (const file of files) {
    const fileIssues = validateTargetImageFile(file)
    if (fileIssues.some((issue) => issue.level === 'error')) {
      throw new Error(fileIssues.find((i) => i.level === 'error')!.message)
    }
  }

  onProgress?.({ percent: 1, stage: 'Loading MindAR compiler…' })

  const { Compiler } = await import('mind-ar/dist/mindar-image.prod.js')
  const compiler = new Compiler()

  const images: HTMLImageElement[] = []
  for (const file of files) {
    const objectUrl = URL.createObjectURL(file)
    try {
      images.push(await loadHtmlImage(objectUrl))
    } finally {
      URL.revokeObjectURL(objectUrl)
    }
  }

  onProgress?.({ percent: 5, stage: 'Extracting feature points…' })

  await compiler.compileImageTargets(images, (percent: number) => {
    onProgress?.({
      percent: Math.min(99, Math.max(5, percent)),
      stage: 'Compiling image target…',
    })
  })

  onProgress?.({ percent: 99, stage: 'Exporting .mind file…' })
  const buffer = await compiler.exportData()
  onProgress?.({ percent: 100, stage: 'Complete' })
  return buffer as ArrayBuffer
}

export function downloadMindFile(
  buffer: ArrayBuffer,
  filename = 'samraya.mind',
): void {
  const blob = new Blob([buffer], { type: 'application/octet-stream' })
  downloadBlob(blob, filename)
}
