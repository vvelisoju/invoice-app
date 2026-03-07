import { useState, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { Crown, Receipt, ChevronDown, Settings } from 'lucide-react'

const STORAGE_KEY = 'plans-nav-collapsed'

function loadCollapsed() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function saveCollapsed(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch {}
}

const PLANS_ITEMS = [
  { key: 'plans', label: 'Plans & Pricing', icon: Crown },
  { key: 'billing', label: 'Billing History', icon: Receipt },
]

/**
 * PlansNavSidebar — Sidebar navigation for Plans & Billing page.
 */
export default function PlansNavSidebar({ activeTab, onTabChange }) {
  const history = useHistory()
  const [collapsed, setCollapsed] = useState(() => loadCollapsed())

  useEffect(() => { saveCollapsed(collapsed) }, [collapsed])

  const toggleGroup = (key) => {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="pt-1">
      {/* Billing group */}
      <div className="mb-0.5">
        <button
          onClick={() => toggleGroup('billing')}
          className="w-full flex items-center justify-between px-4 py-1.5"
        >
          <span className="text-[10px] font-bold text-textSecondary/70 uppercase tracking-widest">Billing</span>
          <ChevronDown className={`w-3 h-3 text-textSecondary/50 transition-transform ${collapsed.billing ? '' : 'rotate-180'}`} />
        </button>
        {!collapsed.billing && (
          <nav className="px-2 space-y-px">
            {PLANS_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.key
              return (
                <button
                  key={item.key}
                  onClick={() => onTabChange(item.key)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${
                    isActive
                      ? 'text-primary bg-primary/8 font-semibold'
                      : 'text-textSecondary hover:text-textPrimary hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                  <span className="flex-1 text-left">{item.label}</span>
                </button>
              )
            })}
          </nav>
        )}
      </div>

      {/* Back to Settings link */}
      <div className="px-2 mt-2">
        <button
          onClick={() => history.push('/settings')}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] font-medium text-textSecondary hover:text-textPrimary hover:bg-gray-50 transition-all"
        >
          <Settings className="w-3.5 h-3.5 text-gray-400" />
          <span>Back to Settings</span>
        </button>
      </div>
    </div>
  )
}
