import type { FsrsRating } from "./fsrs-rating.js"

export function mapAttemptsToRating(attempts: number): FsrsRating {
  if (attempts <= 1) {
    return "good"
  }
  if (attempts === 2) {
    return "hard"
  }
  return "again"
}
