import { useTranslation } from 'react-i18next'

// The Poké Ball mark is decorative; the product name is the accessible name. `as` picks the heading level.
export default function BrandTitle({ as = 'h1', className = '' }) {
  const { t } = useTranslation()
  const Tag = as
  return (
    <Tag className={`flex flex-wrap items-center justify-center gap-3 font-black tracking-tight ${className}`}>
      <span aria-hidden="true" className="pokeball pokeball--hero" />
      <span>{t('app.brand')} {t('app.brandSuffix')}</span>
    </Tag>
  )
}
