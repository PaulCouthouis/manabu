import { betterAuth } from "better-auth"
import { Pool } from "pg"

export const auth = betterAuth({
  database: new Pool({
    host: process.env["DB_HOST"],
    port: Number(process.env["DB_PORT"]),
    database: process.env["DB_NAME"],
    user: process.env["DB_USER"],
    password: process.env["DB_PASSWORD"],
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  }),
  secret: process.env["BETTER_AUTH_SECRET"],
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 30 * 24 * 60 * 60, // 30 days in seconds
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 10,
  },
})
