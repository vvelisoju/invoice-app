import { useState, useMemo, useRef, useEffect } from 'react'
import { Search, X, ChevronDown } from 'lucide-react'

/**
 * SidebarSelectFilter — Searchable single-select filter for sidebar.
 *
 * Props:
 * - label: string — field label (e.g. "Customer")
 * - options: Array<{ id: string, name: string }> — selectable items
 * - selectedId: string | null — currently selected item ID
 * - onChange: (id: string | null) => void
 * - allLabel?: string — label for the "all" option (default: "All")
 * - placeholder?: string — search placeholder
 */
export default function SidebarSelectFilter({
  label,
  options,
  selectedId,
  onChange,
  allLabel = 'All',
  placeholder = 'Search...'
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const searchRef = useRef(null)
  const containerRef = useRef(null)

  const filtered = useMemo(() => {
    if (!search) return options
    const q = search.toLowerCase()
    return options.filter(o => o.name?.toLowerCase().includes(q))
  }, [options, search])

  const selectedItem = options.find(o => o.id === selectedId)

  useEffect(() => {
    if (open && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="px-3 pb-1" ref={containerRef}>
      {label && (
        <p className="text-[10px] font-bold text-textSecondary uppercase tracking-widest mb-1.5 px-1">{label}</p>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 border border-border rounded-lg bg-white hover:bg-gray-50 transition-all text-left tap-target-auto"
      >
        <span className={`text-xs truncate ${selectedItem ? 'text-textPrimary font-medium' : 'text-gray-400'}`}>
          {selectedItem ? selectedItem.name : allLabel}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {selectedItem && (
            <span
              onClick={(e) => { e.stopPropagation(); onChange(null); setOpen(false) }}
              className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-gray-200 tap-target-auto"
            >
              <X className="w-3 h-3 text-gray-400" />
            </span>
          )}
          <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="mt-1 border border-border rounded-lg bg-white shadow-lg overflow-hidden max-h-56">
          <div className="sticky top-0 bg-white border-b border-border/30 p-1.5">
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-7 pr-2 py-1 text-xs border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-40">
            <button
              onClick={() => { onChange(null); setOpen(false); setSearch('') }}
              className={`w-full px-3 py-2 text-left text-xs hover:bg-blue-50 border-b border-border/20 flex items-center gap-2 tap-target-auto ${
                !selectedId ? 'bg-primary/5 text-primary font-semibold' : 'text-textPrimary'
              }`}
            >
              <span className="flex-1">{allLabel}</span>
              {!selectedId && <span className="text-primary text-[10px] font-bold shrink-0">✓</span>}
            </button>
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-xs text-gray-400 text-center">No results</div>
            ) : (
              filtered.map(item => {
                const isSelected = item.id === selectedId
                return (
                  <button
                    key={item.id}
                    onClick={() => { onChange(item.id); setOpen(false); setSearch('') }}
                    className={`w-full px-3 py-2 text-left text-xs hover:bg-blue-50 border-b border-border/20 last:border-b-0 flex items-center gap-2 tap-target-auto ${
                      isSelected ? 'bg-primary/5 text-primary font-semibold' : 'text-textPrimary'
                    }`}
                  >
                    <span className="truncate flex-1">{item.name}</span>
                    {isSelected && <span className="text-primary text-[10px] font-bold shrink-0">✓</span>}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
