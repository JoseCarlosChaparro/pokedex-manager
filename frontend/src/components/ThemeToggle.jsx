import { Monitor, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { THEMES } from '../hooks/useTheme'

const THEME_ICONS = { light: Sun, system: Monitor, dark: Moon }

export default function ThemeToggle({ theme, onChange }) {
  const { t } = useTranslation()
  return (
    <div role="group" aria-label={t('theme.label')} className="flex rounded-xl bg-white/8 p-0.5 ring-1 ring-white/10 sm:p-1">
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
            className="grid h-9 w-8 place-items-center rounded-lg text-slate-400 transition-colors hover:text-white max-[360px]:w-7 sm:w-9 aria-pressed:bg-white/20 aria-pressed:text-white aria-pressed:shadow-sm aria-pressed:ring-1 aria-pressed:ring-white/25"
          >
            <Icon className="size-4 sm:size-5" />
          </button>
        )
      })}
    </div>
  )
}
