import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql"
import { getMigrations } from "better-auth/db/migration"
import { Duration } from "effect"
import { Pool } from "pg"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { POOL_DEFAULTS, createAuth, SESSION_MAX_AGE } from "./server"

const BASE_URL = "http://localhost:3000"

describe("Auth integration — Testcontainers", () => {
  let container: StartedPostgreSqlContainer
  let pool: Pool
  let auth: ReturnType<typeof createAuth>

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:17").start()

    pool = new Pool({
      host: container.getHost(),
      port: container.getMappedPort(5432),
      database: container.getDatabase(),
      user: container.getUsername(),
      password: container.getPassword(),
      ...POOL_DEFAULTS,
    })

    // Pass the same pool to Better Auth so we control the lifecycle
    auth = createAuth({
      database: pool,
      secret: "test-secret-at-least-32-chars-long!!",
      baseURL: BASE_URL,
      trustedOrigins: [BASE_URL],
      rateLimitMax: 3, // Low limit for testing
    })

    // Run Better Auth migrations to create tables (user, session, account, verification)
    const { runMigrations } = await getMigrations(auth.options)
    await runMigrations()
  }, 60_000)

  afterAll(async () => {
    await pool.end()
    await container.stop()
  })

  test("AC6 — le mot de passe est hashé en base, jamais stocké en clair", async () => {
    const plainPassword = "MySecureP@ssw0rd"

    await auth.api.signUpEmail({
      body: { email: "hash-test@example.com", password: plainPassword, name: "Hash Test" },
    })

    // Query the account table directly — Better Auth stores password hash in "account"
    const result = await pool.query(
      `SELECT password FROM account WHERE "userId" = (SELECT id FROM "user" WHERE email = $1) AND "providerId" = 'credential'`,
      ["hash-test@example.com"],
    )

    expect(result.rows.length).toBe(1)
    const storedPassword = result.rows[0]?.password as string
    expect(storedPassword).toBeTruthy()
    // The stored value must NOT be the plaintext password
    expect(storedPassword).not.toBe(plainPassword)
    // bcrypt/scrypt hashes are typically long strings starting with $ or similar
    expect(storedPassword.length).toBeGreaterThan(plainPassword.length)
  })

  test("AC7 — le rate limiting bloque après N tentatives/min/IP", async () => {
    // With rateLimitMax: 3, the 4th request should be blocked
    const makeSignInRequest = () =>
      auth.handler(
        new Request(`${BASE_URL}/api/auth/sign-in/email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "nobody@example.com", password: "wrong" }),
        }),
      )

    // First 3 requests should go through (even if credentials are wrong, they shouldn't be 429)
    const responses: Response[] = []
    for (let i = 0; i < 3; i++) {
      responses.push(await makeSignInRequest())
    }

    for (const res of responses) {
      expect(res.status).not.toBe(429)
    }

    // 4th request should be rate-limited
    const blockedResponse = await makeSignInRequest()
    expect(blockedResponse.status).toBe(429)
  })

  test("AC8 — la session expire après 30 jours d'inactivité", async () => {
    // Sign up a user (creates a session)
    await auth.api.signUpEmail({
      body: {
        email: "session-test@example.com",
        password: "MySecureP@ssw0rd",
        name: "Session Test",
      },
    })

    // Query the session table to check expiresAt
    const result = await pool.query(
      `SELECT "expiresAt" FROM session WHERE "userId" = (SELECT id FROM "user" WHERE email = $1)`,
      ["session-test@example.com"],
    )

    expect(result.rows.length).toBeGreaterThanOrEqual(1)
    const expiresAt = new Date(result.rows[0]?.expiresAt as string)
    const now = new Date()

    // Session should expire approximately 30 days from now
    const diffSeconds = (expiresAt.getTime() - now.getTime()) / 1000
    const maxAgeSeconds = Duration.toSeconds(SESSION_MAX_AGE)
    // Allow 60 seconds of tolerance for test execution time
    expect(diffSeconds).toBeGreaterThan(maxAgeSeconds - 60)
    expect(diffSeconds).toBeLessThanOrEqual(maxAgeSeconds + 60)
  })
})
