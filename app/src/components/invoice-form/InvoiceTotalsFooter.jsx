import { useState, useMemo } from 'react'
import { PenLine, Pencil, ChevronDown, ChevronUp } from 'lucide-react'

function TermsSection({ terms, onTermsChange }) {
  const [collapsed, setCollapsed] = useState(true)

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 text-xs font-semibold text-textSecondary uppercase tracking-wide md:pointer-events-none"
        >
          <PenLine className="w-3.5 h-3.5 text-textSecondary/70" />
          Terms & Conditions
          {collapsed ? (
            <ChevronDown className="w-3.5 h-3.5 text-textSecondary/50 md:hidden" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-textSecondary/50 md:hidden" />
          )}
        </button>
      </div>
      {/* Collapsed summary on mobile */}
      {collapsed && terms && (
        <div className="md:hidden text-xs text-textSecondary truncate px-1">
          {terms.split('\n')[0]}
        </div>
      )}
      <div className={`${collapsed ? 'hidden md:block' : ''}`}>
        <textarea
          placeholder="Payment is due within 15 days..."
          rows={4}
          value={terms}
          onChange={(e) => onTermsChange(e.target.value)}
          className="w-full p-3 md:p-4 bg-bgPrimary/30 active:bg-bgPrimary/50 md:hover:bg-bgPrimary/50 focus:bg-white border border-border/40 active:border-border md:hover:border-border focus:border-primary rounded-lg text-textPrimary text-sm placeholder-textSecondary/40 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all resize-none"
        />
      </div>
    </div>
  )
}

function SignatureSection({ signatureUrl, signatureName, onSignatureClick, collapsed: controlledCollapsed, onToggle }) {
  return (
    <div>
      {/* Mobile collapse toggle */}
      <div className="md:hidden mb-2">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 text-xs font-semibold text-textSecondary uppercase tracking-wide"
        >
          <PenLine className="w-3.5 h-3.5 text-textSecondary/70" />
          Signature
          {controlledCollapsed ? (
            <ChevronDown className="w-3.5 h-3.5 text-textSecondary/50" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-textSecondary/50" />
          )}
        </button>
        {controlledCollapsed && signatureName && (
          <div className="text-xs text-textSecondary truncate px-1 mt-1">
            {signatureUrl ? 'Signature uploaded' : signatureName}
          </div>
        )}
      </div>
      <div className={`${controlledCollapsed ? 'hidden md:block' : ''}`}>
        {signatureUrl || signatureName ? (
          <div
            onClick={onSignatureClick}
            className="bg-gray-50/50 border border-border rounded-xl p-4 md:p-5 flex flex-col items-center justify-center text-center cursor-pointer active:border-primary md:hover:border-primary transition-colors"
          >
            {signatureUrl && (
              <img src={signatureUrl} alt="Signature" className="max-h-16 md:max-h-20 max-w-full object-contain mb-1" />
            )}
            {signatureName && !signatureUrl && (
              <span className="text-lg md:text-xl text-textPrimary" style={{ fontFamily: "'Dancing Script', 'Pacifico', 'Satisfy', cursive", fontStyle: 'italic' }}>
                {signatureName}
              </span>
            )}
            <span className="text-[10px] text-textSecondary mt-1 uppercase tracking-wider font-medium">Authorized Signatory</span>
          </div>
        ) : (
          <div
            onClick={onSignatureClick}
            className="bg-yellow-50/50 border border-yellow-100 rounded-xl p-4 md:p-5 flex flex-col items-center justify-center text-center cursor-pointer active:bg-yellow-50 md:hover:bg-yellow-50 transition-colors group h-24 md:h-28"
          >
            <span className="text-sm font-medium text-yellow-800 mb-1 group-hover:scale-105 transition-transform">Add Your Signature</span>
            <PenLine className="w-6 h-6 text-yellow-600/50 group-hover:text-yellow-600 transition-colors" />
          </div>
        )}
      </div>
    </div>
  )
}

function TotalsBlock({ subtotal, discountTotal, taxRate, taxTotal, total, taxBreakdown, totalTaxFromItems, currency, formatCurrency, onDiscountChange }) {
  return (
    <div>
      <div className="space-y-3">
        <div className="flex justify-between items-center px-2">
          <span className="text-sm font-medium text-textSecondary">Subtotal</span>
          <span className="text-sm font-semibold text-textPrimary">{formatCurrency(subtotal)}</span>
        </div>
        {onDiscountChange ? (
          <div className="flex justify-between items-center px-2">
            <span className="text-sm font-medium text-textSecondary">Discount</span>
            <div className="flex items-center gap-1">
              <span className="text-sm text-red-500">-</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={discountTotal || ''}
                onChange={(e) => onDiscountChange(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-24 text-right text-sm font-semibold text-red-500 border border-border rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
          </div>
        ) : discountTotal > 0 ? (
          <div className="flex justify-between items-center px-2">
            <span className="text-sm font-medium text-textSecondary">Discount</span>
            <span className="text-sm font-semibold text-red-500">-{formatCurrency(discountTotal)}</span>
          </div>
        ) : null}

        {/* Per-tax-rate breakdown from line items */}
        {taxBreakdown.length > 0 && (
          <div className="space-y-2 pt-1">
            {taxBreakdown.map((tax) => (
              <div key={`${tax.rate}_${tax.name}`} className="flex justify-between items-center px-2">
                <span className="text-sm font-medium text-textSecondary">
                  {tax.isComponent ? tax.name : 'Tax'} <span className="text-xs text-textSecondary/70">({tax.rate}%)</span>
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

      <div className="mt-4 md:mt-6 pt-4 md:pt-5 border-t border-border border-dashed">
        <div className="flex justify-between items-end px-2">
          <div className="flex flex-col">
            <span className="text-lg md:text-xl font-bold text-textPrimary">TOTAL</span>
            <div className="flex items-center gap-1 mt-1 cursor-pointer group">
              <span className="text-xs font-bold text-primary bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 group-hover:bg-blue-100 transition-colors">
                {currency}
              </span>
              <Pencil className="w-2.5 h-2.5 text-textSecondary opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <span className="text-xl md:text-2xl font-bold text-primary tracking-tight">
            {formatCurrency(totalTaxFromItems > 0 ? (subtotal - discountTotal + totalTaxFromItems) : total)}
          </span>
        </div>
      </div>
    </div>
  )
}

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
  formatCurrency,
  signatureUrl,
  signatureName,
  onSignatureClick,
  docTypeConfig,
  onDiscountChange
}) {
  const showTerms = docTypeConfig?.fields?.showTerms !== false
  const showSignature = docTypeConfig?.fields?.showSignature !== false
  // Compute per-tax-rate breakdown from line items
  // When a line item has taxComponents (tax group), expand into individual component lines
  const taxBreakdown = useMemo(() => {
    const breakdown = {}
    lineItems.forEach((item) => {
      if (item.taxRate && item.taxRate > 0) {
        const lineTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0)
        const components = item.taxComponents && Array.isArray(item.taxComponents) && item.taxComponents.length >= 2
          ? item.taxComponents
          : null

        if (components) {
          // Expand tax group into individual component taxes
          components.forEach((comp) => {
            const compRate = Number(comp.rate)
            const key = `${comp.name}_${compRate}`
            const compAmount = (lineTotal * compRate) / 100
            if (!breakdown[key]) {
              breakdown[key] = { rate: compRate, name: comp.name, amount: 0, isComponent: true }
            }
            breakdown[key].amount += compAmount
          })
        } else {
          // Simple flat tax rate
          const rate = Number(item.taxRate)
          const key = String(rate)
          const taxAmount = (lineTotal * rate) / 100
          if (!breakdown[key]) {
            breakdown[key] = { rate, name: 'Tax', amount: 0 }
          }
          breakdown[key].amount += taxAmount
        }
      }
    })
    return Object.values(breakdown).sort((a, b) => a.rate - b.rate)
  }, [lineItems])

  const totalTaxFromItems = taxBreakdown.reduce((sum, t) => sum + t.amount, 0)

  const [sigCollapsed, setSigCollapsed] = useState(true)

  return (
    <div className="pt-4 md:pt-6 border-t border-border">
      {/* Desktop: 2-column grid (Terms left, Totals+Signature right) */}
      <div className="hidden md:grid md:grid-cols-2 gap-10">
        {showTerms ? (
          <TermsSection terms={terms} onTermsChange={onTermsChange} />
        ) : <div />}
        <div className="flex flex-col justify-between">
          <TotalsBlock
            subtotal={subtotal} discountTotal={discountTotal} taxRate={taxRate}
            taxTotal={taxTotal} total={total} taxBreakdown={taxBreakdown}
            totalTaxFromItems={totalTaxFromItems} currency={currency} formatCurrency={formatCurrency}
            onDiscountChange={onDiscountChange}
          />
          {showSignature && (
            <div className="mt-6">
              <SignatureSection
                signatureUrl={signatureUrl} signatureName={signatureName}
                onSignatureClick={onSignatureClick} collapsed={false} onToggle={() => {}}
              />
            </div>
          )}
        </div>
      </div>

      {/* Mobile: single column — Totals → Signature → Terms */}
      <div className="md:hidden space-y-5">
        <TotalsBlock
          subtotal={subtotal} discountTotal={discountTotal} taxRate={taxRate}
          taxTotal={taxTotal} total={total} taxBreakdown={taxBreakdown}
          totalTaxFromItems={totalTaxFromItems} currency={currency} formatCurrency={formatCurrency}
          onDiscountChange={onDiscountChange}
        />
        {showSignature && (
          <SignatureSection
            signatureUrl={signatureUrl} signatureName={signatureName}
            onSignatureClick={onSignatureClick} collapsed={sigCollapsed} onToggle={() => setSigCollapsed(!sigCollapsed)}
          />
        )}
        {showTerms && (
          <TermsSection terms={terms} onTermsChange={onTermsChange} />
        )}
      </div>
    </div>
  )
}
