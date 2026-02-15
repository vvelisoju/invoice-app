import { useHistory } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { PageToolbar } from '../../components/data-table'
import { AccountSection } from './SettingsPage'

export default function AccountProfilePage() {
  const history = useHistory()
  const queryClient = useQueryClient()
  const logout = useAuthStore((state) => state.logout)

  const handleLogout = () => {
    queryClient.clear()
    logout()
    history.replace('/auth/phone')
  }

  return (
    <div className="h-full flex flex-col">
      {/* Mobile Header */}
      <div className="md:hidden px-3 py-2 border-b border-border bg-white shrink-0">
        <h1 className="text-sm font-bold text-textPrimary">Account Profile</h1>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block">
        <PageToolbar
          title="Account Profile"
          subtitle="Manage your personal account details and preferences"
        />
      </div>

      {/* Content */}
      <div className="flex-1 px-3 md:px-8 py-3 md:py-6 pb-mobile-nav overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <AccountSection onLogout={handleLogout} onManageSubscription={() => history.push('/plans')} />
        </div>
      </div>
    </div>
  )
}
