import { signUpAtom } from "@manabu/auth/client"
import { useAtom } from "@effect-atom/atom-react"
import { Alert, Button, Card, Field, Input, Link, Text } from "@manabu/ui"
import { createFileRoute } from "@tanstack/react-router"
import { Cause, Exit, Match, Option } from "effect"
import { useActionState } from "react"
import { styled } from "styled-system/jsx"

export const Route = createFileRoute("/auth/sign-up")({
  component: SignUpPage,
})

const Main = styled("main", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100dvh",
    padding: "6",
  },
})

const FormStack = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "4",
  },
})

function SignUpPage() {
  const [, signUp] = useAtom(signUpAtom, { mode: "promiseExit" })

  const [error, formAction, isPending] = useActionState(
    async (_prev: Option.Option<string>, formData: FormData) => {
      const email = String(formData.get("email") ?? "")
      const password = String(formData.get("password") ?? "")
      const confirmPassword = String(formData.get("confirmPassword") ?? "")

      if (password !== confirmPassword) return Option.some("Passwords do not match")
      if (password.length < 8) return Option.some("Password must be at least 8 characters")

      const exit = await signUp({ email, password })

      if (Exit.isFailure(exit)) {
        return Cause.failureOption(exit.cause).pipe(
          Option.map(
            Match.typeTags({
              EmailAlreadyExists: ({ email }) => `Email ${email} is already taken`,
              AuthError: ({ message }) => message,
            }),
          ),
        )
      }

      return Option.none()
    },
    Option.none(),
  )

  return (
    <Main>
      <Card.Root width="100%" maxWidth="400px">
        <Card.Header>
          <Card.Title textStyle="2xl" fontWeight="bold">
            Create account
          </Card.Title>
          <Card.Description>
            <Text color="fg.muted">Sign up to start learning Japanese</Text>
          </Card.Description>
        </Card.Header>
        <Card.Body>
          <form action={formAction}>
            <FormStack>
              {Option.isSome(error) && (
                <Alert.Root>
                  <Alert.Icon />
                  <Alert.Content>
                    <Alert.Description>{error.value}</Alert.Description>
                  </Alert.Content>
                </Alert.Root>
              )}
              <Field.Root>
                <Field.Label>Email</Field.Label>
                <Input type="email" name="email" placeholder="you@example.com" required />
              </Field.Root>
              <Field.Root>
                <Field.Label>Password</Field.Label>
                <Input
                  type="password"
                  name="password"
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                />
              </Field.Root>
              <Field.Root>
                <Field.Label>Confirm password</Field.Label>
                <Input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  required
                  minLength={8}
                />
              </Field.Root>
              <Button
                type="submit"
                size="lg"
                colorPalette="accent"
                width="100%"
                loading={isPending}
              >
                Create account
              </Button>
            </FormStack>
          </form>
        </Card.Body>
        <Card.Footer justifyContent="center">
          <Text color="fg.muted">
            Already have an account?{" "}
            <Link href="/auth/sign-in" colorPalette="accent">
              Sign in
            </Link>
          </Text>
        </Card.Footer>
      </Card.Root>
    </Main>
  )
}
