import { Atom } from "@effect-atom/atom-react"
import { createAuthClient } from "better-auth/react"
import { Effect, Option } from "effect"
import { AuthError, EmailAlreadyExists, InvalidCredentials } from "./errors"

const authClient: ReturnType<typeof createAuthClient> = createAuthClient()

export const useSession = authClient.useSession

const networkError = () => new AuthError({ message: "Network error" })

function toSignUpError(error: { code?: string; message?: string }, email: string) {
  const code = Option.fromNullable(error.code)
  const message = Option.fromNullable(error.message).pipe(
    Option.getOrElse(() => "An error occurred"),
  )

  return code.pipe(
    Option.filter(
      (c) => c === "USER_ALREADY_EXISTS" || c === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",
    ),
    Option.match({
      onSome: () => new EmailAlreadyExists({ email }),
      onNone: () => new AuthError({ message }),
    }),
  )
}

function toSignInError(error: { code?: string; message?: string }) {
  const code = Option.fromNullable(error.code)
  const message = Option.fromNullable(error.message).pipe(
    Option.getOrElse(() => "Invalid credentials"),
  )

  return code.pipe(
    Option.filter(
      (c) => c === "INVALID_EMAIL_OR_PASSWORD" || c === "INVALID_PASSWORD" || c === "INVALID_EMAIL",
    ),
    Option.match({
      onSome: () => new InvalidCredentials({ message }),
      onNone: () => new AuthError({ message }),
    }),
  )
}

function redirect(path: string) {
  return Effect.sync(() => {
    window.location.href = path
  })
}

function reload() {
  return Effect.sync(() => {
    window.location.reload()
  })
}

export const signUpAtom = Atom.fn(
  Effect.fnUntraced(function* (args: { email: string; password: string }) {
    const { error } = yield* Effect.tryPromise({
      try: () =>
        authClient.signUp.email({ email: args.email, password: args.password, name: args.email }),
      catch: networkError,
    })
    if (error) {
      return yield* Effect.fail(toSignUpError(error, args.email))
    }
    yield* redirect("/")
  }),
)

export const signInAtom = Atom.fn(
  Effect.fnUntraced(function* (args: { email: string; password: string }) {
    const { error } = yield* Effect.tryPromise({
      try: () => authClient.signIn.email({ email: args.email, password: args.password }),
      catch: networkError,
    })
    if (error) {
      return yield* Effect.fail(toSignInError(error))
    }
    yield* redirect("/")
  }),
)

export const signOutAtom = Atom.fn(
  Effect.fnUntraced(function* () {
    yield* Effect.tryPromise({
      try: () => authClient.signOut(),
      catch: networkError,
    })
    yield* reload()
  }),
)
