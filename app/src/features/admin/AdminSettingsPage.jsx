import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../lib/api'
import {
  Settings, Save, Plus, Loader2, CheckCircle2,
  Building2, FileText, CreditCard, Landmark, Hash
} from 'lucide-react'

// ── Platform Settings Tab ──────────────────────────────────────────
const PLATFORM_SETTINGS = [
  { key: 'platform_name', label: 'Platform Name', type: 'text', description: 'Display name of the platform' },
  { key: 'support_email', label: 'Support Email', type: 'text', description: 'Email shown to users for support' },
  { key: 'support_phone', label: 'Support Phone', type: 'text', description: 'Phone number for support' },
  { key: 'maintenance_mode', label: 'Maintenance Mode', type: 'boolean', description: 'Enable to show maintenance page to users' },
  { key: 'new_registrations_enabled', label: 'New Registrations', type: 'boolean', description: 'Allow new user registrations' },
  { key: 'default_plan_id', label: 'Default Plan ID', type: 'text', description: 'Plan assigned to new businesses' },
]

// ── Billing Profile Fields ─────────────────────────────────────────
const BILLING_SECTIONS = [
  {
    title: 'Business Identity',
    icon: Building2,
    fields: [
      { key: 'billing_business_name', label: 'Business Name', placeholder: 'e.g. Invoice Baba Pvt Ltd' },
      { key: 'billing_address', label: 'Address', placeholder: 'Full registered address', multiline: true },
      { key: 'billing_email', label: 'Email', placeholder: 'billing@invoicebaba.com' },
      { key: 'billing_phone', label: 'Phone', placeholder: '+91 ...' },
    ]
  },
  {
    title: 'Tax & Compliance',
    icon: FileText,
    fields: [
      { key: 'billing_gstin', label: 'GSTIN', placeholder: '22AAAAA0000A1Z5' },
      { key: 'billing_pan', label: 'PAN', placeholder: 'AAAAA0000A' },
      { key: 'billing_state_code', label: 'State Code', placeholder: 'e.g. 36 for Telangana' },
      { key: 'billing_hsn_sac', label: 'HSN/SAC Code', placeholder: 'e.g. 998431 (IT services)' },
      { key: 'billing_tax_rate', label: 'Default Tax Rate (%)', placeholder: '18', type: 'number' },
    ]
  },
  {
    title: 'Bank Details',
    icon: Landmark,
    fields: [
      { key: 'billing_bank_name', label: 'Bank Name', placeholder: 'e.g. HDFC Bank' },
      { key: 'billing_account_number', label: 'Account Number', placeholder: 'Account number' },
      { key: 'billing_ifsc_code', label: 'IFSC Code', placeholder: 'e.g. HDFC0001234' },
      { key: 'billing_upi_id', label: 'UPI ID', placeholder: 'e.g. business@upi' },
    ]
  },
  {
    title: 'Invoice Defaults',
    icon: Hash,
    fields: [
      { key: 'sub_invoice_prefix', label: 'Invoice Prefix', placeholder: 'e.g. IB' },
      { key: 'billing_signature_name', label: 'Signatory Name', placeholder: 'Authorized Signatory' },
      { key: 'billing_default_notes', label: 'Default Notes', placeholder: 'Notes on every subscription invoice', multiline: true },
      { key: 'billing_default_terms', label: 'Default Terms', placeholder: 'Payment terms', multiline: true },
    ]
  },
]

const TABS = [
  { key: 'platform', label: 'Platform', icon: Settings },
  { key: 'billing', label: 'Billing Profile', icon: CreditCard },
]

export default function AdminSettingsPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('platform')
  const [editValues, setEditValues] = useState({})
  const [customKey, setCustomKey] = useState('')
  const [customValue, setCustomValue] = useState('')
  const [savedKey, setSavedKey] = useState(null)

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => adminApi.getPlatformSettings().then(r => r.data.data),
  })

  // Sync settings into editValues when loaded
  useEffect(() => {
    if (settings) setEditValues(prev => ({ ...settings, ...prev }))
  }, [settings])

  const updateMutation = useMutation({
    mutationFn: ({ key, value }) => adminApi.updatePlatformSetting(key, value),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] })
      setSavedKey(variables.key)
      setTimeout(() => setSavedKey(null), 2000)
    }
  })

  const handleSave = (key) => {
    const value = editValues[key]
    updateMutation.mutate({ key, value: value ?? '' })
  }

  const handleAddCustom = () => {
    if (!customKey.trim()) return
    let parsedValue = customValue
    try { parsedValue = JSON.parse(customValue) } catch {}
    updateMutation.mutate({ key: customKey.trim(), value: parsedValue }, {
      onSuccess: () => { setCustomKey(''); setCustomValue('') }
    })
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Platform configuration &amp; billing business profile</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── Platform Settings Tab ──────────────────────────────────── */}
      {activeTab === 'platform' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {PLATFORM_SETTINGS.map(({ key, label, type, description }) => (
              <div key={key} className="p-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-900">{label}</label>
                  <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                  <div className="mt-2">
                    {type === 'boolean' ? (
                      <button
                        onClick={() => {
                          const newVal = !editValues[key]
                          setEditValues(prev => ({ ...prev, [key]: newVal }))
                          updateMutation.mutate({ key, value: newVal })
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          editValues[key] ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          editValues[key] ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editValues[key] ?? ''}
                          onChange={(e) => setEditValues(prev => ({ ...prev, [key]: e.target.value }))}
                          className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={`Enter ${label.toLowerCase()}`}
                        />
                        <button
                          onClick={() => handleSave(key)}
                          disabled={updateMutation.isPending}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          {savedKey === key ? <CheckCircle2 className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                          {savedKey === key ? 'Saved' : 'Save'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Custom Setting */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-gray-400" /> Add Custom Setting
            </h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder="Setting key"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                placeholder="Value (JSON or string)"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddCustom}
                disabled={!customKey.trim() || updateMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>

          {/* Raw view */}
          {settings && Object.keys(settings).length > 0 && (
            <details className="bg-white rounded-xl border border-gray-200 p-4">
              <summary className="text-sm font-semibold text-gray-900 cursor-pointer flex items-center gap-2">
                <Settings className="w-4 h-4 text-gray-400" /> All Settings (Raw JSON)
              </summary>
              <div className="bg-gray-50 rounded-lg p-3 overflow-x-auto mt-3">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(settings, null, 2)}
                </pre>
              </div>
            </details>
          )}
        </div>
      )}

      {/* ── Billing Profile Tab ────────────────────────────────────── */}
      {activeTab === 'billing' && (
        <div className="space-y-5">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              <strong>Billing Business Profile</strong> — These details appear as the seller on subscription invoices generated for paying users.
              Update your company name, GSTIN, address, bank details, and invoice defaults here.
            </p>
          </div>

          {BILLING_SECTIONS.map(section => {
            const SectionIcon = section.icon
            return (
              <div key={section.title} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                  <SectionIcon className="w-4 h-4 text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-900">{section.title}</h3>
                </div>
                <div className="p-4 space-y-4">
                  {section.fields.map(field => (
                    <div key={field.key}>
                      <label className="block text-xs font-medium text-gray-700 mb-1">{field.label}</label>
                      <div className="flex gap-2">
                        {field.multiline ? (
                          <textarea
                            value={editValues[field.key] ?? ''}
                            onChange={(e) => setEditValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                            placeholder={field.placeholder}
                            rows={2}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          />
                        ) : (
                          <input
                            type={field.type || 'text'}
                            value={editValues[field.key] ?? ''}
                            onChange={(e) => setEditValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                            placeholder={field.placeholder}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        )}
                        <button
                          onClick={() => handleSave(field.key)}
                          disabled={updateMutation.isPending}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1 shrink-0 self-start"
                        >
                          {savedKey === field.key ? (
                            <><CheckCircle2 className="w-3 h-3" /> Saved</>
                          ) : updateMutation.isPending && updateMutation.variables?.key === field.key ? (
                            <><Loader2 className="w-3 h-3 animate-spin" /> Saving</>
                          ) : (
                            <><Save className="w-3 h-3" /> Save</>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
