import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Download, ImagePlus } from 'lucide-react'
import {
  compileMindTarget,
  downloadMindFile,
  inspectImageDimensions,
  validateTargetImageFile,
  type ImageQualityIssue,
} from '../utils/targetCompiler'

export function TargetCompilerPage() {
  const [file, setFile] = useState<File | null>(null)
  const [issues, setIssues] = useState<ImageQualityIssue[]>([])
  const [progress, setProgress] = useState<number | null>(null)
  const [stage, setStage] = useState('')
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [compiling, setCompiling] = useState(false)

  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  )

  async function handleFileChange(next: File | null) {
    setFile(next)
    setBuffer(null)
    setError(null)
    setProgress(null)
    setStage('')

    if (!next) {
      setIssues([])
      return
    }

    const fileIssues = validateTargetImageFile(next)
    const dimensionInfo = await inspectImageDimensions(next)
    setIssues([...fileIssues, ...dimensionInfo.issues])
  }

  async function handleCompile() {
    if (!file) return
    setCompiling(true)
    setError(null)
    setBuffer(null)
    try {
      const result = await compileMindTarget([file], ({ percent, stage: s }) => {
        setProgress(percent)
        setStage(s)
      })
      setBuffer(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Compilation failed.')
    } finally {
      setCompiling(false)
    }
  }

  const hasBlockingIssue = issues.some((issue) => issue.level === 'error')

  return (
    <div className="min-h-dvh bg-atmosphere text-ivory safe-pad">
      <div className="mx-auto max-w-2xl py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-ivory"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to scanner
        </Link>

        <h1 className="mt-8 font-display text-4xl">Target Compiler</h1>
        <p className="mt-3 text-sm font-light leading-relaxed text-muted">
          Compile a high-resolution PNG or JPG of the printed billboard into a
          MindAR <code className="text-gold">.mind</code> target file. Raw images
          cannot be used directly for tracking.
        </p>

        <ol className="mt-6 space-y-2 text-sm text-muted">
          <li>1. Select the Samrāya billboard artwork.</li>
          <li>2. Review quality guidance and compile.</li>
          <li>
            3. Download <code className="text-gold">samraya.mind</code> and place
            it in <code className="text-gold">public/targets/</code>.
          </li>
          <li>
            4. Confirm <code className="text-gold">targetSrc</code> in{' '}
            <code className="text-gold">src/config/experience.ts</code>.
          </li>
        </ol>

        <label className="mt-10 flex cursor-pointer flex-col items-center justify-center border border-dashed border-ivory/20 px-6 py-12 transition hover:border-gold/50">
          <ImagePlus className="mb-3 h-6 w-6 text-gold" />
          <span className="text-sm">Select billboard image</span>
          <span className="mt-1 text-xs text-muted">PNG or JPG, preferably 1000px+</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
            onChange={(event) => {
              void handleFileChange(event.target.files?.[0] ?? null)
            }}
          />
        </label>

        {previewUrl && (
          <img
            src={previewUrl}
            alt="Selected target artwork preview"
            className="mt-6 max-h-56 w-full object-contain bg-ink/40"
          />
        )}

        {issues.length > 0 && (
          <ul className="mt-6 space-y-2 text-sm">
            {issues.map((issue) => (
              <li
                key={`${issue.level}-${issue.message}`}
                className={
                  issue.level === 'error'
                    ? 'text-red-300'
                    : issue.level === 'warning'
                      ? 'text-amber-200'
                      : 'text-muted'
                }
              >
                {issue.message}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={!file || hasBlockingIssue || compiling}
            onClick={() => void handleCompile()}
            className="min-h-12 flex-1 bg-ivory px-5 text-sm font-medium tracking-wide text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            {compiling ? 'Compiling…' : 'Compile .mind target'}
          </button>
          <button
            type="button"
            disabled={!buffer}
            onClick={() => buffer && downloadMindFile(buffer, 'samraya.mind')}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 border border-ivory/20 px-5 text-sm tracking-wide disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            Download samraya.mind
          </button>
        </div>

        {progress !== null && (
          <div className="mt-6">
            <div className="mb-2 flex justify-between text-xs text-muted">
              <span>{stage}</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <div className="h-1 bg-ivory/10">
              <div
                className="h-full bg-gold transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

        {buffer && (
          <p className="mt-4 text-sm text-gold-soft">
            Compilation complete ({buffer.byteLength.toLocaleString()} bytes).
            Save the file to <code>public/targets/samraya.mind</code> and restart
            the scanner.
          </p>
        )}

        <div className="mt-12 border-t border-ivory/10 pt-6 text-xs leading-relaxed text-muted">
          <p className="mb-2 text-[11px] tracking-[0.2em] text-gold uppercase">
            CLI alternative
          </p>
          <p>
            From the project root you can also run{' '}
            <code className="text-ivory">npm run compile:target</code> to generate
            the same file with MindAR&apos;s offline compiler.
          </p>
          <p className="mt-2">
            Official browser tool:{' '}
            <a
              className="text-gold underline-offset-2 hover:underline"
              href="https://hiukim.github.io/mind-ar-js-doc/tools/compile/"
              target="_blank"
              rel="noreferrer"
            >
              MindAR Image Targets Compiler
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
