import { useEffect, useState } from 'react'
import type { SpeechSpeed } from '../types'

const SPEECH_RATES: Record<SpeechSpeed, number> = {
  slow: 0.55,
  normal: 0.78,
  fast: 1,
}

export function useSpeech() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [message, setMessage] = useState('')

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
    const chineseVoice = availableVoices.find((voice) => voice.lang.toLowerCase() === 'zh-cn')
      ?? availableVoices.find((voice) => voice.lang.toLowerCase().startsWith('zh'))

    if (!chineseVoice) {
      setMessage('No Chinese voice is available on this device. Add a Chinese voice in the device language settings.')
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-CN'
    utterance.voice = chineseVoice
    utterance.rate = SPEECH_RATES[speed]
    utterance.onstart = () => setMessage('Speaking…')
    utterance.onend = () => setMessage('')
    utterance.onerror = () => setMessage('Pronunciation could not be played on this device.')
    window.speechSynthesis.speak(utterance)
  }

  return { speak, message }
}
