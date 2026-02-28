import { useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import Portal from '../../components/Portal'
import {
  LayoutDashboard, Building2, Users, CreditCard, Settings,
  ScrollText, LogOut, Shield, Receipt, Menu, X, MoreHorizontal, Bell
} from 'lucide-react'

// All sidebar nav items
const NAV_ITEMS = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/businesses', label: 'Businesses', icon: Building2 },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/plans', label: 'Plans', icon: CreditCard },
  { path: '/admin/billing', label: 'Billing', icon: Receipt },
  { path: '/admin/notifications', label: 'Notifications', icon: Bell },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
  { path: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
]

// Bottom nav shows first 4 + "More" to access the rest
const BOTTOM_NAV_ITEMS = NAV_ITEMS.slice(0, 4)
const MORE_NAV_ITEMS = NAV_ITEMS.slice(4)

/**
 * AdminLayout — Super Admin layout shell.
 * Mirrors the AppLayout CSS architecture exactly:
 * - Root: h-dvh overflow-hidden flex flex-col safe-top
 * - Desktop: Sidebar (left) + scrollable main (right)
 * - Mobile: Header (top) + scrollable main + fixed bottom nav
 * - pb-mobile-nav on main for bottom nav clearance + safe area
 */
export default function AdminLayout({ children }) {
  const history = useHistory()
  const location = useLocation()
  const logout = useAuthStore((s) => s.logout)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin'
    return location.pathname.startsWith(path)
  }

  // Check if any "more" item is active (for highlighting the More button)
  const isMoreActive = MORE_NAV_ITEMS.some(item => isActive(item.path))

  const navigateTo = (path) => {
    history.push(path)
    setDrawerOpen(false)
    setMoreOpen(false)
  }

  return (
    <div className="bg-gray-50 font-sans text-textPrimary antialiased h-dvh overflow-hidden flex flex-col">
      {/* ── Mobile Header ─────────────────────────────────────────── */}
      <header className="md:hidden bg-gray-900 text-white px-4 flex items-center justify-between shrink-0 safe-top"
        style={{ minHeight: '52px' }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="p-2 -ml-2 rounded-lg text-gray-400 active:text-white tap-target-auto"
          >
            {drawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Shield className="w-5 h-5 text-blue-400" />
          <span className="font-bold text-sm">Admin Panel</span>
        </div>
        <button
          onClick={logout}
          className="p-2 -mr-2 rounded-lg text-gray-400 active:text-white tap-target-auto"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* ── Mobile Drawer Overlay ─────────────────────────────────── */}
      {drawerOpen && (
        <Portal>
          <div
            className="fixed inset-0 bg-black/40 z-30 md:hidden"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-72 z-40 md:hidden bg-gray-900 text-white flex flex-col">
            <div className="p-4 border-b border-gray-700 flex items-center gap-2 shrink-0 safe-top">
              <Shield className="w-6 h-6 text-blue-400" />
              <div>
                <h1 className="font-bold text-sm">Invoice Baba</h1>
                <p className="text-xs text-gray-400">Super Admin</p>
              </div>
            </div>
            <nav className="flex-1 py-3 space-y-1 px-2 overflow-y-auto">
              {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
                <button
                  key={path}
                  onClick={() => navigateTo(path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors tap-target-auto ${
                    isActive(path)
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 active:bg-gray-800 active:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </button>
              ))}
            </nav>
            <div className="p-3 border-t border-gray-700 shrink-0">
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 active:bg-gray-800 active:text-white transition-colors tap-target-auto"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </aside>
        </Portal>
      )}

      {/* ── Desktop Sidebar + Content ─────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex md:w-64 flex-col bg-gray-900 text-white shrink-0">
          <div className="p-4 border-b border-gray-700 flex items-center gap-2 shrink-0">
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
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors tap-target-auto ${
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

          <div className="p-3 border-t border-gray-700 shrink-0">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors tap-target-auto"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </aside>

        {/* Scrollable main content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 pb-mobile-nav">
          {children}
        </main>
      </div>

      {/* ── Mobile Bottom Navigation ──────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20 safe-bottom safe-x">
        <div className="flex items-center justify-around h-16">
          {BOTTOM_NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const active = isActive(path)
            return (
              <button
                key={path}
                onClick={() => navigateTo(path)}
                className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors tap-target-auto ${
                  active ? 'text-blue-600' : 'text-gray-400 active:text-blue-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            )
          })}

          {/* More button */}
          <div className="relative flex-1 flex items-center justify-center h-full">
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className={`flex flex-col items-center justify-center h-full w-full gap-0.5 transition-colors tap-target-auto ${
                isMoreActive || moreOpen ? 'text-blue-600' : 'text-gray-400 active:text-blue-600'
              }`}
            >
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-[10px] font-medium">More</span>
            </button>

            {/* More popup */}
            {moreOpen && (
              <Portal>
                <div className="fixed inset-0 z-30" onClick={() => setMoreOpen(false)} />
                <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px)+0.5rem)] right-2 z-40 bg-white rounded-xl shadow-xl border border-gray-200 py-2 min-w-[180px] animate-slide-up">
                  {MORE_NAV_ITEMS.map(({ path, label, icon: Icon }) => {
                    const active = isActive(path)
                    return (
                      <button
                        key={path}
                        onClick={() => navigateTo(path)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors tap-target-auto ${
                          active
                            ? 'text-blue-600 bg-blue-50'
                            : 'text-gray-700 active:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        {label}
                      </button>
                    )
                  })}
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 active:bg-red-50 transition-colors tap-target-auto"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </Portal>
            )}
          </div>
        </div>
      </nav>
    </div>
  )
}
