import { Schema } from "effect"

const N = Schema.Number
const WeightsTuple = Schema.Tuple(N, N, N, N, N, N, N, N, N, N, N, N, N, N, N, N, N, N, N)

export class FsrsParams extends Schema.Class<FsrsParams>("FsrsParams")({
  weights: WeightsTuple,
  requestRetention: Schema.Number.pipe(Schema.between(0, 1)),
}) {}

// FSRS v5 default parameters
// Source: https://github.com/open-spaced-repetition/fsrs4anki/blob/v5.0.0/fsrs4anki_scheduler.js
export const defaultFsrsParams = FsrsParams.make({
  weights: [
    0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575, 0.1192, 1.01925,
    1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898, 0.51655, 0.6621,
  ],
  requestRetention: 0.9,
})
