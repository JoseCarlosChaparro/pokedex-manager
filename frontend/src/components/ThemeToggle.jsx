import { Monitor, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { THEMES } from '../hooks/useTheme'

const THEME_ICONS = { light: Sun, system: Monitor, dark: Moon }

export default function ThemeToggle({ theme, onChange }) {
  const { t } = useTranslation()
  return (
    <div role="group" aria-label={t('theme.label')} className="flex rounded-xl bg-white/15 p-0.5 sm:p-1">
      {THEMES.map((option) => {
        const Icon = THEME_ICONS[option]
        const label = t(`theme.${option}`)
        return (
          <button
            key={option}
            type="button"
            aria-pressed={theme === option}
            aria-label={label}
            title={label}
            onClick={() => onChange(option)}
            className="grid h-9 w-8 place-items-center rounded-lg sm:w-9 aria-pressed:bg-white/90 aria-pressed:text-slate-900 aria-pressed:shadow-sm"
          >
            <Icon className="size-4 sm:size-5" />
          </button>
        )
      })}
    </div>
  )
}
