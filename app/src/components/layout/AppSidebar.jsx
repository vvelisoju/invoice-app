import { useHistory, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { sidebarConfig, getActiveTabKey } from './navigationConfig'

function CreateNewGrid({ items, history }) {
  if (!items || items.length === 0) return null
  return (
    <div className="mb-8">
      <h3 className="px-3 text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">Create New</h3>
      <div className="grid grid-cols-3 gap-2 px-1">
        {items.map((item) => (
          <button
            key={item.label}
            onClick={() => history.push(item.path)}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all border ${
              item.active
                ? 'bg-blue-50 hover:bg-blue-100 text-primary border-blue-100'
                : 'bg-bgPrimary hover:bg-gray-200 text-textSecondary hover:text-textPrimary border-transparent'
            }`}
          >
            <item.icon className="w-4 h-4 mb-1" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function SidebarSection({ section, location, history }) {
  const isActive = (path, exact) => {
    if (exact) return location.pathname === path
    return location.pathname + location.search === path || location.pathname.startsWith(path.split('?')[0]) && path === location.pathname + location.search
  }

  return (
    <div>
      <h3 className="px-3 text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">
        {section.title}
      </h3>
      <nav className="space-y-0.5">
        {section.items.map((item) => {
          const active = item.exact
            ? location.pathname === item.path.split('?')[0]
            : location.pathname + location.search === item.path
          const isFirstItem = section.items.indexOf(item) === 0
          const highlighted = isFirstItem && !location.search

          return (
            <button
              key={item.path}
              onClick={() => history.push(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all border-l-2 group ${
                active || highlighted
                  ? 'bg-primary/5 text-primary font-medium border-primary'
                  : 'text-textSecondary hover:bg-bgPrimary border-transparent'
              }`}
            >
              <item.icon className={`w-4 h-4 text-center ${active || highlighted ? 'text-primary' : 'text-gray-400 group-hover:text-primary'}`} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

export default function AppSidebar() {
  const history = useHistory()
  const location = useLocation()
  const business = useAuthStore((state) => state.business)

  const activeTabKey = getActiveTabKey(location.pathname)
  const config = sidebarConfig[activeTabKey] || sidebarConfig.documents

  return (
    <aside className="w-64 bg-bgSecondary border-r border-border flex flex-col shrink-0 hidden md:flex">
      <div className="p-6 flex-1 overflow-y-auto">
        {/* Create New Grid */}
        <CreateNewGrid items={config.createNew} history={history} />

        {/* Navigation Sections */}
        <div className="space-y-6">
          {config.sections?.map((section) => (
            <SidebarSection
              key={section.title}
              section={section}
              location={location}
              history={history}
            />
          ))}
        </div>
      </div>

      {/* Bottom Pro Plan Card */}
      <div className="mt-auto p-4 border-t border-border">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100">
          <p className="text-xs font-medium text-primary mb-1">Pro Plan</p>
          <p className="text-[10px] text-textSecondary mb-2">You have unlimited invoices.</p>
          <button
            onClick={() => history.push('/settings')}
            className="text-[10px] font-bold text-primary hover:underline"
          >
            Manage Subscription
          </button>
        </div>
      </div>
    </aside>
  )
}
