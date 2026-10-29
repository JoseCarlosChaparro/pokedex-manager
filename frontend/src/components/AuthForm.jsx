import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { apiRequest, saveToken } from '../api'
import AuroraBackground from './AuroraBackground'

const PASSWORD_MIN_LENGTH = 8
const KNOWN_AUTH_ERROR_STATUSES = [401, 409, 422, 429]

// Backend details are English and never shown: the HTTP status picks a translated message
const authErrorKey = (status) => (KNOWN_AUTH_ERROR_STATUSES.includes(status) ? `auth.errors.${status}` : 'auth.errors.generic')

export default function AuthForm({ onAuthenticated, toggles }) {
  const { t } = useTranslation()
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // Holds a translation key, so the message follows the language if it changes
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
      setError(authErrorKey(err.status))
    } finally {
      setLoading(false)
    }
  }

  function toggleMode() {
    setIsRegister(!isRegister)
    setError('')
  }

  return (
    <main className="relative isolate grid min-h-screen place-items-center p-4 text-slate-900 dark:text-slate-100">
      <AuroraBackground />
      <div className="absolute top-3 right-3 flex gap-1 rounded-xl bg-slate-900/70 p-0.5">{toggles}</div>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-3xl bg-white/85 p-6 shadow-2xl ring-1 ring-white/60 backdrop-blur-xl dark:bg-slate-900/80 dark:ring-white/10">
        <h1 className="text-center text-2xl font-bold">
          {isRegister ? t('auth.registerTitle') : t('auth.loginTitle')}
        </h1>
        <label className="block">
          <span className="text-sm font-medium">{t('auth.email')}</span>
          <input
            type="email" required value={email} autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">{t('auth.password')}</span>
          <input
            type="password" required value={password}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            minLength={isRegister ? PASSWORD_MIN_LENGTH : undefined}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
          />
        </label>
        {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{t(error)}</p>}
        <button disabled={loading} className="min-h-11 w-full rounded-lg bg-brand-600 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
          {loading ? t('auth.loading') : isRegister ? t('auth.register') : t('auth.login')}
        </button>
        <button type="button" onClick={toggleMode} className="min-h-11 w-full text-sm text-slate-600 underline dark:text-slate-300">
          {isRegister ? t('auth.toLogin') : t('auth.toRegister')}
        </button>
      </form>
    </main>
  )
}