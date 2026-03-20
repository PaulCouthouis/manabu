import { signInAtom } from "@manabu/auth/client"
import { useAtom } from "@effect-atom/atom-react"
import { Alert, Button, Card, Field, Input, Link, Text } from "@manabu/ui"
import { createFileRoute } from "@tanstack/react-router"
import { Cause, Exit, Option } from "effect"
import { useActionState } from "react"
import { styled } from "styled-system/jsx"

export const Route = createFileRoute("/auth/sign-in")({
  component: SignInPage,
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

function SignInPage() {
  const [, signIn] = useAtom(signInAtom, { mode: "promiseExit" })

  const [error, formAction, isPending] = useActionState(
    async (_prev: Option.Option<string>, formData: FormData) => {
      const email = String(formData.get("email") ?? "")
      const password = String(formData.get("password") ?? "")

      const exit = await signIn({ email, password })

      if (Exit.isFailure(exit)) {
        return Cause.failureOption(exit.cause).pipe(Option.map((e) => e.message))
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
            Sign in
          </Card.Title>
          <Card.Description>
            <Text color="fg.muted">Welcome back to Manabu</Text>
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
                <Input type="password" name="password" placeholder="Your password" required />
              </Field.Root>
              <Button
                type="submit"
                size="lg"
                colorPalette="accent"
                width="100%"
                loading={isPending}
              >
                Sign in
              </Button>
            </FormStack>
          </form>
        </Card.Body>
        <Card.Footer justifyContent="center">
          <Text color="fg.muted">
            Don't have an account?{" "}
            <Link href="/auth/sign-up" colorPalette="accent">
              Sign up
            </Link>
          </Text>
        </Card.Footer>
      </Card.Root>
    </Main>
  )
}
