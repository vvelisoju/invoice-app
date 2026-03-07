import { Search } from 'lucide-react'
import SidebarSection from './SidebarSection'
import SidebarRadioFilter from './SidebarRadioFilter'
import SidebarCheckboxFilter from './SidebarCheckboxFilter'
import SidebarSearchInput from './SidebarSearchInput'
import SidebarSelectFilter from './SidebarSelectFilter'

/**
 * DocumentFiltersSidebar — Filter panel for the Documents list page.
 * Rendered inside the desktop sidebar via useSetSidebarContent.
 *
 * Props:
 * - searchQuery: string
 * - onSearchChange: (value: string) => void
 * - statusFilter: string
 * - onStatusChange: (key: string) => void
 * - statusOptions: Array<{ key, label, badgeColor? }>
 * - docTypeOptions: Array<{ key, label, icon? }>
 * - docTypeFilters: Record<string, boolean>
 * - onDocTypeChange: (key: string, checked: boolean) => void
 * - customers: Array<{ id, name }>
 * - selectedCustomerId: string | null
 * - onCustomerChange: (id: string | null) => void
 */
export default function DocumentFiltersSidebar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  statusOptions,
  docTypeOptions,
  docTypeFilters,
  onDocTypeChange,
  customers,
  selectedCustomerId,
  onCustomerChange,
}) {
  return (
    <div className="pt-2">
      <SidebarSearchInput
        value={searchQuery}
        onChange={onSearchChange}
        placeholder="Search documents..."
      />

      <SidebarSection title="Status" defaultOpen={true}>
        <SidebarRadioFilter
          options={statusOptions}
          activeKey={statusFilter}
          onChange={onStatusChange}
        />
      </SidebarSection>

      <SidebarSection title="Document Type" defaultOpen={true}>
        <SidebarCheckboxFilter
          options={docTypeOptions}
          selected={docTypeFilters}
          onChange={onDocTypeChange}
        />
      </SidebarSection>

      <SidebarSection title="Customer" defaultOpen={true} collapsible={false}>
        <SidebarSelectFilter
          options={customers}
          selectedId={selectedCustomerId}
          onChange={onCustomerChange}
          allLabel="All Customers"
          placeholder="Search customers..."
        />
      </SidebarSection>
    </div>
  )
}
