import { Save, Loader2, ChevronDown } from 'lucide-react'

export default function InvoiceFormToolbar({
  formMode, onFormModeChange, onPreview, onSave, isSaving,
  invoiceTitle,
  docTypeConfig,
  documentTypeKey,
  onDocumentTypeChange,
  availableDocTypes,
  isEditMode
}) {
  const saveLabel = docTypeConfig?.labels?.saveButton || 'Save Invoice'
  const forceBasic = docTypeConfig?.fields?.lineItemsLayout === 'basic' || docTypeConfig?.fields?.lineItemsLayout === 'simple'
  const canChangeType = !isEditMode && availableDocTypes && availableDocTypes.length > 1

  return (
    <div className="px-2.5 md:px-6 py-1.5 md:py-2 border-b border-border flex justify-between items-center bg-white rounded-t-xl sticky top-0 z-10 gap-2">
      {/* Left: Document type select + Basic/Advanced toggle */}
      <div className="flex items-center gap-1.5 md:gap-2.5 min-w-0">
        {/* Document Type — select or read-only label */}
        {canChangeType ? (
          <div className="relative shrink-0">
            <select
              value={documentTypeKey}
              onChange={(e) => onDocumentTypeChange(e.target.value)}
              className="appearance-none bg-transparent pl-0 pr-5 py-1 text-sm md:text-base font-bold text-textPrimary tracking-tight cursor-pointer focus:outline-none"
            >
              {availableDocTypes.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 absolute right-0 top-1/2 -translate-y-1/2 text-textSecondary/50 pointer-events-none" />
          </div>
        ) : (
          <span className="text-sm md:text-base font-bold text-textPrimary tracking-tight truncate shrink-0">
            {invoiceTitle}
          </span>
        )}

        {/* Separator */}
        <div className="h-4 w-px bg-border shrink-0" />

        {/* Basic / Advanced segmented toggle */}
        <div className="flex bg-bgPrimary rounded-md p-px shrink-0">
          <button
            onClick={() => onFormModeChange('basic')}
            className={`px-2 md:px-2.5 py-1 text-[10px] md:text-[11px] font-medium rounded-[5px] transition-colors ${
              formMode === 'basic'
                ? 'bg-white text-textPrimary shadow-sm'
                : 'text-textSecondary active:text-textPrimary md:hover:text-textPrimary'
            }`}
          >
            Basic
          </button>
          <button
            onClick={() => !forceBasic && onFormModeChange('advanced')}
            disabled={forceBasic}
            className={`px-2 md:px-2.5 py-1 text-[10px] md:text-[11px] font-medium rounded-[5px] transition-colors ${
              forceBasic
                ? 'text-textSecondary/30 cursor-not-allowed'
                : formMode === 'advanced'
                  ? 'bg-white text-textPrimary shadow-sm'
                  : 'text-textSecondary active:text-textPrimary md:hover:text-textPrimary'
            }`}
          >
            Adv
          </button>
        </div>
      </div>

      {/* Right: Save */}
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
