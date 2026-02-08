import { useState } from 'react'
import { X } from 'lucide-react'
import Portal from '../Portal'

/**
 * InvoiceTaxModal — Tailwind-styled modal for adding/editing tax on a line item.
 */
export default function InvoiceTaxModal({ isOpen, onClose, onAddTax }) {
  const [taxRate, setTaxRate] = useState('')
  const [taxName, setTaxName] = useState('')

  const handleSubmit = () => {
    if (taxRate && parseFloat(taxRate) > 0) {
      onAddTax(parseFloat(taxRate), taxName || `Tax ${taxRate}%`)
      setTaxRate('')
      setTaxName('')
      onClose()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit()
    if (e.key === 'Escape') onClose()
  }

  if (!isOpen) return null

  return (
    <Portal>
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-base font-semibold text-textPrimary">Add Tax</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-bgPrimary transition-colors text-textSecondary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5 block">
              Tax Name (Optional)
            </label>
            <input
              type="text"
              value={taxName}
              onChange={(e) => setTaxName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., GST, VAT"
              className="w-full px-3 py-2 bg-white border border-border rounded-md text-sm text-textPrimary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5 block">
              Tax Rate (%)
            </label>
            <input
              type="number"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., 18"
              step="0.01"
              autoFocus
              className="w-full px-3 py-2 bg-white border border-border rounded-md text-sm text-textPrimary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-textSecondary hover:bg-bgPrimary rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 bg-primary hover:bg-primaryHover text-white rounded-lg text-sm font-medium shadow-sm transition-all"
          >
            Add Tax
          </button>
        </div>
      </div>
    </div>
    </Portal>
  )
}
