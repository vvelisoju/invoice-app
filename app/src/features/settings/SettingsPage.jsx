import { useState } from 'react'
import { useHistory } from 'react-router-dom'
import {
  Building2,
  Receipt,
  CreditCard,
  FileText,
  Palette,
  LogOut,
  ChevronDown,
  Save,
  Loader2
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { businessApi, plansApi } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import { PageHeader } from '../../components/layout'
import PlanUsageCard from '../../components/PlanUsageCard'
import UpgradePrompt from '../../components/UpgradePrompt'

function SettingsSection({ icon: Icon, title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-bgSecondary rounded-xl border border-border shadow-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-4 flex items-center gap-3 hover:bg-bgPrimary/30 transition-colors"
      >
        <Icon className="w-5 h-5 text-textSecondary" />
        <span className="text-sm font-semibold text-textPrimary flex-1 text-left">{title}</span>
        <ChevronDown className={`w-4 h-4 text-textSecondary transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-6 pb-6 pt-2">{children}</div>}
    </div>
  )
}

function FieldInput({ label, type = 'text', value, onChange, placeholder, maxLength }) {
  return (
    <div>
      <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5 block">{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full px-3 py-2 bg-bgPrimary border border-border rounded-lg text-sm text-textPrimary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
      />
    </div>
  )
}

function FieldTextarea({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <div>
      <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5 block">{label}</label>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 bg-bgPrimary border border-border rounded-lg text-sm text-textPrimary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none"
      />
    </div>
  )
}

function FieldToggle({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-textPrimary">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-gray-300'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const history = useHistory()
  const queryClient = useQueryClient()
  const logout = useAuthStore((state) => state.logout)
  const [formData, setFormData] = useState({})
  const [isDirty, setIsDirty] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)

  const { data: planUsage } = useQuery({
    queryKey: ['plans', 'usage'],
    queryFn: async () => {
      const response = await plansApi.getUsage()
      return response.data.data || response.data
    }
  })

  const { data: business, isLoading } = useQuery({
    queryKey: ['business'],
    queryFn: async () => {
      const response = await businessApi.getProfile()
      setFormData(response.data.data || response.data)
      return response.data.data || response.data
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data) => businessApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['business'])
      setIsDirty(false)
    }
  })

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }

  const handleSave = () => updateMutation.mutate(formData)

  const handleLogout = () => {
    logout()
    history.replace('/auth/phone')
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <PageHeader
        title="Settings"
        actions={
          isDirty ? (
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="px-5 py-2 bg-primary hover:bg-primaryHover text-white rounded-lg transition-all font-medium text-sm shadow-sm flex items-center gap-2 disabled:opacity-60"
            >
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          ) : null
        }
      />

      <div className="space-y-4">
        {/* Plan Usage */}
        <PlanUsageCard usage={planUsage} onUpgradeClick={() => setShowUpgrade(true)} />

        {/* Template Link */}
        <button
          onClick={() => history.push('/templates')}
          className="w-full bg-bgSecondary rounded-xl border border-border shadow-card px-6 py-4 flex items-center gap-3 hover:bg-bgPrimary/30 transition-colors text-left"
        >
          <Palette className="w-5 h-5 text-primary" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-textPrimary">Invoice Template</div>
            <div className="text-xs text-textSecondary">Customize colors, layout, and labels</div>
          </div>
          <ChevronDown className="w-4 h-4 text-textSecondary -rotate-90" />
        </button>

        {/* Business Info */}
        <SettingsSection icon={Building2} title="Business Information" defaultOpen={true}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldInput label="Business Name" value={formData.name} onChange={(v) => handleChange('name', v)} placeholder="Your business name" />
            <FieldInput label="Phone" type="tel" value={formData.phone} onChange={(v) => handleChange('phone', v)} placeholder="Business phone number" />
            <FieldInput label="Email" type="email" value={formData.email} onChange={(v) => handleChange('email', v)} placeholder="Business email" />
            <div className="md:col-span-2">
              <FieldTextarea label="Address" value={formData.address} onChange={(v) => handleChange('address', v)} placeholder="Business address" />
            </div>
          </div>
        </SettingsSection>

        {/* GST Settings */}
        <SettingsSection icon={Receipt} title="GST Settings">
          <div className="space-y-4">
            <FieldToggle label="Enable GST" checked={formData.gstEnabled || false} onChange={(v) => handleChange('gstEnabled', v)} />
            {formData.gstEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FieldInput label="GSTIN" value={formData.gstin} onChange={(v) => handleChange('gstin', v?.toUpperCase())} placeholder="15-digit GSTIN" maxLength={15} />
                <FieldInput label="State Code" value={formData.stateCode} onChange={(v) => handleChange('stateCode', v)} placeholder="e.g., MH, KA, DL" maxLength={2} />
                <FieldInput label="Default Tax Rate (%)" type="number" value={formData.defaultTaxRate} onChange={(v) => handleChange('defaultTaxRate', parseFloat(v) || null)} placeholder="e.g., 18" />
              </div>
            )}
          </div>
        </SettingsSection>

        {/* Bank Details */}
        <SettingsSection icon={CreditCard} title="Bank & Payment Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldInput label="Bank Name" value={formData.bankName} onChange={(v) => handleChange('bankName', v)} placeholder="Bank name" />
            <FieldInput label="Account Number" value={formData.accountNumber} onChange={(v) => handleChange('accountNumber', v)} placeholder="Account number" />
            <FieldInput label="IFSC Code" value={formData.ifscCode} onChange={(v) => handleChange('ifscCode', v?.toUpperCase())} placeholder="IFSC code" maxLength={11} />
            <FieldInput label="UPI ID" value={formData.upiId} onChange={(v) => handleChange('upiId', v)} placeholder="yourname@upi" />
          </div>
        </SettingsSection>

        {/* Invoice Defaults */}
        <SettingsSection icon={FileText} title="Invoice Defaults">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldInput label="Invoice Prefix" value={formData.invoicePrefix} onChange={(v) => handleChange('invoicePrefix', v)} placeholder="e.g., INV-" maxLength={10} />
            <FieldInput label="Next Invoice Number" type="number" value={formData.nextInvoiceNumber} onChange={(v) => handleChange('nextInvoiceNumber', parseInt(v) || null)} placeholder="e.g., 1" />
            <div className="md:col-span-2">
              <FieldTextarea label="Default Notes" value={formData.defaultNotes} onChange={(v) => handleChange('defaultNotes', v)} placeholder="Notes to appear on every invoice" />
            </div>
            <div className="md:col-span-2">
              <FieldTextarea label="Default Terms" value={formData.defaultTerms} onChange={(v) => handleChange('defaultTerms', v)} placeholder="Terms & conditions" />
            </div>
          </div>
        </SettingsSection>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full py-3 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      {/* Upgrade Prompt Modal */}
      <UpgradePrompt
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        usage={planUsage}
      />
    </div>
  )
}
