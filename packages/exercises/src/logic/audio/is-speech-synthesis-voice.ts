import type { VoiceInfo } from "~/logic/audio/voice-selection.js"

export function isSpeechSynthesisVoice(voice: VoiceInfo): voice is SpeechSynthesisVoice {
  return "voiceURI" in voice
}
