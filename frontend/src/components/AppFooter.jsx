import { useTranslation } from 'react-i18next'

const POKEAPI_URL = 'https://pokeapi.co'
const REPOSITORY_URL = 'https://github.com/JoseCarlosChaparro/pokedex-manager'
const LINK_CLASS = 'inline-flex min-h-6 items-center underline underline-offset-4 hover:text-slate-950 dark:hover:text-white'
// Each row wraps its items as units, so no item is split across lines; the dot separators come from CSS (footer-item)
const ROW_CLASS = 'flex flex-wrap items-center justify-center gap-x-2 gap-y-1'
const ITEM_CLASS = 'footer-item'

// Credits, data source and fan-project disclaimer; the <footer> is the page's contentinfo landmark
export default function AppFooter({ year = new Date().getFullYear(), version = 'v2' }) {
  const { t } = useTranslation()
  return (
    <footer className="mx-auto w-full max-w-3xl px-4 pb-6 text-center text-sm text-slate-700 dark:text-slate-300">
      <ul className={ROW_CLASS}>
        <li className={ITEM_CLASS}>
          {t('footer.madeBy')} <span className="font-semibold">{t('footer.author')}</span>
        </li>
        <li className={ITEM_CLASS}>
          {t('footer.dataFrom')} <a className={LINK_CLASS} href={POKEAPI_URL}>{t('footer.pokeapi')}</a>
        </li>
        <li className={ITEM_CLASS}>
          <a className={LINK_CLASS} href={REPOSITORY_URL}>{t('footer.github')}</a>
        </li>
      </ul>
      <p>{t('footer.disclaimer')}</p>
      <ul className={ROW_CLASS}>
        <li className={ITEM_CLASS}>{t('footer.copyright', { year })}</li>
        <li className={ITEM_CLASS}>{version}</li>
      </ul>
    </footer>
  )
}
