import { useHistory, useLocation } from 'react-router-dom'
import {
  Home,
  FileText,
  FilePlus,
  BarChart3,
  Settings,
  Palette,
  CreditCard
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const sidebarSections = [
  {
    title: 'Main',
    items: [
      { path: '/home', label: 'Dashboard', icon: Home },
      { path: '/invoices', label: 'Invoices', icon: FileText, exact: true },
      { path: '/invoices/new', label: 'New Invoice', icon: FilePlus },
      { path: '/reports', label: 'Reports', icon: BarChart3 }
    ]
  },
  {
    title: 'Settings',
    items: [
      { path: '/settings', label: 'Business Settings', icon: Settings },
      { path: '/templates', label: 'Invoice Templates', icon: Palette }
    ]
  }
]

export default function AppSidebar() {
  const history = useHistory()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const business = useAuthStore((state) => state.business)

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path
    return location.pathname.startsWith(path)
  }

  return (
    <aside className="w-64 bg-bgSecondary border-r border-border flex flex-col shrink-0 hidden lg:flex">
      <div className="flex-1 overflow-y-auto p-4">
        {sidebarSections.map((section) => (
          <div key={section.title} className="mb-6">
            <h3 className="px-3 text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">
              {section.title}
            </h3>
            <nav className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.path, item.exact)
                return (
                  <button
                    key={item.path}
                    onClick={() => history.push(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all border-l-2 ${
                      active
                        ? 'bg-primary/5 text-primary font-medium border-primary'
                        : 'text-textSecondary hover:bg-bgPrimary border-transparent'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 ${active ? 'text-primary' : 'text-gray-400'}`} />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-border">
        <div
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-bgPrimary transition-colors cursor-pointer"
          onClick={() => history.push('/settings')}
        >
          <div className="w-8 h-8 rounded-full border border-border bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
            {(business?.name || user?.phone || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-textPrimary truncate">
              {business?.name || 'My Business'}
            </div>
            <div className="text-xs text-textSecondary truncate">
              {user?.phone || 'Settings'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
