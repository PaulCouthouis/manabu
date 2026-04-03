import { Schema } from "effect"

export class FsrsState extends Schema.Class<FsrsState>("FsrsState")({
  stability: Schema.Number.pipe(Schema.greaterThanOrEqualTo(0)),
  difficulty: Schema.Number.pipe(Schema.between(0, 10)),
  retrievability: Schema.Number.pipe(Schema.between(0, 1)),
}) {}
