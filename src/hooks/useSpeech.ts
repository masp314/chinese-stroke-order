import { useEffect, useState } from 'react'

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

  function speak(text: string) {
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
    utterance.rate = 0.82
    utterance.onstart = () => setMessage('Speaking…')
    utterance.onend = () => setMessage('')
    utterance.onerror = () => setMessage('Pronunciation could not be played on this device.')
    window.speechSynthesis.speak(utterance)
  }

  return { speak, message }
}
