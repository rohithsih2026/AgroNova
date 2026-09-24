import { useCallback } from 'react'

export function useSpeech() {
  const speak = useCallback((text: string, language: 'en' | 'ta' = 'en') => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = language === 'ta' ? 'ta-IN' : 'en-IN'
    window.speechSynthesis.speak(utterance)
    return true
  }, [])
  return { speak }
}
