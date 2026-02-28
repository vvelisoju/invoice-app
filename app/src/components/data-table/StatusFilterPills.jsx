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
    <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar">
      {filters.map((f) => {
        const active = activeKey === f.key
        return (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            className={`px-2 md:px-2.5 py-1 rounded-md text-[10px] md:text-[11px] font-medium transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 border ${
              active
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'text-textSecondary border-border active:bg-gray-50 md:hover:bg-gray-50 active:text-textPrimary md:hover:text-textPrimary'
            }`}
          >
            {f.label}
            {f.count !== undefined && (
              <span
                className={`text-[8px] md:text-[9px] px-1 py-px rounded tap-target-auto ${
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
          <div className="h-4 w-px bg-border mx-0.5 shrink-0" />
          {extras.map((f) => (
            <button
              key={f.key}
              onClick={() => onChange(f.key)}
              className={`px-2 md:px-2.5 py-1 rounded-md text-[10px] md:text-[11px] font-medium transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 border ${
                activeKey === f.key
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'text-textSecondary border-border active:bg-gray-50 md:hover:bg-gray-50 active:text-textPrimary md:hover:text-textPrimary'
              }`}
            >
              {f.label}
              {f.count !== undefined && (
                <span
                  className={`text-[8px] md:text-[9px] px-1 py-px rounded tap-target-auto ${
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
