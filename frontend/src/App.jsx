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
    <div className="min-h-screen bg-slate-100">
      <header className="flex items-center justify-between gap-2 bg-red-500 px-4 py-3 text-white">
        <h1 className="text-xl font-bold">PokéDex Manager</h1>
        <button onClick={handleLogout} className="rounded border border-white px-3 py-1 text-sm">
          Cerrar sesión
        </button>
      </header>
      <PokemonBrowser onUnauthorized={endSession} />
    </div>
  )
}