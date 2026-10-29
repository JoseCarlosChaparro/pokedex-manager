import { useTranslation } from 'react-i18next'

const POKEAPI_URL = 'https://pokeapi.co'
const REPOSITORY_URL = 'https://github.com/JoseCarlosChaparro/pokedex-manager'
const LINK_CLASS = 'inline-flex min-h-6 items-center underline underline-offset-4 hover:text-slate-950 dark:hover:text-white'

// Credits, data source and fan-project disclaimer; the <footer> is the page's contentinfo landmark
export default function AppFooter({ year = new Date().getFullYear(), version = 'v2' }) {
  const { t } = useTranslation()
  return (
    <footer className="mx-auto w-full max-w-3xl px-4 pb-6 text-center text-sm text-slate-700 dark:text-slate-300">
      <p>
        {t('footer.madeBy')} <span className="font-semibold">{t('footer.author')}</span>
        {' · '}
        {t('footer.dataFrom')} <a className={LINK_CLASS} href={POKEAPI_URL}>{t('footer.pokeapi')}</a>
        {' · '}
        <a className={LINK_CLASS} href={REPOSITORY_URL}>{t('footer.github')}</a>
      </p>
      <p>{t('footer.disclaimer')}</p>
      <p>
        <span>{t('footer.copyright', { year })}</span>
        {' · '}
        <span>{version}</span>
      </p>
    </footer>
  )
}
