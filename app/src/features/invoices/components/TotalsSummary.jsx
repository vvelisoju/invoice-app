export default function TotalsSummary({ subtotal, discountTotal, taxRate, taxTotal, total }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value || 0)
  }

  return (
    <div className="bg-bgPrimary rounded-lg p-4 mt-4 space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-textSecondary">Subtotal</span>
        <span className="text-textPrimary">{formatCurrency(subtotal)}</span>
      </div>

      {discountTotal > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-textSecondary">Discount</span>
          <span className="text-red-500">-{formatCurrency(discountTotal)}</span>
        </div>
      )}

      {taxRate > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-textSecondary">Tax ({taxRate}%)</span>
          <span className="text-textPrimary">{formatCurrency(taxTotal)}</span>
        </div>
      )}

      <div className="flex justify-between pt-3 border-t border-dashed border-border mt-2">
        <strong className="text-lg text-textPrimary">Total</strong>
        <strong className="text-xl text-primary">{formatCurrency(total)}</strong>
      </div>
    </div>
  )
}
