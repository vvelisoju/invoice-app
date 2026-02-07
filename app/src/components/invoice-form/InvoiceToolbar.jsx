import { Save } from 'lucide-react'

/**
 * InvoiceToolbar — Sticky toolbar inside the document card with form tabs and action buttons.
 */
export default function InvoiceToolbar({
  activeTab = 'basic',
  onTabChange,
  onPreview,
  onSave,
  isSaving = false
}) {
  const tabs = [
    { key: 'basic', label: 'Basic Form' },
    { key: 'advanced', label: 'Advanced Form' }
  ]

  return (
    <div className="px-8 py-4 border-b border-border flex justify-between items-center bg-white rounded-t-xl sticky top-0 z-10">
      {/* Tab Switcher */}
      <div className="flex gap-1 bg-bgPrimary p-1 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange?.(tab.key)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-textPrimary shadow-sm'
                : 'text-textSecondary hover:text-textPrimary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onPreview}
          className="px-4 py-2 text-sm text-textSecondary hover:bg-bgPrimary rounded-lg transition-all font-medium border border-transparent hover:border-border"
        >
          Preview
        </button>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="px-5 py-2 bg-primary hover:bg-primaryHover text-white rounded-lg transition-all font-medium text-sm shadow-sm flex items-center gap-2 disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Invoice'}
        </button>
      </div>
    </div>
  )
}
