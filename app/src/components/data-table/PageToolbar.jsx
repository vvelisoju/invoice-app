/**
 * Reusable page toolbar — sits at the top of the content area.
 * White background, border-bottom, contains title/subtitle and action buttons.
 *
 * Props:
 * - title: string
 * - subtitle?: string
 * - actions?: ReactNode — right-side buttons (Export, New Document, etc.)
 * - mobileActions?: ReactNode — compact action(s) shown on mobile (e.g. just the Add button)
 * - children?: ReactNode — rendered below the title row (e.g. filter pills)
 */
export default function PageToolbar({ title, subtitle, actions, mobileActions, children }) {
  return (
    <div className="bg-white border-b border-border px-4 md:px-8 pt-4 md:pt-8 pb-3 md:pb-6">
      <div className="max-w-7xl mx-auto">
        {/* Mobile: title + compact action in single row */}
        {mobileActions && (
          <div className="flex items-center justify-between md:hidden mb-3">
            <h1 className="text-lg font-bold text-textPrimary truncate">{title}</h1>
            <div className="flex items-center gap-2 shrink-0">{mobileActions}</div>
          </div>
        )}
        {/* Desktop: full title row with subtitle and all actions */}
        <div className={`${mobileActions ? 'hidden md:flex' : 'flex flex-col gap-3 sm:flex-row sm:items-center'} sm:items-center sm:justify-between mb-4 md:mb-6`}>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-textPrimary mb-0.5 md:mb-1">{title}</h1>
            {subtitle && <p className="text-xs md:text-sm text-textSecondary">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 md:gap-3 shrink-0">{actions}</div>}
        </div>
        {children}
      </div>
    </div>
  )
}
