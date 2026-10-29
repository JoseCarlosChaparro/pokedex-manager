import { Monitor, Moon, Sun } from 'lucide-react'
import { THEMES } from '../hooks/useTheme'

const THEME_OPTIONS = {
  light: { Icon: Sun, label: 'Tema claro' },
  system: { Icon: Monitor, label: 'Tema del sistema' },
  dark: { Icon: Moon, label: 'Tema oscuro' },
}

export default function ThemeToggle({ theme, onChange }) {
  return (
    <div role="group" aria-label="Tema" className="flex rounded-xl bg-white/15 p-0.5 sm:p-1">
      {THEMES.map((option) => {
        const { Icon, label } = THEME_OPTIONS[option]
        return (
          <button
            key={option}
            type="button"
            aria-pressed={theme === option}
            aria-label={label}
            title={label}
            onClick={() => onChange(option)}
            className="grid h-9 w-8 place-items-center rounded-lg sm:w-9 aria-pressed:bg-white/90 aria-pressed:shadow-sm"
          >
            <Icon className="size-4 sm:size-5" />
          </button>
        )
      })}
    </div>
  )
}
