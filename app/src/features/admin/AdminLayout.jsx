import { useHistory, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
  LayoutDashboard, Building2, Users, CreditCard, Settings,
  ScrollText, LogOut, Shield, ChevronRight, Receipt
} from 'lucide-react'

const NAV_ITEMS = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/businesses', label: 'Businesses', icon: Building2 },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/plans', label: 'Plans', icon: CreditCard },
  { path: '/admin/billing', label: 'Billing', icon: Receipt },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
  { path: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
]

export default function AdminLayout({ children }) {
  const history = useHistory()
  const location = useLocation()
  const logout = useAuthStore((s) => s.logout)

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col bg-gray-900 text-white">
        <div className="p-4 border-b border-gray-700 flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-400" />
          <div>
            <h1 className="font-bold text-sm">Invoice Baba</h1>
            <p className="text-xs text-gray-400">Super Admin</p>
          </div>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
            <button
              key={path}
              onClick={() => history.push(path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive(path)
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-700">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden bg-gray-900 text-white px-4 py-3 flex items-center justify-between safe-top">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-sm">Admin Panel</span>
          </div>
          <button onClick={logout} className="text-gray-400 p-2">
            <LogOut className="w-4 h-4" />
          </button>
        </header>

        {/* Mobile Bottom Nav */}
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20 safe-bottom">
          <div className="flex justify-around">
            {NAV_ITEMS.slice(0, 5).map(({ path, label, icon: Icon }) => (
              <button
                key={path}
                onClick={() => history.push(path)}
                className={`flex flex-col items-center py-2 px-1 min-w-0 flex-1 ${
                  isActive(path) ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] mt-0.5 truncate">{label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  )
}
