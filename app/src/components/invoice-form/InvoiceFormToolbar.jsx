import { Save, Eye, Loader2, ChevronDown } from 'lucide-react'
import { ALL_INVOICE_TYPES } from '../layout/navigationConfig'

export default function InvoiceFormToolbar({
  formMode, onFormModeChange, onPreview, onSave, isSaving,
  invoiceTitle, onInvoiceTitleChange, showTitleDropdown, onToggleTitleDropdown, onCloseTitleDropdown
}) {
  return (
    <div className="px-3 md:px-8 py-3 md:py-4 border-b border-border flex justify-between items-center bg-white rounded-t-xl sticky top-0 z-10 gap-2">
      {/* Left: Basic/Advanced toggle + Invoice Title */}
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
            onClick={() => onFormModeChange('advanced')}
            className={`px-3 md:px-4 py-2 text-xs md:text-sm font-medium rounded-md transition-colors ${
              formMode === 'advanced'
                ? 'bg-white text-textPrimary shadow-sm border border-gray-100'
                : 'text-textSecondary active:text-textPrimary md:hover:text-textPrimary'
            }`}
          >
            Advanced
          </button>
        </div>

        {/* Invoice Title Selector */}
        {invoiceTitle && onInvoiceTitleChange && (
          <div className="relative min-w-0">
            <button
              onClick={onToggleTitleDropdown}
              onBlur={() => setTimeout(() => onCloseTitleDropdown?.(), 150)}
              className="text-base md:text-lg font-bold text-textPrimary tracking-tight flex items-center gap-1.5 active:text-primary md:hover:text-primary transition-colors group truncate"
            >
              <span className="truncate">{invoiceTitle}</span>
              <ChevronDown className="w-4 h-4 text-textSecondary/40 group-hover:text-primary transition-colors shrink-0" />
            </button>
            {showTitleDropdown && (
              <div className="absolute top-full left-0 z-50 mt-1 bg-white border border-border rounded-xl shadow-lg overflow-hidden min-w-[200px] max-h-[320px] overflow-y-auto">
                {ALL_INVOICE_TYPES.map((type) => (
                  <button
                    key={type.key}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { onInvoiceTitleChange(type.label); onCloseTitleDropdown?.() }}
                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors border-b border-border/30 last:border-b-0 ${
                      invoiceTitle === type.label
                        ? 'bg-blue-50 text-primary font-semibold'
                        : 'text-textPrimary hover:bg-gray-50 font-medium'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            )}
          </div>
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
          className="px-4 md:px-5 py-2 bg-primary active:bg-primaryHover md:hover:bg-primaryHover text-white rounded-lg transition-all font-medium text-sm shadow-sm flex items-center gap-2 disabled:opacity-60"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">Save Invoice</span>
          <span className="sm:hidden">Save</span>
        </button>
      </div>
    </div>
  )
}
