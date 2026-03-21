import { Brand, Schema } from "effect"

// --- Schemas ---

export type SkillTypeId = number & Brand.Brand<"SkillTypeId">
export const SkillTypeId = Brand.nominal<SkillTypeId>()
export const SkillTypeIdSchema = Schema.Number.pipe(Schema.fromBrand(SkillTypeId))

export const SkillFamilySchema = Schema.Literal("Foundation", "Core", "Grammar")
export type SkillFamily = typeof SkillFamilySchema.Type

export const ExerciseFormatSchema = Schema.Literal(
  "ListenRepeat",
  "ReadAloud",
  "MultipleChoice",
  "KeyboardInput",
)
export type ExerciseFormat = typeof ExerciseFormatSchema.Type

// --- Skill Type ---

export class SkillType extends Schema.Class<SkillType>("SkillType")({
  id: SkillTypeIdSchema,
  family: SkillFamilySchema,
  code: Schema.String,
  name: Schema.String,
  description: Schema.String,
  format: ExerciseFormatSchema,
  open: Schema.Boolean,
}) {}

// --- Constants ---

export const SkillTypes: ReadonlyArray<SkillType> = [
  // Foundation (closed)
  new SkillType({
    id: SkillTypeId(1),
    family: "Foundation",
    code: "F1",
    name: "Syllable listening & repetition",
    description:
      "Hear a Japanese syllable, reproduce it vocally. The corresponding hiragana is shown as a reward.",
    format: "ListenRepeat",
    open: false,
  }),
  new SkillType({
    id: SkillTypeId(2),
    family: "Foundation",
    code: "F2",
    name: "Hiragana reading",
    description: "See a hiragana character, produce the corresponding sound.",
    format: "ReadAloud",
    open: false,
  }),
  new SkillType({
    id: SkillTypeId(3),
    family: "Foundation",
    code: "F3",
    name: "Katakana reading",
    description:
      "See a katakana character, produce the corresponding sound. Hiragana→katakana hint shown until first correct answer.",
    format: "ReadAloud",
    open: false,
  }),

  // Core (open)
  new SkillType({
    id: SkillTypeId(4),
    family: "Core",
    code: "C1",
    name: "Word listening & repetition",
    description:
      "Hear a word or sentence, reproduce it vocally. Natural written form shown as a reward.",
    format: "ListenRepeat",
    open: true,
  }),
  new SkillType({
    id: SkillTypeId(5),
    family: "Core",
    code: "C2",
    name: "Kanji meaning",
    description:
      "See an isolated kanji, identify its meaning. Includes standalone and non-standalone kanji.",
    format: "MultipleChoice",
    open: true,
  }),
  new SkillType({
    id: SkillTypeId(6),
    family: "Core",
    code: "C3",
    name: "Listening comprehension",
    description: "Hear a word or sentence, identify its meaning.",
    format: "MultipleChoice",
    open: true,
  }),
  new SkillType({
    id: SkillTypeId(7),
    family: "Core",
    code: "C4",
    name: "Reading aloud",
    description: "See a word or sentence in its natural written form, pronounce it correctly.",
    format: "ReadAloud",
    open: true,
  }),
  new SkillType({
    id: SkillTypeId(8),
    family: "Core",
    code: "C5",
    name: "Reading comprehension",
    description: "See a word or sentence in its natural written form, identify its meaning.",
    format: "MultipleChoice",
    open: true,
  }),
  new SkillType({
    id: SkillTypeId(9),
    family: "Core",
    code: "C6",
    name: "Oral production",
    description: "See the meaning, say the word or sentence in Japanese.",
    format: "ReadAloud",
    open: true,
  }),
  new SkillType({
    id: SkillTypeId(10),
    family: "Core",
    code: "C7",
    name: "Written production",
    description: "See the meaning, type the word or sentence in Japanese using the keyboard.",
    format: "KeyboardInput",
    open: true,
  }),

  // Grammar (open)
  new SkillType({
    id: SkillTypeId(11),
    family: "Grammar",
    code: "G1",
    name: "Particles & connectors",
    description: "Choose the correct particle or connector in a fill-in-the-blank sentence.",
    format: "MultipleChoice",
    open: true,
  }),
  new SkillType({
    id: SkillTypeId(12),
    family: "Grammar",
    code: "G2",
    name: "Conjugations & patterns",
    description:
      "Conjugate a verb or adjective in the requested form. Includes conjugations and grammatical patterns.",
    format: "MultipleChoice",
    open: true,
  }),
  new SkillType({
    id: SkillTypeId(13),
    family: "Grammar",
    code: "G3",
    name: "Keigo",
    description: "Transform an expression into its polite, respectful, or humble form.",
    format: "MultipleChoice",
    open: true,
  }),
  new SkillType({
    id: SkillTypeId(14),
    family: "Grammar",
    code: "G4",
    name: "Giving & receiving",
    description: "Choose the correct verb based on who gives or does something to or for whom.",
    format: "MultipleChoice",
    open: true,
  }),
  new SkillType({
    id: SkillTypeId(15),
    family: "Grammar",
    code: "G5",
    name: "Counters & numbers",
    description:
      "Match the correct counter to an object or context. Includes counters, numbers, and time expressions.",
    format: "MultipleChoice",
    open: true,
  }),
]
