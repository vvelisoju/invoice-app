import { Save, Eye, Loader2 } from 'lucide-react'

export default function InvoiceFormToolbar({ formMode, onFormModeChange, onPreview, onSave, isSaving }) {
  return (
    <div className="px-8 py-4 border-b border-border flex justify-between items-center bg-white rounded-t-xl sticky top-0 z-10">
      <div className="flex gap-1 bg-bgPrimary p-1 rounded-lg">
        <button
          onClick={() => onFormModeChange('basic')}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
            formMode === 'basic'
              ? 'bg-white text-textPrimary shadow-sm border border-gray-100'
              : 'text-textSecondary hover:text-textPrimary'
          }`}
        >
          Basic Form
        </button>
        <button
          onClick={() => onFormModeChange('advanced')}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
            formMode === 'advanced'
              ? 'bg-white text-textPrimary shadow-sm border border-gray-100'
              : 'text-textSecondary hover:text-textPrimary'
          }`}
        >
          Advanced Form
        </button>
      </div>
      <div className="flex gap-3">
        {onPreview && (
          <button
            onClick={onPreview}
            className="px-4 py-2 text-sm text-textSecondary hover:bg-bgPrimary rounded-lg transition-all font-medium border border-transparent hover:border-border"
          >
            Preview
          </button>
        )}
        <button
          onClick={onSave}
          disabled={isSaving}
          className="px-5 py-2 bg-primary hover:bg-primaryHover text-white rounded-lg transition-all font-medium text-sm shadow-sm flex items-center gap-2 disabled:opacity-60"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Invoice
        </button>
      </div>
    </div>
  )
}
