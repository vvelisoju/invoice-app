import { useState, useEffect } from 'react'
import { X, Loader2, UserPlus, Pencil } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { customerApi } from '../../lib/api'
import Portal from '../Portal'
import PlanLimitModal from '../PlanLimitModal'
import { addDemoCustomer } from '../../lib/demoStorage'

const EMPTY_FORM = { name: '', phone: '', email: '', gstin: '', stateCode: '', address: '' }

/**
 * Reusable modal for creating or editing a customer.
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - onCreated: (customer) => void — called with the newly created/updated customer
 * - customer?: object — if provided, modal is in edit mode
 * - initialName?: string — pre-fill the name field (create mode only)
 */
export default function CreateCustomerModal({ isOpen, onClose, onCreated, customer = null, initialName = '', demoMode }) {
  const queryClient = useQueryClient()
  const isEdit = !!customer
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [planLimitData, setPlanLimitData] = useState(null)

  useEffect(() => {
    if (isOpen) {
      if (customer) {
        setFormData({
          name: customer.name || '',
          phone: customer.phone || '',
          email: customer.email || '',
          gstin: customer.gstin || '',
          stateCode: customer.stateCode || '',
          address: customer.address || '',
        })
      } else {
        setFormData({ ...EMPTY_FORM, name: initialName || '' })
      }
      setError('')
    }
  }, [isOpen, customer, initialName])

  const mutation = useMutation({
    mutationFn: (data) => {
      if (isEdit) return customerApi.update(customer.id, data)
      return customerApi.create(data)
    },
    onSuccess: (response) => {
      const result = response.data?.data || response.data
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      onCreated?.(result)
      handleClose()
    },
    onError: (err) => {
      const errorData = err.response?.data?.error
      if (errorData?.code === 'PLAN_LIMIT_REACHED' || errorData?.details?.code === 'PLAN_LIMIT_REACHED') {
        setPlanLimitData(errorData.details?.usage || errorData.usage)
        onClose()
        return
      }
      setError(errorData?.message || (isEdit ? 'Failed to update customer' : 'Failed to create customer'))
    }
  })

  const handleClose = () => {
    setFormData(EMPTY_FORM)
    setError('')
    onClose()
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setError('Customer name is required')
      return
    }
    const payload = {
      name: formData.name.trim(),
      ...(formData.phone && { phone: formData.phone.trim() }),
      ...(formData.email && { email: formData.email.trim() }),
      ...(formData.gstin && { gstin: formData.gstin.trim().toUpperCase() }),
      ...(formData.stateCode && { stateCode: formData.stateCode.trim() }),
      ...(formData.address && { address: formData.address.trim() })
    }
    if (demoMode) {
      const result = addDemoCustomer(payload)
      onCreated?.(result)
      handleClose()
      return
    }
    mutation.mutate(payload)
  }

  if (!isOpen) return null

  return (
    <Portal>
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isEdit ? 'bg-orange-50' : 'bg-blue-50'}`}>
              {isEdit ? <Pencil className="w-4.5 h-4.5 text-orange-600" /> : <UserPlus className="w-4.5 h-4.5 text-primary" />}
            </div>
            <div>
              <h2 className="text-base font-semibold text-textPrimary">{isEdit ? 'Edit Customer' : 'New Customer'}</h2>
              <p className="text-xs text-textSecondary">{isEdit ? 'Update customer details' : 'Add a new customer to your business'}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-lg active:bg-gray-100 md:hover:bg-gray-100 flex items-center justify-center text-textSecondary active:text-textPrimary md:hover:text-textPrimary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {(error || mutation.isError) && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error || mutation.error?.response?.data?.error?.message || mutation.error?.message || 'Something went wrong'}
            </div>
          )}

          {/* Name (required) */}
          <div>
            <label className="block text-xs font-medium text-textSecondary mb-1.5 ml-0.5">
              Customer Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter customer name"
              autoFocus
              className="w-full px-3.5 py-2.5 bg-white border border-border rounded-lg text-sm text-textPrimary placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1.5 ml-0.5">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="Phone number"
                className="w-full px-3.5 py-2.5 bg-white border border-border rounded-lg text-sm text-textPrimary placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1.5 ml-0.5">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Email address"
                className="w-full px-3.5 py-2.5 bg-white border border-border rounded-lg text-sm text-textPrimary placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
          </div>

          {/* GSTIN & State Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1.5 ml-0.5">GSTIN</label>
              <input
                type="text"
                value={formData.gstin}
                onChange={(e) => handleChange('gstin', e.target.value)}
                placeholder="15-digit GSTIN"
                maxLength={15}
                className="w-full px-3.5 py-2.5 bg-white border border-border rounded-lg text-sm text-textPrimary placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1.5 ml-0.5">State Code</label>
              <input
                type="text"
                value={formData.stateCode}
                onChange={(e) => handleChange('stateCode', e.target.value)}
                placeholder="e.g., 36"
                maxLength={2}
                className="w-full px-3.5 py-2.5 bg-white border border-border rounded-lg text-sm text-textPrimary placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-medium text-textSecondary mb-1.5 ml-0.5">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Customer address"
              rows={2}
              className="w-full px-3.5 py-2.5 bg-white border border-border rounded-lg text-sm text-textPrimary placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 text-sm font-medium text-textSecondary active:text-textPrimary md:hover:text-textPrimary active:bg-gray-50 md:hover:bg-gray-50 rounded-lg transition-colors border border-border"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-primary active:bg-primaryHover md:hover:bg-primaryHover rounded-lg transition-colors shadow-sm flex items-center gap-2 disabled:opacity-60"
            >
              {mutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isEdit ? (
                <Pencil className="w-4 h-4" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {isEdit ? 'Save Changes' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
    {/* Plan Limit Modal */}
    <PlanLimitModal
      isOpen={!!planLimitData}
      onClose={() => setPlanLimitData(null)}
      resourceType="customer"
      usage={planLimitData}
    />
    </Portal>
  )
}
