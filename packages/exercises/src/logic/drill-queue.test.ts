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

    expect(Option.isNone(DrillQueue.current(queue))).toBe(true)
  })

  // AC7 — succeed retire l'item de la queue et push dans history
  it("succeed retire l'item et enregistre dans history", () => {
    const queue = DrillQueue.make(items)
    const next = DrillQueue.succeed(queue)

    expect(Chunk.size(next.queue)).toBe(4)
    expect(Option.getOrThrow(DrillQueue.current(next)).value).toBe("b")
    expect(Chunk.size(next.history)).toBe(1)
    expect(Option.getOrThrow(Chunk.get(next.history, 0)).outcome).toBe("success")
    expect(Option.getOrThrow(Chunk.get(next.history, 0)).item.value).toBe("a")
  })

  it("succeed sur queue vide retourne la même queue", () => {
    const queue = DrillQueue.make([])
    expect(DrillQueue.succeed(queue)).toBe(queue)
  })

  // AC8 — isEmpty retourne true quand la queue est vide
  it("isEmpty retourne true quand la queue est vide", () => {
    expect(DrillQueue.isEmpty(DrillQueue.make([]))).toBe(true)
  })

  it("isEmpty retourne false quand la queue a des items", () => {
    expect(DrillQueue.isEmpty(DrillQueue.make(items))).toBe(false)
  })

  // AC9 — recycle déplace l'item en fin de queue et push dans history
  it("recycle déplace l'item en fin de queue et enregistre dans history", () => {
    const queue = DrillQueue.make(items)
    const next = DrillQueue.recycle(queue)

    expect(Chunk.size(next.queue)).toBe(5)
    expect(Option.getOrThrow(DrillQueue.current(next)).value).toBe("b")
    expect(Option.getOrThrow(Chunk.get(next.queue, 4)).value).toBe("a")
    expect(Chunk.size(next.history)).toBe(1)
    expect(Option.getOrThrow(Chunk.get(next.history, 0)).outcome).toBe("recycle")
  })

  it("recycle sur queue vide retourne la même queue", () => {
    const queue = DrillQueue.make([])
    expect(DrillQueue.recycle(queue)).toBe(queue)
  })

  // AC10 — Un item recyclé est re-présenté après les items restants
  it("un item recyclé est re-présenté après les autres", () => {
    const queue = DrillQueue.make(["a", "b", "c"])
    const afterRecycle = DrillQueue.recycle(queue)
    const afterB = DrillQueue.succeed(afterRecycle)
    const afterC = DrillQueue.succeed(afterB)

    expect(Option.getOrThrow(DrillQueue.current(afterC)).value).toBe("a")
  })

  // AC11 — Plusieurs recyclages successifs → l'item réapparaît à chaque fois
  it("recyclages multiples — l'item réapparaît à chaque fois", () => {
    const queue = DrillQueue.make(["a"])
    const r1 = DrillQueue.recycle(queue)
    expect(Option.getOrThrow(DrillQueue.current(r1)).value).toBe("a")

    const r2 = DrillQueue.recycle(r1)
    expect(Option.getOrThrow(DrillQueue.current(r2)).value).toBe("a")
    expect(Chunk.size(r2.history)).toBe(2)
  })

  // AC12 — Queue avec tous les items réussis → isEmpty retourne true
  it("tous les items réussis → queue vide", () => {
    const queue = DrillQueue.make(["a", "b"])
    const s1 = DrillQueue.succeed(queue)
    const s2 = DrillQueue.succeed(s1)

    expect(DrillQueue.isEmpty(s2)).toBe(true)
  })

  // AC13 — succeed avec scaffolding → réinséré sans scaffolding
  it("succeed avec scaffolding → réinséré en fin de queue sans scaffolding", () => {
    const queue = DrillQueue.makeWithScaffolding(["a", "b"])
    const next = DrillQueue.succeed(queue)

    expect(Chunk.size(next.queue)).toBe(2)
    const last = Option.getOrThrow(Chunk.get(next.queue, 1))
    expect(last.value).toBe("a")
    expect(last.withScaffolding).toBe(false)
    expect(Option.getOrThrow(Chunk.get(next.history, 0)).outcome).toBe("success")
  })

  // AC14 — succeed sans scaffolding → retiré définitivement
  it("succeed sans scaffolding → retiré définitivement", () => {
    const queue = DrillQueue.make(["a"])
    const next = DrillQueue.succeed(queue)

    expect(DrillQueue.isEmpty(next)).toBe(true)
  })

  // AC15 — recycle sans scaffolding → recyclé sans (pas de régression)
  it("recycle sans scaffolding → recyclé sans scaffolding", () => {
    const queue = DrillQueue.make(["a"])
    const next = DrillQueue.recycle(queue)

    const item = Option.getOrThrow(DrillQueue.current(next))
    expect(item.withScaffolding).toBe(false)
  })

  it("double passage complet : scaffolding → sans scaffolding → retiré", () => {
    const queue = DrillQueue.makeWithScaffolding(["a"])

    const afterFirst = DrillQueue.succeed(queue)
    expect(Chunk.size(afterFirst.queue)).toBe(1)
    expect(Option.getOrThrow(DrillQueue.current(afterFirst)).withScaffolding).toBe(false)

    const afterSecond = DrillQueue.succeed(afterFirst)
    expect(DrillQueue.isEmpty(afterSecond)).toBe(true)
    expect(Chunk.size(afterSecond.history)).toBe(2)
  })

  it("recycle avec scaffolding → recyclé avec scaffolding", () => {
    const queue = DrillQueue.makeWithScaffolding(["a"])
    const next = DrillQueue.recycle(queue)

    const item = Option.getOrThrow(DrillQueue.current(next))
    expect(item.withScaffolding).toBe(true)
  })

  // AC16 — summarize sur queue fraîche → tout est pending
  it("summarize queue fraîche → tout pending", () => {
    const queue = DrillQueue.make(["a", "b", "c"])
    const summary = DrillQueue.summarize(queue)

    expect(Chunk.size(summary.succeeded)).toBe(0)
    expect(Chunk.size(summary.attempted)).toBe(0)
    expect(Chunk.size(summary.pending)).toBe(3)
  })

  // AC17 — summarize après succès → items dans succeeded avec nb essais
  it("summarize après succès → succeeded avec nb essais", () => {
    const queue = DrillQueue.make(["a", "b", "c"])
    const s1 = DrillQueue.succeed(queue)
    const summary = DrillQueue.summarize(s1)

    expect(Chunk.size(summary.succeeded)).toBe(1)
    expect(Option.getOrThrow(Chunk.get(summary.succeeded, 0)).item.value).toBe("a")
    expect(Option.getOrThrow(Chunk.get(summary.succeeded, 0)).attempts).toBe(1)
    expect(Chunk.size(summary.pending)).toBe(2)
  })

  // AC18 — summarize après recyclage sans succès → items dans attempted
  it("summarize après recyclage → attempted", () => {
    const queue = DrillQueue.make(["a", "b"])
    const r1 = DrillQueue.recycle(queue)
    const summary = DrillQueue.summarize(r1)

    expect(Chunk.size(summary.attempted)).toBe(1)
    expect(Option.getOrThrow(Chunk.get(summary.attempted, 0)).item.value).toBe("a")
    expect(Option.getOrThrow(Chunk.get(summary.attempted, 0)).attempts).toBe(1)
    expect(Chunk.size(summary.pending)).toBe(1)
  })

  // AC19 — summarize sur abandon → pending + attempted mélangés
  it("summarize sur abandon → pending + attempted + succeeded", () => {
    const queue = DrillQueue.make(["a", "b", "c", "d", "e"])
    const s1 = DrillQueue.succeed(queue)
    const r1 = DrillQueue.recycle(s1)
    const summary = DrillQueue.summarize(r1)

    expect(Chunk.size(summary.succeeded)).toBe(1)
    expect(Option.getOrThrow(Chunk.get(summary.succeeded, 0)).item.value).toBe("a")
    expect(Chunk.size(summary.attempted)).toBe(1)
    expect(Option.getOrThrow(Chunk.get(summary.attempted, 0)).item.value).toBe("b")
    expect(Chunk.size(summary.pending)).toBe(3)
  })

  // AC20 — nb essais = nombre d'entrées dans history par item
  it("nb essais comptabilise toutes les tentatives", () => {
    const queue = DrillQueue.make(["a"])
    const r1 = DrillQueue.recycle(queue)
    const r2 = DrillQueue.recycle(r1)
    const s1 = DrillQueue.succeed(r2)
    const summary = DrillQueue.summarize(s1)

    expect(Chunk.size(summary.succeeded)).toBe(1)
    expect(Option.getOrThrow(Chunk.get(summary.succeeded, 0)).attempts).toBe(3)
  })
})
