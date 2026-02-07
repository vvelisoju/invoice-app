import { useState, useEffect } from 'react'
import {
  Palette,
  Image,
  Building2,
  User,
  Calculator,
  FileText,
  Type,
  ChevronDown,
  Save,
  Loader2
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { templateApi } from '../../lib/api'
import { PageHeader } from '../../components/layout'

function EditorSection({ icon: Icon, title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-bgSecondary rounded-xl border border-border shadow-card overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full px-6 py-4 flex items-center gap-3 hover:bg-bgPrimary/30 transition-colors">
        <Icon className="w-5 h-5 text-textSecondary" />
        <span className="text-sm font-semibold text-textPrimary flex-1 text-left">{title}</span>
        <ChevronDown className={`w-4 h-4 text-textSecondary transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-6 pb-6 pt-2">{children}</div>}
    </div>
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-textPrimary">{label}</span>
      <button onClick={() => onChange(!checked)} className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-gray-300'}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  )
}

function ColorPicker({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-textPrimary">{label}</span>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-10 h-10 border-none cursor-pointer rounded" />
    </div>
  )
}

function LabelInput({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5 block">{label}</label>
      <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 bg-bgPrimary border border-border rounded-lg text-sm text-textPrimary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" />
    </div>
  )
}

export default function TemplateEditorPage() {
  const queryClient = useQueryClient()
  const [config, setConfig] = useState(null)
  const [isDirty, setIsDirty] = useState(false)

  const { data: currentConfig, isLoading } = useQuery({
    queryKey: ['templates', 'config'],
    queryFn: async () => {
      const response = await templateApi.getConfig()
      return response.data.data || response.data
    }
  })

  useEffect(() => {
    if (currentConfig?.customConfig) setConfig(currentConfig.customConfig)
  }, [currentConfig])

  const saveMutation = useMutation({
    mutationFn: () => templateApi.updateConfig({ baseTemplateId: currentConfig?.baseTemplateId, customConfig: config }),
    onSuccess: () => { queryClient.invalidateQueries(['templates', 'config']); setIsDirty(false) }
  })

  const updateConfig = (path, value) => {
    setConfig(prev => {
      const newConfig = { ...prev }
      const keys = path.split('.')
      let current = newConfig
      for (let i = 0; i < keys.length - 1; i++) { current[keys[i]] = { ...current[keys[i]] }; current = current[keys[i]] }
      current[keys[keys.length - 1]] = value
      return newConfig
    })
    setIsDirty(true)
  }

  if (isLoading || !config) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <PageHeader
        title="Customize Template"
        backTo="/templates"
        actions={
          <button
            onClick={() => saveMutation.mutate()}
            disabled={!isDirty || saveMutation.isPending}
            className="px-5 py-2 bg-primary hover:bg-primaryHover text-white rounded-lg transition-all font-medium text-sm shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        }
      />

      <div className="space-y-4">
        {/* Colors */}
        <EditorSection icon={Palette} title="Colors" defaultOpen={true}>
          <ColorPicker label="Primary Color" value={config.colors?.primary || '#3880ff'} onChange={(v) => updateConfig('colors.primary', v)} />
          <ColorPicker label="Secondary Color" value={config.colors?.secondary || '#666666'} onChange={(v) => updateConfig('colors.secondary', v)} />
          <ColorPicker label="Accent Color" value={config.colors?.accent || '#f5f5f5'} onChange={(v) => updateConfig('colors.accent', v)} />
        </EditorSection>

        {/* Logo */}
        <EditorSection icon={Image} title="Logo">
          <Toggle label="Show Logo" checked={config.logo?.show !== false} onChange={(v) => updateConfig('logo.show', v)} />
          <div className="mt-2">
            <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5 block">Logo Position</label>
            <select value={config.logo?.position || 'left'} onChange={(e) => updateConfig('logo.position', e.target.value)}
              className="w-full px-3 py-2 bg-bgPrimary border border-border rounded-lg text-sm text-textPrimary focus:outline-none focus:border-primary transition-all">
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
        </EditorSection>

        {/* Business Info */}
        <EditorSection icon={Building2} title="Business Info">
          <Toggle label="Show Business Name" checked={config.header?.showBusinessName !== false} onChange={(v) => updateConfig('header.showBusinessName', v)} />
          <Toggle label="Show Address" checked={config.header?.showBusinessAddress !== false} onChange={(v) => updateConfig('header.showBusinessAddress', v)} />
          <Toggle label="Show GSTIN" checked={config.header?.showBusinessGSTIN !== false} onChange={(v) => updateConfig('header.showBusinessGSTIN', v)} />
          <Toggle label="Show Phone" checked={config.header?.showBusinessPhone !== false} onChange={(v) => updateConfig('header.showBusinessPhone', v)} />
          <Toggle label="Show Email" checked={config.header?.showBusinessEmail !== false} onChange={(v) => updateConfig('header.showBusinessEmail', v)} />
        </EditorSection>

        {/* Customer Info */}
        <EditorSection icon={User} title="Customer Info">
          <Toggle label="Show Phone" checked={config.customer?.showPhone !== false} onChange={(v) => updateConfig('customer.showPhone', v)} />
          <Toggle label="Show Email" checked={config.customer?.showEmail !== false} onChange={(v) => updateConfig('customer.showEmail', v)} />
          <Toggle label="Show Address" checked={config.customer?.showAddress !== false} onChange={(v) => updateConfig('customer.showAddress', v)} />
          <Toggle label="Show GSTIN" checked={config.customer?.showGSTIN !== false} onChange={(v) => updateConfig('customer.showGSTIN', v)} />
        </EditorSection>

        {/* Totals */}
        <EditorSection icon={Calculator} title="Totals Section">
          <Toggle label="Show Subtotal" checked={config.totals?.showSubtotal !== false} onChange={(v) => updateConfig('totals.showSubtotal', v)} />
          <Toggle label="Show Discount" checked={config.totals?.showDiscount !== false} onChange={(v) => updateConfig('totals.showDiscount', v)} />
          <Toggle label="Show Tax Breakup" checked={config.totals?.showTaxBreakup !== false} onChange={(v) => updateConfig('totals.showTaxBreakup', v)} />
          <Toggle label="Show Amount in Words" checked={config.totals?.showAmountInWords === true} onChange={(v) => updateConfig('totals.showAmountInWords', v)} />
        </EditorSection>

        {/* Footer */}
        <EditorSection icon={FileText} title="Footer Section">
          <Toggle label="Show Bank Details" checked={config.footer?.showBankDetails !== false} onChange={(v) => updateConfig('footer.showBankDetails', v)} />
          <Toggle label="Show UPI" checked={config.footer?.showUPI !== false} onChange={(v) => updateConfig('footer.showUPI', v)} />
          <Toggle label="Show Signature" checked={config.footer?.showSignature !== false} onChange={(v) => updateConfig('footer.showSignature', v)} />
          <Toggle label="Show Terms" checked={config.footer?.showTerms !== false} onChange={(v) => updateConfig('footer.showTerms', v)} />
          <Toggle label="Show Notes" checked={config.footer?.showNotes !== false} onChange={(v) => updateConfig('footer.showNotes', v)} />
          <div className="mt-3">
            <LabelInput label="Custom Footer Text" value={config.footer?.customFooterText} onChange={(v) => updateConfig('footer.customFooterText', v)} placeholder="e.g., Thank you for your business!" />
          </div>
        </EditorSection>

        {/* Labels */}
        <EditorSection icon={Type} title="Custom Labels">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LabelInput label="Invoice Title" value={config.labels?.invoiceTitle} onChange={(v) => updateConfig('labels.invoiceTitle', v)} placeholder="INVOICE" />
            <LabelInput label="Bill To Label" value={config.labels?.billTo} onChange={(v) => updateConfig('labels.billTo', v)} placeholder="Bill To" />
            <LabelInput label="Description Column" value={config.labels?.itemDescription} onChange={(v) => updateConfig('labels.itemDescription', v)} placeholder="Description" />
            <LabelInput label="Quantity Column" value={config.labels?.quantity} onChange={(v) => updateConfig('labels.quantity', v)} placeholder="Qty" />
            <LabelInput label="Rate Column" value={config.labels?.rate} onChange={(v) => updateConfig('labels.rate', v)} placeholder="Rate" />
            <LabelInput label="Amount Column" value={config.labels?.amount} onChange={(v) => updateConfig('labels.amount', v)} placeholder="Amount" />
          </div>
        </EditorSection>
      </div>
    </div>
  )
}
