// Official-style type colors; keys are PokéAPI type names (sent to the API and used as translation keys)
export const POKEMON_TYPE_COLORS = {
  normal: '#9fa19f', fire: '#d92121', water: '#2980ef', grass: '#3fa129',
  electric: '#fac000', ice: '#3dcef3', fighting: '#ff8000', poison: '#9141cb',
  ground: '#915121', flying: '#81b9ef', psychic: '#ef4179', bug: '#91a119',
  rock: '#afa981', ghost: '#704170', dragon: '#5060e1', dark: '#624d4e',
  steel: '#60a1b8', fairy: '#ef70ef',
}

export const POKEMON_TYPES = Object.keys(POKEMON_TYPE_COLORS)

export const DEFAULT_TYPE_COLOR = POKEMON_TYPE_COLORS.normal

const DARK_TEXT = '#0f172a'
const LIGHT_TEXT = '#ffffff'

function relativeLuminance(hexColor) {
  const [r, g, b] = [1, 3, 5].map((start) => Number.parseInt(hexColor.slice(start, start + 2), 16) / 255)
  const linear = (channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
}

export function contrastRatio(first, second) {
  const [lighter, darker] = [relativeLuminance(first), relativeLuminance(second)].sort((a, b) => b - a)
  return (lighter + 0.05) / (darker + 0.05)
}

// Picks the text color with the higher contrast on a type-colored badge (WCAG AA needs 4.5:1)
export function readableTextColor(backgroundColor) {
  return contrastRatio(DARK_TEXT, backgroundColor) > contrastRatio(LIGHT_TEXT, backgroundColor) ? DARK_TEXT : LIGHT_TEXT
}
