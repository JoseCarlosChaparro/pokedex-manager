import { useTranslation } from 'react-i18next'
import { LANGUAGES } from '../i18n'

// The accessible name is the visible code plus the full name ("ES Español"), so label-in-name holds (WCAG 2.5.3).
// The full name is sr-only and carries its own lang, so screen readers pronounce it in its language.
export default function LanguageToggle() {
  const { t, i18n } = useTranslation()
  return (
    <div role="group" aria-label={t('language.label')} className="flex rounded-xl bg-white/8 p-0.5 ring-1 ring-white/10 sm:p-1">
      {LANGUAGES.map((language) => {
        const name = t(`language.names.${language}`)
        return (
          <button
            key={language}
            type="button"
            aria-pressed={i18n.language === language}
            title={name}
            onClick={() => i18n.changeLanguage(language)}
            className="grid h-9 w-8 place-items-center rounded-lg text-xs font-bold text-slate-400 transition-colors hover:text-white max-[360px]:w-7 sm:w-9 aria-pressed:bg-white/20 aria-pressed:text-white aria-pressed:shadow-sm aria-pressed:ring-1 aria-pressed:ring-white/25"
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
