import type { Meta, StoryObj } from "@storybook/react-vite"
import type { DrillItem } from "~/logic/session/drill-queue.js"
import type {
  SessionSummaryAttemptedItem,
  SessionSummarySucceededItem,
} from "~/logic/session/session-summary.js"
import { makeFakeAudioBlob } from "~/test-utils/make-fake-audio-blob.js"
import { SessionSummary } from "~/components/session-summary/session-summary.js"

const fakeBlob = makeFakeAudioBlob()

function renderKana(item: DrillItem<string>): React.ReactNode {
  return item.value
}

function makeSucceeded(
  value: string,
  modelText: string,
  attempts: number,
  options: { withScaffolding?: boolean; isNew?: boolean } = {},
): SessionSummarySucceededItem<string> {
  return {
    kind: "succeeded",
    item: { value, withScaffolding: options.withScaffolding ?? false },
    attempts,
    modelText,
    recordingBlob: fakeBlob,
    isNew: options.isNew ?? false,
  }
}

function makeAttempted(
  value: string,
  modelText: string,
  attempts: number,
  options: { withScaffolding?: boolean; isNew?: boolean } = {},
): SessionSummaryAttemptedItem<string> {
  return {
    kind: "attempted",
    item: { value, withScaffolding: options.withScaffolding ?? false },
    attempts,
    modelText,
    isNew: options.isNew ?? false,
  }
}

const meta: Meta<typeof SessionSummary<string>> = {
  title: "Exercises/SessionSummary",
  component: SessionSummary,
}
export default meta

type Story = StoryObj<typeof SessionSummary<string>>

export const AllSucceededFirstTry: Story = {
  render: () => (
    <SessionSummary
      succeeded={[
        makeSucceeded("か", "か", 1),
        makeSucceeded("き", "き", 1),
        makeSucceeded("く", "く", 1),
        makeSucceeded("け", "け", 1),
        makeSucceeded("こ", "こ", 1),
      ]}
      attempted={[]}
      total={5}
      renderContent={renderKana}
    />
  ),
}

export const AllSucceededMultipleAttempts: Story = {
  render: () => (
    <SessionSummary
      succeeded={[
        makeSucceeded("か", "か", 1),
        makeSucceeded("き", "き", 2),
        makeSucceeded("く", "く", 1),
        makeSucceeded("け", "け", 3),
        makeSucceeded("こ", "こ", 1),
      ]}
      attempted={[]}
      total={5}
      renderContent={renderKana}
    />
  ),
}

export const Abandoned: Story = {
  render: () => (
    <SessionSummary
      succeeded={[
        makeSucceeded("食べる", "食べる", 1),
        makeSucceeded("飲む", "飲む", 2),
        makeSucceeded(
          "彼女は毎朝六時に起きてジョギングをする",
          "彼女は毎朝六時に起きてジョギングをする",
          1,
        ),
      ]}
      attempted={[makeAttempted("行く", "行く", 3), makeAttempted("来る", "来る", 2)]}
      total={5}
      renderContent={renderKana}
    />
  ),
}

export const SingleItem: Story = {
  render: () => (
    <SessionSummary
      succeeded={[makeSucceeded("か", "か", 1)]}
      attempted={[]}
      total={5}
      renderContent={renderKana}
    />
  ),
}

export const WithScaffolding: Story = {
  render: () => (
    <SessionSummary
      succeeded={[
        makeSucceeded("か", "か", 2),
        makeSucceeded("き", "き", 2),
        makeSucceeded("く", "く", 1),
      ]}
      attempted={[]}
      total={3}
      renderContent={renderKana}
    />
  ),
}

export const WithNewItems: Story = {
  render: () => (
    <SessionSummary
      succeeded={[
        makeSucceeded("か", "か", 1, { isNew: true }),
        makeSucceeded("き", "き", 2, { isNew: true }),
        makeSucceeded("く", "く", 1),
        makeSucceeded("け", "け", 1, { isNew: true }),
        makeSucceeded("こ", "こ", 3),
      ]}
      attempted={[]}
      total={5}
      renderContent={renderKana}
    />
  ),
}
