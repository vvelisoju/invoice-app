import { ArrowLeft } from 'lucide-react'
import { useHistory } from 'react-router-dom'

/**
 * PageHeader — Reusable page-level title bar with optional back button and action slots.
 */
export default function PageHeader({
  title,
  subtitle,
  backTo,
  actions,
  children
}) {
  const history = useHistory()

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 md:mb-6">
      <div className="flex items-center gap-3 min-w-0">
        {backTo && (
          <button
            onClick={() => history.push(backTo)}
            className="w-11 h-11 flex items-center justify-center text-textSecondary active:bg-bgPrimary md:hover:bg-bgPrimary rounded-lg transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-textPrimary truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs md:text-sm text-textSecondary mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 md:gap-3 shrink-0">{actions}</div>}
      {children}
    </div>
  )
}
