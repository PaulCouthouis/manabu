import { Brand, Schema } from "effect"

// --- Id ---

export type GrammarPointId = number & Brand.Brand<"GrammarPointId">
export const GrammarPointId = Brand.nominal<GrammarPointId>()
export const GrammarPointIdSchema = Schema.Number.pipe(Schema.fromBrand(GrammarPointId))

// --- Grammar Point ---

export class GrammarPoint extends Schema.Class<GrammarPoint>("GrammarPoint")({
  id: GrammarPointIdSchema,
  name: Schema.String,
  explanation: Schema.String,
  frequency: Schema.Number,
  formCount: Schema.Number,
}) {}
