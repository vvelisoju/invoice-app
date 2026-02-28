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
  Lock,
  CheckCircle2,
  Plus,
  Trash2,
  Star,
  Percent,
  Check,
  Upload,
  ImageIcon,
  X,
  PenLine,
  User,
  Phone,
  Mail,
  Pencil,
  Layers,
  AlertTriangle,
  Info,
  Package,
  Crown,
  Hash
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { businessApi, taxRateApi, templateApi, authApi } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import { PageToolbar } from '../../components/data-table'
import { ALL_INVOICE_TYPES, DEFAULT_ENABLED_TYPES } from '../../components/layout/navigationConfig'
import { TEMPLATE_REGISTRY, COLOR_FAMILIES, CATEGORIES, getTemplateList } from '../invoices/utils/templates/registry'
import { DOCUMENT_TYPE_DEFAULTS } from '../../config/documentTypeDefaults'
import BusinessInfoForm, { FieldInput, FieldTextarea, FieldToggle } from '../../components/settings/BusinessInfoForm'

const SETTINGS_TABS = [
  { key: 'business', label: 'Business Info', mobileLabel: 'Business', icon: Building2 },
  { key: 'gst', label: 'GST Settings', mobileLabel: 'GST', icon: Receipt },
  { key: 'bank', label: 'Bank & Payment', mobileLabel: 'Bank', icon: CreditCard },
  { key: 'invoice', label: 'Invoice Settings', mobileLabel: 'Invoice', icon: FileText },
  { key: 'templates', label: 'Invoice Templates', mobileLabel: 'Templates', icon: Palette },
  { key: 'subscription', label: 'Manage Subscription', mobileLabel: 'Subscription', icon: Crown },
]

function DocumentTypeSettingsSection({ enabledTypes, documentTypeConfig, onChange, hasPaidPlan, legacyDefaults }) {
  const [expandedType, setExpandedType] = useState(null)
  const history = useHistory()

  const handleFieldChange = (typeKey, field, value) => {
    const current = documentTypeConfig || {}
    const typeOverrides = { ...(current[typeKey] || {}) }
    if (field === 'nextNumber') {
      const num = parseInt(value, 10)
      if (!value || isNaN(num)) {
        delete typeOverrides.nextNumber
      } else {
        typeOverrides.nextNumber = num
      }
    } else if (field === 'prefix') {
      if (!value || value === DOCUMENT_TYPE_DEFAULTS[typeKey]?.prefix) {
        delete typeOverrides.prefix
      } else {
        typeOverrides.prefix = value
      }
    } else if (field === 'defaultNotes' || field === 'defaultTerms') {
      if (!value) {
        delete typeOverrides[field]
      } else {
        typeOverrides[field] = value
      }
    }
    const updated = { ...current, [typeKey]: typeOverrides }
    if (Object.keys(updated[typeKey] || {}).length === 0) {
      delete updated[typeKey]
    }
    onChange(updated)
  }

  const handleLabelChange = (typeKey, labelKey, value) => {
    const current = documentTypeConfig || {}
    const typeOverrides = current[typeKey] || {}
    const labels = { ...(typeOverrides.labels || {}), [labelKey]: value }
    if (!value || value === DOCUMENT_TYPE_DEFAULTS[typeKey]?.labels?.[labelKey]) {
      delete labels[labelKey]
    }
    const updated = { ...current, [typeKey]: { ...typeOverrides, labels } }
    if (Object.keys(updated[typeKey].labels || {}).length === 0) {
      delete updated[typeKey].labels
    }
    if (Object.keys(updated[typeKey] || {}).length === 0) {
      delete updated[typeKey]
    }
    onChange(updated)
  }

  const getOverride = (typeKey, labelKey) => {
    return documentTypeConfig?.[typeKey]?.labels?.[labelKey] || ''
  }

  const getField = (typeKey, field) => {
    const val = documentTypeConfig?.[typeKey]?.[field]
    return val !== undefined && val !== null ? String(val) : ''
  }

  // For the legacy 'invoice' type, fall back to business-level defaults if no per-type override exists
  const getFieldWithLegacy = (typeKey, field) => {
    const perType = getField(typeKey, field)
    if (perType) return perType
    if (typeKey === 'invoice' && legacyDefaults) {
      if (field === 'prefix' && legacyDefaults.invoicePrefix) return legacyDefaults.invoicePrefix
      if (field === 'nextNumber' && legacyDefaults.nextInvoiceNumber) return String(legacyDefaults.nextInvoiceNumber)
      if (field === 'defaultNotes' && legacyDefaults.defaultNotes) return legacyDefaults.defaultNotes
      if (field === 'defaultTerms' && legacyDefaults.defaultTerms) return legacyDefaults.defaultTerms
    }
    return ''
  }

  const enabledDefaults = ALL_INVOICE_TYPES
    .filter(t => enabledTypes.includes(t.key))
    .map(t => ({ ...t, defaults: DOCUMENT_TYPE_DEFAULTS[t.key] }))
    .filter(t => t.defaults)

  const inputClass = "w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-textPrimary placeholder-textSecondary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
  const labelClass = "text-[11px] font-bold text-textSecondary uppercase tracking-wider mb-1 block"
  const sectionTitleClass = "text-[10px] font-bold text-textSecondary uppercase tracking-widest mb-2"

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="px-4 py-3 md:px-6 md:py-4 border-b border-border flex items-center gap-2.5 md:gap-3">
        <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
          <Layers className="w-3.5 h-3.5 md:w-4 md:h-4 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-xs md:text-sm font-semibold text-textPrimary">Document Type Settings</h3>
          <p className="text-[11px] md:text-xs text-textSecondary">Configure numbering, defaults & labels for each document type</p>
        </div>
      </div>
      <div className="p-3 md:p-4 space-y-2">
        {enabledDefaults.map((type) => {
          const isExpanded = expandedType === type.key
          const Icon = type.icon
          const typeConf = documentTypeConfig?.[type.key] || {}
          const hasOverrides = Object.keys(typeConf).length > 0
          const previewPrefix = getFieldWithLegacy(type.key, 'prefix') || type.defaults.prefix
          const previewNum = getFieldWithLegacy(type.key, 'nextNumber') || '1'
          const previewInvNum = `${previewPrefix}${String(previewNum).padStart(4, '0')}`

          return (
            <div key={type.key} className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedType(isExpanded ? null : type.key)}
                className="w-full px-4 py-3 flex items-center justify-between active:bg-gray-50 md:hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-sm font-medium text-textPrimary">{type.label}</span>
                  {!isExpanded && (
                    <span className="text-[11px] text-textSecondary font-mono hidden sm:inline">{previewInvNum}</span>
                  )}
                  {hasOverrides && (
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full uppercase shrink-0">Customized</span>
                  )}
                </div>
                <ChevronRight className={`w-4 h-4 text-textSecondary transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
              </button>
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-border bg-gray-50/50 space-y-5">
                  {/* Numbering */}
                  <div>
                    <p className={sectionTitleClass}>Numbering</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Prefix</label>
                        <input
                          type="text"
                          value={getFieldWithLegacy(type.key, 'prefix')}
                          onChange={(e) => handleFieldChange(type.key, 'prefix', e.target.value)}
                          placeholder={type.defaults.prefix || 'INV-'}
                          maxLength={10}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Next Number</label>
                        <input
                          type="number"
                          min="1"
                          value={getFieldWithLegacy(type.key, 'nextNumber')}
                          onChange={(e) => handleFieldChange(type.key, 'nextNumber', e.target.value)}
                          placeholder="1"
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-textSecondary mt-1.5">
                      Next: <span className="font-mono font-semibold">{previewInvNum}</span>
                    </p>
                  </div>

                  {/* Default Notes & Terms */}
                  <div>
                    <p className={sectionTitleClass}>Defaults</p>
                    <div className="space-y-3">
                      <div>
                        <label className={labelClass}>Default Notes</label>
                        <textarea
                          value={getFieldWithLegacy(type.key, 'defaultNotes')}
                          onChange={(e) => handleFieldChange(type.key, 'defaultNotes', e.target.value)}
                          placeholder={`Notes to appear on every ${type.defaults.label?.toLowerCase() || 'document'}`}
                          rows={2}
                          className={`${inputClass} resize-none`}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Default Terms & Conditions</label>
                        <textarea
                          value={getFieldWithLegacy(type.key, 'defaultTerms')}
                          onChange={(e) => handleFieldChange(type.key, 'defaultTerms', e.target.value)}
                          placeholder="Terms & conditions"
                          rows={2}
                          className={`${inputClass} resize-none`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section Labels — Advanced Plan only */}
                  {hasPaidPlan ? (
                    <>
                      <div>
                        <p className={sectionTitleClass}>Section Labels</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {[
                            { key: 'fromSection', label: 'From Label' },
                            { key: 'toSection', label: 'To Label' },
                            { key: 'numberField', label: 'Number Label' },
                            { key: 'dateField', label: 'Date Label' },
                            { key: 'saveButton', label: 'Save Button' },
                          ].map((field) => (
                            <div key={field.key}>
                              <label className={labelClass}>{field.label}</label>
                              <input
                                type="text"
                                value={getOverride(type.key, field.key)}
                                onChange={(e) => handleLabelChange(type.key, field.key, e.target.value)}
                                placeholder={type.defaults.labels[field.key]}
                                className={inputClass}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Line Item Labels */}
                      <div>
                        <p className={sectionTitleClass}>Line Item Labels</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {[
                            { key: 'descriptionCol', label: 'Description' },
                            { key: 'unitPriceCol', label: 'Unit Price' },
                            { key: 'qtyCol', label: 'Quantity' },
                            { key: 'amountCol', label: 'Amount' },
                            { key: 'taxCol', label: 'Tax' },
                          ].map((field) => (
                            <div key={field.key}>
                              <label className={labelClass}>{field.label}</label>
                              <input
                                type="text"
                                value={getOverride(type.key, field.key)}
                                onChange={(e) => handleLabelChange(type.key, field.key, e.target.value)}
                                placeholder={type.defaults.labels[field.key]}
                                className={inputClass}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="bg-gray-50 border border-border rounded-lg p-4 text-center">
                      <Lock className="w-5 h-5 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs font-medium text-textPrimary mb-0.5">Custom Labels</p>
                      <p className="text-[11px] text-textSecondary mb-2.5">Customize section & line item labels with a paid plan.</p>
                      <button
                        onClick={() => history.push('/plans')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-primary active:bg-primaryHover md:hover:bg-primaryHover rounded-lg transition-colors"
                      >
                        <Crown className="w-3 h-3" />
                        Upgrade
                      </button>
                    </div>
                  )}

                  <p className="text-[10px] text-textSecondary">
                    Leave blank to use defaults. Changes apply to new documents.
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function InvoiceTypesSection({ enabledTypes, onChange, defaultDocType, onDefaultChange }) {
  const toggleType = (key) => {
    if (enabledTypes.includes(key)) {
      if (enabledTypes.length <= 1) return
      // If disabling the current default, switch default to first remaining enabled type
      const newTypes = enabledTypes.filter(k => k !== key)
      if (key === defaultDocType && onDefaultChange) {
        onDefaultChange(newTypes[0])
      }
      onChange(newTypes)
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
          <p className="text-[11px] md:text-xs text-textSecondary">Choose which types appear in your sidebar. Tap the star to set the default for the "New" button.</p>
        </div>
      </div>
      <div className="p-3 md:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {ALL_INVOICE_TYPES.map((type) => {
            const isEnabled = enabledTypes.includes(type.key)
            const isDefault = defaultDocType === type.key
            const Icon = type.icon
            return (
              <div key={type.key} className="relative">
                <button
                  onClick={() => toggleType(type.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-lg border transition-all text-left ${
                    isEnabled
                      ? 'bg-primary/5 border-primary/30 text-primary'
                      : 'bg-gray-50 border-border text-textSecondary active:bg-gray-100 md:hover:bg-gray-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isEnabled ? 'text-primary' : 'text-gray-400'}`} />
                  <span className={`text-sm flex-1 ${isEnabled ? 'font-semibold' : 'font-medium'}`}>{type.label}</span>
                  {isEnabled && isDefault && (
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                  )}
                  {isEnabled && !isDefault && (
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  )}
                </button>
                {isEnabled && !isDefault && onDefaultChange && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDefaultChange(type.key) }}
                    className="absolute top-1 right-1 w-7 h-7 flex items-center justify-center rounded-md text-gray-300 active:text-amber-500 md:hover:text-amber-500 active:bg-amber-50 md:hover:bg-amber-50 transition-all"
                    title="Set as default for New button"
                  >
                    <Star className="w-3 h-3" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
        <p className="text-[11px] text-textSecondary mt-3 ml-1">
          Selected types will appear in the sidebar for quick access. At least one type must be selected. The starred type opens when you click "New".
        </p>
      </div>
    </div>
  )
}

// Derive dynamic preview colors from template previewColor
function getSettingsPreviewColors(template) {
  const accent = template.previewColor || '#374151'
  const category = template.category
  const isFullHeader = category === 'modern' || category === 'creative'
  return {
    bg: '#FFFFFF',
    accent,
    headerBg: isFullHeader ? accent : `${accent}12`,
  }
}

const SETTINGS_TPL_PAGE_SIZE = 18

function TemplateSection() {
  const queryClient = useQueryClient()
  const [colorFilter, setColorFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [page, setPage] = useState(0)

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
    return templates.filter(t => {
      const catMatch = categoryFilter === 'all' || t.category === categoryFilter
      const colorMatch = colorFilter === 'all' || t.colorFamily === colorFilter
      return catMatch && colorMatch
    })
  }, [templates, colorFilter, categoryFilter])

  const pagedTemplates = useMemo(() => {
    const start = page * SETTINGS_TPL_PAGE_SIZE
    return filteredTemplates.slice(start, start + SETTINGS_TPL_PAGE_SIZE)
  }, [filteredTemplates, page])

  const totalPages = Math.ceil(filteredTemplates.length / SETTINGS_TPL_PAGE_SIZE)

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
            <p className="text-[11px] md:text-xs text-textSecondary">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 md:px-6 py-2.5 md:py-3 border-b border-border space-y-2">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => { setCategoryFilter(cat.key); setPage(0) }}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
                categoryFilter === cat.key
                  ? 'bg-primary text-white'
                  : 'bg-bgPrimary text-textSecondary hover:bg-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        {/* Color Filter */}
        <div className="flex items-center gap-2 md:gap-3">
          <span className="text-xs font-medium text-textSecondary">Color</span>
          <div className="flex items-center gap-1.5">
            {COLOR_FAMILIES.map(cf => (
              <button
                key={cf.key}
                onClick={() => { setColorFilter(cf.key); setPage(0) }}
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
      </div>

      {/* Template Grid */}
      <div className="p-3 md:p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <p className="text-sm text-textSecondary">Loading templates...</p>
          </div>
        ) : pagedTemplates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-textSecondary">No templates match this filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {pagedTemplates.map(template => {
              const isSelected = currentTemplateId === template.id
              const colors = getSettingsPreviewColors(template)
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
                  <div className="aspect-[3/4] bg-gray-50 p-2 relative">
                    <div className="w-full h-full bg-white rounded shadow-sm overflow-hidden flex flex-col">
                      <div className="h-[18%] flex items-center px-2" style={{ backgroundColor: colors.headerBg }}>
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[6px] font-bold tracking-wider" style={{ color: colors.headerBg === colors.accent ? '#FFFFFF' : colors.accent }}>
                            INVOICE
                          </span>
                          <div className="flex flex-col items-end gap-0.5">
                            <div className="w-6 h-0.5 rounded-full" style={{ backgroundColor: colors.accent, opacity: 0.3 }} />
                            <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: colors.accent, opacity: 0.2 }} />
                          </div>
                        </div>
                      </div>
                      <div className="px-2 py-1 flex gap-1.5">
                        <div className="flex-1">
                          <div className="w-8 h-0.5 rounded-full bg-gray-300 mb-0.5" />
                          <div className="w-10 h-0.5 rounded-full bg-gray-200 mb-0.5" />
                          <div className="w-8 h-0.5 rounded-full bg-gray-200" />
                        </div>
                        <div className="flex-1">
                          <div className="w-6 h-0.5 rounded-full bg-gray-300 mb-0.5" />
                          <div className="w-9 h-0.5 rounded-full bg-gray-200 mb-0.5" />
                          <div className="w-7 h-0.5 rounded-full bg-gray-200" />
                        </div>
                      </div>
                      <div className="px-2 flex-1">
                        <div className="h-[1px] mb-0.5" style={{ backgroundColor: colors.accent, opacity: 0.3 }} />
                        {[1, 2, 3].map(i => (
                          <div key={i} className="flex items-center gap-0.5 mb-0.5">
                            <div className="flex-1 h-0.5 rounded-full bg-gray-200" />
                            <div className="w-3 h-0.5 rounded-full bg-gray-200" />
                            <div className="w-4 h-0.5 rounded-full bg-gray-300" />
                          </div>
                        ))}
                      </div>
                      <div className="px-2 pb-1.5 flex justify-end">
                        <div className="flex items-center gap-0.5">
                          <div className="w-5 h-0.5 rounded-full" style={{ backgroundColor: colors.accent, opacity: 0.5 }} />
                          <div className="w-6 h-1 rounded-full" style={{ backgroundColor: colors.accent }} />
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center shadow">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                    {isSelecting && (
                      <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="px-2.5 py-2 bg-white border-t border-border/50">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: template.previewColor }} />
                      <span className="text-[11px] font-semibold text-textPrimary truncate">{template.name}</span>
                    </div>
                    <p className="text-[9px] text-textSecondary mt-0.5 line-clamp-1 pl-4">{template.category}</p>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-2.5 py-1 text-[11px] font-medium rounded-lg border border-border text-textSecondary hover:bg-bgPrimary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-[11px] text-textSecondary">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-2.5 py-1 text-[11px] font-medium rounded-lg border border-border text-textSecondary hover:bg-bgPrimary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
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

        {/* Text Signature — hidden, not currently used
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
        */}
      </div>
    </div>
  )
}

export function AccountSection({ onLogout, onManageSubscription }) {
  const queryClient = useQueryClient()
  const history = useHistory()
  const setAuth = useAuthStore((state) => state.setAuth)
  const logout = useAuthStore((state) => state.logout)
  const authUser = useAuthStore((state) => state.user)

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteError, setDeleteError] = useState('')

  const deleteAccountMutation = useMutation({
    mutationFn: () => authApi.deleteAccount(),
    onSuccess: () => {
      // Clear all local data
      queryClient.clear()
      localStorage.clear()
      sessionStorage.clear()
      logout()
      history.replace('/auth/phone')
    },
    onError: (err) => {
      setDeleteError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to delete account. Please try again.')
    }
  })

  const handleDeleteAccount = () => {
    if (deleteConfirmText !== 'DELETE') return
    setDeleteError('')
    deleteAccountMutation.mutate()
  }

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await authApi.getCurrentUser()
      return response.data
    }
  })

  const [profileForm, setProfileForm] = useState({ name: '', email: '' })
  const [profileDirty, setProfileDirty] = useState(false)

  // Phone change state
  const [showPhoneChange, setShowPhoneChange] = useState(false)
  const [newPhone, setNewPhone] = useState('')
  const [phoneOtp, setPhoneOtp] = useState('')
  const [phoneStep, setPhoneStep] = useState('input') // 'input' | 'otp'
  const [phoneError, setPhoneError] = useState('')

  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name || '', email: user.email || '' })
    }
  }, [user])

  const updateProfileMutation = useMutation({
    mutationFn: (data) => authApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      setProfileDirty(false)
    }
  })

  const initiatePhoneMutation = useMutation({
    mutationFn: (phone) => authApi.initiatePhoneChange(phone),
    onSuccess: () => {
      setPhoneStep('otp')
      setPhoneError('')
    },
    onError: (err) => {
      setPhoneError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to send OTP')
    }
  })

  const confirmPhoneMutation = useMutation({
    mutationFn: ({ phone, otp }) => authApi.confirmPhoneChange(phone, otp),
    onSuccess: (response) => {
      const data = response.data
      if (data.token) {
        const currentAuth = useAuthStore.getState()
        setAuth(data.token, data.user || currentAuth.user, currentAuth.business)
      }
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      setShowPhoneChange(false)
      setNewPhone('')
      setPhoneOtp('')
      setPhoneStep('input')
      setPhoneError('')
    },
    onError: (err) => {
      setPhoneError(err.response?.data?.error?.message || err.response?.data?.message || 'Invalid OTP')
    }
  })

  const handleProfileSave = () => {
    updateProfileMutation.mutate(profileForm)
  }

  const handleProfileChange = (field, value) => {
    setProfileForm(prev => ({ ...prev, [field]: value }))
    setProfileDirty(true)
  }

  const handleSendPhoneOtp = () => {
    setPhoneError('')
    const phoneRegex = /^[6-9]\d{9}$/
    if (!phoneRegex.test(newPhone)) {
      setPhoneError('Please enter a valid 10-digit phone number')
      return
    }
    initiatePhoneMutation.mutate(newPhone)
  }

  const handleConfirmPhoneChange = () => {
    if (phoneOtp.length !== 6) {
      setPhoneError('Please enter a valid 6-digit OTP')
      return
    }
    confirmPhoneMutation.mutate({ phone: newPhone, otp: phoneOtp })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-3 md:space-y-6">
      {/* Profile Information */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-4 py-3 md:px-6 md:py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5 md:gap-3">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-xs md:text-sm font-semibold text-textPrimary">Profile Information</h3>
              <p className="text-[11px] md:text-xs text-textSecondary">Your personal account details</p>
            </div>
          </div>
          {profileDirty && (
            <button
              onClick={handleProfileSave}
              disabled={updateProfileMutation.isPending}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-primary active:bg-primaryHover md:hover:bg-primaryHover rounded-lg flex items-center gap-1.5 disabled:opacity-60"
            >
              {updateProfileMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Save
            </button>
          )}
          {!profileDirty && updateProfileMutation.isSuccess && (
            <span className="text-xs text-green-600 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Saved
            </span>
          )}
        </div>
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 md:gap-5">
            <FieldInput
              label="Full Name"
              value={profileForm.name}
              onChange={(v) => handleProfileChange('name', v)}
              placeholder="Your name"
            />
            <FieldInput
              label="Email"
              type="email"
              value={profileForm.email}
              onChange={(v) => handleProfileChange('email', v)}
              placeholder="your@email.com"
            />
          </div>
        </div>
      </div>

      {/* Phone Number */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-4 py-3 md:px-6 md:py-4 border-b border-border flex items-center gap-2.5 md:gap-3">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
            <Phone className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-600" />
          </div>
          <div>
            <h3 className="text-xs md:text-sm font-semibold text-textPrimary">Phone Number</h3>
            <p className="text-[11px] md:text-xs text-textSecondary">Used for login and verification</p>
          </div>
        </div>
        <div className="p-4 md:p-6">
          {!showPhoneChange ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-textSecondary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-textPrimary">+91 {user?.phone || authUser?.phone || '—'}</p>
                  <p className="text-xs text-textSecondary">Primary phone number</p>
                </div>
              </div>
              <button
                onClick={() => setShowPhoneChange(true)}
                className="px-3 py-1.5 text-xs font-semibold text-primary active:bg-blue-50 md:hover:bg-blue-50 rounded-lg border border-primary/30 flex items-center gap-1.5"
              >
                <Pencil className="w-3 h-3" />
                Change
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {phoneStep === 'input' ? (
                <>
                  <div>
                    <label className="text-xs font-medium text-textSecondary mb-1.5 block">New Phone Number</label>
                    <div className="flex gap-2">
                      <span className="px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm text-textSecondary">+91</span>
                      <input
                        type="tel"
                        value={newPhone}
                        onChange={(e) => { setNewPhone(e.target.value); setPhoneError('') }}
                        placeholder="10-digit phone number"
                        maxLength={10}
                        inputMode="numeric"
                        className="flex-1 px-3.5 py-2.5 bg-white border border-border rounded-lg text-sm text-textPrimary placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                    </div>
                  </div>
                  {phoneError && <p className="text-xs text-red-600">{phoneError}</p>}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSendPhoneOtp}
                      disabled={initiatePhoneMutation.isPending || newPhone.length !== 10}
                      className="px-4 py-2 text-sm font-semibold text-white bg-primary active:bg-primaryHover md:hover:bg-primaryHover rounded-lg flex items-center gap-1.5 disabled:opacity-60"
                    >
                      {initiatePhoneMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Send OTP'}
                    </button>
                    <button
                      onClick={() => { setShowPhoneChange(false); setNewPhone(''); setPhoneError('') }}
                      className="px-4 py-2 text-sm font-medium text-textSecondary active:bg-gray-100 md:hover:bg-gray-100 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-textSecondary">
                    Enter the 6-digit OTP sent to <span className="font-semibold text-textPrimary">+91 {newPhone}</span>
                  </p>
                  <input
                    type="tel"
                    value={phoneOtp}
                    onChange={(e) => { setPhoneOtp(e.target.value); setPhoneError('') }}
                    placeholder="6-digit OTP"
                    maxLength={6}
                    inputMode="numeric"
                    autoFocus
                    className="w-full max-w-[200px] px-3.5 py-2.5 bg-white border border-border rounded-lg text-sm text-textPrimary placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 tracking-widest text-center"
                  />
                  {phoneError && <p className="text-xs text-red-600">{phoneError}</p>}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleConfirmPhoneChange}
                      disabled={confirmPhoneMutation.isPending || phoneOtp.length !== 6}
                      className="px-4 py-2 text-sm font-semibold text-white bg-primary active:bg-primaryHover md:hover:bg-primaryHover rounded-lg flex items-center gap-1.5 disabled:opacity-60"
                    >
                      {confirmPhoneMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Verify & Change'}
                    </button>
                    <button
                      onClick={() => { setPhoneStep('input'); setPhoneOtp(''); setPhoneError('') }}
                      className="px-4 py-2 text-sm font-medium text-textSecondary active:bg-gray-100 md:hover:bg-gray-100 rounded-lg"
                    >
                      Back
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-4 py-3 md:px-6 md:py-4 border-b border-border flex items-center gap-2.5 md:gap-3">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
            <Shield className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600" />
          </div>
          <div>
            <h3 className="text-xs md:text-sm font-semibold text-textPrimary">Account</h3>
            <p className="text-[11px] md:text-xs text-textSecondary">Account created {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'} · v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0'}</p>
          </div>
        </div>
        <div className="p-4 md:p-6 flex flex-wrap gap-3">
          <button
            onClick={onManageSubscription}
            className="px-5 py-2.5 text-sm font-semibold text-primary bg-blue-50 active:bg-blue-100 md:hover:bg-blue-100 rounded-lg border border-blue-100 flex items-center gap-2 transition-colors"
          >
            <Crown className="w-4 h-4" />
            Manage Subscription
          </button>
          <button
            onClick={() => {
              queryClient.clear()
              window.location.reload()
            }}
            className="px-5 py-2.5 text-sm font-semibold text-amber-700 bg-amber-50 active:bg-amber-100 md:hover:bg-amber-100 rounded-lg border border-amber-100 flex items-center gap-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear Cache
          </button>
          <button
            onClick={onLogout}
            className="px-5 py-2.5 text-sm font-semibold text-red-600 bg-red-50 active:bg-red-100 md:hover:bg-red-100 rounded-lg border border-red-100 flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Danger Zone — Delete Account */}
      <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 md:px-6 md:py-4 border-b border-red-100 flex items-center gap-2.5 md:gap-3">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-500" />
          </div>
          <div>
            <h3 className="text-xs md:text-sm font-semibold text-red-700">Danger Zone</h3>
            <p className="text-[11px] md:text-xs text-red-500">Irreversible actions</p>
          </div>
        </div>
        <div className="p-4 md:p-6">
          {!showDeleteConfirm ? (
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-textPrimary">Delete Account</p>
                <p className="text-xs text-textSecondary mt-0.5">
                  Permanently delete your account, business data, all invoices, customers, and products. This cannot be undone.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 active:bg-red-100 md:hover:bg-red-100 rounded-lg border border-red-200 flex items-center gap-1.5 transition-colors shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                <p className="text-sm text-red-800 font-medium">Are you sure? This will permanently delete:</p>
                <ul className="mt-2 text-xs text-red-700 space-y-1 list-disc pl-4">
                  <li>Your account and profile</li>
                  <li>All business data and settings</li>
                  <li>All invoices, quotes, and receipts</li>
                  <li>All customers and products</li>
                  <li>Uploaded logos and signatures</li>
                </ul>
              </div>
              <div>
                <label className="text-xs font-semibold text-textSecondary block mb-1.5">
                  Type <span className="font-bold text-red-600">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => { setDeleteConfirmText(e.target.value.toUpperCase()); setDeleteError('') }}
                  placeholder="DELETE"
                  className="w-full max-w-[200px] px-3.5 py-2.5 bg-white border border-red-200 rounded-lg text-sm text-textPrimary placeholder-gray-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 tracking-widest text-center font-mono"
                  autoComplete="off"
                />
              </div>
              {deleteError && <p className="text-xs text-red-600">{deleteError}</p>}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'DELETE' || deleteAccountMutation.isPending}
                  className="px-4 py-2.5 text-sm font-semibold text-white bg-red-600 active:bg-red-700 md:hover:bg-red-700 rounded-lg flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {deleteAccountMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  Delete My Account
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); setDeleteError('') }}
                  disabled={deleteAccountMutation.isPending}
                  className="px-4 py-2.5 text-sm font-medium text-textSecondary active:bg-gray-100 md:hover:bg-gray-100 rounded-lg transition-colors"
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

// Toast notification component
function Toast({ toast, onDismiss }) {
  if (!toast) return null
  const isError = toast.type === 'error'
  return (
    <div className={`fixed top-4 right-4 z-[100] max-w-sm w-full animate-in slide-in-from-top-2 fade-in duration-200`}>
      <div className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border ${
        isError ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'
      }`}>
        {isError
          ? <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
          : <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-green-500" />
        }
        <p className="text-sm font-medium flex-1">{toast.message}</p>
        <button onClick={onDismiss} className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md hover:bg-black/5 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
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
  const [dirtyTabs, setDirtyTabs] = useState({}) // { business: true, gst: false, ... }
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(location.search)
    const section = params.get('section')
    return section && SETTINGS_TABS.some(t => t.key === section) ? section : 'business'
  })
  const [toast, setToast] = useState(null) // { type: 'success'|'error', message: string }
  const toastTimerRef = useRef(null)
  const emptyTaxForm = { name: '', rate: '', isDefault: false, isGroup: false, components: [{ name: '', rate: '' }, { name: '', rate: '' }] }
  const [taxForm, setTaxForm] = useState(emptyTaxForm)
  const [showTaxForm, setShowTaxForm] = useState(false) // 'add' | 'edit' | false
  const [editingTaxId, setEditingTaxId] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null) // { id, name, productCount }
  const [deleteError, setDeleteError] = useState('')
  const tabsRef = useRef(null)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Toast helper
  const showToast = useCallback((type, message) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast({ type, message })
    toastTimerRef.current = setTimeout(() => setToast(null), 4000)
  }, [])

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast(null)
  }, [])

  // Is any tab dirty?
  const isDirty = Object.values(dirtyTabs).some(Boolean)
  // Is the current tab dirty?
  const isActiveTabDirty = !!dirtyTabs[activeTab]

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
    }
  })

  useEffect(() => {
    if (business && !isDirty) {
      setFormData({
        ...business,
        enabledInvoiceTypes: business.enabledInvoiceTypes || DEFAULT_ENABLED_TYPES
      })
    }
  }, [business])

  // Shared mutation success/error handlers
  const onMutationSuccess = (response, tabKey) => {
    queryClient.invalidateQueries({ queryKey: ['business'] })
    setDirtyTabs(prev => ({ ...prev, [tabKey]: false }))
    const msg = response?.data?.message || 'Settings saved successfully'
    showToast('success', msg)
  }

  const onMutationError = (err) => {
    const msg = err?.response?.data?.error?.message || err?.message || 'Failed to save. Please try again.'
    showToast('error', msg)
  }

  // Per-tab mutations
  const businessInfoMutation = useMutation({
    mutationFn: (data) => businessApi.updateBusinessInfo(data),
    onSuccess: (res) => onMutationSuccess(res, 'business'),
    onError: onMutationError
  })

  const gstMutation = useMutation({
    mutationFn: (data) => businessApi.updateGstSettings(data),
    onSuccess: (res) => onMutationSuccess(res, 'gst'),
    onError: onMutationError
  })

  const bankMutation = useMutation({
    mutationFn: (data) => businessApi.updateBankSettings(data),
    onSuccess: (res) => onMutationSuccess(res, 'bank'),
    onError: onMutationError
  })

  const invoiceMutation = useMutation({
    mutationFn: (data) => businessApi.updateInvoiceSettings(data),
    onSuccess: (res) => onMutationSuccess(res, 'invoice'),
    onError: onMutationError
  })

  // Legacy mutation (for backward compat — sidebar default change, etc.)
  const updateMutation = useMutation({
    mutationFn: (data) => businessApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business'] })
      setDirtyTabs({})
    },
    onError: onMutationError
  })

  // Which mutation is pending for the current tab?
  const isSaving = activeTab === 'business' ? businessInfoMutation.isPending
    : activeTab === 'gst' ? gstMutation.isPending
    : activeTab === 'bank' ? bankMutation.isPending
    : activeTab === 'invoice' ? invoiceMutation.isPending
    : false

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
      closeTaxForm()
    }
  })

  const updateTaxRateMutation = useMutation({
    mutationFn: ({ id, data }) => taxRateApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxRates'] })
      closeTaxForm()
    }
  })

  const deleteTaxRateMutation = useMutation({
    mutationFn: (id) => taxRateApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxRates'] })
      setDeleteConfirm(null)
      setDeleteError('')
    },
    onError: (err) => {
      setDeleteError(err.response?.data?.error?.message || 'Failed to delete')
    }
  })

  const closeTaxForm = () => {
    setShowTaxForm(false)
    setEditingTaxId(null)
    setTaxForm(emptyTaxForm)
  }

  const openAddForm = () => {
    setTaxForm(emptyTaxForm)
    setEditingTaxId(null)
    setShowTaxForm('add')
  }

  const openEditForm = (tr) => {
    const isGroup = tr.components && Array.isArray(tr.components) && tr.components.length >= 2
    setTaxForm({
      name: tr.name,
      rate: String(Number(tr.rate)),
      isDefault: tr.isDefault,
      isGroup,
      components: isGroup
        ? tr.components.map(c => ({ name: c.name, rate: String(c.rate) }))
        : [{ name: '', rate: '' }, { name: '', rate: '' }]
    })
    setEditingTaxId(tr.id)
    setShowTaxForm('edit')
  }

  const handleSaveTaxRate = () => {
    if (!taxForm.name.trim()) return
    if (taxForm.isGroup) {
      const validComponents = taxForm.components.filter(c => c.name.trim() && c.rate !== '' && parseFloat(c.rate) >= 0)
      if (validComponents.length < 2) return
      const totalRate = validComponents.reduce((sum, c) => sum + parseFloat(c.rate), 0)
      const payload = {
        name: taxForm.name.trim(),
        rate: Math.round(totalRate * 100) / 100,
        isDefault: taxForm.isDefault,
        components: validComponents.map(c => ({ name: c.name.trim(), rate: parseFloat(c.rate) }))
      }
      if (showTaxForm === 'edit' && editingTaxId) {
        updateTaxRateMutation.mutate({ id: editingTaxId, data: payload })
      } else {
        createTaxRateMutation.mutate(payload)
      }
    } else {
      if (!taxForm.rate) return
      const payload = {
        name: taxForm.name.trim(),
        rate: parseFloat(taxForm.rate),
        isDefault: taxForm.isDefault,
        components: null
      }
      if (showTaxForm === 'edit' && editingTaxId) {
        updateTaxRateMutation.mutate({ id: editingTaxId, data: payload })
      } else {
        createTaxRateMutation.mutate(payload)
      }
    }
  }

  const handleSetDefault = (taxRate) => {
    updateTaxRateMutation.mutate({ id: taxRate.id, data: { isDefault: true } })
  }

  const confirmDelete = (tr) => {
    setDeleteError('')
    setDeleteConfirm({ id: tr.id, name: tr.name, productCount: tr.productCount || 0 })
  }

  const executeDelete = () => {
    if (deleteConfirm) {
      deleteTaxRateMutation.mutate(deleteConfirm.id)
    }
  }

  // Map fields to their owning tab
  const fieldTabMap = {
    name: 'business', phone: 'business', email: 'business', website: 'business', address: 'business', logoUrl: 'business',
    gstEnabled: 'gst', gstin: 'gst', stateCode: 'gst', defaultTaxRate: 'gst',
    bankName: 'bank', accountNumber: 'bank', ifscCode: 'bank', upiId: 'bank', signatureUrl: 'bank', signatureName: 'bank',
    enableStatusWorkflow: 'invoice', enablePoNumber: 'invoice', invoicePrefix: 'invoice', nextInvoiceNumber: 'invoice',
    defaultNotes: 'invoice', defaultTerms: 'invoice', enabledInvoiceTypes: 'invoice',
    documentTypeConfig: 'invoice', defaultDocType: 'invoice',
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    const tab = fieldTabMap[field] || activeTab
    setDirtyTabs(prev => ({ ...prev, [tab]: true }))
  }

  const handleSave = () => {
    if (activeTab === 'business') {
      const { name, phone, email, website, address, logoUrl } = formData
      businessInfoMutation.mutate({ name, phone, email, website, address, logoUrl })
    } else if (activeTab === 'gst') {
      const { gstEnabled, gstin, stateCode, defaultTaxRate } = formData
      gstMutation.mutate({ gstEnabled, gstin, stateCode, defaultTaxRate })
    } else if (activeTab === 'bank') {
      const { bankName, accountNumber, ifscCode, upiId, signatureUrl, signatureName } = formData
      bankMutation.mutate({ bankName, accountNumber, ifscCode, upiId, signatureUrl, signatureName })
    } else if (activeTab === 'invoice') {
      const { enableStatusWorkflow, enablePoNumber, invoicePrefix, nextInvoiceNumber, defaultNotes, defaultTerms, enabledInvoiceTypes, documentTypeConfig, defaultDocType } = formData
      invoiceMutation.mutate({ enableStatusWorkflow, enablePoNumber, invoicePrefix, nextInvoiceNumber, defaultNotes, defaultTerms, enabledInvoiceTypes, documentTypeConfig, defaultDocType })
    }
  }

  const handleLogout = () => {
    queryClient.clear()
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
      {/* Toast Notification */}
      <Toast toast={toast} onDismiss={dismissToast} />

      {/* Mobile Header — compact, like Invoice Detail page */}
      <div className="md:hidden px-3 py-2 border-b border-border bg-white shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-bold text-textPrimary">Settings</h1>
          <div className="flex items-center gap-2">
            {isActiveTabDirty ? (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-3 py-1.5 bg-primary active:bg-primaryHover text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 disabled:opacity-60"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Mobile Tab Bar — scrollable, like Invoice Detail action bar */}
      <div className="md:hidden flex items-center gap-2 px-3 py-2 border-b border-border bg-white overflow-x-auto no-scrollbar shrink-0">
        {SETTINGS_TABS.map((tab) => {
          const active = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => tab.key === 'subscription' ? history.push('/plans') : setActiveTab(tab.key)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                active
                  ? 'text-primary bg-blue-50 border border-blue-200'
                  : 'text-textSecondary active:text-textPrimary active:bg-gray-50 border border-border'
              }`}
            >
              <tab.icon className={`w-3.5 h-3.5 ${active ? 'text-primary' : 'text-gray-400'}`} />
              {tab.mobileLabel}
            </button>
          )
        })}
      </div>

      {/* Desktop Header — full PageToolbar */}
      <div className="hidden md:block">
        <PageToolbar
          title="Settings"
          subtitle="Manage your business profile, tax configuration, and invoice defaults"
          actions={
            <>
              {isActiveTabDirty && (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-primary md:hover:bg-primaryHover text-white rounded-lg transition-all font-semibold text-sm shadow-sm flex items-center gap-2 disabled:opacity-60"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              )}
            </>
          }
        >
          {/* Tab Navigation — Desktop */}
          <div className="relative mt-2">
            <div
              ref={tabsRef}
              onScroll={handleTabScroll}
              className="flex items-center gap-1 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar"
            >
              {SETTINGS_TABS.map((tab) => {
                const active = activeTab === tab.key
                return (
                  <button
                    key={tab.key}
                    onClick={() => tab.key === 'subscription' ? history.push('/plans') : setActiveTab(tab.key)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
                      active
                        ? 'text-primary bg-blue-50 border border-blue-100 shadow-sm'
                        : 'text-textSecondary hover:text-textPrimary hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <tab.icon className={`w-4 h-4 ${active ? 'text-primary' : 'text-gray-400'}`} />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>
        </PageToolbar>
      </div>

      {/* Content Area */}
      <div className="flex-1 px-3 md:px-8 py-3 md:py-6 pb-mobile-nav overflow-y-auto">
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
                    setDirtyTabs(prev => ({ ...prev, business: true }))
                  }}
                />
              </div>
            </div>
          )}

          {/* GST Settings Tab — Tax Rates & Tax Groups Management */}
          {activeTab === 'gst' && (
            <>
              {/* GST Info Toggle */}
                

              {/* Tax Rates & Groups Card */}
              <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="px-4 py-3 md:px-6 md:py-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2.5 md:gap-3">
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                      <Percent className="w-3.5 h-3.5 md:w-4 md:h-4 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-xs md:text-sm font-semibold text-textPrimary">Tax Rates & Groups</h3>
                      <p className="text-[11px] md:text-xs text-textSecondary hidden sm:block">Create taxes to apply on your products and invoices</p>
                    </div>
                  </div>
                  {!showTaxForm && (
                    <button
                      onClick={openAddForm}
                      className="px-2.5 py-1.5 md:px-3.5 md:py-2 text-[11px] md:text-xs font-semibold text-primary bg-blue-50 active:bg-blue-100 md:hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1 md:gap-1.5 border border-blue-100"
                    >
                      <Plus className="w-3 h-3 md:w-3.5 md:h-3.5" />
                      Add
                    </button>
                  )}
                </div>
                <div className="p-4 md:p-6 space-y-3 md:space-y-4">

                  {/* Add / Edit tax rate form */}
                  {showTaxForm && (
                    <div className={`p-4 rounded-xl border space-y-4 ${showTaxForm === 'edit' ? 'bg-amber-50/50 border-amber-200' : 'bg-blue-50/50 border-blue-100'}`}>
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-textPrimary uppercase tracking-wider">
                          {showTaxForm === 'edit' ? 'Edit Tax' : 'New Tax'}
                        </h4>
                        <button onClick={closeTaxForm} className="w-7 h-7 flex items-center justify-center text-textSecondary active:text-textPrimary md:hover:text-textPrimary active:bg-gray-100 md:hover:bg-gray-100 rounded-lg transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Type toggle */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setTaxForm(prev => ({ ...prev, isGroup: false }))}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                            !taxForm.isGroup
                              ? 'bg-primary text-white shadow-sm'
                              : 'bg-white text-textSecondary border border-border active:bg-gray-50 md:hover:bg-gray-50'
                          }`}
                        >
                          <Percent className="w-3 h-3" />
                          Single Tax
                        </button>
                        <button
                          type="button"
                          onClick={() => setTaxForm(prev => ({ ...prev, isGroup: true }))}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                            taxForm.isGroup
                              ? 'bg-primary text-white shadow-sm'
                              : 'bg-white text-textSecondary border border-border active:bg-gray-50 md:hover:bg-gray-50'
                          }`}
                        >
                          <Layers className="w-3 h-3" />
                          Tax Group
                        </button>
                      </div>

                      {/* Helpful hint */}
                      <p className="text-[11px] text-textSecondary leading-relaxed">
                        {taxForm.isGroup
                          ? 'A tax group combines multiple taxes (e.g., CGST 9% + SGST 9% = GST 18%). Each component shows separately on invoices.'
                          : 'A single tax rate like IGST 18% or VAT 5%. Use this for simple, flat-rate taxes.'
                        }
                      </p>

                      {!taxForm.isGroup ? (
                        /* Simple Tax Rate Form */
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-textSecondary mb-1">Name</label>
                            <input
                              type="text"
                              value={taxForm.name}
                              onChange={(e) => setTaxForm(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="e.g., IGST 18%"
                              autoFocus
                              className="w-full px-3.5 py-2.5 bg-white border border-border rounded-lg text-sm text-textPrimary placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-textSecondary mb-1">Rate (%)</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={taxForm.rate}
                              onChange={(e) => setTaxForm(prev => ({ ...prev, rate: e.target.value }))}
                              placeholder="e.g., 18"
                              className="w-full px-3.5 py-2.5 bg-white border border-border rounded-lg text-sm text-textPrimary placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                            />
                          </div>
                        </div>
                      ) : (
                        /* Tax Group Form */
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-textSecondary mb-1">Group Name</label>
                            <input
                              type="text"
                              value={taxForm.name}
                              onChange={(e) => setTaxForm(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="e.g., GST 18%"
                              autoFocus
                              className="w-full px-3.5 py-2.5 bg-white border border-border rounded-lg text-sm text-textPrimary placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                            />
                          </div>

                          {/* Component taxes */}
                          <div className="space-y-2">
                            <label className="block text-[11px] font-semibold text-textSecondary">Components</label>
                            {taxForm.components.map((comp, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={comp.name}
                                  onChange={(e) => {
                                    const updated = [...taxForm.components]
                                    updated[idx] = { ...updated[idx], name: e.target.value }
                                    setTaxForm(prev => ({ ...prev, components: updated }))
                                  }}
                                  placeholder={idx === 0 ? 'e.g., CGST' : idx === 1 ? 'e.g., SGST' : 'Tax name'}
                                  className="flex-1 px-3 py-2 bg-white border border-border rounded-lg text-sm text-textPrimary placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                                />
                                <div className="relative w-24 shrink-0">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={comp.rate}
                                    onChange={(e) => {
                                      const updated = [...taxForm.components]
                                      updated[idx] = { ...updated[idx], rate: e.target.value }
                                      setTaxForm(prev => ({ ...prev, components: updated }))
                                    }}
                                    placeholder="Rate"
                                    className="w-full px-3 py-2 pr-7 bg-white border border-border rounded-lg text-sm text-textPrimary placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-right"
                                  />
                                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-textSecondary pointer-events-none">%</span>
                                </div>
                                {taxForm.components.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = taxForm.components.filter((_, i) => i !== idx)
                                      setTaxForm(prev => ({ ...prev, components: updated }))
                                    }}
                                    className="w-8 h-8 flex items-center justify-center text-textSecondary active:text-red-500 md:hover:text-red-500 active:bg-red-50 md:hover:bg-red-50 rounded-lg transition-colors shrink-0"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => setTaxForm(prev => ({ ...prev, components: [...prev.components, { name: '', rate: '' }] }))}
                              className="text-xs font-medium text-primary active:text-primaryHover md:hover:text-primaryHover flex items-center gap-1 py-1"
                            >
                              <Plus className="w-3 h-3" />
                              Add another component
                            </button>
                          </div>

                          {/* Auto-calculated total */}
                          {(() => {
                            const validComps = taxForm.components.filter(c => c.rate !== '' && parseFloat(c.rate) >= 0)
                            const totalRate = validComps.reduce((sum, c) => sum + parseFloat(c.rate || 0), 0)
                            return validComps.length >= 2 ? (
                              <div className="flex items-center gap-2 px-3 py-2 bg-white border border-green-200 rounded-lg">
                                <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                                <span className="text-xs text-textSecondary">Total:</span>
                                <span className="text-sm font-bold text-green-700">{Math.round(totalRate * 100) / 100}%</span>
                                <span className="text-[10px] text-textSecondary hidden sm:inline">
                                  ({taxForm.components.filter(c => c.name.trim() && c.rate).map(c => `${c.name} ${c.rate}%`).join(' + ')})
                                </span>
                              </div>
                            ) : null
                          })()}
                        </div>
                      )}

                      {/* Default checkbox + action buttons */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={taxForm.isDefault}
                            onChange={(e) => setTaxForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                            className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary/20"
                          />
                          <span className="text-xs text-textPrimary">Use as default for new items</span>
                        </label>
                        <div className="flex items-center gap-2 sm:ml-auto">
                          <button
                            onClick={closeTaxForm}
                            className="px-4 py-2 text-xs font-medium text-textSecondary active:text-textPrimary md:hover:text-textPrimary active:bg-gray-100 md:hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveTaxRate}
                            disabled={(createTaxRateMutation.isPending || updateTaxRateMutation.isPending) || !taxForm.name.trim() || (!taxForm.isGroup && !taxForm.rate) || (taxForm.isGroup && taxForm.components.filter(c => c.name.trim() && c.rate !== '' && parseFloat(c.rate) >= 0).length < 2)}
                            className="px-4 py-2 text-xs font-semibold text-white bg-primary active:bg-primaryHover md:hover:bg-primaryHover rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                          >
                            {(createTaxRateMutation.isPending || updateTaxRateMutation.isPending) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            {showTaxForm === 'edit' ? 'Save Changes' : taxForm.isGroup ? 'Add Group' : 'Add Tax'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tax rates & groups list */}
                  {taxRatesLoading ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    </div>
                  ) : taxRates.length === 0 && !showTaxForm ? (
                    <div className="text-center py-10">
                      <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-3">
                        <Percent className="w-6 h-6 text-orange-400" />
                      </div>
                      <p className="text-sm font-medium text-textPrimary">No taxes set up yet</p>
                      <p className="text-xs text-textSecondary mt-1 max-w-xs mx-auto">Create a tax rate (e.g., IGST 18%) or a tax group (e.g., CGST 9% + SGST 9%) to use on your products and invoices.</p>
                      <button
                        onClick={openAddForm}
                        className="mt-4 px-4 py-2 text-xs font-semibold text-primary bg-blue-50 active:bg-blue-100 md:hover:bg-blue-100 rounded-lg transition-colors inline-flex items-center gap-1.5 border border-blue-100"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Create your first tax
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {taxRates.map((tr) => {
                        const isGroup = tr.components && Array.isArray(tr.components) && tr.components.length >= 2
                        const isEditing = editingTaxId === tr.id && showTaxForm === 'edit'
                        const hasProducts = (tr.productCount || 0) > 0
                        if (isEditing) return null // form is shown above
                        return (
                          <div
                            key={tr.id}
                            className="px-4 py-3 bg-gray-50/80 active:bg-gray-100 md:hover:bg-gray-100 rounded-xl border border-border/80 transition-colors group"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                  isGroup ? 'bg-blue-100 text-blue-700' : tr.isDefault ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                                }`}>
                                  {isGroup
                                    ? <Layers className="w-4 h-4" />
                                    : <span className="text-xs font-bold">{Number(tr.rate)}%</span>
                                  }
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-sm font-semibold text-textPrimary">{tr.name}</span>
                                    {tr.isDefault && (
                                      <span className="text-[9px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                                        Default
                                      </span>
                                    )}
                                    {isGroup && (
                                      <span className="text-[9px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                                        Group
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-textSecondary mt-0.5">
                                    {isGroup
                                      ? tr.components.map(c => `${c.name} ${c.rate}%`).join(' + ') + ` = ${Number(tr.rate)}%`
                                      : `${Number(tr.rate)}% tax rate`
                                    }
                                  </div>
                                  {hasProducts && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <Package className="w-3 h-3 text-gray-400" />
                                      <span className="text-[10px] text-textSecondary">{tr.productCount} product{tr.productCount !== 1 ? 's' : ''} using this</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-0.5 shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                {!tr.isDefault && (
                                  <button
                                    onClick={() => handleSetDefault(tr)}
                                    title="Set as default"
                                    className="w-8 h-8 flex items-center justify-center text-textSecondary active:text-yellow-600 md:hover:text-yellow-600 active:bg-yellow-50 md:hover:bg-yellow-50 rounded-lg transition-colors"
                                  >
                                    <Star className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => openEditForm(tr)}
                                  title="Edit"
                                  className="w-8 h-8 flex items-center justify-center text-textSecondary active:text-primary md:hover:text-primary active:bg-blue-50 md:hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => confirmDelete(tr)}
                                  title="Delete"
                                  className="w-8 h-8 flex items-center justify-center text-textSecondary active:text-red-500 md:hover:text-red-500 active:bg-red-50 md:hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Delete Confirmation Dialog */}
              {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setDeleteConfirm(null); setDeleteError('') }} />
                  <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
                    <div className="p-5 text-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                        deleteConfirm.productCount > 0 ? 'bg-amber-100' : 'bg-red-100'
                      }`}>
                        <AlertTriangle className={`w-6 h-6 ${deleteConfirm.productCount > 0 ? 'text-amber-600' : 'text-red-600'}`} />
                      </div>
                      <h3 className="text-base font-bold text-textPrimary mb-1">Delete "{deleteConfirm.name}"?</h3>
                      {deleteConfirm.productCount > 0 ? (
                        <p className="text-sm text-textSecondary">
                          This tax is used by <strong className="text-amber-700">{deleteConfirm.productCount} product{deleteConfirm.productCount !== 1 ? 's' : ''}</strong>. Remove it from those products first before deleting.
                        </p>
                      ) : (
                        <p className="text-sm text-textSecondary">
                          This will permanently remove this tax. This action cannot be undone.
                        </p>
                      )}
                      {deleteError && (
                        <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                          {deleteError}
                        </div>
                      )}
                    </div>
                    <div className="flex border-t border-border">
                      <button
                        onClick={() => { setDeleteConfirm(null); setDeleteError('') }}
                        className="flex-1 px-4 py-3 text-sm font-medium text-textSecondary active:bg-gray-50 md:hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      {deleteConfirm.productCount > 0 ? (
                        <button
                          onClick={() => { setDeleteConfirm(null); setDeleteError('') }}
                          className="flex-1 px-4 py-3 text-sm font-semibold text-amber-700 active:bg-amber-50 md:hover:bg-amber-50 border-l border-border transition-colors"
                        >
                          Understood
                        </button>
                      ) : (
                        <button
                          onClick={executeDelete}
                          disabled={deleteTaxRateMutation.isPending}
                          className="flex-1 px-4 py-3 text-sm font-semibold text-red-600 active:bg-red-50 md:hover:bg-red-50 border-l border-border transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                        >
                          {deleteTaxRateMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
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

              {/* Invoice Status Workflow */}
              <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="px-4 py-3 md:px-6 md:py-4 border-b border-border flex items-center gap-2.5 md:gap-3">
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-xs md:text-sm font-semibold text-textPrimary">Invoice Status Workflow</h3>
                    <p className="text-[11px] md:text-xs text-textSecondary">Control how invoice statuses are managed</p>
                  </div>
                </div>
                <div className="p-4 md:p-6">
                  <FieldToggle
                    label="Enable Issue & Payment Tracking"
                    description="When enabled, invoices go through Draft → Issued → Paid. When disabled (default), invoices are saved as Paid directly."
                    checked={formData.enableStatusWorkflow || false}
                    onChange={(v) => handleChange('enableStatusWorkflow', v)}
                  />
                  <p className="text-[11px] text-textSecondary mt-3 ml-1">
                    {formData.enableStatusWorkflow
                      ? '✓ Invoices will be saved as Draft first. You can then Issue and Mark as Paid separately.'
                      : '✓ Invoices are saved as Paid immediately — ideal for businesses that don\'t need payment tracking.'}
                  </p>
                </div>
              </div>

              {/* PO Number on Customers */}
              <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="px-4 py-3 md:px-6 md:py-4 border-b border-border flex items-center gap-2.5 md:gap-3">
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                    <Hash className="w-3.5 h-3.5 md:w-4 md:h-4 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="text-xs md:text-sm font-semibold text-textPrimary">Purchase Order (PO) Number</h3>
                    <p className="text-[11px] md:text-xs text-textSecondary">Attach PO numbers to customers for auto-fill</p>
                  </div>
                </div>
                <div className="p-4 md:p-6">
                  <FieldToggle
                    label="Enable PO Number on Customers"
                    description="When enabled, you can add a PO number to each customer. It will auto-populate when selecting a customer on a new invoice."
                    checked={formData.enablePoNumber || false}
                    onChange={(v) => handleChange('enablePoNumber', v)}
                  />
                  <p className="text-[11px] text-textSecondary mt-3 ml-1">
                    {formData.enablePoNumber
                      ? '✓ PO Number field is visible on customer forms and auto-fills on invoices.'
                      : '✓ PO Number is hidden — enable to track purchase orders per customer.'}
                  </p>
                </div>
              </div>

              {/* Document Type Settings — unified section for all users */}
              <DocumentTypeSettingsSection
                enabledTypes={formData.enabledInvoiceTypes || DEFAULT_ENABLED_TYPES}
                documentTypeConfig={formData.documentTypeConfig || null}
                onChange={(config) => handleChange('documentTypeConfig', config)}
                hasPaidPlan={!!formData.planId}
                legacyDefaults={{
                  invoicePrefix: formData.invoicePrefix,
                  nextInvoiceNumber: formData.nextInvoiceNumber,
                  defaultNotes: formData.defaultNotes,
                  defaultTerms: formData.defaultTerms,
                }}
              />

              {/* Advanced: Document Types selector — paid plan only */}
              {formData.planId ? (
                <div className="space-y-3 md:space-y-6">
                  <div className="flex items-center gap-2 pt-2">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[11px] font-bold text-textSecondary uppercase tracking-widest">Advanced Settings</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <InvoiceTypesSection
                    enabledTypes={formData.enabledInvoiceTypes || DEFAULT_ENABLED_TYPES}
                    onChange={(types) => handleChange('enabledInvoiceTypes', types)}
                    defaultDocType={formData.defaultDocType || 'invoice'}
                    onDefaultChange={(docType) => handleChange('defaultDocType', docType)}
                  />
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                  <div className="px-4 py-3 md:px-6 md:py-4 border-b border-border flex items-center gap-2.5 md:gap-3">
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <Lock className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-xs md:text-sm font-semibold text-textPrimary">More Document Types</h3>
                      <p className="text-[11px] md:text-xs text-textSecondary">Unlock 12 document types with a paid plan</p>
                    </div>
                  </div>
                  <div className="p-4 md:p-6 text-center">
                    <Lock className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-textPrimary mb-1">Upgrade to unlock</p>
                    <p className="text-xs text-textSecondary mb-4 max-w-sm mx-auto">
                      Access all 12 document types including Proforma Invoice, Estimate, Credit Note, Purchase Order and more.
                    </p>
                    <a
                      href="/plans"
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary active:bg-primaryHover md:hover:bg-primaryHover rounded-lg transition-colors"
                    >
                      View Plans
                    </a>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Invoice Templates Tab — separate from Invoice Settings */}
          {activeTab === 'templates' && (
            <TemplateSection />
          )}

          
        </div>
      </div>


    </div>
  )
}
