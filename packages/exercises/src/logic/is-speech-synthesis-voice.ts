import type { VoiceInfo } from "./voice-selection.js"

export function isSpeechSynthesisVoice(voice: VoiceInfo): voice is SpeechSynthesisVoice {
  return "voiceURI" in voice
}
