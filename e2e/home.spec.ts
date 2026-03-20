import { expect, test } from "@playwright/test"

test.describe("Page d'accueil", () => {
	test("affiche le titre, le sous-titre et le bouton", async ({ page }) => {
		await page.goto("/")

		await expect(page.getByRole("heading", { name: "Manabu" })).toBeVisible()
		await expect(page.getByText("Learn Japanese, skill by skill")).toBeVisible()
		await expect(page.getByRole("button", { name: "Get started" })).toBeVisible()
	})

	test("pas de scroll horizontal sur viewport 375px", async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 812 })
		await page.goto("/")

		const hasHorizontalScroll = await page.evaluate(
			() => document.documentElement.scrollWidth > document.documentElement.clientWidth,
		)

		expect(hasHorizontalScroll).toBe(false)
	})
})
