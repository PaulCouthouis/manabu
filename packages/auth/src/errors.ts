import { Data } from "effect"

export class AuthError extends Data.TaggedError("AuthError")<{
  readonly message: string
}> {}

export class InvalidCredentials extends Data.TaggedError("InvalidCredentials")<{
  readonly message: string
}> {}

export class EmailAlreadyExists extends Data.TaggedError("EmailAlreadyExists")<{
  readonly email: string
}> {}

export class Unauthorized extends Data.TaggedError("Unauthorized")<{
  readonly message: string
}> {}
