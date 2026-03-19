import { APP_NAME } from "@manabu/shared"
import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router"

export const Route = createRootRoute({
	component: RootComponent,
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: APP_NAME },
		],
	}),
})

function RootComponent() {
	return (
		<html lang="ja">
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
