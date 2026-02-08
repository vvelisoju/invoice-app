import { useState, useRef, useEffect } from 'react'
import { Building, User, Truck, Hash, Check, Search, UserPlus, Loader2, Settings, ChevronDown, ChevronUp } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { customerApi } from '../../lib/api'
import LogoUpload from './LogoUpload'

export default function InvoiceHeaderSection({
  formMode,
  fromAddress,
  onFromAddressChange,
  businessProfile,
  billTo,
  onBillToChange,
  selectedCustomer,
  onCustomerSelect,
  onCreateNewCustomer,
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
  onLogoClick,
  onEditSettings
}) {
  const isAdvanced = formMode === 'advanced'
  const [fromCollapsed, setFromCollapsed] = useState(true)
  const [billToText, setBillToText] = useState(billTo || '')
  const [searchTerm, setSearchTerm] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const suggestionsRef = useRef(null)
  const textareaRef = useRef(null)

  // Ship To state (mirrors Bill To)
  const [shipToText, setShipToText] = useState(shipTo || '')
  const [shipSearchTerm, setShipSearchTerm] = useState('')
  const [showShipSuggestions, setShowShipSuggestions] = useState(false)
  const [shipHighlightedIndex, setShipHighlightedIndex] = useState(-1)
  const shipTextareaRef = useRef(null)

  const { data: suggestions = [], isFetching, isFetched } = useQuery({
    queryKey: ['customers', 'search', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 1) return []
      try {
        const response = await customerApi.search(searchTerm)
        return response.data || []
      } catch {
        return []
      }
    },
    enabled: searchTerm.length >= 1 && showSuggestions
  })

  const { data: shipSuggestions = [], isFetching: shipIsFetching, isFetched: shipIsFetched } = useQuery({
    queryKey: ['customers', 'search', 'ship', shipSearchTerm],
    queryFn: async () => {
      if (!shipSearchTerm || shipSearchTerm.length < 1) return []
      try {
        const response = await customerApi.search(shipSearchTerm)
        return response.data || []
      } catch {
        return []
      }
    },
    enabled: shipSearchTerm.length >= 1 && showShipSuggestions
  })

  // Build address text from customer (name + details)
  const buildCustomerText = (customer) => {
    const parts = [customer.name]
    if (customer.address) parts.push(customer.address)
    if (customer.phone) parts.push(customer.phone)
    if (customer.email) parts.push(customer.email)
    return parts.join('\n')
  }

  // Sync billToText from prop (e.g. sessionStorage draft restoration)
  useEffect(() => {
    if (billTo && !billToText) {
      setBillToText(billTo)
    }
  }, [billTo])

  // Sync shipToText from prop (e.g. sessionStorage draft restoration)
  useEffect(() => {
    if (shipTo && !shipToText) {
      setShipToText(shipTo)
    }
  }, [shipTo])

  // Sync when a customer is selected externally (e.g. from modal)
  useEffect(() => {
    if (selectedCustomer) {
      const text = buildCustomerText(selectedCustomer)
      setBillToText(text)
      onBillToChange(text)
    }
  }, [selectedCustomer])

  const handleTextareaChange = (e) => {
    const val = e.target.value
    setBillToText(val)
    onBillToChange(val)

    // Use the first line as the search term for suggestions
    const firstLine = val.split('\n')[0].trim()
    setSearchTerm(firstLine)

    if (firstLine.length >= 1) {
      setShowSuggestions(true)
      setHighlightedIndex(-1)
    } else {
      setShowSuggestions(false)
    }
  }

  const handleSelectCustomer = (customer) => {
    const text = buildCustomerText(customer)
    setBillToText(text)
    onCustomerSelect?.(customer)
    setShowSuggestions(false)
    setHighlightedIndex(-1)
  }

  const handleCreateNew = () => {
    setShowSuggestions(false)
    onCreateNewCustomer?.(searchTerm)
  }

  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200)
  }

  const handleFocus = () => {
    const firstLine = billToText.split('\n')[0].trim()
    if (firstLine.length >= 1) {
      setSearchTerm(firstLine)
      setShowSuggestions(true)
    }
  }

  // Total dropdown items: suggestions + "Create New" (only when fetched)
  const showCreateNew = isFetched && !isFetching

  const handleKeyDown = (e) => {
    if (!showSuggestions) return
    const totalItems = suggestions.length + (showCreateNew ? 1 : 0)
    if (totalItems === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex(prev => (prev + 1) % totalItems)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex(prev => (prev - 1 + totalItems) % totalItems)
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault()
      if (highlightedIndex < suggestions.length) {
        handleSelectCustomer(suggestions[highlightedIndex])
      } else if (showCreateNew && highlightedIndex === suggestions.length) {
        handleCreateNew()
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  // Ship To handlers
  const handleShipTextareaChange = (e) => {
    const val = e.target.value
    setShipToText(val)
    onShipToChange(val)
    const firstLine = val.split('\n')[0].trim()
    setShipSearchTerm(firstLine)
    if (firstLine.length >= 1) {
      setShowShipSuggestions(true)
      setShipHighlightedIndex(-1)
    } else {
      setShowShipSuggestions(false)
    }
  }

  const handleShipSelectCustomer = (customer) => {
    const text = buildCustomerText(customer)
    setShipToText(text)
    onShipToChange(text)
    setShowShipSuggestions(false)
    setShipHighlightedIndex(-1)
  }

  const handleShipCreateNew = () => {
    setShowShipSuggestions(false)
    onCreateNewCustomer?.(shipSearchTerm)
  }

  const handleShipBlur = () => {
    setTimeout(() => setShowShipSuggestions(false), 200)
  }

  const handleShipFocus = () => {
    const firstLine = shipToText.split('\n')[0].trim()
    if (firstLine.length >= 1) {
      setShipSearchTerm(firstLine)
      setShowShipSuggestions(true)
    }
  }

  const showShipCreateNew = shipIsFetched && !shipIsFetching

  const handleShipKeyDown = (e) => {
    if (!showShipSuggestions) return
    const totalItems = shipSuggestions.length + (showShipCreateNew ? 1 : 0)
    if (totalItems === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setShipHighlightedIndex(prev => (prev + 1) % totalItems)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setShipHighlightedIndex(prev => (prev - 1 + totalItems) % totalItems)
    } else if (e.key === 'Enter' && shipHighlightedIndex >= 0) {
      e.preventDefault()
      if (shipHighlightedIndex < shipSuggestions.length) {
        handleShipSelectCustomer(shipSuggestions[shipHighlightedIndex])
      } else if (showShipCreateNew && shipHighlightedIndex === shipSuggestions.length) {
        handleShipCreateNew()
      }
    } else if (e.key === 'Escape') {
      setShowShipSuggestions(false)
    }
  }

  return (
    <div className="flex flex-col md:flex-row gap-5 md:gap-8 mb-6 md:mb-8">
      {/* Left Column: From, Bill To, Ship To */}
      <div className={`flex-1 ${isAdvanced ? 'space-y-4 md:space-y-5' : 'space-y-4 md:space-y-6'}`}>
        {/* From Section — collapsible on mobile */}
        <div className="group relative transition-all">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setFromCollapsed(!fromCollapsed)}
              className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wide md:pointer-events-none"
            >
              <Building className="w-3.5 h-3.5 text-primary/70" /> From
              {fromCollapsed ? (
                <ChevronDown className="w-3.5 h-3.5 text-primary/50 md:hidden" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5 text-primary/50 md:hidden" />
              )}
            </button>
            <button
              onClick={onEditSettings}
              className="flex items-center gap-1 text-[11px] font-medium text-textSecondary active:text-primary md:hover:text-primary transition-colors"
              title="Edit Business Settings"
            >
              <Settings className="w-3 h-3" />
              <span className="hidden sm:inline">Edit Settings</span>
            </button>
          </div>
          {/* Collapsed summary on mobile */}
          {fromCollapsed && fromAddress && (
            <div className="md:hidden text-xs text-textSecondary truncate px-1">
              {fromAddress.split('\n')[0]}
            </div>
          )}
          <div className={`${fromCollapsed ? 'hidden md:block' : ''}`}>
            <div className="relative">
              <textarea
                placeholder="Your Business Name & Address"
                rows={3}
                value={fromAddress}
                readOnly
                className="w-full p-3 md:p-4 bg-bgPrimary/30 border border-transparent rounded-lg text-textPrimary placeholder-textSecondary/40 focus:outline-none transition-all resize-none text-sm leading-relaxed cursor-default"
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
        </div>

        {/* Bill To Section — Customer Typeahead Textarea */}
        <div className="group relative transition-all">
          <label className="flex items-center gap-2 text-xs font-semibold text-orange-600 uppercase tracking-wide mb-2">
            <User className="w-3.5 h-3.5 text-orange-500/70" /> Bill To
          </label>
          <div className="relative">
            <div className="relative">
              <textarea
                ref={textareaRef}
                placeholder="Customer's name and billing address"
                rows={3}
                value={billToText}
                onChange={handleTextareaChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="w-full p-3 md:p-4 bg-bgPrimary/30 active:bg-bgPrimary/50 md:hover:bg-bgPrimary/50 focus:bg-white border border-transparent active:border-border md:hover:border-border focus:border-primary rounded-lg text-textPrimary placeholder-textSecondary/40 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all resize-none text-sm leading-relaxed"
              />
              <Search className="w-4 h-4 absolute right-4 top-4 text-textSecondary/40" />
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && searchTerm.length >= 1 && (
              <div
                ref={suggestionsRef}
                className="absolute left-0 right-0 z-50 mt-1 bg-white border border-border rounded-xl shadow-lg overflow-hidden"
              >
                {/* Loading indicator */}
                {isFetching && (
                  <div className="px-4 py-3 flex items-center gap-2 text-sm text-textSecondary">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    Searching customers...
                  </div>
                )}

                {/* Customer suggestions */}
                {!isFetching && suggestions.length > 0 && (
                  <div className="max-h-52 overflow-y-auto">
                    {suggestions.map((customer, index) => (
                      <button
                        key={customer.id}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelectCustomer(customer)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors border-b border-border/50 last:border-b-0 ${
                          highlightedIndex === index
                            ? 'bg-blue-50 text-primary'
                            : 'hover:bg-gray-50 text-textPrimary'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {customer.name?.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{customer.name}</div>
                          <div className="text-xs text-textSecondary flex items-center gap-2">
                            {customer.phone && <span>{customer.phone}</span>}
                            {customer.email && <span>{customer.email}</span>}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* No results message — only after response */}
                {!isFetching && isFetched && suggestions.length === 0 && (
                  <div className="px-4 py-3 text-sm text-textSecondary">
                    No customers found for "<span className="font-medium text-textPrimary">{searchTerm}</span>"
                  </div>
                )}

                {/* Create New Customer — only shown after response received */}
                {showCreateNew && (
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleCreateNew}
                    onMouseEnter={() => setHighlightedIndex(suggestions.length)}
                    className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors border-t border-border ${
                      highlightedIndex === suggestions.length
                        ? 'bg-green-50 text-green-700'
                        : 'hover:bg-green-50/50 text-green-600'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">Create New Customer</div>
                      {searchTerm && (
                        <div className="text-xs text-textSecondary">
                          Add "<span className="font-medium">{searchTerm}</span>" as a new customer
                        </div>
                      )}
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Ship To Section (Advanced only) — with customer typeahead */}
        {isAdvanced && (
          <div className="group relative transition-all">
            <label className="flex items-center gap-2 text-xs font-semibold text-teal-600 uppercase tracking-wide mb-2">
              <Truck className="w-3.5 h-3.5 text-teal-500/70" /> Ship To
            </label>
            <div className="relative">
              <div className="relative">
                <textarea
                  ref={shipTextareaRef}
                  placeholder="Customer's shipping address (optional)"
                  rows={3}
                  value={shipToText}
                  onChange={handleShipTextareaChange}
                  onFocus={handleShipFocus}
                  onBlur={handleShipBlur}
                  onKeyDown={handleShipKeyDown}
                  className="w-full p-3 md:p-4 bg-bgPrimary/30 active:bg-bgPrimary/50 md:hover:bg-bgPrimary/50 focus:bg-white border border-transparent active:border-border md:hover:border-border focus:border-primary rounded-lg text-textPrimary placeholder-textSecondary/40 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all resize-none text-sm leading-relaxed"
                />
                <Search className="w-4 h-4 absolute right-4 top-4 text-textSecondary/40" />
              </div>

              {/* Ship To Suggestions Dropdown */}
              {showShipSuggestions && shipSearchTerm.length >= 1 && (
                <div className="absolute left-0 right-0 z-50 mt-1 bg-white border border-border rounded-xl shadow-lg overflow-hidden">
                  {shipIsFetching && (
                    <div className="px-4 py-3 flex items-center gap-2 text-sm text-textSecondary">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      Searching customers...
                    </div>
                  )}

                  {!shipIsFetching && shipSuggestions.length > 0 && (
                    <div className="max-h-52 overflow-y-auto">
                      {shipSuggestions.map((customer, index) => (
                        <button
                          key={customer.id}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleShipSelectCustomer(customer)}
                          onMouseEnter={() => setShipHighlightedIndex(index)}
                          className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors border-b border-border/50 last:border-b-0 ${
                            shipHighlightedIndex === index
                              ? 'bg-blue-50 text-primary'
                              : 'hover:bg-gray-50 text-textPrimary'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {customer.name?.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{customer.name}</div>
                            <div className="text-xs text-textSecondary flex items-center gap-2">
                              {customer.phone && <span>{customer.phone}</span>}
                              {customer.email && <span>{customer.email}</span>}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {!shipIsFetching && shipIsFetched && shipSuggestions.length === 0 && (
                    <div className="px-4 py-3 text-sm text-textSecondary">
                      No customers found for "<span className="font-medium text-textPrimary">{shipSearchTerm}</span>"
                    </div>
                  )}

                  {showShipCreateNew && (
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={handleShipCreateNew}
                      onMouseEnter={() => setShipHighlightedIndex(shipSuggestions.length)}
                      className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors border-t border-border ${
                        shipHighlightedIndex === shipSuggestions.length
                          ? 'bg-green-50 text-green-700'
                          : 'hover:bg-green-50/50 text-green-600'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                        <UserPlus className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">Create New Customer</div>
                        {shipSearchTerm && (
                          <div className="text-xs text-textSecondary">
                            Add "<span className="font-medium">{shipSearchTerm}</span>" as a new customer
                          </div>
                        )}
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Logo & Metadata */}
      <div className="w-full md:w-72 flex flex-col gap-4 md:gap-6">
        {/* Logo Upload / Display */}
        <LogoUpload logoUrl={businessProfile?.logoUrl} onClick={onLogoClick} />

        {/* Invoice Meta */}
        <div className="bg-bgPrimary/30 rounded-xl p-4 md:p-5 border border-transparent active:border-border md:hover:border-border transition-all space-y-3 md:space-y-4">
          <div>
            <label className="text-[11px] font-bold text-textSecondary uppercase tracking-wider mb-1.5 block">Invoice #</label>
            <div className="relative">
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => onInvoiceNumberChange(e.target.value)}
                placeholder="Auto-generated"
                className="w-full px-3 py-2.5 md:py-2 bg-white border border-border rounded-md text-sm font-semibold text-textPrimary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
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
              className="w-full px-3 py-2.5 md:py-2 bg-white border border-border rounded-md text-sm text-textPrimary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
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
                  className="w-full px-3 py-2.5 md:py-2 bg-white border border-border rounded-md text-sm text-textPrimary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-textSecondary uppercase tracking-wider mb-1.5 block">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => onDueDateChange(e.target.value)}
                  className="w-full px-3 py-2.5 md:py-2 bg-white border border-border rounded-md text-sm text-textPrimary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
