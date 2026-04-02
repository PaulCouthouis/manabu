import { type ComponentType, useState } from "react"
import { Array, Effect, type Layer, Option, Record, pipe } from "effect"
import { Apple, Keyboard, Laptop, Monitor, Smartphone, TabletSmartphone } from "lucide-react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { styled } from "styled-system/jsx"
import { Button, Dialog } from "@manabu/ui"
import { type DeviceType, detectDevice } from "~/components/ime-help-modal/detect-device.js"
import { createExerciseProvider } from "~/components/shared/exercise-provider.js"
import { Prose } from "~/components/shared/prose-styles.js"
import { UserAgentApi } from "~/logic/user-agent.js"
import androidContent from "~/content/ime-help/android.md?raw"
import chromeosContent from "~/content/ime-help/chromeos.md?raw"
import iosContent from "~/content/ime-help/ios.md?raw"
import macosContent from "~/content/ime-help/macos.md?raw"
import windowsContent from "~/content/ime-help/windows.md?raw"

export type IMEHelpModalLayer = Layer.Layer<UserAgentApi>

type KnownDevice = Exclude<DeviceType, "unknown">

export interface IMEHelpModalProps {
  readonly open: boolean
  readonly onClose: () => void
}

const contentByDevice = {
  ios: iosContent,
  android: androidContent,
  macos: macosContent,
  windows: windowsContent,
  chromeos: chromeosContent,
} as const

const ICON_SIZE = 18

const deviceIcons: ReadonlyArray<readonly [KnownDevice, ComponentType<{ size: number }>]> = [
  ["macos", Apple],
  ["windows", Monitor],
  ["ios", Smartphone],
  ["android", TabletSmartphone],
  ["chromeos", Laptop],
]

const REMARK_PLUGINS = [remarkGfm]

const DeviceLabel = styled("p", {
  base: {
    fontSize: "sm",
    color: "fg.muted",
    mb: "3",
  },
})

const PlatformButton = styled("button", {
  base: {
    width: "100%",
    py: "3",
    px: "4",
    mb: "2",
    borderRadius: "md",
    border: "1px solid",
    borderColor: "border.default",
    bg: "bg.default",
    cursor: "pointer",
    textAlign: "left",
    fontSize: "md",
    display: "flex",
    alignItems: "center",
    gap: "3",
    _hover: { bg: "bg.subtle" },
  },
})

const BackLink = styled("button", {
  base: {
    color: "fg.muted",
    fontSize: "sm",
    cursor: "pointer",
    bg: "transparent",
    border: "none",
    mb: "3",
    _hover: { color: "fg.default" },
  },
})

const deviceDisplayNames = {
  ios: "iOS",
  android: "Android",
  macos: "macOS",
  windows: "Windows",
  chromeos: "ChromeOS",
} as const

function DeviceContent(props: { readonly deviceType: KnownDevice }) {
  const content = pipe(contentByDevice, Record.get(props.deviceType), Option.getOrThrow)

  const displayName = pipe(deviceDisplayNames, Record.get(props.deviceType), Option.getOrThrow)

  return (
    <>
      <DeviceLabel>
        We detected you're on <strong>{displayName}</strong>.
      </DeviceLabel>
      <Prose>
        <Markdown remarkPlugins={REMARK_PLUGINS}>{content}</Markdown>
      </Prose>
    </>
  )
}

function PlatformSelector(props: { readonly onSelect: (device: KnownDevice) => void }) {
  return (
    <>
      <DeviceLabel>We couldn't detect your device. Select your platform:</DeviceLabel>
      {Array.map(deviceIcons, ([device, Icon]) => {
        const label = pipe(Record.get(deviceDisplayNames, device), Option.getOrThrow)
        return (
          <PlatformButton
            key={device}
            onClick={() => {
              props.onSelect(device)
            }}
          >
            <Icon size={ICON_SIZE} /> {label}
          </PlatformButton>
        )
      })}
    </>
  )
}

function makeAtoms(layer: IMEHelpModalLayer) {
  const deviceType = Effect.runSync(pipe(detectDevice, Effect.provide(layer)))
  return { deviceType }
}

const { Provider: IMEHelpModalProvider, useAtoms } = createExerciseProvider(
  "IMEHelpModal",
  makeAtoms,
)

export { IMEHelpModalProvider }

function useDeviceType() {
  return useAtoms().deviceType
}

function ModalBody(props: { readonly deviceType: DeviceType }) {
  const [manualDevice, setManualDevice] = useState<KnownDevice | null>(null)

  if (props.deviceType !== "unknown") {
    return <DeviceContent deviceType={props.deviceType} />
  }

  if (manualDevice !== null) {
    return (
      <>
        <BackLink
          onClick={() => {
            setManualDevice(null)
          }}
        >
          ← Back to platforms
        </BackLink>
        <DeviceContent deviceType={manualDevice} />
      </>
    )
  }

  return <PlatformSelector onSelect={setManualDevice} />
}

export function IMEHelpModal(props: IMEHelpModalProps) {
  const { open, onClose } = props
  const deviceType = useDeviceType()
  return (
    <Dialog.Root
      open={open}
      scrollBehavior="inside"
      onOpenChange={(details) => {
        if (!details.open) {
          onClose()
        }
      }}
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Header css={{ pr: "10" }}>
            <Dialog.Title css={{ display: "flex", alignItems: "center", gap: "2" }}>
              <Keyboard size={20} /> Japanese Keyboard Setup
            </Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>
            <ModalBody deviceType={deviceType} />
          </Dialog.Body>
          <Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <Button variant="outline">Got it</Button>
            </Dialog.CloseTrigger>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  )
}
