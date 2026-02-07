import { Trash2 } from 'lucide-react'
import ProductTypeahead from './ProductTypeahead'

export default function LineItemRow({
  item,
  index,
  onUpdate,
  onRemove,
  onProductSelect,
  canRemove
}) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value || 0)
  }

  return (
    <div className="bg-bgPrimary/30 rounded-lg p-3 mb-3">
      <div className="mb-2">
        <ProductTypeahead
          value={item.name}
          onChange={(value) => onUpdate(index, 'name', value)}
          onSelect={(product) => onProductSelect(index, product)}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <div className="text-xs text-textSecondary mb-1">Qty</div>
          <input
            type="number"
            inputMode="decimal"
            value={item.quantity}
            onChange={(e) => onUpdate(index, 'quantity', e.target.value)}
            className="w-full px-2 py-1.5 bg-white border border-border rounded text-sm text-right focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>

        <div>
          <div className="text-xs text-textSecondary mb-1">Rate (₹)</div>
          <input
            type="number"
            inputMode="decimal"
            value={item.rate}
            onChange={(e) => onUpdate(index, 'rate', e.target.value)}
            className="w-full px-2 py-1.5 bg-white border border-border rounded text-sm text-right focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>

        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs text-textSecondary mb-1">Total</div>
            <div className="text-base font-semibold text-textPrimary">
              {formatCurrency(item.lineTotal)}
            </div>
          </div>

          {canRemove && (
            <button
              onClick={() => onRemove(index)}
              className="w-7 h-7 flex items-center justify-center text-textSecondary hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
