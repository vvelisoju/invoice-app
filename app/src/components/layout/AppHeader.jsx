import { useHistory, useLocation } from 'react-router-dom'
import { FileText, Bell, LogOut } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { headerTabs, headerQuickActions, getActiveTabKey } from './navigationConfig'

export default function AppHeader() {
  const history = useHistory()
  const location = useLocation()
  const business = useAuthStore((state) => state.business)
  const logout = useAuthStore((state) => state.logout)

  const activeTabKey = getActiveTabKey(location.pathname)

  const handleLogout = () => {
    logout()
    history.replace('/auth/phone')
  }

  return (
    <nav className="bg-bgSecondary border-b border-border h-14 flex items-center px-6 shrink-0 z-20 justify-between">
      <div className="flex items-center">
        {/* Logo & Brand */}
        <div
          className="flex items-center gap-3 mr-8 cursor-pointer"
          onClick={() => history.push('/home')}
        >
          <div className="w-9 h-9 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xl text-textPrimary tracking-tight">
            {business?.name || 'InvoiceApp'}
          </span>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1">
          {headerTabs.map((tab) => {
            const active = activeTabKey === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => history.push(tab.basePath)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                  active
                    ? 'text-primary bg-blue-50 border border-blue-100 shadow-sm'
                    : 'text-textSecondary hover:bg-bgPrimary'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${active ? '' : 'text-gray-400'}`} />
                {tab.label}
              </button>
            )
          })}

          <div className="h-6 w-px bg-border mx-2" />

          {/* Quick Actions */}
          {headerQuickActions.map((action) => (
            <button
              key={action.path}
              onClick={() => history.push(action.path)}
              className="px-4 py-2 text-sm font-medium text-textSecondary hover:bg-bgPrimary rounded-md transition-colors flex items-center gap-2"
            >
              <action.icon className="w-4 h-4 text-gray-400" />
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4">
        <div className="relative cursor-pointer">
          <Bell className="w-[18px] h-[18px] text-textSecondary hover:text-textPrimary transition-colors" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
        </div>
        <button
          onClick={handleLogout}
          className="w-8 h-8 rounded-full border border-border bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
          title="Logout"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </nav>
  )
}
