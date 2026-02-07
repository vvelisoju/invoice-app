import { useHistory, useLocation } from 'react-router-dom'
import {
  FileText,
  Users,
  BarChart3,
  Plus,
  Settings,
  LogOut,
  Bell
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const navItems = [
  { path: '/invoices', label: 'Invoices', icon: FileText },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings }
]

export default function AppHeader() {
  const history = useHistory()
  const location = useLocation()
  const business = useAuthStore((state) => state.business)
  const logout = useAuthStore((state) => state.logout)

  const handleLogout = () => {
    logout()
    history.replace('/auth/phone')
  }

  const isActive = (path) => location.pathname.startsWith(path)

  return (
    <nav className="bg-bgSecondary border-b border-border h-14 flex items-center px-6 shrink-0 z-20">
      {/* Logo */}
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

      {/* Nav Items */}
      <div className="flex items-center space-x-1">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => history.push(item.path)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
              isActive(item.path)
                ? 'text-primary bg-blue-50 border border-blue-100 shadow-sm'
                : 'text-textSecondary hover:bg-bgPrimary'
            }`}
          >
            <item.icon className={`w-4 h-4 ${isActive(item.path) ? '' : 'text-gray-400'}`} />
            {item.label}
          </button>
        ))}

        <div className="h-6 w-px bg-border mx-2" />

        <button
          onClick={() => history.push('/invoices/new')}
          className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primaryHover rounded-md transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Invoice
        </button>
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2">
        <button className="w-9 h-9 flex items-center justify-center text-textSecondary hover:bg-bgPrimary rounded-md transition-colors">
          <Bell className="w-4 h-4" />
        </button>
        <button
          onClick={handleLogout}
          className="w-9 h-9 flex items-center justify-center text-textSecondary hover:bg-red-50 hover:text-red-500 rounded-md transition-colors"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </nav>
  )
}
