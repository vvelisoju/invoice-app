import { Pencil } from 'lucide-react'

/**
 * TotalsRow — A single row in the totals summary (e.g., Subtotal, Tax line).
 */
function TotalsRow({ label, value, className = '' }) {
  return (
    <div className={`flex justify-between items-center px-2 ${className}`}>
      <span className="text-sm font-medium text-textSecondary">{label}</span>
      <span className="text-sm font-semibold text-textPrimary">{value}</span>
    </div>
  )
}

/**
 * InvoiceTotals — Subtotal, tax rows, and grand total with currency badge.
 */
export default function InvoiceTotals({
  subtotal = 0,
  taxRows = [],
  total = 0,
  currency = 'INR',
  currencySymbol = '₹',
  onCurrencyEdit
}) {
  const formatAmount = (amount) =>
    new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)

  return (
    <div className="flex flex-col justify-between">
      {/* Subtotal + Tax Rows */}
      <div className="space-y-4">
        <TotalsRow label="Subtotal" value={formatAmount(subtotal)} />
        {taxRows.map((row, i) => (
          <TotalsRow key={i} label={row.label} value={formatAmount(row.amount)} />
        ))}
      </div>

      {/* Grand Total */}
      <div className="mt-8 pt-6 border-t border-border border-dashed">
        <div className="flex justify-between items-end px-2">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-textPrimary">TOTAL</span>
            <div
              onClick={onCurrencyEdit}
              className="flex items-center gap-1 mt-1 cursor-pointer group"
            >
              <span className="text-xs font-bold text-primary bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 group-hover:bg-blue-100 transition-colors">
                {currency}
              </span>
              <Pencil className="w-2.5 h-2.5 text-textSecondary opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <span className="text-3xl font-bold text-primary tracking-tight">
            {currencySymbol} {formatAmount(total)}
          </span>
        </div>
      </div>
    </div>
  )
}
