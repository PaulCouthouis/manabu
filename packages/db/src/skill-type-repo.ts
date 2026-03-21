import { SqlClient, SqlError } from "@effect/sql"
import { SkillType, SkillTypes } from "@manabu/domain"
import type { SkillFamily } from "@manabu/domain"
import { Array, Effect, ParseResult, Schema } from "effect"

type SkillTypeEncoded = typeof SkillType.Encoded

const decodeRows = Schema.decode(Schema.Array(SkillType))

const encodeMany = Schema.encode(Schema.Array(SkillType))

export class SkillTypeRepo extends Effect.Service<SkillTypeRepo>()("SkillTypeRepo", {
  effect: Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    const queryAndValidate = (
      statement: Effect.Effect<ReadonlyArray<SkillTypeEncoded>, SqlError.SqlError>,
    ): Effect.Effect<ReadonlyArray<SkillType>, SqlError.SqlError | ParseResult.ParseError> =>
      Effect.flatMap(statement, decodeRows)

    return {
      findAll: queryAndValidate(sql<SkillTypeEncoded>`SELECT * FROM skill_type ORDER BY id`),

      findByFamily: (family: SkillFamily) =>
        queryAndValidate(
          sql<SkillTypeEncoded>`SELECT * FROM skill_type WHERE family = ${family} ORDER BY id`,
        ),

      seed: Effect.gen(function* () {
        const values = yield* encodeMany(Array.fromIterable(SkillTypes))

        yield* sql`INSERT INTO skill_type ${sql.insert(values)} ON CONFLICT (id) DO NOTHING`
      }),
    }
  }),
}) {}
