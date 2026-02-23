import { X } from 'lucide-react'

/**
 * InvoiceLineItemRow — A single line item row with description, amount, tax button, and delete.
 */
export default function InvoiceLineItemRow({
  item,
  index,
  onUpdate,
  onRemove,
  onTaxClick,
  canRemove = true
}) {
  return (
    <div className="group relative bg-white border border-transparent active:border-border md:hover:border-border active:shadow-soft md:hover:shadow-soft rounded-lg transition-all p-1 -mx-1">
      <div className="grid grid-cols-12 gap-2 md:gap-4 items-start p-2 md:p-3">
        {/* Description */}
        <div className="col-span-12 md:col-span-7">
          <textarea
            value={item.description}
            onChange={(e) => onUpdate(index, 'description', e.target.value)}
            placeholder="Description"
            rows={1}
            className="w-full bg-transparent border-none p-0 text-sm text-textPrimary placeholder-textSecondary/40 focus:ring-0 resize-none overflow-hidden min-h-[28px] leading-7 focus:outline-none"
          />
        </div>

        {/* Amount */}
        <div className="col-span-5 md:col-span-2">
          <input
            type="number"
            value={item.amount}
            onChange={(e) => onUpdate(index, 'amount', e.target.value)}
            placeholder="0.00"
            className="w-full bg-bgPrimary/30 px-3 py-2 md:py-1.5 rounded border border-transparent focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm text-right transition-all focus:outline-none"
          />
        </div>

        {/* Tax + Delete */}
        <div className="col-span-7 md:col-span-3 flex items-center gap-2">
          {item.tax ? (
            <button
              onClick={() => onTaxClick?.(index)}
              className="flex-1 bg-green-50 active:bg-green-100 md:hover:bg-green-100 text-green-700 text-xs font-medium py-2 md:py-1.5 px-3 rounded border border-green-200/50 transition-colors truncate"
              title={`${item.tax}%`}
            >
              {`${item.tax}%`}
            </button>
          ) : (
            <button
              onClick={() => onTaxClick?.(index)}
              className="flex-1 bg-yellow-50 active:bg-yellow-100 md:hover:bg-yellow-100 text-yellow-700 text-xs font-medium py-2 md:py-1.5 px-3 rounded border border-yellow-200/50 transition-colors"
            >
              + Tax
            </button>
          )}
          {canRemove && (
            <button
              onClick={() => onRemove(index)}
              className="w-10 h-10 md:w-8 md:h-8 flex items-center justify-center text-textSecondary active:text-red-500 md:hover:text-red-500 active:bg-red-50 md:hover:bg-red-50 rounded-full transition-all md:opacity-0 md:group-hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
