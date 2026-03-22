import { Text } from "@manabu/ui"
import { createFileRoute } from "@tanstack/react-router"
import { styled } from "styled-system/jsx"

export const Route = createFileRoute("/_protected/profile")({
  component: ProfilePage,
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

function ProfilePage() {
  return (
    <Main>
      <Text as="h1" variant="heading" textStyle="4xl" fontWeight="bold">
        Profil
      </Text>
    </Main>
  )
}
