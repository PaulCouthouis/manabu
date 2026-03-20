import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
	testDir: ".",
	testMatch: "**/*.spec.ts",
	timeout: 30_000,
	retries: 0,
	use: {
		baseURL: "http://localhost:5173",
		headless: true,
	},
	projects: [
		{
			name: "desktop",
			use: { ...devices["Desktop Chrome"] },
		},
		{
			name: "mobile",
			use: {
				...devices["Desktop Chrome"],
				viewport: { width: 375, height: 812 },
			},
		},
	],
	webServer: {
		command: "pnpm --filter @manabu/web dev",
		url: "http://localhost:5173",
		reuseExistingServer: !process.env["CI"],
		timeout: 30_000,
		cwd: "..",
	},
})
