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

test.describe("Navigation — US9", () => {
	test("routes protégées sans auth redirigent vers /auth/sign-in → AC5, AC6", async ({ page }) => {
		await page.goto("/home", { waitUntil: "networkidle" })
		await expect(page).toHaveURL(/\/auth\/sign-in/, { timeout: 15000 })

		await page.goto("/progress", { waitUntil: "networkidle" })
		await expect(page).toHaveURL(/\/auth\/sign-in/, { timeout: 15000 })

		await page.goto("/profile", { waitUntil: "networkidle" })
		await expect(page).toHaveURL(/\/auth\/sign-in/, { timeout: 15000 })

		await page.goto("/session", { waitUntil: "networkidle" })
		await expect(page).toHaveURL(/\/auth\/sign-in/, { timeout: 15000 })
	})

	test("coquilles vides avec titres identifiables et layout standard → AC1, AC2, AC3, AC7", async ({ page }) => {
		const email = `nav-${Date.now()}@example.com`
		await signUp(page, email)

		await page.goto("/home", { waitUntil: "networkidle" })
		await expect(page).toHaveURL(/\/home/, { timeout: 15000 })
		await expect(page.getByRole("heading", { name: "Home" })).toBeVisible()
		await expect(page.locator("main")).toBeVisible()

		await page.goto("/progress", { waitUntil: "networkidle" })
		await expect(page).toHaveURL(/\/progress/, { timeout: 15000 })
		await expect(page.getByRole("heading", { name: "Progression" })).toBeVisible()
		await expect(page.locator("main")).toBeVisible()

		await page.goto("/profile", { waitUntil: "networkidle" })
		await expect(page).toHaveURL(/\/profile/, { timeout: 15000 })
		await expect(page.getByRole("heading", { name: "Profil" })).toBeVisible()
		await expect(page.locator("main")).toBeVisible()
	})

	test("/session rend une page plein écran avec layout exercice → AC4, AC8", async ({ page }) => {
		const email = `nav-session-${Date.now()}@example.com`
		await signUp(page, email)

		await page.goto("/session", { waitUntil: "networkidle" })
		await expect(page).toHaveURL(/\/session/, { timeout: 15000 })
		await expect(page.getByRole("heading", { name: "Session" })).toBeVisible()
		await expect(page.locator("[data-layout='exercise']")).toBeVisible()
	})
})
