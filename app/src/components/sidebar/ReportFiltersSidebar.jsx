import SidebarSection from './SidebarSection'
import SidebarRadioFilter from './SidebarRadioFilter'
import SidebarSelectFilter from './SidebarSelectFilter'

/**
 * ReportFiltersSidebar — Filter panel for the Reports page.
 *
 * Props:
 * - activeTab: string
 * - onTabChange: (key: string) => void
 * - tabs: Array<{ key, label, icon? }>
 * - docTypes: Array<{ id: string, name: string }>  — mapped from availableDocTypes
 * - selectedDocType: string
 * - onDocTypeChange: (id: string | null) => void
 */
export default function ReportFiltersSidebar({
  activeTab,
  onTabChange,
  tabs,
  docTypes,
  selectedDocType,
  onDocTypeChange,
}) {
  return (
    <div className="pt-2">
      <SidebarSection title="Report" defaultOpen={true} collapsible={false}>
        <SidebarRadioFilter
          options={tabs}
          activeKey={activeTab}
          onChange={onTabChange}
        />
      </SidebarSection>

      <SidebarSection title="Document Type" defaultOpen={true}>
        <SidebarSelectFilter
          options={docTypes}
          selectedId={selectedDocType}
          onChange={(id) => onDocTypeChange(id)}
          allLabel="All Types"
          placeholder="Search types..."
        />
      </SidebarSection>
    </div>
  )
}
