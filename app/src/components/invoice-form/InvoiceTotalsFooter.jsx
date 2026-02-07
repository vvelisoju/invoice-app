import { PenLine, Pencil } from 'lucide-react'
import { useMemo } from 'react'

export default function InvoiceTotalsFooter({
  subtotal,
  discountTotal,
  taxRate,
  taxTotal,
  total,
  terms,
  onTermsChange,
  lineItems = [],
  currency = 'INR',
  formatCurrency
}) {
  // Compute per-tax-rate breakdown from line items
  const taxBreakdown = useMemo(() => {
    const breakdown = {}
    lineItems.forEach((item) => {
      if (item.taxRate && item.taxRate > 0) {
        const rate = Number(item.taxRate)
        const name = item.taxRateName || `Tax ${rate}%`
        const key = `${rate}_${name}`
        const lineTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0)
        const taxAmount = (lineTotal * rate) / 100
        if (!breakdown[key]) {
          breakdown[key] = { rate, name, amount: 0 }
        }
        breakdown[key].amount += taxAmount
      }
    })
    return Object.values(breakdown).sort((a, b) => a.rate - b.rate)
  }, [lineItems])

  const totalTaxFromItems = taxBreakdown.reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-6 border-t border-border">
      {/* Terms & Conditions */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-textSecondary uppercase tracking-wide">
            <PenLine className="w-3.5 h-3.5 text-textSecondary/70" />
            Terms & Conditions
          </label>
        </div>
        <textarea
          placeholder="Payment is due within 15 days..."
          rows={4}
          value={terms}
          onChange={(e) => onTermsChange(e.target.value)}
          className="w-full p-4 bg-bgPrimary/30 hover:bg-bgPrimary/50 focus:bg-white border border-transparent hover:border-border focus:border-primary rounded-lg text-textPrimary text-sm placeholder-textSecondary/40 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all resize-none"
        />
      </div>

      {/* Totals Calculation */}
      <div className="flex flex-col justify-between">
        <div className="space-y-3">
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

          {/* Per-tax-rate breakdown from line items */}
          {taxBreakdown.length > 0 && (
            <div className="space-y-2 pt-1">
              {taxBreakdown.map((tax) => (
                <div key={`${tax.rate}_${tax.name}`} className="flex justify-between items-center px-2">
                  <span className="text-sm font-medium text-textSecondary">
                    {tax.name} <span className="text-xs text-textSecondary/70">({tax.rate}%)</span>
                  </span>
                  <span className="text-sm font-semibold text-textPrimary">{formatCurrency(tax.amount)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Fallback: invoice-level tax if no per-item taxes */}
          {taxBreakdown.length === 0 && taxTotal > 0 && (
            <div className="flex justify-between items-center px-2">
              <span className="text-sm font-medium text-textSecondary">Tax ({taxRate}%)</span>
              <span className="text-sm font-semibold text-textPrimary">{formatCurrency(taxTotal)}</span>
            </div>
          )}
        </div>

        <div className="mt-6 pt-5 border-t border-border border-dashed">
          <div className="flex justify-between items-end px-2">
            <div className="flex flex-col">
              <span className="text-xl font-bold text-textPrimary">TOTAL</span>
              <div className="flex items-center gap-1 mt-1 cursor-pointer group">
                <span className="text-xs font-bold text-primary bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 group-hover:bg-blue-100 transition-colors">
                  {currency}
                </span>
                <Pencil className="w-2.5 h-2.5 text-textSecondary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <span className="text-2xl font-bold text-primary tracking-tight">
              {formatCurrency(totalTaxFromItems > 0 ? (subtotal - discountTotal + totalTaxFromItems) : total)}
            </span>
          </div>
        </div>

        {/* Signature Area */}
        <div className="mt-6 bg-yellow-50/50 border border-yellow-100 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-yellow-50 transition-colors group h-28">
          <span className="text-sm font-medium text-yellow-800 mb-1 group-hover:scale-105 transition-transform">
            Add Your Signature
          </span>
          <PenLine className="w-6 h-6 text-yellow-600/50 group-hover:text-yellow-600 transition-colors" />
        </div>
      </div>
    </div>
  )
}
