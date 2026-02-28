import { Save, Eye, Loader2 } from 'lucide-react'

export default function InvoiceFormToolbar({
  formMode, onFormModeChange, onPreview, onSave, isSaving,
  invoiceTitle,
  docTypeConfig
}) {
  const saveLabel = docTypeConfig?.labels?.saveButton || 'Save Invoice'
  const forceBasic = docTypeConfig?.fields?.lineItemsLayout === 'basic' || docTypeConfig?.fields?.lineItemsLayout === 'simple'
  return (
    <div className="px-2.5 md:px-6 py-2 md:py-2.5 border-b border-border flex justify-between items-center bg-white rounded-t-xl sticky top-0 z-10 gap-2">
      {/* Left: Basic/Advanced toggle + Document type label */}
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <div className="flex gap-0.5 bg-bgPrimary p-0.5 rounded-md shrink-0">
          <button
            onClick={() => onFormModeChange('basic')}
            className={`px-2.5 md:px-3 py-1.5 text-[10px] md:text-xs font-medium rounded transition-colors ${
              formMode === 'basic'
                ? 'bg-white text-textPrimary shadow-sm border border-gray-100'
                : 'text-textSecondary active:text-textPrimary md:hover:text-textPrimary'
            }`}
          >
            Basic
          </button>
          <button
            onClick={() => !forceBasic && onFormModeChange('advanced')}
            disabled={forceBasic}
            className={`px-2.5 md:px-3 py-1.5 text-[10px] md:text-xs font-medium rounded transition-colors ${
              forceBasic
                ? 'text-textSecondary/40 cursor-not-allowed'
                : formMode === 'advanced'
                  ? 'bg-white text-textPrimary shadow-sm border border-gray-100'
                  : 'text-textSecondary active:text-textPrimary md:hover:text-textPrimary'
            }`}
          >
            Advanced
          </button>
        </div>

        {/* Document type label (read-only, driven by sidebar selection) */}
        {invoiceTitle && (
          <span className="text-sm md:text-base font-bold text-textPrimary tracking-tight truncate">
            {invoiceTitle}
          </span>
        )}
      </div>

      {/* Right: Preview + Save */}
      <div className="flex gap-1.5 md:gap-2 shrink-0">
        {onPreview && (
          <button
            onClick={onPreview}
            className="px-2.5 md:px-3 py-1.5 text-xs text-textSecondary active:bg-bgPrimary md:hover:bg-bgPrimary rounded-md transition-all font-medium border border-transparent active:border-border md:hover:border-border"
          >
            Preview
          </button>
        )}
        <button
          onClick={onSave}
          disabled={isSaving}
          className="px-3 md:px-4 py-1.5 bg-primary active:bg-primaryHover md:hover:bg-primaryHover text-white rounded-md transition-all font-medium text-xs shadow-sm flex items-center gap-1.5 disabled:opacity-60 tap-target-auto"
        >
          {isSaving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          ) : (
            <Save className="w-3.5 h-3.5 shrink-0" />
          )}
          <span className="hidden sm:inline leading-none">{saveLabel}</span>
          <span className="sm:hidden leading-none">Save</span>
        </button>
      </div>
    </div>
  )
}
