import { Text } from "@manabu/ui"
import { createFileRoute } from "@tanstack/react-router"
import { styled } from "styled-system/jsx"

export const Route = createFileRoute("/_exercise/session")({
  component: SessionPage,
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

function SessionPage() {
  return (
    <Main data-layout="exercise">
      <Text as="h1" variant="heading" textStyle="4xl" fontWeight="bold">
        Session
      </Text>
    </Main>
  )
}
