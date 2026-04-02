import type { Meta, StoryObj } from "@storybook/react-vite"
import { RegistryProvider } from "@effect-atom/atom-react"
import { Layer } from "effect"
import { useState } from "react"
import { Button } from "@manabu/ui"
import {
  IMEHelpModal,
  IMEHelpModalProvider,
  type IMEHelpModalProps,
} from "~/components/ime-help-modal/ime-help-modal.js"
import { UserAgentApi } from "~/logic/user-agent.js"

// --- Fake user agent strings ---

const userAgents = {
  macos:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  windows:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  ios: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  android:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  chromeos:
    "Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  unknown: "SomeUnknownBrowser/1.0",
} as const

function fakeUserAgentLayer(userAgent: string) {
  return Layer.succeed(UserAgentApi, {
    get: () => {
      return userAgent
    },
  })
}

// --- Story wrapper ---

function IMEHelpStory(props: { readonly userAgent: string }) {
  const [open, setOpen] = useState(true)
  return (
    <RegistryProvider>
      <IMEHelpModalProvider layer={fakeUserAgentLayer(props.userAgent)}>
        <Button
          onClick={() => {
            setOpen(true)
          }}
        >
          Open IME Help
        </Button>
        <IMEHelpModal
          open={open}
          onClose={() => {
            setOpen(false)
          }}
        />
      </IMEHelpModalProvider>
    </RegistryProvider>
  )
}

// --- Meta ---

const meta: Meta<IMEHelpModalProps> = {
  title: "Exercises/IMEHelpModal",
  component: IMEHelpModal,
}
export default meta

type Story = StoryObj<IMEHelpModalProps>

// --- Stories ---

export const IMEHelpModal_macOS: Story = {
  name: "macOS",
  render: () => {
    return <IMEHelpStory userAgent={userAgents.macos} />
  },
}

export const IMEHelpModal_Windows: Story = {
  name: "Windows",
  render: () => {
    return <IMEHelpStory userAgent={userAgents.windows} />
  },
}

export const IMEHelpModal_iOS: Story = {
  name: "iOS",
  render: () => {
    return <IMEHelpStory userAgent={userAgents.ios} />
  },
}

export const IMEHelpModal_Android: Story = {
  name: "Android",
  render: () => {
    return <IMEHelpStory userAgent={userAgents.android} />
  },
}

export const IMEHelpModal_ChromeOS: Story = {
  name: "ChromeOS",
  render: () => {
    return <IMEHelpStory userAgent={userAgents.chromeos} />
  },
}

export const IMEHelpModal_Unknown: Story = {
  name: "Unknown (platform selector)",
  render: () => {
    return <IMEHelpStory userAgent={userAgents.unknown} />
  },
}
