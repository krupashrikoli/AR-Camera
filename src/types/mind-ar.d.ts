declare module 'mind-ar/dist/mindar-image-three.prod.js' {
  import type { Camera, Group, Scene, WebGLRenderer } from 'three'

  export type MindARAnchor = {
    group: Group
    targetIndex: number
    onTargetFound: (() => void) | null
    onTargetLost: (() => void) | null
    onTargetUpdate: (() => void) | null
    css: boolean
    visible: boolean
  }

  export type MindARThreeOptions = {
    container: HTMLElement
    imageTargetSrc: string
    maxTrack?: number
    uiLoading?: string
    uiScanning?: string
    uiError?: string
    filterMinCF?: number | null
    filterBeta?: number | null
    warmupTolerance?: number | null
    missTolerance?: number | null
    userDeviceId?: string | null
    environmentDeviceId?: string | null
  }

  export class MindARThree {
    renderer: WebGLRenderer
    scene: Scene
    camera: Camera
    constructor(options: MindARThreeOptions)
    start(): Promise<void>
    stop(): void
    switchCamera(): void
    addAnchor(targetIndex: number): MindARAnchor
    addCSSAnchor(targetIndex: number): MindARAnchor
  }
}

declare module 'mind-ar/dist/mindar-image.prod.js' {
  export class Compiler {
    compileImageTargets(
      images: HTMLImageElement[],
      progressCallback: (progress: number) => void,
    ): Promise<unknown>
    exportData(): ArrayBuffer | Promise<ArrayBuffer>
    importData(buffer: ArrayBuffer): unknown
  }
}
