import { useCallback, useState } from 'react'
import AuthForm from './components/AuthForm'
import PokemonBrowser from './components/PokemonBrowser'
import { apiRequest, clearToken, getToken } from './api'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getToken()))

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

  if (!isAuthenticated) return <AuthForm onAuthenticated={() => setIsAuthenticated(true)} />

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="flex items-center justify-between gap-2 bg-red-600 px-4 py-3 text-white shadow-md sm:px-6">
        <h1 className="text-xl font-bold">PokéDex Manager</h1>
        <button onClick={handleLogout} className="min-h-11 rounded-lg border border-white/80 px-3 text-sm hover:bg-white/10">
          Cerrar sesión
        </button>
      </header>
      <PokemonBrowser onUnauthorized={endSession} />
    </div>
  )
}