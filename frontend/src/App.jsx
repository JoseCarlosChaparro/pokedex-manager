import { LogOut } from 'lucide-react'
import { Suspense, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import AppFooter from './components/AppFooter'
import AuthForm from './components/AuthForm'
import LanguageToggle from './components/LanguageToggle'
import ChunkErrorBoundary from './components/ChunkErrorBoundary'
import { PokemonCardSkeleton } from './components/PokemonCard'
import { apiRequest, clearToken, getToken } from './api'
import ThemeToggle from './components/ThemeToggle'
import { LazyPokemonBrowser } from './lazyComponents'
import { useTheme } from './hooks/useTheme'
import { CONTAINER_CLASS } from './layout'

const BROWSER_SKELETON_COUNT = 24

// Shown while the browser chunk loads: the same skeleton cards the grid shows while its index loads
function BrowserSkeleton() {
  return (
    <section aria-busy="true" className={`${CONTAINER_CLASS} py-6`}>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8">
        {Array.from({ length: BROWSER_SKELETON_COUNT }, (_, i) => <PokemonCardSkeleton key={i} />)}
      </ul>
    </section>
  )
}

export default function App() {
  const { t } = useTranslation()
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
    return (
      <AuthForm
        onAuthenticated={() => setIsAuthenticated(true)}
        toggles={
          <>
            <LanguageToggle />
            <ThemeToggle theme={theme} onChange={setTheme} />
          </>
        }
      />
    )
  }

  return (
    <div className="isolate min-h-screen text-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-20 flex h-(--header-height) items-center justify-between gap-1.5 border-b-2 border-brand-600 bg-slate-900/90 px-3 text-white shadow-md backdrop-blur max-[360px]:gap-1 max-[360px]:px-2 sm:gap-2 sm:px-6">
        <h1 className="flex min-w-0 items-center gap-2 text-xl font-black tracking-tight">
          <span aria-hidden="true" className="pokeball max-[360px]:hidden" />
          {t('app.brand')}
          <span className="hidden sm:inline"> {t('app.brandSuffix')}</span>
        </h1>
        <div className="flex shrink-0 items-center gap-1.5 max-[360px]:gap-1 sm:gap-2">
          <LanguageToggle />
          <ThemeToggle theme={theme} onChange={setTheme} />
          <button onClick={handleLogout} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-white/80 px-2 text-sm hover:bg-white/10 sm:px-3">
            <LogOut aria-hidden="true" className="size-4" />
            {/* Below sm the button is icon-only: the short name stays for screen readers */}
            <span className="sr-only sm:hidden">{t('app.logoutShort')}</span>
            <span className="hidden sm:inline">{t('app.logout')}</span>
          </button>
        </div>
      </header>
      <main>
        <ChunkErrorBoundary>
          <Suspense fallback={<BrowserSkeleton />}>
            <LazyPokemonBrowser onUnauthorized={endSession} />
          </Suspense>
        </ChunkErrorBoundary>
      </main>
      <AppFooter />
    </div>
  )
}