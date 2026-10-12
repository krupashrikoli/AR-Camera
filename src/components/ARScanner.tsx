import { useMemo, useState } from 'react'
import {
  debugConfig,
  getExperience,
  listExperiences,
  type ExperienceConfig,
} from '../config/experience'
import { useARScanner } from '../hooks/useARScanner'
import { CameraPermissionScreen } from './CameraPermissionScreen'
import { DebugPanel } from './DebugPanel'
import { ErrorScreen } from './ErrorScreen'
import { LoadingScreen } from './LoadingScreen'
import { MediaControls } from './MediaControls'
import { ScannerOverlay } from './ScannerOverlay'

type ARScannerProps = {
  initialExperienceId?: string
}

function useDebugEnabled(): boolean {
  const params =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : null
  return (
    debugConfig.enabled ||
    import.meta.env.DEV ||
    params?.get('debug') === '1' ||
    import.meta.env.VITE_DEBUG_AR === 'true'
  )
}

export function ARScanner({ initialExperienceId }: ARScannerProps) {
  const experiences = useMemo(() => listExperiences(), [])
  const [experienceId, setExperienceId] = useState(
    initialExperienceId ?? experiences[0]?.id ?? 'samraya',
  )
  const experience = useMemo(
    () => getExperience(experienceId),
    [experienceId],
  )
  const debugEnabled = useDebugEnabled()

  return (
    <ARScannerSession
      key={experience.id}
      experience={experience}
      debugEnabled={debugEnabled}
      experiences={experiences}
      onSelectExperience={setExperienceId}
    />
  )
}

function ARScannerSession({
  experience,
  debugEnabled,
  experiences,
  onSelectExperience,
}: {
  experience: ExperienceConfig
  debugEnabled: boolean
  experiences: ExperienceConfig[]
  onSelectExperience: (id: string) => void
}) {
  const {
    phase,
    errorMessage,
    autoplayBlocked,
    isMuted,
    isPaused,
    cameraLive,
    debugInfo,
    containerRef,
    start,
    stop,
    retry,
    playMedia,
    toggleMute,
    togglePause,
    replay,
  } = useARScanner(experience)

  const active =
    phase === 'initializing' ||
    phase === 'scanning' ||
    phase === 'detected' ||
    phase === 'lost'

  const showWelcome = phase === 'idle'
  // Drop the full-screen loader as soon as the live camera feed appears.
  const showLoading = phase === 'initializing' && !cameraLive
  const showError = phase === 'error'

  return (
    <div className="relative h-full min-h-dvh overflow-hidden bg-ink">
      {showWelcome && (
        <div className="absolute inset-0 z-10">
          <CameraPermissionScreen
            brandName={experience.brandName}
            experienceTitle={experience.experienceTitle}
            onStart={() => void start()}
            experiences={experiences}
            selectedExperienceId={experience.id}
            onSelectExperience={onSelectExperience}
          />
        </div>
      )}

      <div
        ref={containerRef}
        className={
          active
            ? 'absolute inset-0 z-0 h-full w-full overflow-hidden bg-black'
            : 'pointer-events-none absolute inset-0 -z-10 h-full w-full overflow-hidden opacity-0'
        }
        aria-hidden={!active}
      />

      {active && (
        <>
          <ScannerOverlay
            brandName={experience.brandName}
            instructionText={experience.instructionText}
            detectedText={experience.detectedText}
            lostText={experience.lostText}
            phase={phase}
            onClose={stop}
          />
          <MediaControls
            visible={phase === 'detected' || autoplayBlocked}
            isMuted={isMuted}
            isPaused={isPaused}
            autoplayBlocked={autoplayBlocked}
            showVideoControls={experience.contentType === 'video'}
            onPlay={() => void playMedia()}
            onToggleMute={toggleMute}
            onTogglePause={togglePause}
            onReplay={() => void replay()}
            onStop={stop}
          />
          <DebugPanel
            enabled={debugEnabled}
            phase={phase}
            debugInfo={debugInfo}
            onRestart={() => void retry()}
          />
        </>
      )}

      {showLoading && (
        <LoadingScreen
          message="Opening camera…"
          detail="Allow camera access when prompted."
        />
      )}

      {showError && errorMessage && (
        <ErrorScreen
          message={errorMessage}
          onRetry={() => void retry()}
          onClose={stop}
        />
      )}
    </div>
  )
}
