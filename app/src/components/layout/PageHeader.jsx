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
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {backTo && (
          <button
            onClick={() => history.push(backTo)}
            className="w-9 h-9 flex items-center justify-center text-textSecondary hover:bg-bgPrimary rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-textPrimary">{title}</h1>
          {subtitle && (
            <p className="text-sm text-textSecondary mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
      {children}
    </div>
  )
}
