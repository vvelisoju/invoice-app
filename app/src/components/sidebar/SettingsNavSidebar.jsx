import { useState, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'

const STORAGE_KEY = 'settings-nav-collapsed'

function loadCollapsed() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function saveCollapsed(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch {}
}

/**
 * SettingsNavSidebar — Grouped hierarchical navigation for the Settings page.
 *
 * Props:
 * - tabs: Array<{ key, label, icon, group }>
 * - groups: Array<{ key, label }>
 * - activeTab: string
 * - onTabChange: (key: string) => void
 * - isDirty: boolean
 * - onSave: () => void
 * - isSaving: boolean
 */
export default function SettingsNavSidebar({
  tabs,
  groups,
  activeTab,
  onTabChange,
  isDirty,
  onSave,
  isSaving,
}) {
  const history = useHistory()
  const [collapsed, setCollapsed] = useState(() => loadCollapsed())

  useEffect(() => { saveCollapsed(collapsed) }, [collapsed])

  const toggleGroup = (groupKey) => {
    setCollapsed(prev => {
      const next = { ...prev, [groupKey]: !prev[groupKey] }
      return next
    })
  }

  return (
    <div className="pt-1">
      {groups.map((group) => {
        const groupTabs = tabs.filter(t => t.group === group.key)
        const isCollapsed = !!collapsed[group.key]

        return (
          <div key={group.key} className="mb-0.5">
            {/* Group header */}
            <button
              onClick={() => toggleGroup(group.key)}
              className="w-full flex items-center justify-between px-4 py-1.5 group"
            >
              <span className="text-[10px] font-bold text-textSecondary/70 uppercase tracking-widest">{group.label}</span>
              <ChevronDown className={`w-3 h-3 text-textSecondary/50 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} />
            </button>

            {/* Group items */}
            {!isCollapsed && (
              <nav className="px-2 space-y-px">
                {groupTabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.key

                  return (
                    <button
                      key={tab.key}
                      onClick={() => onTabChange(tab.key)}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${
                        isActive
                          ? 'text-primary bg-primary/8 font-semibold'
                          : 'text-textSecondary hover:text-textPrimary hover:bg-gray-50'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                      <span className="flex-1 text-left truncate">{tab.label}</span>
                    </button>
                  )
                })}
              </nav>
            )}
          </div>
        )
      })}

      {/* Save button when dirty */}
      {isDirty && (
        <div className="px-3 mt-3">
          <button
            onClick={onSave}
            disabled={isSaving}
            className="w-full px-3 py-1.5 bg-primary hover:bg-primaryHover text-white rounded-md transition-all font-semibold text-[11px] shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  )
}
