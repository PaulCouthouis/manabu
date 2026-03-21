import { getSession } from "@manabu/auth"
import { Effect } from "effect"
import { createServerFn } from "@tanstack/react-start"
import { getRequest } from "@tanstack/react-start/server"

export const getAuthSessionFn = createServerFn({ method: "GET" }).handler(async () =>
  getSession(getRequest().headers).pipe(
    Effect.map((session) => ({
      id: session.user.id,
      email: session.user.email,
    })),
    Effect.runPromise,
  ),
)
