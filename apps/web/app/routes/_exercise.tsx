import { Outlet, createFileRoute, redirect } from "@tanstack/react-router"
import { getAuthSessionFn } from "../server/auth"

export const Route = createFileRoute("/_exercise")({
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
  component: ExerciseLayout,
})

function ExerciseLayout() {
  return <Outlet />
}
