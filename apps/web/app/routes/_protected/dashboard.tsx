import { Button, Text } from "@manabu/ui"
import { createFileRoute, Link } from "@tanstack/react-router"
import { styled } from "styled-system/jsx"

export const Route = createFileRoute("/_protected/dashboard")({
  component: DashboardPage,
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

function DashboardPage() {
  const { user } = Route.useRouteContext()

  return (
    <Main>
      <Text as="h1" variant="heading" textStyle="4xl" fontWeight="bold">
        Dashboard
      </Text>
      <Text color="fg.muted">{user.email}</Text>
      <Button size="lg" variant="outline" asChild>
        <Link to="/">Back to home</Link>
      </Button>
    </Main>
  )
}
