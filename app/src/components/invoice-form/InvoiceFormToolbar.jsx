import { Save, Eye, Loader2 } from 'lucide-react'

export default function InvoiceFormToolbar({
  formMode, onFormModeChange, onPreview, onSave, isSaving,
  invoiceTitle,
  docTypeConfig
}) {
  const saveLabel = docTypeConfig?.labels?.saveButton || 'Save Invoice'
  const forceBasic = docTypeConfig?.fields?.lineItemsLayout === 'basic' || docTypeConfig?.fields?.lineItemsLayout === 'simple'
  return (
    <div className="px-3 md:px-8 py-3 md:py-4 border-b border-border flex justify-between items-center bg-white rounded-t-xl sticky top-0 z-10 gap-2">
      {/* Left: Basic/Advanced toggle + Document type label */}
      <div className="flex items-center gap-2 md:gap-4 min-w-0">
        <div className="flex gap-1 bg-bgPrimary p-1 rounded-lg shrink-0">
          <button
            onClick={() => onFormModeChange('basic')}
            className={`px-3 md:px-4 py-2 text-xs md:text-sm font-medium rounded-md transition-colors ${
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
            className={`px-3 md:px-4 py-2 text-xs md:text-sm font-medium rounded-md transition-colors ${
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
          <span className="text-base md:text-lg font-bold text-textPrimary tracking-tight truncate">
            {invoiceTitle}
          </span>
        )}
      </div>

      {/* Right: Preview + Save */}
      <div className="flex gap-2 md:gap-3 shrink-0">
        {onPreview && (
          <button
            onClick={onPreview}
            className="px-3 md:px-4 py-2 text-sm text-textSecondary active:bg-bgPrimary md:hover:bg-bgPrimary rounded-lg transition-all font-medium border border-transparent active:border-border md:hover:border-border"
          >
            Preview
          </button>
        )}
        <button
          onClick={onSave}
          disabled={isSaving}
          className="px-4 md:px-5 py-2 bg-primary active:bg-primaryHover md:hover:bg-primaryHover text-white rounded-lg transition-all font-medium text-sm shadow-sm flex items-center gap-2 disabled:opacity-60 tap-target-auto"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          ) : (
            <Save className="w-4 h-4 shrink-0" />
          )}
          <span className="hidden sm:inline leading-none">{saveLabel}</span>
          <span className="sm:hidden leading-none">Save</span>
        </button>
      </div>
    </div>
  )
}
