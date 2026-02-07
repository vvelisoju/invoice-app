import { PenLine, Pencil } from 'lucide-react'

export default function InvoiceTotalsFooter({
  subtotal,
  discountTotal,
  taxRate,
  taxTotal,
  total,
  terms,
  onTermsChange,
  currency = 'INR',
  formatCurrency
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-border">
      {/* Terms & Conditions */}
      <div className="space-y-8">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-textSecondary uppercase tracking-wide">
              <PenLine className="w-3.5 h-3.5 text-textSecondary/70" />
              Terms & Conditions
            </label>
            <button className="text-[10px] text-primary hover:underline">Edit Default</button>
          </div>
          <textarea
            placeholder="Payment is due within 15 days..."
            rows={4}
            value={terms}
            onChange={(e) => onTermsChange(e.target.value)}
            className="w-full p-4 bg-bgPrimary/30 hover:bg-bgPrimary/50 focus:bg-white border border-transparent hover:border-border focus:border-primary rounded-lg text-textPrimary text-sm placeholder-textSecondary/40 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all resize-none"
          />
        </div>
      </div>

      {/* Totals Calculation */}
      <div className="flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <span className="text-sm font-medium text-textSecondary">Subtotal</span>
            <span className="text-sm font-semibold text-textPrimary">{formatCurrency(subtotal)}</span>
          </div>
          {discountTotal > 0 && (
            <div className="flex justify-between items-center px-2">
              <span className="text-sm font-medium text-textSecondary">Discount</span>
              <span className="text-sm font-semibold text-red-500">-{formatCurrency(discountTotal)}</span>
            </div>
          )}
          {taxTotal > 0 && (
            <div className="flex justify-between items-center px-2">
              <span className="text-sm font-medium text-textSecondary">Tax ({taxRate}%)</span>
              <span className="text-sm font-semibold text-textPrimary">{formatCurrency(taxTotal)}</span>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-border border-dashed">
          <div className="flex justify-between items-end px-2">
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-textPrimary">TOTAL</span>
              <div className="flex items-center gap-1 mt-1 cursor-pointer group">
                <span className="text-xs font-bold text-primary bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 group-hover:bg-blue-100 transition-colors">
                  {currency}
                </span>
                <Pencil className="w-2.5 h-2.5 text-textSecondary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <span className="text-3xl font-bold text-primary tracking-tight">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        {/* Signature Area */}
        <div className="mt-8 bg-yellow-50/50 border border-yellow-100 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-yellow-50 transition-colors group h-32">
          <span className="text-sm font-medium text-yellow-800 mb-1 group-hover:scale-105 transition-transform">
            Add Your Signature
          </span>
          <PenLine className="w-6 h-6 text-yellow-600/50 group-hover:text-yellow-600 transition-colors" />
        </div>
      </div>
    </div>
  )
}
