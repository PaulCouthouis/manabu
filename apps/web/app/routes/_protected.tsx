import { Outlet, createFileRoute, redirect } from "@tanstack/react-router"
import { getAuthSessionFn } from "../server/auth"

export const Route = createFileRoute("/_protected")({
  beforeLoad: async ({ location }) => {
    try {
      return { user: await getAuthSessionFn() }
    } catch {
      throw redirect({
        to: "/auth/sign-in",
        search: { redirect: location.pathname },
      })
    }
  },
  component: ProtectedLayout,
})

function ProtectedLayout() {
  return <Outlet />
}
