import { Array, Chunk, Option } from "effect"
import { describe, expect, it } from "vitest"
import { DrillQueue } from "./drill-queue.js"

describe("DrillQueue", () => {
  const items = ["a", "b", "c", "d", "e"]

  // AC5 — Créer une queue à partir d'une liste d'items → taille et ordre FIFO préservés
  it("make crée une queue avec la taille et l'ordre préservés", () => {
    const queue = DrillQueue.make(items)

    expect(Chunk.toArray(queue.queue)).toEqual(
      Array.map(items, (value) => ({ value, withScaffolding: false })),
    )
    expect(Chunk.isEmpty(queue.history)).toBe(true)
  })

  // AC6 — current retourne le premier item de la queue
  it("current retourne le premier item (FIFO)", () => {
    const queue = DrillQueue.make(items)
    const item = DrillQueue.current(queue)

    expect(Option.isSome(item)).toBe(true)
    expect(Option.getOrThrow(item).value).toBe("a")
  })

  it("current retourne None sur une queue vide", () => {
    const queue = DrillQueue.make([])
    const item = DrillQueue.current(queue)

    expect(Option.isNone(item)).toBe(true)
  })

  // AC7 — succeed retire l'item de la queue et push dans history
  it("succeed retire l'item et enregistre dans history", () => {
    const queue = DrillQueue.make(items)
    const next = Option.getOrThrow(DrillQueue.succeed(queue))

    expect(Chunk.size(next.queue)).toBe(4)
    expect(Option.getOrThrow(DrillQueue.current(next)).value).toBe("b")
    expect(Chunk.size(next.history)).toBe(1)
    expect(Option.getOrThrow(Chunk.get(next.history, 0)).outcome).toBe("success")
    expect(Option.getOrThrow(Chunk.get(next.history, 0)).item.value).toBe("a")
  })

  it("succeed retourne None sur une queue vide", () => {
    const queue = DrillQueue.make([])
    expect(Option.isNone(DrillQueue.succeed(queue))).toBe(true)
  })

  // AC8 — isEmpty retourne true quand la queue est vide
  it("isEmpty retourne true quand la queue est vide", () => {
    const queue = DrillQueue.make([])
    expect(DrillQueue.isEmpty(queue)).toBe(true)
  })

  it("isEmpty retourne false quand la queue a des items", () => {
    const queue = DrillQueue.make(items)
    expect(DrillQueue.isEmpty(queue)).toBe(false)
  })
})
