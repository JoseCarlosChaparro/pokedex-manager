import { useTranslation } from 'react-i18next'
import { LANGUAGES } from '../i18n'

// Visible code (ES/EN) sits inside the accessible name (Español/English), so label-in-name holds (WCAG 2.5.3)
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
            aria-label={name}
            title={name}
            onClick={() => i18n.changeLanguage(language)}
            className="grid h-9 w-8 place-items-center rounded-lg text-xs font-bold sm:w-9 aria-pressed:bg-white/90 aria-pressed:text-slate-900 aria-pressed:shadow-sm"
          >
            {language.toUpperCase()}
          </button>
        )
      })}
    </div>
  )
}
