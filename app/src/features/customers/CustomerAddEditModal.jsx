import { useState, useEffect } from 'react'
import { X, Loader2, User, Phone, Mail, MapPin, FileText, Hash, Trash2, AlertTriangle } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { customerApi } from '../../lib/api'
import Portal from '../../components/Portal'
import PlanLimitModal from '../../components/PlanLimitModal'

const INDIAN_STATES = [
  { code: '01', name: 'Jammu & Kashmir' }, { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' }, { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' }, { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' }, { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' }, { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' }, { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' }, { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' }, { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' }, { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' }, { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' }, { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' }, { code: '24', name: 'Gujarat' },
  { code: '27', name: 'Maharashtra' }, { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' }, { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' }, { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh' },
]

const EMPTY_FORM = { name: '', phone: '', email: '', gstin: '', stateCode: '', address: '' }

export default function CustomerAddEditModal({ isOpen, onClose, customer = null, onSuccess, onDelete }) {
  const queryClient = useQueryClient()
  const isEdit = !!customer
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [planLimitData, setPlanLimitData] = useState(null)

  const deleteMutation = useMutation({
    mutationFn: () => customerApi.delete(customer.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      setShowDeleteConfirm(false)
      onDelete?.()
      onClose()
    }
  })

  useEffect(() => {
    if (isOpen) {
      if (customer) {
        setForm({
          name: customer.name || '',
          phone: customer.phone || '',
          email: customer.email || '',
          gstin: customer.gstin || '',
          stateCode: customer.stateCode || '',
          address: customer.address || '',
        })
      } else {
        setForm(EMPTY_FORM)
      }
      setErrors({})
      setShowDeleteConfirm(false)
      deleteMutation.reset()
    }
  }, [isOpen, customer])

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (isEdit) {
        return customerApi.update(customer.id, data)
      }
      return customerApi.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      onSuccess?.()
      onClose()
    },
    onError: (err) => {
      const errorData = err.response?.data?.error
      if (errorData?.code === 'PLAN_LIMIT_REACHED' || errorData?.details?.code === 'PLAN_LIMIT_REACHED') {
        const usagePayload = errorData.details?.usage || errorData.usage
        setPlanLimitData(usagePayload)
        onClose()
        return
      }
      setErrors({ submit: errorData?.message || (isEdit ? 'Failed to update customer' : 'Failed to create customer') })
    }
  })

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Customer name is required'
    if (form.phone && !/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Enter valid 10-digit phone'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter valid email'
    if (form.gstin && form.gstin.length !== 15) e.gstin = 'GSTIN must be 15 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    const payload = {
      name: form.name.trim(),
      phone: form.phone || null,
      email: form.email || null,
      gstin: form.gstin || null,
      stateCode: form.stateCode || null,
      address: form.address || null,
    }
    mutation.mutate(payload)
  }

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  if (!isOpen) return null

  return (
    <Portal>
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-textPrimary">
              {isEdit ? 'Edit Customer' : 'Add Customer'}
            </h2>
            <p className="text-xs text-textSecondary mt-0.5">
              {isEdit ? 'Update customer details' : 'Fill in customer details to create a new entry'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Name */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-textPrimary mb-1.5">
              <User className="w-3.5 h-3.5 text-gray-400" />
              Customer Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="e.g. Acme Corporation"
              className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-1 transition-colors ${
                errors.name ? 'border-red-300 focus:ring-red-400 focus:border-red-400' : 'border-border focus:ring-primary focus:border-primary'
              }`}
              autoFocus
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Phone + Email row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-textPrimary mb-1.5">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                Phone
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="9876543210"
                className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-1 transition-colors ${
                  errors.phone ? 'border-red-300 focus:ring-red-400 focus:border-red-400' : 'border-border focus:ring-primary focus:border-primary'
                }`}
              />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-textPrimary mb-1.5">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="customer@example.com"
                className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-1 transition-colors ${
                  errors.email ? 'border-red-300 focus:ring-red-400 focus:border-red-400' : 'border-border focus:ring-primary focus:border-primary'
                }`}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>
          </div>

          {/* GSTIN + State row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-textPrimary mb-1.5">
                <Hash className="w-3.5 h-3.5 text-gray-400" />
                GSTIN
              </label>
              <input
                type="text"
                value={form.gstin}
                onChange={(e) => updateField('gstin', e.target.value.toUpperCase().slice(0, 15))}
                placeholder="22AAAAA0000A1Z5"
                className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-1 transition-colors font-mono ${
                  errors.gstin ? 'border-red-300 focus:ring-red-400 focus:border-red-400' : 'border-border focus:ring-primary focus:border-primary'
                }`}
              />
              {errors.gstin && <p className="text-xs text-red-500 mt-1">{errors.gstin}</p>}
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-textPrimary mb-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                State
              </label>
              <select
                value={form.stateCode}
                onChange={(e) => updateField('stateCode', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors bg-white"
              >
                <option value="">Select State</option>
                {INDIAN_STATES.map(s => (
                  <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-textPrimary mb-1.5">
              <FileText className="w-3.5 h-3.5 text-gray-400" />
              Address
            </label>
            <textarea
              value={form.address}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="Full billing address..."
              rows={3}
              className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors resize-none"
            />
          </div>

          {/* Error banner */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}
        </form>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="px-6 py-3 bg-red-50 border-t border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <p className="text-sm font-medium text-red-700">Delete this customer?</p>
            </div>
            <p className="text-xs text-red-600 mb-3">This action cannot be undone.</p>
            {deleteMutation.isError && (
              <p className="text-xs text-red-600 mb-2">
                {deleteMutation.error?.response?.data?.error?.message || 'Cannot delete. Customer may have existing invoices.'}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowDeleteConfirm(false); deleteMutation.reset() }}
                className="flex-1 px-3 py-1.5 text-xs font-medium text-textSecondary bg-white border border-border rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {deleteMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                {deleteMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-gray-50/50">
          <div>
            {isEdit && !showDeleteConfirm && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-2 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-textSecondary hover:text-textPrimary hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={mutation.isPending}
              className="px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-primaryHover rounded-lg transition-colors flex items-center gap-2 disabled:opacity-60 shadow-sm"
            >
              {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Add Customer'}
            </button>
          </div>
        </div>
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
