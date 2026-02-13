import { useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Home, FileText, Users, Package, PieChart, Plus } from 'lucide-react'
import { businessApi } from '../../lib/api'
import AppHeader from './AppHeader'
import AppSidebar from './AppSidebar'
import { getActiveTabKey } from './navigationConfig'

const BOTTOM_NAV_ITEMS = [
  { key: 'home', label: 'Home', icon: Home, path: '/home' },
  { key: 'documents', label: 'Documents', icon: FileText, path: '/invoices' },
  { key: 'new', label: 'New', icon: Plus, path: '/invoices/new', isAction: true },
  { key: 'customers', label: 'Customers', icon: Users, path: '/customers' },
  { key: 'products', label: 'Products', icon: Package, path: '/products' },
]

/**
 * AppLayout — The main authenticated layout shell.
 * Desktop: fixed Header (top) + Sidebar (left) + scrollable Content (right).
 * Mobile: Header (top) + scrollable Content + Bottom Nav (bottom).
 */
export default function AppLayout({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const history = useHistory()
  const location = useLocation()
  const activeTabKey = getActiveTabKey(location.pathname)
  const isHome = location.pathname === '/home'

  const { data: businessProfile } = useQuery({
    queryKey: ['business'],
    queryFn: async () => {
      const response = await businessApi.getProfile()
      return response.data?.data || response.data
    },
    staleTime: 1000 * 60 * 5
  })

  return (
    <div className="bg-bgPrimary font-sans text-textPrimary antialiased h-dvh overflow-hidden flex flex-col safe-top">
      <AppHeader onMenuToggle={() => setDrawerOpen(!drawerOpen)} />

      {/* Mobile Drawer Overlay */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-30 md:hidden"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 z-40 md:hidden safe-top">
            <AppSidebar mobile onClose={() => setDrawerOpen(false)} />
          </div>
        </>
      )}

      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto bg-bgPrimary pb-mobile-nav">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-20 safe-bottom safe-x">
        <div className="flex items-center justify-around h-16">
          {BOTTOM_NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = item.key === 'home'
              ? isHome
              : item.key === 'new'
                ? false
                : activeTabKey === item.key
            const isNewBtn = item.isAction

            return (
              <button
                key={item.key}
                onClick={() => {
                  if (isNewBtn) {
                    const docType = businessProfile?.defaultDocType || 'invoice'
                    history.push(`/invoices/new?type=${docType}`)
                  } else {
                    history.push(item.path)
                  }
                }}
                className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors tap-target-auto ${
                  isNewBtn
                    ? ''
                    : isActive
                      ? 'text-primary'
                      : 'text-textSecondary active:text-primary'
                }`}
              >
                {isNewBtn ? (
                  <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center shadow-lg -mt-3">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                ) : (
                  <>
                    <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                    <span className={`text-[10px] font-medium ${isActive ? 'text-primary' : ''}`}>{item.label}</span>
                  </>
                )}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
