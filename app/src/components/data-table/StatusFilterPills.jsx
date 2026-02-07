/**
 * Reusable status filter pills bar.
 *
 * Props:
 * - filters: Array<{ key, label, count?, badgeColor? }>
 * - activeKey: string
 * - onChange: (key) => void
 * - extras?: Array<{ key, label, count?, badgeColor? }> — shown after a divider
 */
export default function StatusFilterPills({ filters, activeKey, onChange, extras }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {filters.map((f) => {
        const active = activeKey === f.key
        return (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
              active
                ? 'bg-primary text-white shadow-sm'
                : 'text-textSecondary hover:bg-gray-100'
            }`}
          >
            {f.label}
            {f.count !== undefined && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  active
                    ? 'bg-white/20 text-white'
                    : f.badgeColor || 'bg-gray-400 text-white'
                }`}
              >
                {f.count}
              </span>
            )}
          </button>
        )
      })}

      {extras && extras.length > 0 && (
        <>
          <div className="h-6 w-px bg-border mx-1" />
          {extras.map((f) => (
            <button
              key={f.key}
              onClick={() => onChange(f.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                activeKey === f.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-textSecondary hover:bg-gray-100'
              }`}
            >
              {f.label}
              {f.count !== undefined && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    activeKey === f.key
                      ? 'bg-white/20 text-white'
                      : f.badgeColor || 'bg-gray-400 text-white'
                  }`}
                >
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </>
      )}
    </div>
  )
}
