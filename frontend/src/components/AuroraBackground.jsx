const DEFAULT_COLORS = ['#f43f5e', '#3b82f6', '#facc15']

// Decorative animated gradient behind the app; takes the colors of the selected types.
// Pure CSS (transform/opacity only), static under prefers-reduced-motion.
export default function AuroraBackground({ colors = [] }) {
  const palette = [...colors, ...DEFAULT_COLORS].slice(0, 3)
  return (
    <div aria-hidden="true" className="aurora pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {palette.map((color, index) => (
        <span key={index} className={`aurora__blob aurora__blob--${index + 1}`} style={{ '--blob-color': color }} />
      ))}
      <span className="aurora__grain" />
    </div>
  )
}
