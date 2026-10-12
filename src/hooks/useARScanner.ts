import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { ExperienceConfig } from '../config/experience'
import { checkBrowserSupport, lockBodyScroll } from '../utils/device'
import { preloadMindAR, warmupExperienceAssets } from '../utils/arPreload'
import {
  createARVideoElement,
  degToRad,
  disposeVideo,
  pauseVideo,
  playVideoSafe,
} from '../utils/media'

export type ScannerPhase =
  | 'idle'
  | 'initializing'
  | 'scanning'
  | 'detected'
  | 'lost'
  | 'error'

export type ScannerErrorCode =
  | 'unsupported_browser'
  | 'camera_denied'
  | 'camera_unavailable'
  | 'camera_timeout'
  | 'target_missing'
  | 'target_invalid'
  | 'video_missing'
  | 'video_failed'
  | 'model_missing'
  | 'model_invalid'
  | 'init_failed'
  | 'unknown'

export type DebugInfo = {
  cameraStatus: string
  targetStatus: string
  detectionStatus: string
  mediaStatus: string
  mode: string
  error: string | null
}

export type UseARScannerResult = {
  phase: ScannerPhase
  errorCode: ScannerErrorCode | null
  errorMessage: string | null
  autoplayBlocked: boolean
  isMuted: boolean
  isPaused: boolean
  cameraLive: boolean
  debugInfo: DebugInfo
  containerRef: React.RefObject<HTMLDivElement | null>
  start: () => Promise<void>
  stop: () => void
  retry: () => Promise<void>
  playMedia: () => Promise<void>
  toggleMute: () => void
  togglePause: () => void
  replay: () => Promise<void>
}

type MindARThreeInstance = {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.Camera
  start: () => Promise<void>
  stop: () => void
  addAnchor: (targetIndex: number) => {
    group: THREE.Group
    onTargetFound: (() => void) | null
    onTargetLost: (() => void) | null
  }
}

const CAMERA_TIMEOUT_MS = 12_000

function errorMessageFor(code: ScannerErrorCode): string {
  switch (code) {
    case 'unsupported_browser':
      return 'This browser cannot run the AR scanner. Try the latest Safari on iOS or Chrome on Android.'
    case 'camera_denied':
      return 'Camera access was denied. Enable camera permission for this site in your browser settings, then try again.'
    case 'camera_unavailable':
      return 'No compatible camera was found on this device.'
    case 'camera_timeout':
      return 'Camera initialization timed out. Close other apps using the camera and try again.'
    case 'target_missing':
      return 'The compiled image target (.mind) is missing. Place it at public/targets/samraya.mind or compile it with the Target Compiler.'
    case 'target_invalid':
      return 'The image target file could not be loaded. Recompile the artwork into a valid .mind file.'
    case 'video_missing':
      return 'The experience video is missing. Place a file at public/videos/samraya.mp4.'
    case 'video_failed':
      return 'The experience video failed to load. Check the file format (MP4/H.264) and try again.'
    case 'model_missing':
      return 'The 3D model is missing. Place a GLB file at public/models/samraya.glb or switch contentType to "video".'
    case 'model_invalid':
      return 'The 3D model could not be loaded. Verify the GLB file is valid.'
    case 'init_failed':
      return 'The AR engine failed to start. Refresh the page and try again.'
    default:
      return 'Something went wrong while starting the AR experience.'
  }
}

function waitForCameraVideo(
  container: HTMLElement,
  signal: AbortSignal,
): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve()
      return
    }

    const existing = container.querySelector('video')
    if (existing instanceof HTMLVideoElement && existing.srcObject) {
      resolve()
      return
    }

    const observer = new MutationObserver(() => {
      const video = container.querySelector('video')
      if (video instanceof HTMLVideoElement && video.srcObject) {
        cleanup()
        resolve()
      }
    })

    const onAbort = () => {
      cleanup()
      resolve()
    }

    const cleanup = () => {
      observer.disconnect()
      signal.removeEventListener('abort', onAbort)
    }

    observer.observe(container, { childList: true, subtree: true })
    signal.addEventListener('abort', onAbort, { once: true })
  })
}

export function useARScanner(config: ExperienceConfig): UseARScannerResult {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mindarRef = useRef<MindARThreeInstance | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const videoTextureRef = useRef<THREE.VideoTexture | null>(null)
  const contentRootRef = useRef<THREE.Group | null>(null)
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const clockRef = useRef<THREE.Clock | null>(null)
  const animationActiveRef = useRef(false)
  const startingRef = useRef(false)
  const mountedRef = useRef(true)
  const configRef = useRef(config)
  const startAbortRef = useRef<AbortController | null>(null)

  const [phase, setPhase] = useState<ScannerPhase>('idle')
  const [errorCode, setErrorCode] = useState<ScannerErrorCode | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [autoplayBlocked, setAutoplayBlocked] = useState(false)
  const [isMuted, setIsMuted] = useState(config.muteByDefault)
  const [isPaused, setIsPaused] = useState(false)
  const [cameraLive, setCameraLive] = useState(false)
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    cameraStatus: 'idle',
    targetStatus: 'unchecked',
    detectionStatus: 'none',
    mediaStatus: 'idle',
    mode: config.contentType,
    error: null,
  })

  configRef.current = config

  const updateDebug = useCallback((patch: Partial<DebugInfo>) => {
    setDebugInfo((prev) => ({ ...prev, ...patch }))
  }, [])

  const setError = useCallback(
    (code: ScannerErrorCode, detail?: string) => {
      const message = detail ?? errorMessageFor(code)
      setErrorCode(code)
      setErrorMessage(message)
      setPhase('error')
      setCameraLive(false)
      updateDebug({ error: message })
    },
    [updateDebug],
  )

  // Warm MindAR + target while the welcome screen is visible.
  useEffect(() => {
    warmupExperienceAssets({
      targetSrc: config.targetSrc,
      videoSrc: config.videoSrc,
      modelSrc: config.modelSrc,
      contentType: config.contentType,
    })
  }, [config.contentType, config.modelSrc, config.targetSrc, config.videoSrc])

  const disposeContent = useCallback(() => {
    mixerRef.current = null
    clockRef.current = null

    if (videoTextureRef.current) {
      videoTextureRef.current.dispose()
      videoTextureRef.current = null
    }

    disposeVideo(videoRef.current)
    videoRef.current = null

    if (contentRootRef.current) {
      contentRootRef.current.traverse((object) => {
        const mesh = object as THREE.Mesh
        if (mesh.geometry) mesh.geometry.dispose()
        if (mesh.material) {
          const materials = Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material]
          materials.forEach((material) => {
            Object.values(material).forEach((value) => {
              if (value instanceof THREE.Texture) value.dispose()
            })
            material.dispose()
          })
        }
      })
      contentRootRef.current = null
    }
  }, [])

  const stop = useCallback(() => {
    animationActiveRef.current = false
    startingRef.current = false
    startAbortRef.current?.abort()
    startAbortRef.current = null

    if (mindarRef.current) {
      try {
        mindarRef.current.renderer.setAnimationLoop(null)
        mindarRef.current.stop()
      } catch {
        // MindAR may throw if video/controller was never fully started.
      }

      try {
        const renderer = mindarRef.current.renderer
        renderer.dispose()
        renderer.domElement.remove()
      } catch {
        // ignore renderer cleanup failures
      }

      mindarRef.current = null
    }

    if (containerRef.current) {
      containerRef.current
        .querySelectorAll('video, canvas')
        .forEach((node) => node.remove())
    }

    disposeContent()
    lockBodyScroll(false)

    if (mountedRef.current) {
      setPhase('idle')
      setCameraLive(false)
      setAutoplayBlocked(false)
      setIsPaused(false)
      updateDebug({
        cameraStatus: 'stopped',
        detectionStatus: 'none',
        mediaStatus: 'stopped',
        error: null,
      })
    }
  }, [disposeContent, updateDebug])

  const playMedia = useCallback(async () => {
    const video = videoRef.current
    if (!video) return
    const result = await playVideoSafe(video)
    if (result.played) {
      setAutoplayBlocked(false)
      setIsPaused(false)
      updateDebug({ mediaStatus: 'playing' })
    } else if (result.blocked) {
      setAutoplayBlocked(true)
      updateDebug({ mediaStatus: 'autoplay_blocked' })
    } else {
      updateDebug({ mediaStatus: `play_error: ${result.error ?? 'unknown'}` })
    }
  }, [updateDebug])

  /** Attach video plane immediately — do not wait for the full MP4 download. */
  const attachVideoContent = useCallback(
    (anchorGroup: THREE.Group, experience: ExperienceConfig) => {
      const video = createARVideoElement(experience.videoSrc, {
        muted: experience.muteByDefault,
        loop: experience.videoLoop,
      })
      video.preload = 'auto'
      document.body.appendChild(video)
      videoRef.current = video
      setIsMuted(experience.muteByDefault)

      video.addEventListener(
        'error',
        () => {
          updateDebug({ mediaStatus: 'video_failed' })
        },
        { once: true },
      )

      // Kick off download without blocking camera startup.
      void video.play().then(
        () => {
          video.pause()
          video.currentTime = 0
        },
        () => {
          // Autoplay probe may fail; ignore — real play happens on target found.
        },
      )

      const width = experience.overlayFullArtwork
        ? experience.videoSize.width
        : experience.videoSize.width * 0.72
      const height = experience.overlayFullArtwork
        ? experience.videoSize.height
        : experience.videoSize.height * 0.72

      const texture = new THREE.VideoTexture(video)
      texture.colorSpace = THREE.SRGBColorSpace
      texture.minFilter = THREE.LinearFilter
      texture.magFilter = THREE.LinearFilter
      videoTextureRef.current = texture

      const geometry = new THREE.PlaneGeometry(width, height)
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
        toneMapped: false,
      })
      const mesh = new THREE.Mesh(geometry, material)

      const root = new THREE.Group()
      root.position.set(
        experience.position.x,
        experience.position.y,
        experience.position.z,
      )
      root.scale.set(experience.scale.x, experience.scale.y, experience.scale.z)
      root.rotation.set(
        degToRad(experience.rotation.x),
        degToRad(experience.rotation.y),
        degToRad(experience.rotation.z),
      )
      root.add(mesh)

      contentRootRef.current = root
      anchorGroup.add(root)
      updateDebug({ mediaStatus: 'video_ready' })
    },
    [updateDebug],
  )

  const attachModelContent = useCallback(
    async (anchorGroup: THREE.Group, experience: ExperienceConfig) => {
      const loader = new GLTFLoader()
      const gltf = await new Promise<Awaited<ReturnType<typeof loader.loadAsync>>>(
        (resolve, reject) => {
          loader.load(
            experience.modelSrc,
            resolve,
            undefined,
            () =>
              reject(
                Object.assign(new Error('Model invalid'), {
                  code: 'model_invalid' as const,
                }),
              ),
          )
        },
      )

      const root = new THREE.Group()
      root.position.set(
        experience.position.x,
        experience.position.y,
        experience.position.z,
      )
      root.scale.set(experience.scale.x, experience.scale.y, experience.scale.z)
      root.rotation.set(
        degToRad(experience.rotation.x),
        degToRad(experience.rotation.y),
        degToRad(experience.rotation.z),
      )
      root.add(gltf.scene)

      if (experience.playModelAnimations && gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(gltf.scene)
        gltf.animations.forEach((clip) => {
          mixer.clipAction(clip).play()
        })
        mixerRef.current = mixer
        clockRef.current = new THREE.Clock()
      }

      contentRootRef.current = root
      anchorGroup.add(root)
      updateDebug({ mediaStatus: 'model_ready' })
    },
    [updateDebug],
  )

  const start = useCallback(async () => {
    if (startingRef.current || mindarRef.current) return
    startingRef.current = true
    mountedRef.current = true

    const abort = new AbortController()
    startAbortRef.current = abort

    setErrorCode(null)
    setErrorMessage(null)
    setAutoplayBlocked(false)
    setCameraLive(false)
    setPhase('initializing')
    lockBodyScroll(true)
    updateDebug({
      cameraStatus: 'requesting',
      targetStatus: 'loading',
      detectionStatus: 'none',
      mediaStatus: 'idle',
      mode: configRef.current.contentType,
      error: null,
    })

    const support = checkBrowserSupport()
    if (!support.supported) {
      startingRef.current = false
      lockBodyScroll(false)
      setError('unsupported_browser', support.reasons.join(' '))
      return
    }

    const experience = configRef.current
    const container = containerRef.current
    if (!container) {
      startingRef.current = false
      lockBodyScroll(false)
      setError('init_failed', 'AR container is not ready.')
      return
    }

    try {
      // Use preloaded chunk when available — this is the biggest Start delay.
      const { MindARThree } = await preloadMindAR()
      if (abort.signal.aborted || !mountedRef.current) return

      const mindarThree = new MindARThree({
        container,
        imageTargetSrc: experience.targetSrc,
        maxTrack: 1,
        uiLoading: 'no',
        uiScanning: 'no',
        uiError: 'no',
        filterMinCF: 0.0001,
        filterBeta: 0.001,
      }) as MindARThreeInstance

      // Prefer smoother mobile frames over retina sharpness.
      mindarThree.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))

      mindarRef.current = mindarThree
      const { renderer, scene, camera } = mindarThree
      const anchor = mindarThree.addAnchor(experience.targetIndex)

      // Content attaches without blocking the camera permission prompt.
      if (experience.contentType === 'video') {
        attachVideoContent(anchor.group, experience)
      } else {
        // 3D can load in parallel with camera start.
        void attachModelContent(anchor.group, experience).catch((error) => {
          const code =
            error && typeof error === 'object' && 'code' in error
              ? ((error as { code?: ScannerErrorCode }).code ?? 'model_invalid')
              : 'model_invalid'
          if (mountedRef.current) setError(code)
        })
      }

      anchor.onTargetFound = () => {
        if (!mountedRef.current) return
        setPhase('detected')
        updateDebug({ detectionStatus: 'found' })
        if (experience.contentType === 'video' && experience.videoAutoplay) {
          void playMedia()
        }
        if (mixerRef.current && clockRef.current) {
          clockRef.current.getDelta()
        }
      }

      anchor.onTargetLost = () => {
        if (!mountedRef.current) return
        setPhase('lost')
        updateDebug({ detectionStatus: 'lost' })
        if (
          experience.contentType === 'video' &&
          experience.pauseOnTrackingLost
        ) {
          pauseVideo(videoRef.current)
          setIsPaused(true)
          updateDebug({ mediaStatus: 'paused_tracking_lost' })
        }
      }

      // Reveal camera feed as soon as the browser grants it — don't wait for tracker compile.
      void waitForCameraVideo(container, abort.signal).then(() => {
        if (!mountedRef.current || abort.signal.aborted) return
        setCameraLive(true)
        setPhase((prev) => (prev === 'initializing' ? 'scanning' : prev))
        updateDebug({ cameraStatus: 'active', targetStatus: 'loading' })
      })

      const startPromise = mindarThree.start()
      const timeoutPromise = new Promise<never>((_, reject) => {
        const timer = window.setTimeout(
          () =>
            reject(
              Object.assign(new Error('timeout'), { code: 'camera_timeout' }),
            ),
          CAMERA_TIMEOUT_MS,
        )
        abort.signal.addEventListener(
          'abort',
          () => window.clearTimeout(timer),
          { once: true },
        )
      })

      await Promise.race([startPromise, timeoutPromise])

      if (abort.signal.aborted || !mountedRef.current) {
        stop()
        return
      }

      animationActiveRef.current = true
      renderer.setAnimationLoop(() => {
        if (!animationActiveRef.current) return
        if (mixerRef.current && clockRef.current) {
          mixerRef.current.update(clockRef.current.getDelta())
        }
        renderer.render(scene, camera)
      })

      setCameraLive(true)
      setPhase((prev) => (prev === 'detected' || prev === 'lost' ? prev : 'scanning'))
      updateDebug({
        cameraStatus: 'active',
        targetStatus: 'ready',
        detectionStatus: 'searching',
      })
    } catch (error) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? ((error as { code?: ScannerErrorCode }).code ?? 'init_failed')
          : 'init_failed'

      let resolvedCode: ScannerErrorCode = code
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
          resolvedCode = 'camera_denied'
        } else if (
          error.name === 'NotFoundError' ||
          error.name === 'DevicesNotFoundError'
        ) {
          resolvedCode = 'camera_unavailable'
        }
      } else if (error instanceof Error) {
        const msg = error.message.toLowerCase()
        if (
          msg.includes('permission') ||
          msg.includes('denied') ||
          msg.includes('notallowed')
        ) {
          resolvedCode = 'camera_denied'
        } else if (msg.includes('notfound') || msg.includes('devices not found')) {
          resolvedCode = 'camera_unavailable'
        } else if (code === 'camera_timeout') {
          resolvedCode = 'camera_timeout'
        } else if (
          code === 'video_missing' ||
          code === 'video_failed' ||
          code === 'model_missing' ||
          code === 'model_invalid' ||
          code === 'target_invalid'
        ) {
          resolvedCode = code
        } else if (
          msg.includes('mind') ||
          msg.includes('target') ||
          msg.includes('404')
        ) {
          resolvedCode = 'target_invalid'
        }
      } else if (error == null || error === undefined) {
        resolvedCode = 'camera_denied'
      }

      stop()
      setError(resolvedCode)
    } finally {
      startingRef.current = false
    }
  }, [
    attachModelContent,
    attachVideoContent,
    playMedia,
    setError,
    stop,
    updateDebug,
  ])

  const retry = useCallback(async () => {
    stop()
    // Yield so cleanup settles before a fresh start.
    await new Promise((resolve) => window.setTimeout(resolve, 0))
    await start()
  }, [start, stop])

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setIsMuted(video.muted)
  }, [])

  const togglePause = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      void playMedia()
    } else {
      pauseVideo(video)
      setIsPaused(true)
      updateDebug({ mediaStatus: 'paused' })
    }
  }, [playMedia, updateDebug])

  const replay = useCallback(async () => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = 0
    await playMedia()
  }, [playMedia])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      stop()
    }
  }, [stop])

  return {
    phase,
    errorCode,
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
  }
}
