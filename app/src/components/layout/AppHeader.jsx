import { useState, useRef, useEffect } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { FileText, Bell, LogOut, Settings, ChevronDown, User, HelpCircle, Menu, X } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { headerTabs, headerQuickActions, getActiveTabKey } from './navigationConfig'

function SettingsMenuItem({ icon: Icon, label, onClick, danger = false }) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-5 py-3.5 md:px-4 md:py-3 text-sm flex items-center gap-3 transition-colors ${
        danger
          ? 'text-red-600 active:bg-red-50 md:hover:bg-red-50'
          : 'text-textPrimary active:bg-blue-50 md:hover:bg-blue-50 active:text-primary md:hover:text-primary'
      }`}
    >
      <Icon className={`w-5 h-5 md:w-4 md:h-4 ${danger ? '' : 'text-gray-400'}`} />
      {label}
    </button>
  )
}

export default function AppHeader({ onMenuToggle }) {
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

  const handleNavigate = (path) => {
    history.push(path)
    setSettingsOpen(false)
  }

  // Close dropdown on outside click (desktop only)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setSettingsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Close on route change
  useEffect(() => {
    setSettingsOpen(false)
  }, [location.pathname])

  // Prevent body scroll when bottom sheet is open on mobile
  useEffect(() => {
    if (settingsOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [settingsOpen])

  const settingsMenuItems = (
    <>
      <SettingsMenuItem icon={Settings} label="Business Settings" onClick={() => handleNavigate('/settings')} />
      <SettingsMenuItem icon={User} label="Account Profile" onClick={() => {}} />
      <SettingsMenuItem icon={HelpCircle} label="Help & Support" onClick={() => {}} />
    </>
  )

  return (
    <nav className="bg-bgSecondary border-b border-border h-14 flex items-center px-3 md:px-6 shrink-0 z-20 justify-between">
      <div className="flex items-center min-w-0">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuToggle}
          className="md:hidden w-11 h-11 flex items-center justify-center rounded-lg text-textSecondary active:bg-bgPrimary transition-colors mr-1 shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo & Brand */}
        <div
          className="flex items-center gap-2 md:gap-3 mr-4 md:mr-8 cursor-pointer min-w-0"
          onClick={() => history.push('/home')}
        >
          <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center shadow-sm shrink-0">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg md:text-xl text-textPrimary tracking-tight truncate">
            {business?.name || 'InvoiceApp'}
          </span>
        </div>

        {/* Navigation Tabs — hidden on mobile (bottom nav replaces this) */}
        <div className="hidden md:flex items-center space-x-1">
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
      <div className="flex items-center gap-1 md:gap-3 shrink-0">
        <button className="relative w-11 h-11 flex items-center justify-center rounded-lg text-textSecondary active:bg-bgPrimary md:hover:text-textPrimary transition-colors">
          <Bell className="w-[18px] h-[18px]" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Settings Button */}
        <div className="relative" ref={settingsRef}>
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className={`flex items-center gap-1.5 w-11 h-11 md:w-auto md:px-3 justify-center rounded-lg text-sm font-medium transition-colors ${
              isSettingsActive || settingsOpen
                ? 'text-primary bg-blue-50 border border-blue-100'
                : 'text-textSecondary active:bg-bgPrimary md:hover:bg-bgPrimary border border-transparent'
            }`}
          >
            <Settings className={`w-4 h-4 ${isSettingsActive || settingsOpen ? 'text-primary' : 'text-gray-400'}`} />
            <ChevronDown className={`w-3 h-3 transition-transform hidden md:block ${settingsOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Desktop Dropdown */}
          {settingsOpen && (
            <div className="hidden md:block absolute right-0 top-full mt-2 w-56 bg-white border border-border rounded-xl shadow-lg py-2 z-50">
              <div className="px-4 py-2.5 border-b border-border">
                <p className="text-xs font-semibold text-textSecondary uppercase tracking-wider">Settings</p>
              </div>
              <div className="py-1">
                {settingsMenuItems}
              </div>
              <div className="border-t border-border pt-1">
                <SettingsMenuItem icon={LogOut} label="Logout" onClick={handleLogout} danger />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Sheet */}
      {settingsOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 transition-opacity"
            onClick={() => setSettingsOpen(false)}
          />
          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl animate-slide-up" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 72px)' }}>
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <h3 className="text-base font-bold text-textPrimary">Settings</h3>
              <button
                onClick={() => setSettingsOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-textSecondary active:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Menu Items */}
            <div className="py-2">
              {settingsMenuItems}
            </div>
            <div className="border-t border-border py-2">
              <SettingsMenuItem icon={LogOut} label="Logout" onClick={handleLogout} danger />
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
