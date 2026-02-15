import { useState, useEffect } from 'react'
import { X, Building2, Save, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { businessApi } from '../../lib/api'
import BusinessInfoForm from './BusinessInfoForm'
import Portal from '../Portal'

export default function BusinessSettingsModal({ isOpen, onClose }) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({})
  const [isDirty, setIsDirty] = useState(false)
  const [saveError, setSaveError] = useState('')

  const { data: business, isLoading } = useQuery({
    queryKey: ['business'],
    queryFn: async () => {
      const response = await businessApi.getProfile()
      return response.data?.data || response.data
    },
    enabled: isOpen
  })

  useEffect(() => {
    if (business && isOpen) {
      setFormData({ ...business })
      setIsDirty(false)
      setSaveError('')
    }
  }, [business, isOpen])

  const updateMutation = useMutation({
    mutationFn: (data) => businessApi.updateBusinessInfo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business'] })
      setIsDirty(false)
      setSaveError('')
      setTimeout(() => onClose(), 600)
    },
    onError: (err) => {
      setSaveError(err?.response?.data?.error?.message || err?.message || 'Failed to save. Please try again.')
    }
  })

  const handleFormChange = (newData) => {
    setFormData(newData)
    setIsDirty(true)
    setSaveError('')
  }

  const handleSave = () => {
    const { name, phone, email, website, address, logoUrl } = formData
    updateMutation.mutate({ name, phone, email, website, address, logoUrl })
  }

  if (!isOpen) return null

  return (
    <Portal>
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-textPrimary">Business Settings</h2>
              <p className="text-[11px] text-textSecondary">Edit your business details</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-lg active:bg-gray-100 md:hover:bg-gray-100 flex items-center justify-center text-textSecondary active:text-textPrimary md:hover:text-textPrimary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : (
            <BusinessInfoForm formData={formData} onChange={handleFormChange} compact />
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-border shrink-0">
          {saveError && (
            <div className="flex items-start gap-2 mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
              <p className="text-xs text-red-700">{saveError}</p>
            </div>
          )}
          <div className="flex items-center justify-end gap-2">
          {updateMutation.isSuccess && !isDirty && !saveError && (
            <span className="text-xs text-green-600 flex items-center gap-1 font-medium mr-auto">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved
            </span>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-textSecondary active:bg-gray-100 md:hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isDirty || updateMutation.isPending}
            className="px-4 py-2 text-sm font-semibold text-white bg-primary active:bg-primaryHover md:hover:bg-primaryHover rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-60"
          >
            {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Changes
          </button>
        </div>
      </div>
      </div>
    </div>
    </Portal>
  )
}
