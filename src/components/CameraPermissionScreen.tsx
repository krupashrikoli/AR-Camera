import { Camera, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ExperienceConfig } from '../config/experience'
import { ExperienceSelector } from './ExperienceSelector'

type CameraPermissionScreenProps = {
  brandName: string
  experienceTitle: string
  onStart: () => void
  starting?: boolean
  experiences?: ExperienceConfig[]
  selectedExperienceId?: string
  onSelectExperience?: (id: string) => void
}

export function CameraPermissionScreen({
  brandName,
  experienceTitle,
  onStart,
  starting = false,
  experiences = [],
  selectedExperienceId,
  onSelectExperience,
}: CameraPermissionScreenProps) {
  return (
    <div className="relative flex min-h-full flex-col bg-atmosphere safe-pad">
      <header className="flex items-start justify-between pt-2">
        <div>
          <p className="font-display text-xl tracking-[0.18em] text-ivory uppercase">
            {brandName}
          </p>
          <p className="mt-1 text-[11px] tracking-[0.28em] text-gold uppercase">
            {experienceTitle}
          </p>
        </div>
        <Link
          to="/tools/compile"
          className="text-[11px] tracking-wide text-muted transition hover:text-gold"
        >
          Target tools
        </Link>
      </header>

      <main className="flex flex-1 flex-col justify-center py-16">
        <p className="text-xs tracking-[0.35em] text-gold uppercase">WebAR</p>
        <h1 className="mt-4 max-w-md font-display text-5xl leading-[1.05] text-ivory sm:text-6xl">
          Experience More.
        </h1>
        <p className="mt-5 max-w-md text-base font-light leading-relaxed text-muted">
          Point your camera at a registered GHD Hotels visual to discover an
          experience beyond the ordinary.
        </p>

        <div className="mt-10 flex flex-col gap-4">
          <button
            type="button"
            onClick={onStart}
            disabled={starting}
            className="inline-flex min-h-12 w-full max-w-sm items-center justify-center gap-3 bg-ivory px-6 text-sm font-medium tracking-[0.12em] text-ink uppercase transition hover:bg-warm-white disabled:cursor-wait disabled:opacity-70"
          >
            <Camera className="h-4 w-4" aria-hidden />
            {starting ? 'Starting…' : 'Start AR Experience'}
          </button>
          <p className="text-xs text-muted">Camera access is required.</p>
        </div>

        {selectedExperienceId && onSelectExperience && (
          <ExperienceSelector
            experiences={experiences}
            selectedId={selectedExperienceId}
            onSelect={onSelectExperience}
          />
        )}
      </main>

      <footer className="pb-2">
        <div className="flex items-start gap-2 text-[11px] leading-relaxed text-muted/80">
          <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold/70" aria-hidden />
          <p>
            Camera frames are processed on your device for image tracking and are
            not uploaded to GHD Hotels servers.
          </p>
        </div>
      </footer>
    </div>
  )
}
