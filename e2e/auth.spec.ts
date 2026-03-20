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

test.describe.configure({ mode: "serial" })

test.describe("Authentification", () => {
	test("parcours inscription (sign-up) → AC1", async ({ page }) => {
		const email = `signup-${Date.now()}@example.com`
		await signUp(page, email)

		await expect(page.getByText(email)).toBeVisible()
		await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible()
	})

	test("parcours connexion (sign-in) → AC2", async ({ page }) => {
		const email = `signin-${Date.now()}@example.com`
		await signUp(page, email)

		// Sign out
		await waitForHydration(page, "Sign out")
		await page.getByRole("button", { name: "Sign out" }).click()
		await page.waitForLoadState("networkidle")
		await expect(page.getByText("Get started")).toBeVisible()

		// Sign in
		await page.goto("/auth/sign-in", { waitUntil: "networkidle" })
		await waitForHydration(page, "Sign in")

		await page.getByLabel("Email").fill(email)
		await page.getByLabel("Password").fill(TEST_PASSWORD)

		const [signInResponse] = await Promise.all([
			page.waitForResponse((resp) => resp.url().includes("/api/auth/sign-in"), { timeout: 15000 }),
			page.getByRole("button", { name: "Sign in" }).click(),
		])
		expect(signInResponse.ok()).toBe(true)
		await expect(page).toHaveURL("/", { timeout: 15000 })
		await expect(page.getByText(email)).toBeVisible()
	})

	test("parcours déconnexion (sign-out) → AC3", async ({ page }) => {
		const email = `signout-${Date.now()}@example.com`
		await signUp(page, email)

		await waitForHydration(page, "Sign out")
		await page.getByRole("button", { name: "Sign out" }).click()

		await page.waitForLoadState("networkidle")
		await expect(page.getByText("Get started")).toBeVisible()
		await expect(page.getByRole("button", { name: "Sign out" })).not.toBeVisible()
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
