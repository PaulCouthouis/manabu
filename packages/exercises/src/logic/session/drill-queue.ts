import { Array, Chunk, HashMap, Option, pipe } from "effect"

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
  return Array.reduce(
    Chunk.toArray(history),
    {
      attempts: HashMap.empty<A, number>(),
      lastSucceeded: HashMap.empty<A, DrillItem<A>>(),
    },
    (acc, entry) => {
      const currentAttempts = pipe(
        HashMap.get(acc.attempts, entry.item.value),
        Option.getOrElse(() => {
          return 0
        }),
      )
      const attempts = HashMap.set(acc.attempts, entry.item.value, currentAttempts + 1)
      const lastSucceeded =
        entry.outcome === "success"
          ? HashMap.set(acc.lastSucceeded, entry.item.value, entry.item)
          : acc.lastSucceeded
      return { attempts, lastSucceeded }
    },
  )
}

const collectSucceeded = <A>(
  lastSucceeded: HashMap.HashMap<A, DrillItem<A>>,
  queueValues: HashMap.HashMap<A, true>,
  attempts: HashMap.HashMap<A, number>,
) => {
  return Array.filterMap(HashMap.toEntries(lastSucceeded), ([value, item]) => {
    return HashMap.has(queueValues, value)
      ? Option.none()
      : Option.some({
          item,
          attempts: pipe(
            HashMap.get(attempts, value),
            Option.getOrElse(() => {
              return 0
            }),
          ),
        })
  })
}

const partitionQueue = <A>(
  queue: Chunk.Chunk<DrillItem<A>>,
  attempts: HashMap.HashMap<A, number>,
) => {
  const { attempted, pending } = Array.reduce(
    Chunk.toArray(queue),
    {
      attempted: [] as ReadonlyArray<DrillSummaryEntry<A>>,
      pending: [] as ReadonlyArray<DrillItem<A>>,
      seen: HashMap.empty<A, true>(),
    },
    (acc, item) => {
      if (!HashMap.has(attempts, item.value)) {
        return { ...acc, pending: [...acc.pending, item] }
      }
      if (HashMap.has(acc.seen, item.value)) {
        return acc
      }
      return {
        attempted: [
          ...acc.attempted,
          {
            item,
            attempts: pipe(
              HashMap.get(attempts, item.value),
              Option.getOrElse(() => {
                return 0
              }),
            ),
          },
        ],
        pending: acc.pending,
        seen: HashMap.set(acc.seen, item.value, true as const),
      }
    },
  )
  return { attempted, pending }
}

const summarize = <A>(state: DrillQueueState<A>): DrillSummary<A> => {
  const { attempts, lastSucceeded } = indexHistory(state.history)
  const queueValues = HashMap.fromIterable(
    Array.map(Chunk.toArray(state.queue), (item) => {
      return [item.value, true as const] as const
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
