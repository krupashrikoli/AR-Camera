import { X } from 'lucide-react'
import type { ScannerPhase } from '../hooks/useARScanner'

type ScannerOverlayProps = {
  brandName: string
  instructionText: string
  detectedText: string
  lostText: string
  phase: ScannerPhase
  onClose: () => void
}

export function ScannerOverlay({
  brandName,
  instructionText,
  detectedText,
  lostText,
  phase,
  onClose,
}: ScannerOverlayProps) {
  const statusLabel =
    phase === 'detected'
      ? detectedText
      : phase === 'lost'
        ? lostText
        : phase === 'initializing'
          ? 'Opening camera…'
          : 'Searching for artwork…'

  return (
    <div className="pointer-events-none absolute inset-0 z-20 safe-pad">
      <div className="pointer-events-auto flex items-center justify-between">
        <div>
          <p className="font-display text-lg tracking-[0.16em] text-ivory uppercase drop-shadow">
            {brandName}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Exit scanner"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-ivory/25 bg-ink/40 text-ivory backdrop-blur-md transition hover:border-ivory/50"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm font-light text-ivory/90 drop-shadow">
          {phase === 'detected' ? detectedText : instructionText}
        </p>
        <p className="mt-2 text-[11px] tracking-[0.2em] text-gold uppercase drop-shadow">
          {statusLabel}
        </p>
      </div>

      {(phase === 'scanning' || phase === 'lost' || phase === 'initializing') && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative h-56 w-56 sm:h-72 sm:w-72">
            <span className="absolute top-0 left-0 h-8 w-8 border-t border-l border-ivory/70" />
            <span className="absolute top-0 right-0 h-8 w-8 border-t border-r border-ivory/70" />
            <span className="absolute bottom-0 left-0 h-8 w-8 border-b border-l border-ivory/70" />
            <span className="absolute right-0 bottom-0 h-8 w-8 border-r border-b border-ivory/70" />
          </div>
        </div>
      )}
    </div>
  )
}
