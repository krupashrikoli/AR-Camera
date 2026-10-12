import type { ReactNode } from 'react'
import { Pause, Play, RotateCcw, Square, Volume2, VolumeX } from 'lucide-react'

type MediaControlsProps = {
  visible: boolean
  isMuted: boolean
  isPaused: boolean
  autoplayBlocked: boolean
  showVideoControls: boolean
  onPlay: () => void
  onToggleMute: () => void
  onTogglePause: () => void
  onReplay: () => void
  onStop: () => void
}

export function MediaControls({
  visible,
  isMuted,
  isPaused,
  autoplayBlocked,
  showVideoControls,
  onPlay,
  onToggleMute,
  onTogglePause,
  onReplay,
  onStop,
}: MediaControlsProps) {
  if (!visible) return null

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 safe-pad">
      <div className="pointer-events-auto mx-auto flex max-w-md flex-col items-center gap-3 pb-2">
        {autoplayBlocked && (
          <button
            type="button"
            onClick={onPlay}
            className="inline-flex min-h-12 items-center justify-center gap-2 bg-ivory px-6 text-sm font-medium tracking-wide text-ink"
          >
            <Play className="h-4 w-4" aria-hidden />
            Play experience
          </button>
        )}

        {showVideoControls && (
          <div className="flex items-center gap-2 rounded-full border border-ivory/15 bg-ink/55 px-2 py-2 backdrop-blur-md">
            <ControlButton
              label={isPaused ? 'Resume' : 'Pause'}
              onClick={onTogglePause}
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </ControlButton>
            <ControlButton
              label={isMuted ? 'Unmute' : 'Mute'}
              onClick={onToggleMute}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </ControlButton>
            <ControlButton label="Replay" onClick={onReplay}>
              <RotateCcw className="h-4 w-4" />
            </ControlButton>
            <ControlButton label="Stop experience" onClick={onStop}>
              <Square className="h-4 w-4" />
            </ControlButton>
          </div>
        )}
      </div>
    </div>
  )
}

function ControlButton({
  children,
  label,
  onClick,
}: {
  children: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center rounded-full text-ivory transition hover:bg-ivory/10"
    >
      {children}
    </button>
  )
}
