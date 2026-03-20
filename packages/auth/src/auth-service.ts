import { Context, Effect, Layer, Option } from "effect"
import { APIError } from "better-auth/api"
import { auth } from "./server"
import { AuthError, EmailAlreadyExists, InvalidCredentials, Unauthorized } from "./errors"

type SignUpResponse = Awaited<ReturnType<typeof auth.api.signUpEmail>>
type SignInResponse = Awaited<ReturnType<typeof auth.api.signInEmail>>
type SignOutResponse = Awaited<ReturnType<typeof auth.api.signOut>>
type SessionResponse = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function apiErrorMessage(error: APIError): string {
  return Option.fromNullable(error.body?.message).pipe(Option.getOrElse(() => error.message))
}

function apiErrorCode(error: APIError): Option.Option<string> {
  return Option.fromNullable(error.body?.code)
}

function toAuthError(error: unknown): AuthError | InvalidCredentials {
  if (error instanceof APIError) {
    return apiErrorCode(error).pipe(
      Option.filter(
        (code) =>
          code === "INVALID_EMAIL_OR_PASSWORD" ||
          code === "INVALID_PASSWORD" ||
          code === "INVALID_EMAIL",
      ),
      Option.match({
        onSome: () => new InvalidCredentials({ message: apiErrorMessage(error) }),
        onNone: () => new AuthError({ message: apiErrorMessage(error) }),
      }),
    )
  }
  return new AuthError({ message: errorMessage(error) })
}

function toSignUpError(email: string) {
  return (error: unknown): AuthError | EmailAlreadyExists => {
    if (error instanceof APIError) {
      return apiErrorCode(error).pipe(
        Option.filter(
          (code) =>
            code === "USER_ALREADY_EXISTS" || code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",
        ),
        Option.match({
          onSome: () => new EmailAlreadyExists({ email }),
          onNone: () => new AuthError({ message: apiErrorMessage(error) }),
        }),
      )
    }
    return new AuthError({ message: errorMessage(error) })
  }
}

export class AuthService extends Context.Tag("AuthService")<
  AuthService,
  {
    readonly handler: (request: Request) => Effect.Effect<Response, AuthError>
    readonly signUp: (
      email: string,
      password: string,
      name: string,
    ) => Effect.Effect<SignUpResponse, AuthError | EmailAlreadyExists>
    readonly signIn: (
      email: string,
      password: string,
    ) => Effect.Effect<SignInResponse, AuthError | InvalidCredentials>
    readonly signOut: (headers: Headers) => Effect.Effect<SignOutResponse, AuthError>
    readonly getSession: (
      headers: Headers,
    ) => Effect.Effect<SessionResponse, AuthError | Unauthorized>
  }
>() {}

export const AuthServiceLive = Layer.succeed(AuthService, {
  handler: (request) =>
    Effect.tryPromise({
      try: () => auth.handler(request),
      catch: (error) => new AuthError({ message: errorMessage(error) }),
    }),

  signUp: (email, password, name) =>
    Effect.tryPromise({
      try: () => auth.api.signUpEmail({ body: { email, password, name } }),
      catch: toSignUpError(email),
    }),

  signIn: (email, password) =>
    Effect.tryPromise({
      try: () => auth.api.signInEmail({ body: { email, password } }),
      catch: toAuthError,
    }),

  signOut: (headers) =>
    Effect.tryPromise({
      try: () => auth.api.signOut({ headers }),
      catch: (error) => new AuthError({ message: errorMessage(error) }),
    }),

  getSession: (headers) =>
    Effect.tryPromise({
      try: () => auth.api.getSession({ headers }),
      catch: (error) => new AuthError({ message: errorMessage(error) }),
    }).pipe(
      Effect.filterOrFail(
        (session): session is NonNullable<typeof session> => session != null,
        () => new Unauthorized({ message: "Not authenticated" }),
      ),
    ),
})
