import { APP_NAME } from "@manabu/shared"
import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router"
import indexCss from "../index.css?url"

export const Route = createRootRoute({
	component: RootComponent,
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: APP_NAME },
		],
		links: [{ rel: "stylesheet", href: indexCss }],
	}),
})

function RootComponent() {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<Outlet />
				<Scripts />
			</body>
		</html>
	)
}
