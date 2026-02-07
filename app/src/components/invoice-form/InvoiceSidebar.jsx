/**
 * SidebarNavItem — A single sidebar navigation link.
 */
function SidebarNavItem({ label, active = false, href = '#' }) {
  return (
    <a
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all text-sm border-l-2 ${
        active
          ? 'bg-primary/5 text-primary font-medium border-primary'
          : 'text-textSecondary hover:bg-bgPrimary border-transparent'
      }`}
    >
      <span>{label}</span>
    </a>
  )
}

/**
 * InvoiceSidebar — Left sidebar with "Create" nav group and user profile footer.
 */
export default function InvoiceSidebar({
  navItems = [],
  user = {}
}) {
  const defaultItems = [
    { label: 'Invoice', active: true },
    { label: 'Estimate', active: false },
    { label: 'Credit Note', active: false }
  ]

  const items = navItems.length > 0 ? navItems : defaultItems

  return (
    <aside className="w-64 bg-bgSecondary border-r border-border flex-col hidden md:flex">
      <div className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="px-3 text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">
              Create
            </h3>
            <nav className="space-y-0.5">
              {items.map((item) => (
                <SidebarNavItem
                  key={item.label}
                  label={item.label}
                  active={item.active}
                  href={item.href}
                />
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* User Profile Footer */}
      <div className="mt-auto p-4 border-t border-border">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-bgPrimary transition-colors cursor-pointer">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name || 'User'}
              className="w-8 h-8 rounded-full border border-border"
            />
          ) : (
            <div className="w-8 h-8 rounded-full border border-border bg-bgPrimary flex items-center justify-center text-xs font-semibold text-textSecondary">
              {(user.name || 'U').charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-textPrimary truncate">
              {user.name || 'John Doe'}
            </div>
            <div className="text-xs text-textSecondary truncate">
              {user.email || 'john@business.com'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
