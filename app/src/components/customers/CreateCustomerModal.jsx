import { useState } from 'react'
import { X, Loader2, UserPlus } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { customerApi } from '../../lib/api'
import Portal from '../Portal'

/**
 * Reusable modal for creating a new customer.
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - onCreated: (customer) => void — called with the newly created customer
 * - initialName?: string — pre-fill the name field
 */
export default function CreateCustomerModal({ isOpen, onClose, onCreated, initialName = '' }) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    name: initialName,
    phone: '',
    email: '',
    gstin: '',
    stateCode: '',
    address: ''
  })
  const [error, setError] = useState('')

  const createMutation = useMutation({
    mutationFn: (data) => customerApi.create(data),
    onSuccess: (response) => {
      const customer = response.data?.data || response.data
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      onCreated?.(customer)
      handleClose()
    },
    onError: (err) => {
      setError(err.response?.data?.error?.message || 'Failed to create customer')
    }
  })

  const handleClose = () => {
    setFormData({ name: '', phone: '', email: '', gstin: '', stateCode: '', address: '' })
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
    createMutation.mutate(payload)
  }

  // Sync initialName when modal opens
  if (isOpen && initialName && !formData.name && initialName !== formData.name) {
    setFormData(prev => ({ ...prev, name: initialName }))
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
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <UserPlus className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-textPrimary">New Customer</h2>
              <p className="text-xs text-textSecondary">Add a new customer to your business</p>
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
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
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
              disabled={createMutation.isPending}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-primary active:bg-primaryHover md:hover:bg-primaryHover rounded-lg transition-colors shadow-sm flex items-center gap-2 disabled:opacity-60"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              Create Customer
            </button>
          </div>
        </form>
      </div>
    </div>
    </Portal>
  )
}
