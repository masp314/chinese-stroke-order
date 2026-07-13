import { useEffect, useState } from 'react'
import type { SpeechSpeed } from '../types'

const SPEECH_RATES: Record<SpeechSpeed, number> = {
  slow: 0.55,
  normal: 0.78,
  fast: 1,
}

export function useSpeech() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoiceURI, setSelectedVoiceURI] = useState('')
  const [message, setMessage] = useState('')

  const normalizeLanguage = (language: string) => language.toLowerCase().replace('_', '-')
  const chineseVoices = voices.filter((voice) => {
    const language = normalizeLanguage(voice.lang)
    return language.startsWith('zh') || language.startsWith('cmn') || language.startsWith('yue')
  })
  const recommendedVoice = chineseVoices.find((voice) => {
    const language = normalizeLanguage(voice.lang)
    return language === 'zh-cn' || language === 'cmn-cn'
  })
  const effectiveVoiceURI = selectedVoiceURI || recommendedVoice?.voiceURI || ''

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
    const chineseVoice = availableVoices.find((voice) => voice.voiceURI === effectiveVoiceURI)
      ?? availableVoices.find((voice) => {
        const language = normalizeLanguage(voice.lang)
        return language === 'zh-cn' || language === 'cmn-cn'
      })

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
