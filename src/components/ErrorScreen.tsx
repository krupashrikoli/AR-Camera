import { AlertCircle, RefreshCw, X } from 'lucide-react'

type ErrorScreenProps = {
  title?: string
  message: string
  onRetry?: () => void
  onClose?: () => void
  retryLabel?: string
}

export function ErrorScreen({
  title = 'Unable to continue',
  message,
  onRetry,
  onClose,
  retryLabel = 'Try again',
}: ErrorScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink px-6 safe-pad">
      <div className="w-full max-w-md">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 text-gold">
          <AlertCircle className="h-6 w-6" aria-hidden />
        </div>
        <h1 className="font-display text-3xl text-ivory">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">{message}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 bg-ivory px-5 text-sm font-medium tracking-wide text-ink transition hover:bg-warm-white"
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              {retryLabel}
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 border border-ivory/20 px-5 text-sm font-medium tracking-wide text-ivory transition hover:border-ivory/40"
            >
              <X className="h-4 w-4" aria-hidden />
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
