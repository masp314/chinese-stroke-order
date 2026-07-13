import { useEffect, useState } from 'react'
import type { SpeechSpeed } from '../types'

const SPEECH_RATES: Record<SpeechSpeed, number> = {
  slow: 0.55,
  normal: 0.78,
  fast: 1,
}

const normalizeLanguage = (language: string) => language.toLowerCase().replaceAll('_', '-')
const isMainlandMandarin = (voice: SpeechSynthesisVoice) => {
  const language = normalizeLanguage(voice.lang)
  return language === 'zh-cn' || language === 'cmn-cn'
}
const isHongKongChinese = (voice: SpeechSynthesisVoice) => {
  const language = normalizeLanguage(voice.lang)
  return language === 'zh-hk' || language === 'yue-hk'
}
const isGoogleVoice = (voice: SpeechSynthesisVoice) =>
  `${voice.name} ${voice.voiceURI}`.toLowerCase().includes('google')

function sortVoices(voices: SpeechSynthesisVoice[]) {
  return [...voices].sort((left, right) => {
    const leftRank = isMainlandMandarin(left) ? (isGoogleVoice(left) ? 0 : 1) : 2
    const rightRank = isMainlandMandarin(right) ? (isGoogleVoice(right) ? 0 : 1) : 2
    return leftRank - rightRank || left.name.localeCompare(right.name)
  })
}

export function useSpeech() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoiceURI, setSelectedVoiceURI] = useState('')
  const [message, setMessage] = useState('')

  const chineseVoices = sortVoices(voices.filter((voice) => isMainlandMandarin(voice) || isHongKongChinese(voice)))
  const recommendedVoice = chineseVoices.find((voice) => isMainlandMandarin(voice) && isGoogleVoice(voice))
    ?? chineseVoices.find(isMainlandMandarin)
  const selectedVoice = chineseVoices.find((voice) => voice.voiceURI === selectedVoiceURI)
  const effectiveVoiceURI = selectedVoice?.voiceURI ?? recommendedVoice?.voiceURI ?? ''

  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    const updateVoices = () => setVoices(window.speechSynthesis.getVoices())
    updateVoices()
    window.speechSynthesis.addEventListener('voiceschanged', updateVoices)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', updateVoices)
  }, [])

  function speak(text: string, speed: SpeechSpeed) {
    if (!text) return
    if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
      setMessage('Speech is not supported by this browser.')
      return
    }

    const availableVoices = voices.length ? voices : window.speechSynthesis.getVoices()
    if (!voices.length && availableVoices.length) setVoices(availableVoices)
    const eligibleVoices = sortVoices(availableVoices.filter((voice) => isMainlandMandarin(voice) || isHongKongChinese(voice)))
    const chineseVoice = eligibleVoices.find((voice) => voice.voiceURI === effectiveVoiceURI)
      ?? eligibleVoices.find((voice) => isMainlandMandarin(voice) && isGoogleVoice(voice))
      ?? eligibleVoices.find(isMainlandMandarin)

    if (!chineseVoice) {
      setMessage('No Mainland Mandarin voice (zh-CN) is selected. Choose a voice below or add Chinese (China) speech in the device settings.')
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = chineseVoice.lang
    utterance.voice = chineseVoice
    utterance.rate = SPEECH_RATES[speed]
    utterance.onstart = () => setMessage('Speaking…')
    utterance.onend = () => setMessage('')
    utterance.onerror = () => setMessage('Pronunciation could not be played on this device.')
    window.speechSynthesis.speak(utterance)
  }

  return {
    speak,
    message,
    voices: chineseVoices,
    selectedVoiceURI: effectiveVoiceURI,
    setSelectedVoiceURI,
  }
}
