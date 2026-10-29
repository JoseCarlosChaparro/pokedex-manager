import { useTranslation } from 'react-i18next'
import { LANGUAGES } from '../i18n'

// The accessible name is the visible code plus the full name ("ES Español"), so label-in-name holds (WCAG 2.5.3).
// The full name is sr-only and carries its own lang, so screen readers pronounce it in its language.
export default function LanguageToggle() {
  const { t, i18n } = useTranslation()
  return (
    <div role="group" aria-label={t('language.label')} className="flex rounded-xl bg-white/15 p-0.5 sm:p-1">
      {LANGUAGES.map((language) => {
        const name = t(`language.names.${language}`)
        return (
          <button
            key={language}
            type="button"
            aria-pressed={i18n.language === language}
            title={name}
            onClick={() => i18n.changeLanguage(language)}
            className="grid h-9 w-8 place-items-center rounded-lg text-xs font-bold text-white sm:w-9 aria-pressed:bg-white/90 aria-pressed:text-slate-900 aria-pressed:shadow-sm"
          >
            {language.toUpperCase()}
            {' '}
            <span lang={language} className="sr-only">{name}</span>
          </button>
        )
      })}
    </div>
  )
}
