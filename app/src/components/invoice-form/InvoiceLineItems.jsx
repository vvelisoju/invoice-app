import { X, Plus, List, Loader2, PackagePlus, Percent, Check, Package } from 'lucide-react'
import { useState, useRef, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productApi, taxRateApi } from '../../lib/api'

function AutoResizeTextarea({ value, onChange, placeholder, className, onFocus, onBlur, onKeyDown, inputRef }) {
  const localRef = useRef(null)
  const ref = inputRef || localRef

  const handleInput = useCallback((e) => {
    onChange(e)
    if (ref.current) {
      ref.current.style.height = 'auto'
      ref.current.style.height = ref.current.scrollHeight + 'px'
    }
  }, [onChange, ref])

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      onChange={handleInput}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className={className}
    />
  )
}

function ProductTypeaheadInput({ value, onChange, onProductSelect, onCreateNew, placeholder }) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef(null)

  const { data: suggestions = [], isFetching, isFetched } = useQuery({
    queryKey: ['products', 'search', value],
    queryFn: async () => {
      if (!value || value.length < 1) return []
      try {
        const response = await productApi.search(value)
        return response.data || []
      } catch {
        return []
      }
    },
    enabled: value?.length >= 1 && showSuggestions
  })

  const showCreateNew = isFetched && !isFetching

  const handleChange = (e) => {
    onChange(e.target.value)
    setShowSuggestions(true)
    setHighlightedIndex(-1)
  }

  const handleSelect = (product) => {
    onProductSelect(product)
    setShowSuggestions(false)
    setHighlightedIndex(-1)
  }

  const handleCreateNew = () => {
    setShowSuggestions(false)
    onCreateNew(value)
  }

  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200)
  }

  const handleFocus = () => {
    if (value?.length >= 1) setShowSuggestions(true)
  }

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
        handleSelect(suggestions[highlightedIndex])
      } else if (showCreateNew && highlightedIndex === suggestions.length) {
        handleCreateNew()
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const formatRate = (rate) => {
    if (!rate) return null
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(rate)
  }

  return (
    <div className="relative flex-1">
      <AutoResizeTextarea
        inputRef={inputRef}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full bg-transparent border-none p-0 text-sm text-textPrimary placeholder-textSecondary/40 focus:ring-0 resize-none overflow-hidden h-6 leading-6 focus:outline-none"
      />

      {showSuggestions && value?.length >= 1 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-border rounded-xl shadow-lg overflow-hidden min-w-[280px]">
          {/* Loading */}
          {isFetching && (
            <div className="px-4 py-3 flex items-center gap-2 text-sm text-textSecondary">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              Searching products...
            </div>
          )}

          {/* Product suggestions */}
          {!isFetching && suggestions.length > 0 && (
            <div className="max-h-48 overflow-y-auto">
              {suggestions.map((product, index) => (
                <button
                  key={product.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(product)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`w-full px-4 py-2.5 text-left flex items-center gap-3 transition-colors border-b border-border/50 last:border-b-0 ${
                    highlightedIndex === index
                      ? 'bg-blue-50 text-primary'
                      : 'hover:bg-gray-50 text-textPrimary'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{product.name}</div>
                    <div className="text-xs text-textSecondary flex items-center gap-2">
                      {product.defaultRate && <span>{formatRate(product.defaultRate)}</span>}
                      {product.taxRate && <span className="text-orange-600">{Number(product.taxRate)}% tax</span>}
                      {product.unit && <span>{product.unit}</span>}
                    </div>
                  </div>
                  {product.defaultRate && (
                    <span className="text-xs font-semibold text-primary shrink-0">
                      {formatRate(product.defaultRate)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* No results — only after response */}
          {!isFetching && isFetched && suggestions.length === 0 && (
            <div className="px-4 py-3 text-sm text-textSecondary">
              No products found for "<span className="font-medium text-textPrimary">{value}</span>"
            </div>
          )}

          {/* Create New — only after response received */}
          {showCreateNew && (
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleCreateNew}
              onMouseEnter={() => setHighlightedIndex(suggestions.length)}
              className={`w-full px-4 py-2.5 text-left flex items-center gap-3 transition-colors border-t border-border ${
                highlightedIndex === suggestions.length
                  ? 'bg-green-50 text-green-700'
                  : 'hover:bg-green-50/50 text-green-600'
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                <PackagePlus className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">Create New Product</div>
                {value && (
                  <div className="text-xs text-textSecondary">
                    Add "<span className="font-medium">{value}</span>" as a new product
                  </div>
                )}
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function TaxRateModal({ isOpen, onClose, onSelect, taxRates, currentTaxRate }) {
  const queryClient = useQueryClient()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newRate, setNewRate] = useState('')
  const [newIsDefault, setNewIsDefault] = useState(false)
  const [error, setError] = useState('')

  const createMutation = useMutation({
    mutationFn: (data) => taxRateApi.create(data),
    onSuccess: (response) => {
      const created = response.data?.data || response.data
      queryClient.invalidateQueries({ queryKey: ['taxRates'] })
      onSelect(created)
      resetCreate()
      onClose()
    },
    onError: (err) => {
      setError(err.response?.data?.error?.message || 'Failed to create tax rate')
    }
  })

  const resetCreate = () => {
    setShowCreateForm(false)
    setNewName('')
    setNewRate('')
    setNewIsDefault(false)
    setError('')
  }

  const handleCreate = () => {
    if (!newName.trim()) { setError('Name is required'); return }
    if (!newRate || parseFloat(newRate) < 0) { setError('Valid rate is required'); return }
    createMutation.mutate({
      name: newName.trim(),
      rate: parseFloat(newRate),
      isDefault: newIsDefault
    })
  }

  const handleClose = () => {
    resetCreate()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <Percent className="w-4 h-4 text-orange-600" />
            </div>
            <h2 className="text-sm font-semibold text-textPrimary">Select Tax Rate</h2>
          </div>
          <button onClick={handleClose} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-textSecondary hover:text-textPrimary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tax rate list */}
        <div className="max-h-[280px] overflow-y-auto">
          {/* No Tax option */}
          <button
            onClick={() => { onSelect(null); handleClose() }}
            className={`w-full px-5 py-3 text-left flex items-center justify-between transition-colors border-b border-border/50 ${
              !currentTaxRate ? 'bg-blue-50/50' : 'hover:bg-gray-50'
            }`}
          >
            <span className="text-sm text-textSecondary">No Tax</span>
            {!currentTaxRate && <Check className="w-4 h-4 text-primary" />}
          </button>

          {taxRates.length === 0 && (
            <div className="px-5 py-6 text-center">
              <Percent className="w-6 h-6 text-gray-300 mx-auto mb-1.5" />
              <p className="text-sm text-textSecondary">No tax rates configured</p>
              <p className="text-xs text-textSecondary mt-0.5">Create one below</p>
            </div>
          )}

          {taxRates.map((tr) => (
            <button
              key={tr.id}
              onClick={() => { onSelect(tr); handleClose() }}
              className={`w-full px-5 py-3 text-left flex items-center justify-between transition-colors border-b border-border/50 last:border-b-0 ${
                currentTaxRate && Number(currentTaxRate) === Number(tr.rate)
                  ? 'bg-blue-50/50'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                  tr.isDefault ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {Number(tr.rate)}%
                </div>
                <div>
                  <div className="text-sm font-medium text-textPrimary">{tr.name}</div>
                  {tr.isDefault && (
                    <span className="text-[10px] font-semibold text-green-600 uppercase">Default</span>
                  )}
                </div>
              </div>
              {currentTaxRate && Number(currentTaxRate) === Number(tr.rate) && (
                <Check className="w-4 h-4 text-primary" />
              )}
            </button>
          ))}
        </div>

        {/* Create new section */}
        <div className="border-t border-border">
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full px-5 py-3 text-left flex items-center gap-2.5 text-primary hover:bg-blue-50/50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Create New Tax Rate</span>
            </button>
          ) : (
            <div className="p-4 space-y-3 bg-gray-50/50">
              {error && (
                <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => { setNewName(e.target.value); setError('') }}
                  placeholder="e.g., GST 18%"
                  autoFocus
                  className="px-3 py-2 bg-white border border-border rounded-lg text-sm text-textPrimary placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={newRate}
                  onChange={(e) => { setNewRate(e.target.value); setError('') }}
                  placeholder="Rate %"
                  className="px-3 py-2 bg-white border border-border rounded-lg text-sm text-textPrimary placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newIsDefault}
                  onChange={(e) => setNewIsDefault(e.target.checked)}
                  className="w-3.5 h-3.5 text-primary rounded border-gray-300 focus:ring-primary/20"
                />
                <span className="text-xs text-textSecondary">Set as default for new items</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-primary hover:bg-primaryHover rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-60"
                >
                  {createMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Add & Select
                </button>
                <button
                  onClick={resetCreate}
                  className="px-3.5 py-2 text-xs font-medium text-textSecondary hover:text-textPrimary hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TaxButton({ item, index, onUpdate, taxRates }) {
  const [showModal, setShowModal] = useState(false)

  const handleSelect = (taxRate) => {
    onUpdate(index, 'taxRate', taxRate ? Number(taxRate.rate) : null)
    onUpdate(index, 'taxRateName', taxRate ? taxRate.name : null)
  }

  const label = item.taxRate
    ? `${Number(item.taxRate)}%${item.taxRateName ? ' ' + item.taxRateName : ''}`
    : '+ Tax'

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`flex-1 text-xs font-medium py-1.5 px-2 rounded border transition-colors truncate ${
          item.taxRate
            ? 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200/50'
            : 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200/50'
        }`}
        title={label}
      >
        {label}
      </button>
      <TaxRateModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSelect={handleSelect}
        taxRates={taxRates}
        currentTaxRate={item.taxRate}
      />
    </>
  )
}

function BasicLineItem({ item, index, onUpdate, onRemove, canRemove, onProductSelect, onCreateProduct, taxRates }) {
  return (
    <div className="group relative bg-white border border-transparent hover:border-border hover:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_2px_4px_-1px_rgba(0,0,0,0.02)] rounded-lg transition-all p-1 -mx-1">
      <div className="grid grid-cols-12 gap-4 items-start p-3">
        {/* Description — Product Typeahead */}
        <div className="col-span-6 md:col-span-7">
          <ProductTypeaheadInput
            value={item.name}
            onChange={(val) => onUpdate(index, 'name', val)}
            onProductSelect={(product) => onProductSelect(index, product)}
            onCreateNew={(name) => onCreateProduct(index, name)}
            placeholder="Description"
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
          <TaxButton item={item} index={index} onUpdate={onUpdate} taxRates={taxRates} />
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

function AdvancedLineItem({ item, index, onUpdate, onRemove, canRemove, onProductSelect, onCreateProduct, taxRates }) {
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
        {/* Description — Product Typeahead */}
        <div className="col-span-5">
          <ProductTypeaheadInput
            value={item.name}
            onChange={(val) => onUpdate(index, 'name', val)}
            onProductSelect={(product) => onProductSelect(index, product)}
            onCreateNew={(name) => onCreateProduct(index, name)}
            placeholder="Description"
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
          <TaxButton item={item} index={index} onUpdate={onUpdate} taxRates={taxRates} />
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

function SavedItemsModal({ isOpen, onClose, onSelect }) {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', 'recent'],
    queryFn: async () => {
      const response = await productApi.list({ limit: 20 })
      const data = response.data?.data || response.data
      return data?.products || data || []
    },
    enabled: isOpen
  })

  const formatRate = (rate) => {
    if (!rate) return null
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(rate)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center">
              <Package className="w-4 h-4 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-textPrimary">Saved Items</h2>
              <p className="text-xs text-textSecondary">Select a product to add as a line item</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-textSecondary hover:text-textPrimary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Product list */}
        <div className="max-h-[360px] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-10">
              <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-textSecondary">No saved products yet</p>
            </div>
          ) : (
            products.map((product) => (
              <button
                key={product.id}
                onClick={() => { onSelect(product); onClose() }}
                className="w-full px-5 py-3 text-left flex items-center gap-3 hover:bg-blue-50/50 transition-colors border-b border-border/50 last:border-b-0"
              >
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                  {product.name?.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-textPrimary truncate">{product.name}</div>
                  <div className="text-xs text-textSecondary flex items-center gap-2">
                    {product.defaultRate && <span>{formatRate(product.defaultRate)}</span>}
                    {product.taxRate && <span className="text-orange-600">{Number(product.taxRate)}%</span>}
                    {product.unit && <span>{product.unit}</span>}
                  </div>
                </div>
                {product.defaultRate && (
                  <span className="text-xs font-semibold text-primary shrink-0">
                    {formatRate(product.defaultRate)}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default function InvoiceLineItems({ formMode, lineItems, onUpdateItem, onAddItem, onRemoveItem, onProductSelect, onCreateProduct }) {
  const isAdvanced = formMode === 'advanced'
  const [showSavedItems, setShowSavedItems] = useState(false)

  const { data: taxRates = [] } = useQuery({
    queryKey: ['taxRates'],
    queryFn: async () => {
      const response = await taxRateApi.list()
      return response.data?.data || response.data || []
    }
  })

  return (
    <div className="mb-6">
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
              onProductSelect={onProductSelect}
              onCreateProduct={onCreateProduct}
              taxRates={taxRates}
            />
          ) : (
            <BasicLineItem
              key={item.id}
              item={item}
              index={index}
              onUpdate={onUpdateItem}
              onRemove={onRemoveItem}
              canRemove={lineItems.length > 1}
              onProductSelect={onProductSelect}
              onCreateProduct={onCreateProduct}
              taxRates={taxRates}
            />
          )
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-5">
        <button
          onClick={() => setShowSavedItems(true)}
          className="flex-1 py-2.5 border border-dashed border-yellow-300 bg-yellow-50/30 text-yellow-800 hover:bg-yellow-50 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
        >
          <List className="w-4 h-4" /> Add Saved Items
        </button>
        <button
          onClick={onAddItem}
          className="flex-1 py-2.5 border border-dashed border-yellow-300 bg-yellow-50/50 text-yellow-800 hover:bg-yellow-50 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add New Item
        </button>
      </div>

      {/* Saved Items Modal */}
      <SavedItemsModal
        isOpen={showSavedItems}
        onClose={() => setShowSavedItems(false)}
        onSelect={(product) => {
          // Add a new line item, then populate it with the selected product
          onAddItem()
          // Use setTimeout to ensure the new item is added before populating
          setTimeout(() => {
            onProductSelect(lineItems.length, product)
          }, 0)
        }}
      />
    </div>
  )
}
