import { Search, X } from 'lucide-react'

/**
 * SidebarSearchInput — Compact search input for sidebar filter panels.
 *
 * Props:
 * - value: string
 * - onChange: (value: string) => void
 * - placeholder?: string
 */
export default function SidebarSearchInput({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="px-3 pb-1.5">
      <div className="relative">
        <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-7 pr-7 py-1 text-[11px] border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder-gray-400"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 tap-target-auto"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  )
}
