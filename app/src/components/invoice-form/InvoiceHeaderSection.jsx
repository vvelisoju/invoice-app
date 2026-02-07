import { Building, User, Truck, Hash, Check } from 'lucide-react'
import LogoUpload from './LogoUpload'

export default function InvoiceHeaderSection({
  formMode,
  fromAddress,
  onFromAddressChange,
  billTo,
  onBillToChange,
  shipTo,
  onShipToChange,
  invoiceNumber,
  onInvoiceNumberChange,
  invoiceDate,
  onInvoiceDateChange,
  poNumber,
  onPoNumberChange,
  dueDate,
  onDueDateChange,
  onLogoClick
}) {
  const isAdvanced = formMode === 'advanced'

  return (
    <div className="flex flex-col md:flex-row gap-12 mb-12">
      {/* Left Column: From, Bill To, Ship To */}
      <div className={`flex-1 ${isAdvanced ? 'space-y-6' : 'space-y-8'}`}>
        {/* From Section */}
        <div className="group relative transition-all">
          <label className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wide mb-2">
            <Building className="w-3.5 h-3.5 text-primary/70" /> From
          </label>
          <div className="relative">
            <textarea
              placeholder="Your Business Name & Address"
              rows={3}
              value={fromAddress}
              onChange={(e) => onFromAddressChange(e.target.value)}
              className="w-full p-4 bg-bgPrimary/30 hover:bg-bgPrimary/50 focus:bg-white border border-transparent hover:border-border focus:border-primary rounded-lg text-textPrimary placeholder-textSecondary/40 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all resize-none text-sm leading-relaxed"
            />
            {fromAddress && (
              <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-600 text-[10px]">
                  <Check className="w-3 h-3" />
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bill To Section */}
        <div className="group relative transition-all">
          <label className="flex items-center gap-2 text-xs font-semibold text-orange-600 uppercase tracking-wide mb-2">
            <User className="w-3.5 h-3.5 text-orange-500/70" /> Bill To
          </label>
          <textarea
            placeholder="Customer's billing address"
            rows={3}
            value={billTo}
            onChange={(e) => onBillToChange(e.target.value)}
            className="w-full p-4 bg-bgPrimary/30 hover:bg-bgPrimary/50 focus:bg-white border border-transparent hover:border-border focus:border-primary rounded-lg text-textPrimary placeholder-textSecondary/40 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all resize-none text-sm leading-relaxed"
          />
        </div>

        {/* Ship To Section (Advanced only) */}
        {isAdvanced && (
          <div className="group relative transition-all">
            <label className="flex items-center gap-2 text-xs font-semibold text-teal-600 uppercase tracking-wide mb-2">
              <Truck className="w-3.5 h-3.5 text-teal-500/70" /> Ship To
            </label>
            <textarea
              placeholder="Customer's shipping address (optional)"
              rows={3}
              value={shipTo}
              onChange={(e) => onShipToChange(e.target.value)}
              className="w-full p-4 bg-bgPrimary/30 hover:bg-bgPrimary/50 focus:bg-white border border-transparent hover:border-border focus:border-primary rounded-lg text-textPrimary placeholder-textSecondary/40 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all resize-none text-sm leading-relaxed"
            />
          </div>
        )}
      </div>

      {/* Right Column: Logo & Metadata */}
      <div className="w-full md:w-72 flex flex-col gap-6">
        {/* Logo Upload */}
        <LogoUpload onClick={onLogoClick} />

        {/* Invoice Meta */}
        <div className="bg-bgPrimary/30 rounded-xl p-5 border border-transparent hover:border-border transition-all space-y-4">
          <div>
            <label className="text-[11px] font-bold text-textSecondary uppercase tracking-wider mb-1.5 block">Invoice #</label>
            <div className="relative">
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => onInvoiceNumberChange(e.target.value)}
                placeholder="Auto-generated"
                className="w-full px-3 py-2 bg-white border border-border rounded-md text-sm font-semibold text-textPrimary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
              <Hash className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary/30" />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold text-textSecondary uppercase tracking-wider mb-1.5 block">
              {isAdvanced ? 'Invoice Date' : 'Date'}
            </label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => onInvoiceDateChange(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-border rounded-md text-sm text-textPrimary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>

          {/* Advanced Fields: P.O.# & Due Date */}
          {isAdvanced && (
            <>
              <div>
                <label className="text-[11px] font-bold text-textSecondary uppercase tracking-wider mb-1.5 block">P.O.#</label>
                <input
                  type="text"
                  value={poNumber}
                  onChange={(e) => onPoNumberChange(e.target.value)}
                  placeholder="Purchase Order (optional)"
                  className="w-full px-3 py-2 bg-white border border-border rounded-md text-sm text-textPrimary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-textSecondary uppercase tracking-wider mb-1.5 block">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => onDueDateChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-border rounded-md text-sm text-textPrimary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
