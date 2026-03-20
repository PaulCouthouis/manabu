import { betterAuth } from "better-auth"
import { Duration, Effect } from "effect"
import { Pool } from "pg"
import { AuthError, Unauthorized } from "./errors"

export interface AuthDatabaseConfig {
  readonly host: string
  readonly port: number
  readonly database: string
  readonly user: string
  readonly password: string
}

export interface AuthConfig {
  readonly database: AuthDatabaseConfig | Pool
  readonly secret: string
  readonly baseURL?: string
  readonly trustedOrigins?: ReadonlyArray<string>
  readonly rateLimitMax?: number
}

export const SESSION_MAX_AGE = Duration.days(30)
const RATE_LIMIT_WINDOW = Duration.minutes(1)
export const RATE_LIMIT_MAX = 10

export const POOL_DEFAULTS = {
  max: 5,
  idleTimeoutMillis: Duration.toMillis(Duration.seconds(30)),
  connectionTimeoutMillis: Duration.toMillis(Duration.seconds(5)),
} as const

function toPool(database: AuthDatabaseConfig | Pool): Pool {
  if (database instanceof Pool) return database
  return new Pool({
    host: database.host,
    port: database.port,
    database: database.database,
    user: database.user,
    password: database.password,
    ...POOL_DEFAULTS,
  })
}

export function createAuth(config: AuthConfig) {
  return betterAuth({
    database: toPool(config.database),
    secret: config.secret,
    baseURL: config.baseURL,
    trustedOrigins: config.trustedOrigins ? [...config.trustedOrigins] : undefined,
    emailAndPassword: {
      enabled: true,
    },
    session: {
      expiresIn: Duration.toSeconds(SESSION_MAX_AGE),
    },
    rateLimit: {
      enabled: true,
      window: Duration.toSeconds(RATE_LIMIT_WINDOW),
      max: config.rateLimitMax ?? RATE_LIMIT_MAX,
    },
  })
}

export const auth = createAuth({
  database: {
    host: process.env["DB_HOST"] ?? "localhost",
    port: Number(process.env["DB_PORT"] ?? 5432),
    database: process.env["DB_NAME"] ?? "manabu_dev",
    user: process.env["DB_USER"] ?? "manabu",
    password: process.env["DB_PASSWORD"] ?? "manabu",
  },
  secret: process.env["BETTER_AUTH_SECRET"] ?? "dev-secret-change-in-production",
  baseURL: process.env["BETTER_AUTH_URL"] ?? "http://localhost:5173",
  rateLimitMax: Number.isNaN(Number(process.env["RATE_LIMIT_MAX"]))
    ? RATE_LIMIT_MAX
    : Number(process.env["RATE_LIMIT_MAX"] ?? RATE_LIMIT_MAX),
})

type SessionResponse = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export const handler = (request: Request) =>
  Effect.tryPromise({
    try: () => auth.handler(request),
    catch: (error) => new AuthError({ message: errorMessage(error) }),
  })

export const getSession = (headers: Headers) =>
  Effect.tryPromise({
    try: () => auth.api.getSession({ headers }),
    catch: (error) => new AuthError({ message: errorMessage(error) }),
  }).pipe(
    Effect.filterOrFail(
      (session): session is SessionResponse => session != null,
      () => new Unauthorized({ message: "Not authenticated" }),
    ),
  )
