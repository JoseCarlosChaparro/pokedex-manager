import { useCallback, useState } from 'react'
import AuthForm from './components/AuthForm'
import PokemonBrowser from './components/PokemonBrowser'
import { apiRequest, clearToken, getToken } from './api'
import ThemeToggle from './components/ThemeToggle'
import { useTheme } from './hooks/useTheme'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getToken()))
  const [theme, setTheme] = useTheme()

  // Stable reference so PokemonBrowser's effect doesn't re-run on every render
  const endSession = useCallback(() => {
    clearToken()
    setIsAuthenticated(false)
  }, [])

  async function handleLogout() {
    // End the local session even if the server call fails (e.g. token already expired)
    await apiRequest('/auth/logout', { method: 'POST' }).catch(() => null)
    endSession()
  }

  if (!isAuthenticated) {
    return <AuthForm onAuthenticated={() => setIsAuthenticated(true)} themeToggle={<ThemeToggle theme={theme} onChange={setTheme} />} />
  }

  return (
    <div className="isolate min-h-screen text-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-2 bg-red-600/90 px-4 py-2 text-white shadow-md backdrop-blur sm:px-6">
        <h1 className="flex items-center gap-2 text-xl font-black tracking-tight">
          <span aria-hidden="true" className="pokeball" />
          PokéDex Manager
        </h1>
        <div className="flex items-center gap-2">
          <ThemeToggle theme={theme} onChange={setTheme} />
        <button onClick={handleLogout} className="min-h-11 rounded-lg border border-white/80 px-3 text-sm hover:bg-white/10">
          Cerrar sesión
        </button>
        </div>
      </header>
      <PokemonBrowser onUnauthorized={endSession} />
    </div>
  )
}