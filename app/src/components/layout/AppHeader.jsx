import { useState, useRef, useEffect } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { FileText, Bell, LogOut, Settings, Palette, ChevronDown, User, HelpCircle } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { headerTabs, headerQuickActions, getActiveTabKey } from './navigationConfig'

export default function AppHeader() {
  const history = useHistory()
  const location = useLocation()
  const business = useAuthStore((state) => state.business)
  const logout = useAuthStore((state) => state.logout)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsRef = useRef(null)

  const activeTabKey = getActiveTabKey(location.pathname)
  const isSettingsActive = activeTabKey === 'settings'

  const handleLogout = () => {
    logout()
    history.replace('/auth/phone')
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setSettingsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close dropdown on route change
  useEffect(() => {
    setSettingsOpen(false)
  }, [location.pathname])

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
      <div className="flex items-center gap-3">
        <div className="relative cursor-pointer">
          <Bell className="w-[18px] h-[18px] text-textSecondary hover:text-textPrimary transition-colors" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
        </div>

        {/* Settings Dropdown */}
        <div className="relative" ref={settingsRef}>
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isSettingsActive || settingsOpen
                ? 'text-primary bg-blue-50 border border-blue-100'
                : 'text-textSecondary hover:bg-bgPrimary border border-transparent'
            }`}
          >
            <Settings className={`w-4 h-4 ${isSettingsActive || settingsOpen ? 'text-primary' : 'text-gray-400'}`} />
            <ChevronDown className={`w-3 h-3 transition-transform ${settingsOpen ? 'rotate-180' : ''}`} />
          </button>

          {settingsOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-border rounded-xl shadow-lg py-2 z-50">
              <div className="px-4 py-2.5 border-b border-border">
                <p className="text-xs font-semibold text-textSecondary uppercase tracking-wider">Settings</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => history.push('/settings')}
                  className="w-full px-4 py-2.5 text-sm text-textPrimary hover:bg-blue-50 hover:text-primary flex items-center gap-3 transition-colors"
                >
                  <Settings className="w-4 h-4 text-gray-400" />
                  Business Settings
                </button>
                <button
                  onClick={() => history.push('/templates')}
                  className="w-full px-4 py-2.5 text-sm text-textPrimary hover:bg-blue-50 hover:text-primary flex items-center gap-3 transition-colors"
                >
                  <Palette className="w-4 h-4 text-gray-400" />
                  Invoice Templates
                </button>
                <button
                  onClick={() => {}}
                  className="w-full px-4 py-2.5 text-sm text-textPrimary hover:bg-blue-50 hover:text-primary flex items-center gap-3 transition-colors"
                >
                  <User className="w-4 h-4 text-gray-400" />
                  Account Profile
                </button>
                <button
                  onClick={() => {}}
                  className="w-full px-4 py-2.5 text-sm text-textPrimary hover:bg-blue-50 hover:text-primary flex items-center gap-3 transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-gray-400" />
                  Help & Support
                </button>
              </div>
              <div className="border-t border-border pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
