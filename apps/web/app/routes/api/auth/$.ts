import { handler } from "@manabu/auth"
import { Effect } from "effect"
import { createFileRoute } from "@tanstack/react-router"

const handleAuth = (request: Request) => handler(request).pipe(Effect.runPromise)

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => handleAuth(request),
      POST: async ({ request }: { request: Request }) => handleAuth(request),
    },
  },
})
