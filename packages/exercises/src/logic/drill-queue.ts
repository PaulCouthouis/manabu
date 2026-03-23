import { Array, Chunk, Option, pipe } from "effect"

export type DrillOutcome = "success" | "recycle"

export interface DrillItem<A> {
  readonly value: A
  readonly withScaffolding: boolean
}

export interface DrillEntry<A> {
  readonly item: DrillItem<A>
  readonly outcome: DrillOutcome
}

export interface DrillQueueState<A> {
  readonly queue: Chunk.Chunk<DrillItem<A>>
  readonly history: Chunk.Chunk<DrillEntry<A>>
}

const make = <A>(values: ReadonlyArray<A>): DrillQueueState<A> => ({
  queue: Chunk.fromIterable(
    Array.map(values, (value): DrillItem<A> => ({ value, withScaffolding: false })),
  ),
  history: Chunk.empty(),
})

const makeWithScaffolding = <A>(values: ReadonlyArray<A>): DrillQueueState<A> => ({
  queue: Chunk.fromIterable(
    Array.map(values, (value): DrillItem<A> => ({ value, withScaffolding: true })),
  ),
  history: Chunk.empty(),
})

const current = <A>(state: DrillQueueState<A>): Option.Option<DrillItem<A>> =>
  Chunk.get(state.queue, 0)

const succeedQueue = <A>(queue: Chunk.Chunk<DrillItem<A>>, item: DrillItem<A>) => {
  const rest = Chunk.drop(queue, 1)
  return item.withScaffolding ? Chunk.append(rest, { ...item, withScaffolding: false }) : rest
}

const succeed = <A>(state: DrillQueueState<A>): DrillQueueState<A> =>
  pipe(
    current(state),
    Option.match({
      onNone: () => state,
      onSome: (item) => ({
        queue: succeedQueue(state.queue, item),
        history: Chunk.append(state.history, { item, outcome: "success" as const }),
      }),
    }),
  )

const recycle = <A>(state: DrillQueueState<A>): DrillQueueState<A> =>
  pipe(
    current(state),
    Option.match({
      onNone: () => state,
      onSome: (item) => ({
        queue: Chunk.append(Chunk.drop(state.queue, 1), item),
        history: Chunk.append(state.history, { item, outcome: "recycle" as const }),
      }),
    }),
  )

const isEmpty = <A>(state: DrillQueueState<A>): boolean => Chunk.isEmpty(state.queue)

export const DrillQueue = { make, makeWithScaffolding, current, succeed, recycle, isEmpty }
