import SidebarSection from './SidebarSection'
import SidebarRadioFilter from './SidebarRadioFilter'
import SidebarSearchInput from './SidebarSearchInput'

/**
 * CustomerFiltersSidebar — Filter panel for the Customers list page.
 *
 * Props:
 * - searchQuery: string
 * - onSearchChange: (value: string) => void
 * - statusFilter: string
 * - onStatusChange: (key: string) => void
 * - statusOptions: Array<{ key, label, badgeColor? }>
 */
export default function CustomerFiltersSidebar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  statusOptions,
}) {
  return (
    <div className="pt-2">
      <SidebarSearchInput
        value={searchQuery}
        onChange={onSearchChange}
        placeholder="Search customers..."
      />

      <SidebarSection title="Status" defaultOpen={true}>
        <SidebarRadioFilter
          options={statusOptions}
          activeKey={statusFilter}
          onChange={onStatusChange}
        />
      </SidebarSection>
    </div>
  )
}
