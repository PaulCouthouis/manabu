import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import { RegistryProvider } from "@effect-atom/atom-react"
import { Effect, Layer } from "effect"
import { styled } from "styled-system/jsx"
import type { SpeechRepeatConfig } from "~/logic/speech-repeat-config.js"
import { SpeechRecognitionApi, type SpeechResult } from "~/logic/vocal/speech-recognition.js"
import {
  BrowserVoiceRecorderLayer,
  VoiceRecorderProvider,
} from "~/components/voice-recorder/voice-recorder.js"
import {
  SpeechRepeat,
  SpeechRepeatProvider,
  type SpeechRepeatPhase,
  type SpeechRepeatProps,
} from "~/components/speech-repeat/speech-repeat.js"
import { makeFakeAudioBlob } from "~/test-utils/make-fake-audio-blob.js"

const fakeAudio = makeFakeAudioBlob()

// --- Fake layers ---

function fakeSpeechRecognitionLayer(result: SpeechResult) {
  return Layer.succeed(SpeechRecognitionApi, {
    recognize: (_blob: Blob, _expected: string) => {
      return Effect.succeed(result)
    },
  })
}

// --- Story wrapper ---

function SpeechRepeatStory(props: {
  readonly config: SpeechRepeatConfig
  readonly speechResult: SpeechResult
  readonly renderReward?: () => React.ReactNode
  readonly initialPhase?: SpeechRepeatPhase
}) {
  return (
    <RegistryProvider>
      <VoiceRecorderProvider layer={BrowserVoiceRecorderLayer}>
        <SpeechRepeatProvider layer={fakeSpeechRecognitionLayer(props.speechResult)}>
          <SpeechRepeat
            config={props.config}
            onResult={fn()}
            renderReward={props.renderReward}
            initialPhase={props.initialPhase}
          />
        </SpeechRepeatProvider>
      </VoiceRecorderProvider>
    </RegistryProvider>
  )
}

// --- Meta ---

const meta: Meta<SpeechRepeatProps> = {
  title: "Exercises/SpeechRepeat",
  component: SpeechRepeat,
  parameters: {
    layout: "fullscreen",
  },
}

export default meta

type Story = StoryObj<SpeechRepeatProps>

// --- Configs ---

const skill1Config: SpeechRepeatConfig = {
  stimulus: { mode: "audio" },
  expected: "か",
  reward: "kana-unlocked",
  modelAudioSrc: "",
}

const skill2Config: SpeechRepeatConfig = {
  stimulus: { mode: "visual-kana", kana: "き" },
  expected: "き",
  reward: "none",
  modelAudioSrc: "",
}

const skill7SentenceConfig: SpeechRepeatConfig = {
  stimulus: { mode: "visual-text", text: "猫が好きです" },
  expected: "ねこがすきです",
  reward: "none",
  modelAudioSrc: "",
}

const skill3ScaffoldingConfig: SpeechRepeatConfig = {
  stimulus: { mode: "visual-kana-scaffolding", hint: "し", kana: "シ" },
  expected: "し",
  reward: "none",
  modelAudioSrc: "",
}

const skill3NoScaffoldingConfig: SpeechRepeatConfig = {
  stimulus: { mode: "visual-kana", kana: "シ" },
  expected: "し",
  reward: "none",
  modelAudioSrc: "",
}

const skill4Config: SpeechRepeatConfig = {
  stimulus: { mode: "audio" },
  expected: "ねこ",
  reward: "word-unlocked",
  modelAudioSrc: "",
}

const skill7WordFuriganaConfig: SpeechRepeatConfig = {
  stimulus: { mode: "visual-text-furigana", text: "猫", reading: "ねこ" },
  expected: "ねこ",
  reward: "none",
  modelAudioSrc: "",
}

const skill7WordNoFuriganaConfig: SpeechRepeatConfig = {
  stimulus: { mode: "visual-text", text: "猫" },
  expected: "ねこ",
  reward: "none",
  modelAudioSrc: "",
}

// --- Fake results ---

const matchResult: SpeechResult = {
  kind: "match",
  transcript: "か",
  audio: fakeAudio,
}
const mismatchResult: SpeechResult = {
  kind: "mismatch",
  transcript: "が",
  audio: fakeAudio,
}

// --- Audio-first stories (Skills 1, 4) ---

export const AudioFirstMatch: Story = {
  name: "Audio-first — Match (Skill 1)",
  render: () => {
    return (
      <SpeechRepeatStory
        config={skill1Config}
        speechResult={matchResult}
        renderReward={() => {
          return (
            <styled.div textAlign="center">
              <styled.span fontSize="6xl" lineHeight={1}>
                か
              </styled.span>
              <styled.div fontSize="sm" color="fg.muted">
                Kana unlocked
              </styled.div>
            </styled.div>
          )
        }}
      />
    )
  },
}

export const AudioFirstMismatch: Story = {
  name: "Audio-first — Mismatch (Skill 1)",
  render: () => {
    return <SpeechRepeatStory config={skill1Config} speechResult={mismatchResult} />
  },
}

// --- Visual-first stories (Skills 2, 3, 7) ---

export const VisualFirstMatch: Story = {
  name: "Visual-first — Match (Skill 2 hiragana)",
  render: () => {
    return <SpeechRepeatStory config={skill2Config} speechResult={matchResult} />
  },
}

export const VisualFirstMismatch: Story = {
  name: "Visual-first — Mismatch (Skill 2 hiragana)",
  render: () => {
    return <SpeechRepeatStory config={skill2Config} speechResult={mismatchResult} />
  },
}

// --- Static feedback stories (no mic needed) ---

export const FeedbackMatchStatic: Story = {
  name: "Feedback — Match visual-first (static)",
  render: () => {
    return (
      <SpeechRepeatStory
        config={skill2Config}
        speechResult={matchResult}
        initialPhase={{ kind: "feedback", speechResult: matchResult }}
      />
    )
  },
}

export const FeedbackMismatchStatic: Story = {
  name: "Feedback — Mismatch visual-first (static)",
  render: () => {
    return (
      <SpeechRepeatStory
        config={skill2Config}
        speechResult={mismatchResult}
        initialPhase={{ kind: "feedback", speechResult: mismatchResult }}
      />
    )
  },
}

export const FeedbackMatchAudioFirst: Story = {
  name: "Feedback — Match audio-first (static)",
  render: () => {
    return (
      <SpeechRepeatStory
        config={skill1Config}
        speechResult={matchResult}
        initialPhase={{ kind: "feedback", speechResult: matchResult }}
        renderReward={() => {
          return (
            <styled.div textAlign="center">
              <styled.span fontSize="6xl" lineHeight={1}>
                か
              </styled.span>
              <styled.div fontSize="sm" color="fg.muted">
                Kana unlocked
              </styled.div>
            </styled.div>
          )
        }}
      />
    )
  },
}

export const FeedbackMismatchAudioFirst: Story = {
  name: "Feedback — Mismatch audio-first (static)",
  render: () => {
    return (
      <SpeechRepeatStory
        config={skill1Config}
        speechResult={mismatchResult}
        initialPhase={{ kind: "feedback", speechResult: mismatchResult }}
      />
    )
  },
}

// --- Sentence stories (Skill 7) ---

export const SentenceListening: Story = {
  name: "Sentence — Listening (Skill 7)",
  render: () => {
    return <SpeechRepeatStory config={skill7SentenceConfig} speechResult={matchResult} />
  },
}

export const SentenceMatch: Story = {
  name: "Sentence — Match (Skill 7, static)",
  render: () => {
    return (
      <SpeechRepeatStory
        config={skill7SentenceConfig}
        speechResult={matchResult}
        initialPhase={{ kind: "feedback", speechResult: matchResult }}
      />
    )
  },
}

export const SentenceMismatch: Story = {
  name: "Sentence — Mismatch (Skill 7, static)",
  render: () => {
    return (
      <SpeechRepeatStory
        config={skill7SentenceConfig}
        speechResult={mismatchResult}
        initialPhase={{
          kind: "feedback",
          speechResult: {
            kind: "mismatch",
            transcript: "ねこがきです",
            audio: fakeAudio,
          },
        }}
      />
    )
  },
}

export const WordFurigana: Story = {
  name: "Word with furigana — Listening (Skill 7)",
  render: () => {
    return <SpeechRepeatStory config={skill7WordFuriganaConfig} speechResult={matchResult} />
  },
}

// --- Skill 3: Katakana scaffolding ---

export const Skill3KatakanaScaffolding: Story = {
  name: "Katakana scaffolding — し → シ (Skill 3)",
  render: () => {
    return <SpeechRepeatStory config={skill3ScaffoldingConfig} speechResult={matchResult} />
  },
}

export const Skill3KatakanaNoScaffolding: Story = {
  name: "Katakana no scaffolding — シ (Skill 3, 2e passage)",
  render: () => {
    return <SpeechRepeatStory config={skill3NoScaffoldingConfig} speechResult={matchResult} />
  },
}

// --- Skill 4: Audio word ---

export const Skill4AudioWord: Story = {
  name: "Audio-first — Word (Skill 4)",
  render: () => {
    return (
      <SpeechRepeatStory
        config={skill4Config}
        speechResult={matchResult}
        renderReward={() => {
          return (
            <styled.div textAlign="center">
              <styled.span fontSize="6xl" lineHeight={1}>
                猫
              </styled.span>
              <styled.div fontSize="sm" color="fg.muted">
                Word unlocked
              </styled.div>
            </styled.div>
          )
        }}
      />
    )
  },
}

// --- Skill 7: Word without furigana ---

export const Skill7WordNoFurigana: Story = {
  name: "Word without furigana — 猫 (Skill 7, 2e passage)",
  render: () => {
    return <SpeechRepeatStory config={skill7WordNoFuriganaConfig} speechResult={matchResult} />
  },
}
