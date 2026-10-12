type LoadingScreenProps = {
  message?: string
  detail?: string
}

export function LoadingScreen({
  message = 'Preparing your experience…',
  detail = 'Initializing camera and image tracking.',
}: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/90 px-6 backdrop-blur-sm">
      <div className="flex max-w-sm flex-col items-center text-center">
        <div
          className="mb-6 h-10 w-10 animate-spin rounded-full border border-gold/30 border-t-gold"
          aria-hidden
        />
        <p className="font-display text-2xl tracking-wide text-ivory">{message}</p>
        <p className="mt-2 text-sm font-light text-muted">{detail}</p>
      </div>
    </div>
  )
}
