import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import {
  Building2,
  Receipt,
  CreditCard,
  FileText,
  Palette,
  LogOut,
  ChevronRight,
  Save,
  Loader2,
  Shield,
  CheckCircle2,
  Plus,
  Trash2,
  Star,
  Percent,
  Check,
  Upload,
  ImageIcon,
  X,
  PenLine
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { businessApi, taxRateApi, templateApi } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import { PageToolbar } from '../../components/data-table'
import { ALL_INVOICE_TYPES, DEFAULT_ENABLED_TYPES } from '../../components/layout/navigationConfig'
import { TEMPLATE_REGISTRY, COLOR_FAMILIES, getTemplateList } from '../invoices/utils/templates/registry'
import BusinessInfoForm, { FieldInput, FieldTextarea, FieldToggle } from '../../components/settings/BusinessInfoForm'

const SETTINGS_TABS = [
  { key: 'business', label: 'Business Info', mobileLabel: 'Business', icon: Building2 },
  { key: 'gst', label: 'GST Settings', mobileLabel: 'GST', icon: Receipt },
  { key: 'bank', label: 'Bank & Payment', mobileLabel: 'Bank', icon: CreditCard },
  { key: 'invoice', label: 'Invoice Settings', mobileLabel: 'Invoice', icon: FileText },
]

function InvoiceTypesSection({ enabledTypes, onChange }) {
  const toggleType = (key) => {
    if (enabledTypes.includes(key)) {
      if (enabledTypes.length <= 1) return
      onChange(enabledTypes.filter(k => k !== key))
    } else {
      onChange([...enabledTypes, key])
    }
  }

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="px-4 py-3 md:px-6 md:py-4 border-b border-border flex items-center gap-2.5 md:gap-3">
        <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
          <FileText className="w-3.5 h-3.5 md:w-4 md:h-4 text-violet-600" />
        </div>
        <div>
          <h3 className="text-xs md:text-sm font-semibold text-textPrimary">Document Types</h3>
          <p className="text-[11px] md:text-xs text-textSecondary">Choose which types appear in your sidebar</p>
        </div>
      </div>
      <div className="p-3 md:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {ALL_INVOICE_TYPES.map((type) => {
            const isEnabled = enabledTypes.includes(type.key)
            const Icon = type.icon
            return (
              <button
                key={type.key}
                onClick={() => toggleType(type.key)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-lg border transition-all text-left ${
                  isEnabled
                    ? 'bg-primary/5 border-primary/30 text-primary'
                    : 'bg-gray-50 border-border text-textSecondary active:bg-gray-100 md:hover:bg-gray-100'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isEnabled ? 'text-primary' : 'text-gray-400'}`} />
                <span className={`text-sm ${isEnabled ? 'font-semibold' : 'font-medium'}`}>{type.label}</span>
                {isEnabled && (
                  <CheckCircle2 className="w-4 h-4 text-primary ml-auto shrink-0" />
                )}
              </button>
            )
          })}
        </div>
        <p className="text-[11px] text-textSecondary mt-3 ml-1">
          Selected types will appear in the sidebar for quick access. At least one type must be selected.
        </p>
      </div>
    </div>
  )
}

const TEMPLATE_PREVIEW_COLORS = {
  clean: { bg: '#FFFFFF', accent: '#1F2937', headerBg: '#F9FAFB' },
  'modern-red': { bg: '#FFFFFF', accent: '#DC2626', headerBg: '#FEF2F2' },
  'classic-red': { bg: '#FFFFFF', accent: '#047857', headerBg: '#ECFDF5' },
  wexler: { bg: '#FFFFFF', accent: '#1E3A5F', headerBg: '#1E3A5F' },
  plexer: { bg: '#FFFFFF', accent: '#374151', headerBg: '#F3F4F6' },
  contemporary: { bg: '#FFFFFF', accent: '#E11D48', headerBg: '#E11D48' },
}

function TemplateSection() {
  const queryClient = useQueryClient()
  const [colorFilter, setColorFilter] = useState('all')

  const { data: currentConfig, isLoading: configLoading } = useQuery({
    queryKey: ['templates', 'config'],
    queryFn: async () => {
      const response = await templateApi.getConfig()
      return response.data.data || response.data
    }
  })

  const { data: serverTemplates, isLoading: templatesLoading } = useQuery({
    queryKey: ['templates', 'base'],
    queryFn: async () => {
      const response = await templateApi.listBase()
      return response.data.data || response.data || []
    }
  })

  const templates = useMemo(() => {
    const clientTemplates = getTemplateList()
    if (!serverTemplates?.length) return clientTemplates
    return clientTemplates.map(ct => {
      const serverMatch = serverTemplates.find(st => st.name === ct.id)
      return { ...ct, serverId: serverMatch?.id || null }
    }).filter(t => serverTemplates.some(st => st.name === t.id))
  }, [serverTemplates])

  const filteredTemplates = useMemo(() => {
    if (colorFilter === 'all') return templates
    return templates.filter(t => t.colorFamily === colorFilter)
  }, [templates, colorFilter])

  const currentTemplateId = useMemo(() => {
    if (!currentConfig?.baseTemplateId || !serverTemplates?.length) return 'clean'
    const match = serverTemplates.find(st => st.id === currentConfig.baseTemplateId)
    return match?.name || 'clean'
  }, [currentConfig, serverTemplates])

  const selectMutation = useMutation({
    mutationFn: async (templateId) => {
      const serverTemplate = serverTemplates?.find(st => st.name === templateId)
      if (!serverTemplate) throw new Error('Template not found on server')
      await templateApi.updateConfig({ baseTemplateId: serverTemplate.id })
      return templateId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates', 'config'] })
    }
  })

  const isLoading = configLoading || templatesLoading

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="px-4 py-3 md:px-6 md:py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5 md:gap-3">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
            <Palette className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-600" />
          </div>
          <div>
            <h3 className="text-xs md:text-sm font-semibold text-textPrimary">Invoice Template</h3>
            <p className="text-[11px] md:text-xs text-textSecondary">Default template for invoice PDFs</p>
          </div>
        </div>
      </div>

      {/* Color Filter */}
      <div className="px-4 md:px-6 py-2.5 md:py-3 border-b border-border flex items-center gap-2 md:gap-3">
        <span className="text-xs font-medium text-textSecondary">Filter by Color</span>
        <div className="flex items-center gap-1.5">
          {COLOR_FAMILIES.map(cf => (
            <button
              key={cf.key}
              onClick={() => setColorFilter(cf.key)}
              className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                colorFilter === cf.key
                  ? 'border-primary scale-110 shadow-sm'
                  : 'border-transparent hover:border-gray-300'
              }`}
              style={cf.color ? { backgroundColor: cf.color } : { backgroundColor: '#F3F4F6' }}
              title={cf.label}
            >
              {colorFilter === cf.key && (
                <Check className={`w-3.5 h-3.5 ${cf.color ? 'text-white' : 'text-gray-600'}`} />
              )}
              {cf.key === 'all' && colorFilter !== 'all' && (
                <span className="text-[9px] font-bold text-gray-500">All</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Template Grid */}
      <div className="p-3 md:p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <p className="text-sm text-textSecondary">Loading templates...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-textSecondary">No templates match this filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredTemplates.map(template => {
              const isSelected = currentTemplateId === template.id
              const colors = TEMPLATE_PREVIEW_COLORS[template.id] || TEMPLATE_PREVIEW_COLORS.clean
              const isSelecting = selectMutation.isPending && selectMutation.variables === template.id

              return (
                <button
                  key={template.id}
                  onClick={() => {
                    if (!isSelected && !selectMutation.isPending) {
                      selectMutation.mutate(template.id)
                    }
                  }}
                  disabled={selectMutation.isPending}
                  className={`group relative rounded-xl border-2 overflow-hidden text-left transition-all hover:shadow-lg ${
                    isSelected
                      ? 'border-primary shadow-md ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/40'
                  } ${selectMutation.isPending && !isSelecting ? 'opacity-50' : ''}`}
                >
                  {/* Mini Preview */}
                  <div className="aspect-[3/4] bg-gray-50 p-3 relative">
                    <div className="w-full h-full bg-white rounded shadow-sm overflow-hidden flex flex-col">
                      <div className="h-[18%] flex items-center px-2" style={{ backgroundColor: colors.headerBg }}>
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[7px] font-bold tracking-wider" style={{ color: colors.headerBg === colors.accent ? '#FFFFFF' : colors.accent }}>
                            INVOICE
                          </span>
                          <div className="flex flex-col items-end gap-0.5">
                            <div className="w-8 h-1 rounded-full" style={{ backgroundColor: colors.accent, opacity: 0.3 }} />
                            <div className="w-6 h-1 rounded-full" style={{ backgroundColor: colors.accent, opacity: 0.2 }} />
                          </div>
                        </div>
                      </div>
                      <div className="px-2 py-1.5 flex gap-2">
                        <div className="flex-1">
                          <div className="w-10 h-1 rounded-full bg-gray-300 mb-1" />
                          <div className="w-14 h-0.5 rounded-full bg-gray-200 mb-0.5" />
                          <div className="w-12 h-0.5 rounded-full bg-gray-200" />
                        </div>
                        <div className="flex-1">
                          <div className="w-8 h-1 rounded-full bg-gray-300 mb-1" />
                          <div className="w-12 h-0.5 rounded-full bg-gray-200 mb-0.5" />
                          <div className="w-10 h-0.5 rounded-full bg-gray-200" />
                        </div>
                      </div>
                      <div className="px-2 flex-1">
                        <div className="h-[1px] mb-1" style={{ backgroundColor: colors.accent, opacity: 0.3 }} />
                        {[1, 2, 3].map(i => (
                          <div key={i} className="flex items-center gap-1 mb-1">
                            <div className="flex-1 h-0.5 rounded-full bg-gray-200" />
                            <div className="w-4 h-0.5 rounded-full bg-gray-200" />
                            <div className="w-5 h-0.5 rounded-full bg-gray-300" />
                          </div>
                        ))}
                      </div>
                      <div className="px-2 pb-2 flex justify-end">
                        <div className="flex items-center gap-1">
                          <div className="w-6 h-1 rounded-full" style={{ backgroundColor: colors.accent, opacity: 0.5 }} />
                          <div className="w-8 h-1.5 rounded-full" style={{ backgroundColor: colors.accent }} />
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    {isSelecting && (
                      <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="px-3 py-2.5 bg-white border-t border-border/50">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: template.previewColor }} />
                      <span className="text-xs font-semibold text-textPrimary truncate">{template.name}</span>
                    </div>
                    <p className="text-[10px] text-textSecondary mt-0.5 line-clamp-1 pl-5">{template.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {selectMutation.isError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {selectMutation.error?.message || 'Failed to update template'}
          </div>
        )}

        {selectMutation.isSuccess && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Template updated successfully
          </div>
        )}
      </div>
    </div>
  )
}

function LogoUploadSection({ logoUrl, onUploaded, onRemove }) {
  const queryClient = useQueryClient()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate client-side
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a JPEG, PNG, GIF, WebP, or SVG image')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be under 5MB')
      return
    }

    setError(null)
    setUploading(true)
    try {
      const response = await businessApi.uploadLogo(file)
      const url = response.data?.data?.logoUrl || response.data?.logoUrl
      if (url) {
        onUploaded(url)
        queryClient.invalidateQueries({ queryKey: ['business'] })
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload logo')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemove = async () => {
    onRemove()
    try {
      await businessApi.updateProfile({ logoUrl: null })
      queryClient.invalidateQueries({ queryKey: ['business'] })
    } catch {}
  }

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="px-4 py-3 md:px-6 md:py-4 border-b border-border flex items-center gap-2.5 md:gap-3">
        <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-cyan-50 flex items-center justify-center shrink-0">
          <ImageIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-cyan-600" />
        </div>
        <div>
          <h3 className="text-xs md:text-sm font-semibold text-textPrimary">Business Logo</h3>
          <p className="text-[11px] md:text-xs text-textSecondary">Your logo will appear on invoices</p>
        </div>
      </div>
      <div className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Logo Preview */}
          <div className="w-24 h-24 rounded-xl border-2 border-dashed border-border bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt="Business logo" className="w-full h-full object-contain p-1" />
            ) : (
              <ImageIcon className="w-8 h-8 text-gray-300" />
            )}
          </div>

          {/* Upload Controls */}
          <div className="flex-1 min-w-0">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 text-sm font-semibold text-primary bg-blue-50 active:bg-blue-100 md:hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-2 border border-blue-100 disabled:opacity-60"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {logoUrl ? 'Change Logo' : 'Upload Logo'}
              </button>
              {logoUrl && (
                <button
                  onClick={handleRemove}
                  className="px-4 py-2 text-sm font-medium text-red-600 active:bg-red-50 md:hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Remove
                </button>
              )}
            </div>
            <p className="text-[11px] text-textSecondary mt-2">
              Recommended: Square image, at least 200×200px. Max 5MB. JPEG, PNG, WebP, or SVG.
            </p>
            {error && (
              <p className="text-xs text-red-600 mt-1.5">{error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SignatureSettingsSection({ signatureUrl, signatureName, businessName, onSignatureUrlChange, onSignatureNameChange }) {
  const queryClient = useQueryClient()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  // Default signatureName to businessName if empty
  const effectiveName = signatureName || businessName || ''

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a JPEG, PNG, GIF, WebP, or SVG image')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be under 5MB')
      return
    }
    setError(null)
    setUploading(true)
    try {
      const response = await businessApi.uploadSignature(file)
      const url = response.data?.data?.signatureUrl || response.data?.signatureUrl
      if (url) {
        onSignatureUrlChange(url)
        queryClient.invalidateQueries({ queryKey: ['business'] })
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload signature')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemove = async () => {
    onSignatureUrlChange(null)
    try {
      await businessApi.updateProfile({ signatureUrl: null })
      queryClient.invalidateQueries({ queryKey: ['business'] })
    } catch {}
  }

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="px-4 py-3 md:px-6 md:py-4 border-b border-border flex items-center gap-2.5 md:gap-3">
        <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
          <PenLine className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-600" />
        </div>
        <div>
          <h3 className="text-xs md:text-sm font-semibold text-textPrimary">Signature</h3>
          <p className="text-[11px] md:text-xs text-textSecondary">Your signature will appear on invoices</p>
        </div>
      </div>
      <div className="p-4 md:p-6 space-y-4">
        {/* Signature Image Upload — same layout as Logo */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-24 h-24 rounded-xl border-2 border-dashed border-border bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
            {signatureUrl ? (
              <img src={signatureUrl} alt="Signature" className="w-full h-full object-contain p-1" />
            ) : (
              <PenLine className="w-8 h-8 text-gray-300" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 text-sm font-semibold text-primary bg-blue-50 active:bg-blue-100 md:hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-2 border border-blue-100 disabled:opacity-60"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {signatureUrl ? 'Change Signature' : 'Upload Signature'}
              </button>
              {signatureUrl && (
                <button
                  onClick={handleRemove}
                  className="px-4 py-2 text-sm font-medium text-red-600 active:bg-red-50 md:hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Remove
                </button>
              )}
            </div>
            <p className="text-[11px] text-textSecondary mt-2">
              Upload a signature image. Max 5MB. JPEG, PNG, WebP, or SVG.
            </p>
            {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
          </div>
        </div>

        {/* Text Signature — always visible below */}
        <div className="pt-3 border-t border-border space-y-3">
          <p className="text-xs font-medium text-textSecondary">Or use a text signature</p>
          <FieldInput
            label="Signatory Name"
            value={effectiveName}
            onChange={(v) => onSignatureNameChange(v)}
            placeholder="e.g., John Doe"
            description="Displayed in a handwriting-style font on invoices"
          />
          {effectiveName && (
            <div className="px-4 py-3 bg-gray-50 rounded-lg border border-border">
              <p className="text-[11px] text-textSecondary uppercase tracking-wider font-medium mb-1">Preview</p>
              <span
                className="text-2xl text-textPrimary"
                style={{ fontFamily: "'Dancing Script', 'Pacifico', 'Satisfy', cursive", fontStyle: 'italic' }}
              >
                {effectiveName}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const history = useHistory()
  const location = useLocation()
  const queryClient = useQueryClient()
  const logout = useAuthStore((state) => state.logout)
  const [formData, setFormData] = useState({})
  const [isDirty, setIsDirty] = useState(false)
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(location.search)
    const section = params.get('section')
    return section && SETTINGS_TABS.some(t => t.key === section) ? section : 'business'
  })
  const [newTaxRate, setNewTaxRate] = useState({ name: '', rate: '', isDefault: false })
  const [showAddTaxRate, setShowAddTaxRate] = useState(false)
  const tabsRef = useRef(null)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const handleTabScroll = useCallback(() => {
    const el = tabsRef.current
    if (!el) return
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    handleTabScroll()
    window.addEventListener('resize', handleTabScroll)
    return () => window.removeEventListener('resize', handleTabScroll)
  }, [handleTabScroll])

  const { data: business, isLoading } = useQuery({
    queryKey: ['business'],
    queryFn: async () => {
      const response = await businessApi.getProfile()
      return response.data.data || response.data
    },
    staleTime: 0,
    refetchOnMount: 'always'
  })

  useEffect(() => {
    if (business && !isDirty) {
      setFormData({
        ...business,
        enabledInvoiceTypes: business.enabledInvoiceTypes || DEFAULT_ENABLED_TYPES
      })
    }
  }, [business])

  const updateMutation = useMutation({
    mutationFn: (data) => businessApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business'] })
      setIsDirty(false)
    }
  })

  // Tax Rates
  const { data: taxRates = [], isLoading: taxRatesLoading } = useQuery({
    queryKey: ['taxRates'],
    queryFn: async () => {
      const response = await taxRateApi.list()
      return response.data?.data || response.data || []
    }
  })

  const createTaxRateMutation = useMutation({
    mutationFn: (data) => taxRateApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxRates'] })
      setNewTaxRate({ name: '', rate: '', isDefault: false })
      setShowAddTaxRate(false)
    }
  })

  const updateTaxRateMutation = useMutation({
    mutationFn: ({ id, data }) => taxRateApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['taxRates'] })
  })

  const deleteTaxRateMutation = useMutation({
    mutationFn: (id) => taxRateApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['taxRates'] })
  })

  const handleAddTaxRate = () => {
    if (!newTaxRate.name.trim() || !newTaxRate.rate) return
    createTaxRateMutation.mutate({
      name: newTaxRate.name.trim(),
      rate: parseFloat(newTaxRate.rate),
      isDefault: newTaxRate.isDefault
    })
  }

  const handleSetDefault = (taxRate) => {
    updateTaxRateMutation.mutate({ id: taxRate.id, data: { isDefault: true } })
  }

  const handleDeleteTaxRate = (id) => {
    deleteTaxRateMutation.mutate(id)
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }

  const handleSave = () => {
    // Only send editable fields, exclude id/timestamps/computed fields
    const { id, createdAt, updatedAt, ...editableData } = formData
    updateMutation.mutate(editableData)
  }

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
    <div className="h-full flex flex-col">
      {/* Page Toolbar */}
      <PageToolbar
        title="Settings"
        subtitle="Manage your business profile, tax configuration, and invoice defaults"
        mobileActions={
          isDirty ? (
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="px-3.5 py-2 bg-primary active:bg-primaryHover text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 disabled:opacity-60"
            >
              {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save
            </button>
          ) : updateMutation.isSuccess ? (
            <span className="text-xs text-green-600 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Saved
            </span>
          ) : null
        }
        actions={
          <>
            {isDirty && (
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="px-5 py-2.5 bg-primary md:hover:bg-primaryHover text-white rounded-lg transition-all font-semibold text-sm shadow-sm flex items-center gap-2 disabled:opacity-60"
              >
                {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            )}
            {!isDirty && updateMutation.isSuccess && (
              <span className="text-sm text-green-600 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Saved
              </span>
            )}
          </>
        }
      >
        {/* Tab Navigation */}
        <div className="relative mt-2">
          <div
            ref={tabsRef}
            onScroll={handleTabScroll}
            className="flex items-center gap-0.5 md:gap-1 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar"
          >
            {SETTINGS_TABS.map((tab) => {
              const active = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-2.5 md:px-4 py-1.5 md:py-2 text-[11px] md:text-sm font-medium rounded-lg transition-colors flex items-center gap-1 md:gap-2 whitespace-nowrap shrink-0 ${
                    active
                      ? 'text-primary bg-blue-50 border border-blue-100 shadow-sm'
                      : 'text-textSecondary active:text-textPrimary md:hover:text-textPrimary active:bg-gray-50 md:hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <tab.icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${active ? 'text-primary' : 'text-gray-400'}`} />
                  <span className="md:hidden">{tab.mobileLabel}</span>
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>
          {/* Scroll indicator — visible on mobile when more tabs overflow right */}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-1 w-8 bg-gradient-to-l from-white to-transparent flex items-center justify-end pointer-events-none md:hidden">
              <ChevronRight className="w-4 h-4 text-textSecondary animate-pulse" />
            </div>
          )}
        </div>
      </PageToolbar>

      {/* Content Area */}
      <div className="flex-1 px-3 md:px-8 py-3 md:py-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-3 md:space-y-6">

          {/* Business Information Tab */}
          {activeTab === 'business' && (
            <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="px-4 py-3 md:px-6 md:py-4 border-b border-border flex items-center gap-2.5 md:gap-3">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Building2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-xs md:text-sm font-semibold text-textPrimary">Business Information</h3>
                  <p className="text-[11px] md:text-xs text-textSecondary">Your company details shown on invoices</p>
                </div>
              </div>
              <div className="p-4 md:p-6">
                <BusinessInfoForm
                  formData={formData}
                  onChange={(newData) => {
                    setFormData(newData)
                    setIsDirty(true)
                  }}
                />
              </div>
            </div>
          )}

          {/* GST Settings Tab */}
          {activeTab === 'gst' && (
            <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="px-4 py-3 md:px-6 md:py-4 border-b border-border flex items-center gap-2.5 md:gap-3">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                  <Receipt className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xs md:text-sm font-semibold text-textPrimary">GST Configuration</h3>
                  <p className="text-[11px] md:text-xs text-textSecondary">Tax registration and default rates</p>
                </div>
              </div>
              <div className="p-4 md:p-6 space-y-4 md:space-y-5">
                <FieldToggle
                  label="Enable GST"
                  description="Show GST fields on invoices and calculate tax automatically"
                  checked={formData.gstEnabled || false}
                  onChange={(v) => handleChange('gstEnabled', v)}
                />
                {formData.gstEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 md:gap-5 pt-2">
                    <FieldInput label="GSTIN" value={formData.gstin} onChange={(v) => handleChange('gstin', v?.toUpperCase())} placeholder="15-digit GSTIN" maxLength={15} description="Your 15-digit GST Identification Number" />
                    <FieldInput label="State Code" value={formData.stateCode} onChange={(v) => handleChange('stateCode', v)} placeholder="e.g., 36" maxLength={2} description="2-digit state code for GST" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tax Rates Management — visible in GST tab */}
          {activeTab === 'gst' && (
            <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="px-4 py-3 md:px-6 md:py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2.5 md:gap-3">
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                    <Percent className="w-3.5 h-3.5 md:w-4 md:h-4 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-xs md:text-sm font-semibold text-textPrimary">Tax Rates</h3>
                    <p className="text-[11px] md:text-xs text-textSecondary hidden sm:block">Configure reusable tax rates</p>
                  </div>
                </div>
                {!showAddTaxRate && (
                  <button
                    onClick={() => setShowAddTaxRate(true)}
                    className="px-2.5 py-1.5 md:px-3.5 md:py-2 text-[11px] md:text-xs font-semibold text-primary bg-blue-50 active:bg-blue-100 md:hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1 md:gap-1.5 border border-blue-100"
                  >
                    <Plus className="w-3 h-3 md:w-3.5 md:h-3.5" />
                    Add
                  </button>
                )}
              </div>
              <div className="p-4 md:p-6 space-y-3 md:space-y-4">
                {/* Add new tax rate form */}
                {showAddTaxRate && (
                  <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-lg space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={newTaxRate.name}
                        onChange={(e) => setNewTaxRate(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., GST 18%"
                        autoFocus
                        className="px-3.5 py-2.5 bg-white border border-border rounded-lg text-sm text-textPrimary placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={newTaxRate.rate}
                        onChange={(e) => setNewTaxRate(prev => ({ ...prev, rate: e.target.value }))}
                        placeholder="Rate %"
                        className="px-3.5 py-2.5 bg-white border border-border rounded-lg text-sm text-textPrimary placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                      />
                      <label className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-border rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newTaxRate.isDefault}
                          onChange={(e) => setNewTaxRate(prev => ({ ...prev, isDefault: e.target.checked }))}
                          className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary/20"
                        />
                        <span className="text-sm text-textPrimary">Set as default</span>
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAddTaxRate}
                        disabled={createTaxRateMutation.isPending || !newTaxRate.name.trim() || !newTaxRate.rate}
                        className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primaryHover rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-60"
                      >
                        {createTaxRateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        Add
                      </button>
                      <button
                        onClick={() => { setShowAddTaxRate(false); setNewTaxRate({ name: '', rate: '', isDefault: false }) }}
                        className="px-4 py-2 text-sm font-medium text-textSecondary hover:text-textPrimary hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Tax rates list */}
                {taxRatesLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  </div>
                ) : taxRates.length === 0 ? (
                  <div className="text-center py-8">
                    <Percent className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-textSecondary">No tax rates configured yet</p>
                    <p className="text-xs text-textSecondary mt-1">Add tax rates to use them on products and invoices</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {taxRates.map((tr) => (
                      <div
                        key={tr.id}
                        className="flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-border transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                            tr.isDefault ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {Number(tr.rate)}%
                          </div>
                          <div>
                            <div className="text-sm font-medium text-textPrimary flex items-center gap-2">
                              {tr.name}
                              {tr.isDefault && (
                                <span className="text-[10px] font-semibold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                  Default
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-textSecondary">{Number(tr.rate)}% tax rate</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          {!tr.isDefault && (
                            <button
                              onClick={() => handleSetDefault(tr)}
                              title="Set as default"
                              className="w-8 h-8 flex items-center justify-center text-textSecondary hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                            >
                              <Star className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteTaxRate(tr.id)}
                            title="Delete"
                            className="w-8 h-8 flex items-center justify-center text-textSecondary hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bank & Payment Tab */}
          {activeTab === 'bank' && (
            <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="px-4 py-3 md:px-6 md:py-4 border-b border-border flex items-center gap-2.5 md:gap-3">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                  <CreditCard className="w-3.5 h-3.5 md:w-4 md:h-4 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xs md:text-sm font-semibold text-textPrimary">Bank & Payment Details</h3>
                  <p className="text-[11px] md:text-xs text-textSecondary">Payment information displayed on invoices</p>
                </div>
              </div>
              <div className="p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 md:gap-5">
                  <FieldInput label="Bank Name" value={formData.bankName} onChange={(v) => handleChange('bankName', v)} placeholder="Bank name" />
                  <FieldInput label="Account Number" value={formData.accountNumber} onChange={(v) => handleChange('accountNumber', v)} placeholder="Account number" />
                  <FieldInput label="IFSC Code" value={formData.ifscCode} onChange={(v) => handleChange('ifscCode', v?.toUpperCase())} placeholder="IFSC code" maxLength={11} />
                  <FieldInput label="UPI ID" value={formData.upiId} onChange={(v) => handleChange('upiId', v)} placeholder="yourname@upi" />
                </div>
              </div>
            </div>
          )}

          {/* Invoice Settings Tab — combines Logo, Defaults, Types, Template */}
          {activeTab === 'invoice' && (
            <>
              {/* Business Logo */}
              <LogoUploadSection
                logoUrl={formData.logoUrl}
                onUploaded={(url) => handleChange('logoUrl', url)}
                onRemove={() => handleChange('logoUrl', null)}
              />

              {/* Signature Settings — 2 options: Upload Image or Text */}
              <SignatureSettingsSection
                signatureUrl={formData.signatureUrl}
                signatureName={formData.signatureName}
                businessName={formData.name}
                onSignatureUrlChange={(url) => handleChange('signatureUrl', url)}
                onSignatureNameChange={(name) => handleChange('signatureName', name)}
              />

              <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="px-4 py-3 md:px-6 md:py-4 border-b border-border flex items-center gap-2.5 md:gap-3">
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                    <FileText className="w-3.5 h-3.5 md:w-4 md:h-4 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xs md:text-sm font-semibold text-textPrimary">Invoice Defaults</h3>
                    <p className="text-[11px] md:text-xs text-textSecondary">Default values applied to new invoices</p>
                  </div>
                </div>
                <div className="p-4 md:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 md:gap-5">
                    <FieldInput label="Invoice Prefix" value={formData.invoicePrefix} onChange={(v) => handleChange('invoicePrefix', v)} placeholder="e.g., INV-" maxLength={10} description="Prefix added before invoice numbers" />
                    <FieldInput label="Next Invoice Number" type="number" value={formData.nextInvoiceNumber} onChange={(v) => handleChange('nextInvoiceNumber', parseInt(v) || null)} placeholder="e.g., 1" description="Auto-incremented for each new invoice" />
                    <div className="md:col-span-2">
                      <FieldTextarea label="Default Notes" value={formData.defaultNotes} onChange={(v) => handleChange('defaultNotes', v)} placeholder="Notes to appear on every invoice" />
                    </div>
                    <div className="md:col-span-2">
                      <FieldTextarea label="Default Terms & Conditions" value={formData.defaultTerms} onChange={(v) => handleChange('defaultTerms', v)} placeholder="Terms & conditions" />
                    </div>
                  </div>
                </div>
              </div>

              <InvoiceTypesSection
                enabledTypes={formData.enabledInvoiceTypes || DEFAULT_ENABLED_TYPES}
                onChange={(types) => handleChange('enabledInvoiceTypes', types)}
              />

              <TemplateSection />
            </>
          )}
        </div>
      </div>


    </div>
  )
}
