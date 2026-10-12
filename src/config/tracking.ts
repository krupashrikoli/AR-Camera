/**
 * MindAR tracking tuned for difficult real-world conditions
 * (low light, glare, low-resolution / noisy mobile cameras).
 *
 * Defaults from MindAR: filterMinCF 0.001, filterBeta 1000,
 * warmupTolerance 5, missTolerance 5.
 *
 * @see https://hiukim.github.io/mind-ar-js-doc/quick-start/tracking-config/
 */
export type TrackingConfig = {
  /** One Euro Filter cutoff — lower = less jitter in noisy feeds. */
  filterMinCF: number
  /** One Euro Filter speed — higher = less lag when the phone moves. */
  filterBeta: number
  /** Consecutive frames required before "found" (lower = faster lock). */
  warmupTolerance: number
  /** Consecutive missed frames before "lost" (higher = survives flicker). */
  missTolerance: number
  /** Ideal capture width — 720p balances light per pixel vs detail. */
  idealWidth: number
  idealHeight: number
}

export const robustTracking: TrackingConfig = {
  filterMinCF: 0.0005,
  filterBeta: 1000,
  // Lock after 2 solid frames instead of 5 — helps dim / noisy cameras.
  warmupTolerance: 2,
  // Keep the experience alive through brief lighting dropouts.
  missTolerance: 18,
  idealWidth: 1280,
  idealHeight: 720,
}
