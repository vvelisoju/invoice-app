import { useState, useEffect, useRef } from 'react'
import { X, Loader2, PackagePlus, ChevronDown } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { productApi, taxRateApi } from '../../lib/api'

const EMPTY_FORM = { name: '', defaultRate: '', unit: '', taxRate: '' }

/**
 * Unified product add/edit modal used in both ProductListPage and NewInvoicePage.
 *
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - product?: object          — if provided, modal is in edit mode
 * - initialName?: string      — pre-fill name (used when creating from invoice page)
 * - onSuccess?: () => void    — called after successful create/update (product list page)
 * - onCreated?: (product) => void — called with newly created/updated product object (invoice page)
 */
export default function ProductAddEditModal({
  isOpen,
  onClose,
  product = null,
  initialName = '',
  onSuccess,
  onCreated
}) {
  const queryClient = useQueryClient()
  const isEdit = !!product
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})

  // Unit combobox state
  const [unitInputValue, setUnitInputValue] = useState('')
  const [showUnitDropdown, setShowUnitDropdown] = useState(false)
  const unitInputRef = useRef(null)
  const unitDropdownRef = useRef(null)

  // Fetch business units (distinct units from existing products)
  const { data: businessUnits = [] } = useQuery({
    queryKey: ['product-units'],
    queryFn: async () => {
      const response = await productApi.listUnits()
      return response.data?.data || response.data || []
    },
    enabled: isOpen
  })

  // Fetch tax rates for the select dropdown
  const { data: taxRates = [] } = useQuery({
    queryKey: ['taxRates'],
    queryFn: async () => {
      const response = await taxRateApi.list()
      return response.data?.data || response.data || []
    },
    enabled: isOpen
  })

  // Filtered unit suggestions based on typed input
  const filteredUnits = unitInputValue
    ? businessUnits.filter(u => u.toLowerCase().includes(unitInputValue.toLowerCase()))
    : businessUnits

  useEffect(() => {
    if (isOpen) {
      if (product) {
        setForm({
          name: product.name || '',
          defaultRate: product.defaultRate != null ? String(product.defaultRate) : '',
          unit: product.unit || '',
          taxRate: product.taxRate != null ? String(product.taxRate) : '',
        })
        setUnitInputValue(product.unit || '')
      } else {
        setForm({ ...EMPTY_FORM, name: initialName || '' })
        setUnitInputValue('')
      }
      setErrors({})
    }
  }, [isOpen, product, initialName])

  // Sync initialName when modal is already open but name changes
  useEffect(() => {
    if (isOpen && !product && initialName && !form.name) {
      setForm(prev => ({ ...prev, name: initialName }))
    }
  }, [initialName, isOpen, product, form.name])

  // Close unit dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (
        unitDropdownRef.current && !unitDropdownRef.current.contains(e.target) &&
        unitInputRef.current && !unitInputRef.current.contains(e.target)
      ) {
        setShowUnitDropdown(false)
      }
    }
    if (showUnitDropdown) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showUnitDropdown])

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (isEdit) {
        return productApi.update(product.id, data)
      }
      return productApi.create(data)
    },
    onSuccess: (response) => {
      const created = response.data?.data || response.data
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product-units'] })
      onCreated?.(created)
      onSuccess?.()
      onClose()
    }
  })

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Product name is required'
    if (form.defaultRate && isNaN(Number(form.defaultRate))) e.defaultRate = 'Enter a valid number'
    if (form.defaultRate && Number(form.defaultRate) < 0) e.defaultRate = 'Rate cannot be negative'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    const payload = {
      name: form.name.trim(),
      defaultRate: form.defaultRate ? Number(form.defaultRate) : null,
      unit: form.unit || null,
      taxRate: form.taxRate ? Number(form.taxRate) : null,
    }
    mutation.mutate(payload)
  }

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const handleUnitInputChange = (val) => {
    setUnitInputValue(val)
    updateField('unit', val)
    setShowUnitDropdown(true)
  }

  const handleUnitSelect = (unit) => {
    setUnitInputValue(unit)
    updateField('unit', unit)
    setShowUnitDropdown(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center">
              <PackagePlus className="w-4.5 h-4.5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-textPrimary">
                {isEdit ? 'Edit Product / Service' : 'New Product / Service'}
              </h2>
              <p className="text-xs text-textSecondary">
                {isEdit ? 'Update item details' : 'Add a new item to your catalog'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-textSecondary hover:text-textPrimary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error banner */}
          {mutation.isError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {mutation.error?.response?.data?.error?.message || mutation.error?.message || 'Something went wrong'}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-textSecondary mb-1.5 ml-0.5">
              Product / Service Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="e.g., Web Design, Consulting"
              autoFocus
              className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-sm text-textPrimary placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all ${
                errors.name ? 'border-red-300' : 'border-border'
              }`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Rate + Tax Rate row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1.5 ml-0.5">
                Default Rate (₹)
              </label>
              <input
                type="text"
                value={form.defaultRate}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) updateField('defaultRate', val)
                }}
                placeholder="0.00"
                className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-sm text-textPrimary placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all ${
                  errors.defaultRate ? 'border-red-300' : 'border-border'
                }`}
              />
              {errors.defaultRate && <p className="text-xs text-red-500 mt-1">{errors.defaultRate}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1.5 ml-0.5">
                Tax Rate
              </label>
              <select
                value={form.taxRate}
                onChange={(e) => updateField('taxRate', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-border rounded-lg text-sm text-textPrimary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              >
                <option value="">No Tax</option>
                {taxRates.map((tr) => (
                  <option key={tr.id} value={Number(tr.rate)}>
                    {tr.name} ({Number(tr.rate)}%)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Unit — commented out: units can be handled via product name/description
          <div>
            <label className="block text-xs font-medium text-textSecondary mb-1.5 ml-0.5">
              Unit
            </label>
            <div className="relative">
              <input
                ref={unitInputRef}
                type="text"
                value={unitInputValue}
                onChange={(e) => handleUnitInputChange(e.target.value)}
                onFocus={() => setShowUnitDropdown(true)}
                placeholder="Type or select a unit (e.g., hour, kg)"
                className="w-full px-3.5 py-2.5 pr-8 bg-white border border-border rounded-lg text-sm text-textPrimary placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => { unitInputRef.current?.focus(); setShowUnitDropdown(v => !v) }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <ChevronDown className="w-4 h-4" />
              </button>

              {showUnitDropdown && filteredUnits.length > 0 && (
                <div
                  ref={unitDropdownRef}
                  className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto"
                >
                  {filteredUnits.map((u) => (
                    <button
                      key={u}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleUnitSelect(u)}
                      className={`w-full px-3.5 py-2 text-left text-sm transition-colors border-b border-border/30 last:border-b-0 ${
                        form.unit === u
                          ? 'bg-blue-50 text-primary font-medium'
                          : 'text-textPrimary hover:bg-gray-50'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              )}

              {showUnitDropdown && unitInputValue && !businessUnits.includes(unitInputValue) && (
                <div
                  ref={!filteredUnits.length ? unitDropdownRef : undefined}
                  className={`${filteredUnits.length ? '' : 'absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg'}`}
                >
                  {!filteredUnits.length && (
                    <div className="px-3.5 py-2 text-xs text-textSecondary">
                      New unit "<span className="font-medium text-textPrimary">{unitInputValue}</span>" will be saved for future use
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          */}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-textSecondary hover:text-textPrimary hover:bg-gray-50 rounded-lg transition-colors border border-border"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primaryHover rounded-lg transition-colors shadow-sm flex items-center gap-2 disabled:opacity-60"
            >
              {mutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <PackagePlus className="w-4 h-4" />
              )}
              {isEdit ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
