import { expect, test } from "@playwright/test"

const TEST_PASSWORD = "password1234"

async function waitForHydration(page: import("@playwright/test").Page, buttonName: string) {
	await page.waitForLoadState("networkidle")
	const button = page.getByRole("button", { name: buttonName })
	await button.waitFor({ state: "visible" })
	await page.waitForFunction(
		(name) => {
			const btn = [...document.querySelectorAll("button")].find((b) => b.textContent?.includes(name))
			return btn ? Object.keys(btn).some((key) => key.startsWith("__react")) : false
		},
		buttonName,
		{ timeout: 10000 },
	)
}

async function signUp(page: import("@playwright/test").Page, email: string) {
	await page.goto("/auth/sign-up", { waitUntil: "networkidle" })
	await waitForHydration(page, "Create account")
	await page.getByLabel("Email").fill(email)
	await page.getByLabel("Password", { exact: true }).fill(TEST_PASSWORD)
	await page.getByLabel("Confirm password").fill(TEST_PASSWORD)

	const [response] = await Promise.all([
		page.waitForResponse((resp) => resp.url().includes("/api/auth/sign-up"), { timeout: 15000 }),
		page.getByRole("button", { name: "Create account" }).click(),
	])
	expect(response.ok()).toBe(true)
	await expect(page).toHaveURL("/", { timeout: 15000 })
}

async function signIn(page: import("@playwright/test").Page, email: string) {
	await page.goto("/auth/sign-in", { waitUntil: "networkidle" })
	await waitForHydration(page, "Sign in")
	await page.getByLabel("Email").fill(email)
	await page.getByLabel("Password").fill(TEST_PASSWORD)

	const [response] = await Promise.all([
		page.waitForResponse((resp) => resp.url().includes("/api/auth/sign-in"), { timeout: 15000 }),
		page.getByRole("button", { name: "Sign in" }).click(),
	])
	expect(response.ok()).toBe(true)
	await expect(page).toHaveURL("/", { timeout: 15000 })
}

test.describe.configure({ mode: "serial" })

test.describe("Authentification", () => {
	// Shared email for reuse across tests — created once in AC1
	const sharedEmail = `shared-${Date.now()}@example.com`

	test("parcours inscription (sign-up) → AC1", async ({ page }) => {
		await signUp(page, sharedEmail)

		await expect(page.getByText(sharedEmail)).toBeVisible()
		await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible()
	})

	test("parcours connexion (sign-in) → AC2", async ({ page }) => {
		// Sign out first (AC1 left us logged in, but new page context means no session)
		// Sign in with the shared account
		await signIn(page, sharedEmail)
		await expect(page.getByText(sharedEmail)).toBeVisible()
	})

	test("parcours déconnexion (sign-out) → AC3", async ({ page }) => {
		await signIn(page, sharedEmail)

		await waitForHydration(page, "Sign out")
		await page.getByRole("button", { name: "Sign out" }).click()

		await page.waitForLoadState("networkidle")
		await expect(page.getByText("Get started")).toBeVisible()
		await expect(page.getByRole("button", { name: "Sign out" })).not.toBeVisible()
	})

	test("route protégée sans auth → redirection vers /auth/sign-in → AC5", async ({ page }) => {
		await page.goto("/dashboard", { waitUntil: "networkidle" })
		await expect(page).toHaveURL(/\/auth\/sign-in/, { timeout: 15000 })
	})

	test("session persistante après fermeture/réouverture navigateur → AC4", async ({ page, context }) => {
		await signIn(page, sharedEmail)

		// Verify user is authenticated
		await expect(page.getByText(sharedEmail)).toBeVisible()

		// Access a protected route to confirm session works
		await page.goto("/dashboard", { waitUntil: "networkidle" })
		await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })
		await expect(page.getByText(sharedEmail)).toBeVisible()

		// Get cookies before "closing" the browser
		const cookies = await context.cookies()

		// Create a new context (simulates browser reopen) with same cookies
		const newContext = await page.context().browser()!.newContext()
		await newContext.addCookies(cookies)
		const newPage = await newContext.newPage()

		// Access protected route with persisted session
		await newPage.goto("/dashboard", { waitUntil: "networkidle" })
		await expect(newPage).toHaveURL(/\/dashboard/, { timeout: 15000 })
		await expect(newPage.getByText(sharedEmail)).toBeVisible()

		await newContext.close()
	})

	test("pages sign-in et sign-up responsives sur 375px → AC9", async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 812 })

		await page.goto("/auth/sign-up", { waitUntil: "networkidle" })
		await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible()
		let hasHorizontalScroll = await page.evaluate(
			() => document.documentElement.scrollWidth > document.documentElement.clientWidth,
		)
		expect(hasHorizontalScroll).toBe(false)

		await page.goto("/auth/sign-in", { waitUntil: "networkidle" })
		await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible()
		hasHorizontalScroll = await page.evaluate(
			() => document.documentElement.scrollWidth > document.documentElement.clientWidth,
		)
		expect(hasHorizontalScroll).toBe(false)
	})
})
