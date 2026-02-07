import { List, Plus } from 'lucide-react'
import InvoiceLineItemRow from './InvoiceLineItemRow'

/**
 * LineItemsSection — The full line-items area: header row, item rows, and action buttons.
 */
export default function LineItemsSection({
  lineItems = [],
  onUpdateItem,
  onRemoveItem,
  onAddItem,
  onTaxClick,
  onAddSavedItems
}) {
  return (
    <div className="mb-8">
      {/* Header Row */}
      <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-border mb-2">
        <div className="col-span-6 md:col-span-7">
          <span className="text-[11px] font-bold text-textSecondary uppercase tracking-wider">
            Description
          </span>
        </div>
        <div className="col-span-3 md:col-span-2">
          <span className="text-[11px] font-bold text-textSecondary uppercase tracking-wider">
            Amount
          </span>
        </div>
        <div className="col-span-3 md:col-span-3">
          <span className="text-[11px] font-bold text-textSecondary uppercase tracking-wider">
            Tax
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-3">
        {lineItems.map((item, index) => (
          <InvoiceLineItemRow
            key={index}
            item={item}
            index={index}
            onUpdate={onUpdateItem}
            onRemove={onRemoveItem}
            onTaxClick={onTaxClick}
            canRemove={lineItems.length > 1}
          />
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-6">
        <button
          onClick={onAddSavedItems}
          className="flex-1 py-3 border border-dashed border-yellow-300 bg-yellow-50/30 text-yellow-800 hover:bg-yellow-50 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
        >
          <List className="w-4 h-4" />
          Add Saved Items
        </button>
        <button
          onClick={onAddItem}
          className="flex-1 py-3 border border-dashed border-yellow-300 bg-yellow-50/50 text-yellow-800 hover:bg-yellow-50 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add New Item
        </button>
      </div>
    </div>
  )
}
