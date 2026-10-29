import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import es from './locales/es.json'

export const LANGUAGES = ['es', 'en']
export const LANGUAGE_STORAGE_KEY = 'pokedex_lang'
const DEFAULT_LANGUAGE = 'es'
// es-MX keeps the thousands separator Spanish users already see (1,025); plain 'es' would print 1025
const NUMBER_LOCALES = { es: 'es-MX', en: 'en-US' }

// Pure rule: a saved language outside LANGUAGES, or a storage that throws, means Spanish
export function detectLanguage(storage) {
  try {
    const saved = storage?.getItem(LANGUAGE_STORAGE_KEY)
    return LANGUAGES.includes(saved) ? saved : DEFAULT_LANGUAGE
  } catch {
    return DEFAULT_LANGUAGE
  }
}

// Reading window.localStorage itself throws when storage is blocked
function readBrowserStorage() {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function handleLanguageChanged(language) {
  document.documentElement.lang = language
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  } catch {
    // Storage can be blocked (private mode); the language still applies for this visit
  }
}

export function formatNumber(language, value) {
  return new Intl.NumberFormat(NUMBER_LOCALES[language] ?? NUMBER_LOCALES[DEFAULT_LANGUAGE]).format(value)
}

// Listener first: init() emits languageChanged, which sets <html lang> for the saved language
i18n.on('languageChanged', handleLanguageChanged)
i18n.use(initReactI18next).init({
  resources: { es: { translation: es }, en: { translation: en } },
  lng: detectLanguage(readBrowserStorage()),
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: { escapeValue: false },
  initAsync: false,
})

export default i18n
