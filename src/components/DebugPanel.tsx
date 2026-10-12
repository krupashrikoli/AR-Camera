import type { DebugInfo, ScannerPhase } from '../hooks/useARScanner'

type DebugPanelProps = {
  enabled: boolean
  phase: ScannerPhase
  debugInfo: DebugInfo
  onRestart: () => void
}

export function DebugPanel({
  enabled,
  phase,
  debugInfo,
  onRestart,
}: DebugPanelProps) {
  if (!enabled) return null

  return (
    <div className="pointer-events-none absolute top-20 right-3 z-40 max-w-[220px] rounded border border-ivory/15 bg-ink/75 p-3 font-mono text-[10px] leading-relaxed text-ivory/80 backdrop-blur-md">
      <p className="mb-2 tracking-wider text-gold uppercase">AR Debug</p>
      <DebugLine label="phase" value={phase} />
      <DebugLine label="mode" value={debugInfo.mode} />
      <DebugLine label="camera" value={debugInfo.cameraStatus} />
      <DebugLine label="target" value={debugInfo.targetStatus} />
      <DebugLine label="detect" value={debugInfo.detectionStatus} />
      <DebugLine label="media" value={debugInfo.mediaStatus} />
      {debugInfo.error && <DebugLine label="error" value={debugInfo.error} />}
      <button
        type="button"
        onClick={onRestart}
        className="pointer-events-auto mt-3 w-full border border-ivory/20 px-2 py-1.5 text-[10px] tracking-wide text-ivory uppercase transition hover:border-gold hover:text-gold"
      >
        Restart AR
      </button>
    </div>
  )
}

function DebugLine({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="text-muted">{label}: </span>
      {value}
    </p>
  )
}
