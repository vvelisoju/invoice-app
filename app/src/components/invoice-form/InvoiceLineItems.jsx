import { X, Plus, List } from 'lucide-react'
import { useRef, useCallback } from 'react'

function AutoResizeTextarea({ value, onChange, placeholder, className }) {
  const ref = useRef(null)

  const handleInput = useCallback((e) => {
    onChange(e)
    if (ref.current) {
      ref.current.style.height = 'auto'
      ref.current.style.height = ref.current.scrollHeight + 'px'
    }
  }, [onChange])

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      onChange={handleInput}
      placeholder={placeholder}
      className={className}
    />
  )
}

function BasicLineItem({ item, index, onUpdate, onRemove, canRemove }) {
  return (
    <div className="group relative bg-white border border-transparent hover:border-border hover:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_2px_4px_-1px_rgba(0,0,0,0.02)] rounded-lg transition-all p-1 -mx-1">
      <div className="grid grid-cols-12 gap-4 items-start p-3">
        {/* Description */}
        <div className="col-span-6 md:col-span-7">
          <AutoResizeTextarea
            value={item.name}
            onChange={(e) => onUpdate(index, 'name', e.target.value)}
            placeholder="Description"
            className="w-full bg-transparent border-none p-0 text-sm text-textPrimary placeholder-textSecondary/40 focus:ring-0 resize-none overflow-hidden h-6 leading-6 focus:outline-none"
          />
        </div>
        {/* Amount */}
        <div className="col-span-3 md:col-span-2">
          <input
            type="number"
            value={item.rate || ''}
            onChange={(e) => onUpdate(index, 'rate', e.target.value)}
            placeholder="0.00"
            className="w-full bg-bgPrimary/30 px-3 py-1.5 rounded border border-transparent focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm text-right transition-all focus:outline-none"
          />
        </div>
        {/* Tax & Delete */}
        <div className="col-span-3 md:col-span-3 flex items-center gap-2">
          <button className="flex-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 text-xs font-medium py-1.5 px-3 rounded border border-yellow-200/50 transition-colors">
            + Tax
          </button>
          {canRemove && (
            <button
              onClick={() => onRemove(index)}
              className="w-8 h-8 flex items-center justify-center text-textSecondary hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function AdvancedLineItem({ item, index, onUpdate, onRemove, canRemove }) {
  return (
    <div className="group relative bg-white border border-transparent hover:border-border hover:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_2px_4px_-1px_rgba(0,0,0,0.02)] rounded-lg transition-all p-1 -mx-1">
      <div className="grid grid-cols-12 gap-4 items-start p-3">
        {/* Qty */}
        <div className="col-span-1">
          <input
            type="number"
            value={item.quantity || ''}
            onChange={(e) => onUpdate(index, 'quantity', e.target.value)}
            className="w-full bg-bgPrimary/30 px-2 py-1.5 rounded border border-transparent focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm text-center transition-all focus:outline-none"
          />
        </div>
        {/* Description */}
        <div className="col-span-5">
          <AutoResizeTextarea
            value={item.name}
            onChange={(e) => onUpdate(index, 'name', e.target.value)}
            placeholder="Description"
            className="w-full bg-transparent border-none p-1.5 text-sm text-textPrimary placeholder-textSecondary/40 focus:ring-0 resize-none overflow-hidden h-8 leading-5 focus:outline-none"
          />
        </div>
        {/* Unit Price */}
        <div className="col-span-2">
          <input
            type="number"
            value={item.rate || ''}
            onChange={(e) => onUpdate(index, 'rate', e.target.value)}
            placeholder="0.00"
            className="w-full bg-bgPrimary/30 px-3 py-1.5 rounded border border-transparent focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm text-right transition-all focus:outline-none"
          />
        </div>
        {/* Amount */}
        <div className="col-span-2">
          <input
            type="number"
            value={item.lineTotal || ''}
            readOnly
            placeholder="0.00"
            className="w-full bg-bgPrimary/30 px-3 py-1.5 rounded border border-transparent text-sm text-right transition-all cursor-default"
          />
        </div>
        {/* Tax & Delete */}
        <div className="col-span-2 flex items-center gap-2">
          <button className="flex-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 text-xs font-medium py-1.5 px-2 rounded border border-yellow-200/50 transition-colors truncate">
            + Tax
          </button>
          {canRemove && (
            <button
              onClick={() => onRemove(index)}
              className="w-8 h-8 flex items-center justify-center text-textSecondary hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function InvoiceLineItems({ formMode, lineItems, onUpdateItem, onAddItem, onRemoveItem }) {
  const isAdvanced = formMode === 'advanced'

  return (
    <div className="mb-8">
      {/* Header Row */}
      {isAdvanced ? (
        <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-border mb-2">
          <div className="col-span-1">
            <span className="text-[11px] font-bold text-textSecondary uppercase tracking-wider">Qty</span>
          </div>
          <div className="col-span-5">
            <span className="text-[11px] font-bold text-textSecondary uppercase tracking-wider">Description</span>
          </div>
          <div className="col-span-2">
            <span className="text-[11px] font-bold text-textSecondary uppercase tracking-wider">Unit Price</span>
          </div>
          <div className="col-span-2">
            <span className="text-[11px] font-bold text-textSecondary uppercase tracking-wider">Amount</span>
          </div>
          <div className="col-span-2">
            <span className="text-[11px] font-bold text-textSecondary uppercase tracking-wider">Tax</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-border mb-2">
          <div className="col-span-6 md:col-span-7">
            <span className="text-[11px] font-bold text-textSecondary uppercase tracking-wider">Description</span>
          </div>
          <div className="col-span-3 md:col-span-2">
            <span className="text-[11px] font-bold text-textSecondary uppercase tracking-wider">Amount</span>
          </div>
          <div className="col-span-3 md:col-span-3">
            <span className="text-[11px] font-bold text-textSecondary uppercase tracking-wider">Tax</span>
          </div>
        </div>
      )}

      {/* Items Container */}
      <div className="space-y-3">
        {lineItems.map((item, index) =>
          isAdvanced ? (
            <AdvancedLineItem
              key={item.id}
              item={item}
              index={index}
              onUpdate={onUpdateItem}
              onRemove={onRemoveItem}
              canRemove={lineItems.length > 1}
            />
          ) : (
            <BasicLineItem
              key={item.id}
              item={item}
              index={index}
              onUpdate={onUpdateItem}
              onRemove={onRemoveItem}
              canRemove={lineItems.length > 1}
            />
          )
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-6">
        <button className="flex-1 py-3 border border-dashed border-yellow-300 bg-yellow-50/30 text-yellow-800 hover:bg-yellow-50 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2">
          <List className="w-4 h-4" /> Add Saved Items
        </button>
        <button
          onClick={onAddItem}
          className="flex-1 py-3 border border-dashed border-yellow-300 bg-yellow-50/50 text-yellow-800 hover:bg-yellow-50 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add New Item
        </button>
      </div>
    </div>
  )
}
