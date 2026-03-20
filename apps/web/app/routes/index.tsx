import { Button, Text } from "@manabu/ui"
import { createFileRoute } from "@tanstack/react-router"
import { styled } from "styled-system/jsx"

export const Route = createFileRoute("/")({
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
	return (
		<Main>
			<Text as="h1" variant="heading" textStyle="4xl" fontWeight="bold">
				Manabu
			</Text>
			<Text textStyle="lg" color="fg.muted" textAlign="center">
				Learn Japanese, skill by skill
			</Text>
			<Button size="lg" colorPalette="accent">Get started</Button>
		</Main>
	)
}
