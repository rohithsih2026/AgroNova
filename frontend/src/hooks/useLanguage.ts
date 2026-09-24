import { useEffect, useState } from 'react'

export type Language = 'en' | 'ta'

export function useLanguage() {
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('agronova-language') as Language) || 'en')
  useEffect(() => {
    const listener = (event: Event) => {
      const next = (event as CustomEvent<Language>).detail
      if (next === 'en' || next === 'ta') setLanguage(next)
    }
    window.addEventListener('agronova-language', listener)
    return () => window.removeEventListener('agronova-language', listener)
  }, [])
  return { language, setLanguage }
}
