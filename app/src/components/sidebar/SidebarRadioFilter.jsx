/**
 * SidebarRadioFilter — Single-select radio-style filter list for sidebar.
 *
 * Props:
 * - options: Array<{ key: string, label: string, icon?: LucideIcon, badgeColor?: string }>
 * - activeKey: string
 * - onChange: (key: string) => void
 */
export default function SidebarRadioFilter({ options, activeKey, onChange }) {
  return (
    <nav className="px-1 space-y-px">
      {options.map((opt) => {
        const isActive = activeKey === opt.key
        const Icon = opt.icon
        return (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${
              isActive
                ? 'text-primary bg-primary/8 font-semibold'
                : 'text-textSecondary hover:text-textPrimary hover:bg-gray-50'
            }`}
          >
            {Icon && (
              <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
            )}
            {opt.badgeColor && (
              <span className={`w-2 h-2 rounded-full shrink-0 ${opt.badgeColor}`} />
            )}
            <span className="flex-1 text-left">{opt.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
