import { useState } from 'react'
import { apiRequest, saveToken } from '../api'

const PASSWORD_MIN_LENGTH = 8

const AUTH_ERROR_MESSAGES = {
  401: 'Email o contraseña incorrectos',
  409: 'Ese email ya está registrado',
  422: 'Revisa tu email y contraseña',
  429: 'Demasiados intentos fallidos. Espera un minuto e intenta de nuevo.',
}

export default function AuthForm({ onAuthenticated }) {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const credentials = { email, password }
      if (isRegister) await apiRequest('/auth/register', { method: 'POST', body: credentials })
      const { access_token } = await apiRequest('/auth/login', { method: 'POST', body: credentials })
      saveToken(access_token)
      onAuthenticated()
    } catch (err) {
      setError(AUTH_ERROR_MESSAGES[err.status] ?? 'Algo salió mal, intenta de nuevo')
    } finally {
      setLoading(false)
    }
  }

  function toggleMode() {
    setIsRegister(!isRegister)
    setError('')
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-4 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-800">
        <h1 className="text-center text-2xl font-bold">
          {isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
        </h1>
        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input
            type="email" required value={email} autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Contraseña</span>
          <input
            type="password" required value={password}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            minLength={isRegister ? PASSWORD_MIN_LENGTH : undefined}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
          />
        </label>
        {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
        <button disabled={loading} className="min-h-11 w-full rounded-lg bg-red-600 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50">
          {loading ? 'Cargando…' : isRegister ? 'Registrarme' : 'Entrar'}
        </button>
        <button type="button" onClick={toggleMode} className="min-h-11 w-full text-sm text-slate-600 underline dark:text-slate-300">
          {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
        </button>
      </form>
    </main>
  )
}