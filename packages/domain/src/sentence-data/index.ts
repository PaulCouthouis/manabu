import type { SentenceElement } from "../linguistic-element.js"

import { skill11Part1Sentences } from "./skill-11-part1.js"
import { skill11Part2Sentences } from "./skill-11-part2.js"
import { skill12Part1Sentences } from "./skill-12-part1.js"
import { skill12Part2Sentences } from "./skill-12-part2.js"
import { skill12Part3Sentences } from "./skill-12-part3.js"
import { skill13Sentences } from "./skill-13.js"
import { skill14Sentences } from "./skill-14.js"
import { skill15Sentences } from "./skill-15.js"

export const skill11Sentences: ReadonlyArray<SentenceElement> = [
  ...skill11Part1Sentences,
  ...skill11Part2Sentences,
]

export const skill12Sentences: ReadonlyArray<SentenceElement> = [
  ...skill12Part1Sentences,
  ...skill12Part2Sentences,
  ...skill12Part3Sentences,
]

export { skill13Sentences } from "./skill-13.js"
export { skill14Sentences } from "./skill-14.js"
export { skill15Sentences } from "./skill-15.js"

export const sentenceData: ReadonlyArray<SentenceElement> = [
  ...skill11Part1Sentences,
  ...skill11Part2Sentences,
  ...skill12Part1Sentences,
  ...skill12Part2Sentences,
  ...skill12Part3Sentences,
  ...skill13Sentences,
  ...skill14Sentences,
  ...skill15Sentences,
]
