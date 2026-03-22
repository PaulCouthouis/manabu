import { Text } from "@manabu/ui"
import { createFileRoute } from "@tanstack/react-router"
import { styled } from "styled-system/jsx"

export const Route = createFileRoute("/_protected/home")({
  component: HomePage,
})

const Main = styled("main", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100dvh",
    gap: "6",
    padding: "6",
  },
})

function HomePage() {
  const { user } = Route.useRouteContext()

  return (
    <Main>
      <Text as="h1" variant="heading" textStyle="4xl" fontWeight="bold">
        Home
      </Text>
      <Text color="fg.muted">{user.email}</Text>
    </Main>
  )
}
