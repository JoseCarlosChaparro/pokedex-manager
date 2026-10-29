import { THEMES } from '../hooks/useTheme'

const THEME_OPTIONS = {
  light: { icon: '☀️', label: 'Tema claro' },
  system: { icon: '🖥️', label: 'Tema del sistema' },
  dark: { icon: '🌙', label: 'Tema oscuro' },
}

export default function ThemeToggle({ theme, onChange }) {
  return (
    <div role="group" aria-label="Tema" className="flex rounded-xl bg-white/15 p-0.5 sm:p-1">
      {THEMES.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={theme === option}
          aria-label={THEME_OPTIONS[option].label}
          title={THEME_OPTIONS[option].label}
          onClick={() => onChange(option)}
          className="grid h-9 w-8 place-items-center rounded-lg text-sm sm:w-9 sm:text-base aria-pressed:bg-white/90 aria-pressed:shadow-sm"
        >
          <span aria-hidden="true">{THEME_OPTIONS[option].icon}</span>
        </button>
      ))}
    </div>
  )
}
