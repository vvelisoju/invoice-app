/**
 * Reusable page toolbar — sits at the top of the content area.
 * White background, border-bottom, contains title/subtitle and action buttons.
 *
 * Props:
 * - title: string
 * - subtitle?: string
 * - actions?: ReactNode — right-side buttons (Export, New Document, etc.)
 * - children?: ReactNode — rendered below the title row (e.g. filter pills)
 */
export default function PageToolbar({ title, subtitle, actions, children }) {
  return (
    <div className="bg-white border-b border-border px-8 pt-8 pb-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-textPrimary mb-1">{title}</h1>
            {subtitle && <p className="text-sm text-textSecondary">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
        {children}
      </div>
    </div>
  )
}
