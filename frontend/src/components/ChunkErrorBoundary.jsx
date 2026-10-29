import { Component } from 'react'
import { useTranslation } from 'react-i18next'

// A chunk can fail to load (offline, or a deploy changed its hash). Without a boundary React unmounts
// the whole tree, so the boundary swaps just its own children for a retry message.
// Retrying reloads the page: after a deploy the old chunk names are gone, so only a reload fetches new ones.
function reloadPage() {
  window.location.reload()
}

function ChunkErrorFallback({ onRetry }) {
  const { t } = useTranslation()
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl bg-red-100 p-3 text-red-800 dark:bg-red-950 dark:text-red-200">
      <p>{t('app.chunkError')}</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex min-h-11 items-center rounded-lg border border-red-800 px-3 font-semibold hover:bg-red-200 dark:border-red-200 dark:hover:bg-red-900"
      >
        {t('app.retry')}
      </button>
    </div>
  )
}

export default class ChunkErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    const { children, onRetry = reloadPage } = this.props
    if (this.state.hasError) return <ChunkErrorFallback onRetry={onRetry} />
    return children
  }
}
