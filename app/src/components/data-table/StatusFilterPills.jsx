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
    <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
      {filters.map((f) => {
        const active = activeKey === f.key
        return (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            className={`px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-colors flex items-center gap-1.5 md:gap-2 whitespace-nowrap shrink-0 ${
              active
                ? 'bg-primary text-white shadow-sm'
                : 'text-textSecondary active:bg-gray-100 md:hover:bg-gray-100'
            }`}
          >
            {f.label}
            {f.count !== undefined && (
              <span
                className={`text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full tap-target-auto ${
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
          <div className="h-6 w-px bg-border mx-1 shrink-0" />
          {extras.map((f) => (
            <button
              key={f.key}
              onClick={() => onChange(f.key)}
              className={`px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-colors flex items-center gap-1.5 md:gap-2 whitespace-nowrap shrink-0 ${
                activeKey === f.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-textSecondary active:bg-gray-100 md:hover:bg-gray-100'
              }`}
            >
              {f.label}
              {f.count !== undefined && (
                <span
                  className={`text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full tap-target-auto ${
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
