/**
 * SidebarCheckboxFilter — Multi-select checkbox filter list for sidebar.
 *
 * Props:
 * - options: Array<{ key: string, label: string, icon?: LucideIcon }>
 * - selected: Record<string, boolean> — { [key]: true/false }
 * - onChange: (key: string, checked: boolean) => void
 * - allSelectedLabel?: string — text shown when all are selected (default: "All selected")
 */
export default function SidebarCheckboxFilter({ options, selected, onChange, allSelectedLabel = 'All selected' }) {
  const allSelected = options.every(opt => selected[opt.key] !== false)

  return (
    <nav className="px-1 space-y-0.5">
      {options.map((opt) => {
        const isChecked = allSelected || selected[opt.key] !== false
        const Icon = opt.icon
        return (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key, !isChecked)}
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all tap-target-auto ${
              isChecked
                ? 'text-textPrimary'
                : 'text-textSecondary/50'
            }`}
          >
            <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
              isChecked
                ? 'bg-primary border-primary'
                : 'border-gray-300 bg-white'
            }`}>
              {isChecked && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
            {Icon && (
              <Icon className={`w-3.5 h-3.5 shrink-0 ${isChecked ? 'text-gray-500' : 'text-gray-300'}`} />
            )}
            <span className="flex-1 text-left">{opt.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
