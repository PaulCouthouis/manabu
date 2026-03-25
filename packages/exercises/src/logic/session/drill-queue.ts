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

const make = <A>(values: ReadonlyArray<A>): DrillQueueState<A> => {
  return {
    queue: Chunk.fromIterable(
      Array.map(values, (value): DrillItem<A> => {
        return { value, withScaffolding: false }
      }),
    ),
    history: Chunk.empty(),
  }
}

const makeWithScaffolding = <A>(values: ReadonlyArray<A>): DrillQueueState<A> => {
  return {
    queue: Chunk.fromIterable(
      Array.map(values, (value): DrillItem<A> => {
        return { value, withScaffolding: true }
      }),
    ),
    history: Chunk.empty(),
  }
}

const current = <A>(state: DrillQueueState<A>): Option.Option<DrillItem<A>> => {
  return Chunk.get(state.queue, 0)
}

const succeedQueue = <A>(queue: Chunk.Chunk<DrillItem<A>>, item: DrillItem<A>) => {
  const rest = Chunk.drop(queue, 1)
  return item.withScaffolding ? Chunk.append(rest, { ...item, withScaffolding: false }) : rest
}

const succeed = <A>(state: DrillQueueState<A>): DrillQueueState<A> => {
  return pipe(
    current(state),
    Option.match({
      onNone: () => {
        return state
      },
      onSome: (item) => {
        return {
          queue: succeedQueue(state.queue, item),
          history: Chunk.append(state.history, { item, outcome: "success" as const }),
        }
      },
    }),
  )
}

const recycle = <A>(state: DrillQueueState<A>): DrillQueueState<A> => {
  return pipe(
    current(state),
    Option.match({
      onNone: () => {
        return state
      },
      onSome: (item) => {
        return {
          queue: Chunk.append(Chunk.drop(state.queue, 1), item),
          history: Chunk.append(state.history, { item, outcome: "recycle" as const }),
        }
      },
    }),
  )
}

const isEmpty = <A>(state: DrillQueueState<A>): boolean => {
  return Chunk.isEmpty(state.queue)
}

export interface DrillSummaryEntry<A> {
  readonly item: DrillItem<A>
  readonly attempts: number
}

export interface DrillSummary<A> {
  readonly succeeded: Chunk.Chunk<DrillSummaryEntry<A>>
  readonly attempted: Chunk.Chunk<DrillSummaryEntry<A>>
  readonly pending: Chunk.Chunk<DrillItem<A>>
}

const indexHistory = <A>(history: Chunk.Chunk<DrillEntry<A>>) => {
  const attempts = new Map<A, number>()
  const lastSucceeded = new Map<A, DrillItem<A>>()

  for (const entry of Chunk.toArray(history)) {
    attempts.set(entry.item.value, (attempts.get(entry.item.value) ?? 0) + 1)
    if (entry.outcome === "success") {
      lastSucceeded.set(entry.item.value, entry.item)
    }
  }

  return { attempts, lastSucceeded }
}

const collectSucceeded = <A>(
  lastSucceeded: Map<A, DrillItem<A>>,
  queueValues: Set<A>,
  attempts: Map<A, number>,
) => {
  const succeeded: Array<DrillSummaryEntry<A>> = []
  for (const [value, item] of lastSucceeded) {
    if (!queueValues.has(value)) {
      succeeded.push({ item, attempts: attempts.get(value) ?? 0 })
    }
  }
  return succeeded
}

const partitionQueue = <A>(queue: Chunk.Chunk<DrillItem<A>>, attempts: Map<A, number>) => {
  const attempted: Array<DrillSummaryEntry<A>> = []
  const pending: Array<DrillItem<A>> = []
  const seen = new Set<A>()

  for (const item of Chunk.toArray(queue)) {
    if (attempts.has(item.value)) {
      if (!seen.has(item.value)) {
        attempted.push({ item, attempts: attempts.get(item.value) ?? 0 })
        seen.add(item.value)
      }
    } else {
      pending.push(item)
    }
  }

  return { attempted, pending }
}

const summarize = <A>(state: DrillQueueState<A>): DrillSummary<A> => {
  const { attempts, lastSucceeded } = indexHistory(state.history)
  const queueValues = new Set(
    Chunk.toArray(state.queue).map((item) => {
      return item.value
    }),
  )

  const succeeded = collectSucceeded(lastSucceeded, queueValues, attempts)
  const { attempted, pending } = partitionQueue(state.queue, attempts)

  return {
    succeeded: Chunk.fromIterable(succeeded),
    attempted: Chunk.fromIterable(attempted),
    pending: Chunk.fromIterable(pending),
  }
}

export const DrillQueue = {
  make,
  makeWithScaffolding,
  current,
  succeed,
  recycle,
  isEmpty,
  summarize,
}
