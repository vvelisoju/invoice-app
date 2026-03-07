import { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

const STORAGE_KEY = 'sidebar-sections'

function loadSectionState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function saveSectionState(key, isOpen) {
  try {
    const state = loadSectionState()
    state[key] = isOpen
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

/**
 * SidebarSection — Collapsible section wrapper for sidebar filter groups.
 *
 * Props:
 * - title: string — section heading text
 * - defaultOpen?: boolean — initial open state (default: true)
 * - children: ReactNode — section content
 * - collapsible?: boolean — whether section can be collapsed (default: true)
 * - storageKey?: string — unique key for localStorage persistence
 */
export default function SidebarSection({ title, defaultOpen = true, children, collapsible = true, storageKey }) {
  const [open, setOpen] = useState(() => {
    if (storageKey) {
      const saved = loadSectionState()
      if (saved[storageKey] !== undefined) return saved[storageKey]
    }
    return defaultOpen
  })

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (storageKey) saveSectionState(storageKey, next)
  }

  return (
    <div className="px-3 pt-2 pb-0.5">
      {collapsible ? (
        <button
          onClick={toggle}
          className="w-full flex items-center justify-between px-2 py-1 mb-0.5"
        >
          <h3 className="text-[10px] font-bold text-textSecondary/70 uppercase tracking-widest">{title}</h3>
          <ChevronDown className={`w-3 h-3 text-textSecondary/50 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      ) : (
        <div className="px-2 py-1 mb-0.5">
          <h3 className="text-[10px] font-bold text-textSecondary/70 uppercase tracking-widest">{title}</h3>
        </div>
      )}
      {open && children}
    </div>
  )
}
