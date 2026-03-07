import { useState, useEffect, useMemo, useRef, useCallback, lazy, Suspense } from 'react'
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
  Hash,
  Zap,
  CalendarClock,
  RefreshCw,
  XCircle,
  Eye,
  Download,
  Printer,
  Share2,
  MessageCircle,
  ArrowLeft
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pdf } from '@react-pdf/renderer'
import { businessApi, taxRateApi, templateApi, authApi, plansApi } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import { PageToolbar } from '../../components/data-table'
import { useSetSidebarContent } from '../../components/sidebar'
import SettingsNavSidebar from '../../components/sidebar/SettingsNavSidebar'
import { ALL_INVOICE_TYPES, DEFAULT_ENABLED_TYPES } from '../../components/layout/navigationConfig'
import { TEMPLATE_REGISTRY, COLOR_FAMILIES, CATEGORIES, getTemplateList } from '../invoices/utils/templates/registry'
import { DOCUMENT_TYPE_DEFAULTS } from '../../config/documentTypeDefaults'
import BusinessInfoForm, { FieldInput, FieldTextarea, FieldToggle } from '../../components/settings/BusinessInfoForm'
import { downloadPDF, sharePDF, printPDF } from '../invoices/utils/pdfGenerator.jsx'
import { isNative } from '../../lib/capacitor'
import { openExternalUrl } from '../../lib/nativeBrowser'
import SubscriptionInvoicePdf from '../plans/SubscriptionInvoicePdf'
const PdfViewer = lazy(() => import('../../components/MobilePdfViewer'))

const SETTINGS_TABS = [
  { key: 'business', label: 'Business Info', mobileLabel: 'Business', icon: Building2, group: 'business' },
  { key: 'gst', label: 'Tax Rates & Groups', mobileLabel: 'Tax', icon: Receipt, group: 'business' },
  { key: 'bank', label: 'Bank & Payment', mobileLabel: 'Bank', icon: CreditCard, group: 'business' },
  { key: 'invoice', label: 'Invoice Settings', mobileLabel: 'Invoice', icon: FileText, group: 'invoice' },
  { key: 'doctypes', label: 'Document Types', mobileLabel: 'Doc Types', icon: Layers, group: 'invoice' },
  { key: 'templates', label: 'Templates', mobileLabel: 'Templates', icon: Palette, group: 'invoice' },
  { key: 'plans', label: 'Plans & Pricing', mobileLabel: 'Plans', icon: Crown, group: 'billing' },
  { key: 'billing', label: 'Billing History', mobileLabel: 'Billing', icon: Receipt, group: 'billing' },
]

const SETTINGS_GROUPS = [
  { key: 'business', label: 'Business' },
  { key: 'invoice', label: 'Invoice' },
  { key: 'billing', label: 'Billing' },
]

function DocumentTypeSettingsSection({ enabledTypes, documentTypeConfig, onChange, hasPaidPlan, legacyDefaults }) {
  const [expandedType, setExpandedType] = useState(null)
  const history = useHistory()

  const handleFieldChange = (typeKey, field, value) => {
    const current = documentTypeConfig || {}
    const typeOverrides = { ...(current[typeKey] || {}) }
    if (field === 'nextNumber') {
      const num = parseInt(value, 10)
      if (!value || isNaN(num) || num < 1) {
        // Keep 1 as minimum — nextNumber is mandatory for all document types
        typeOverrides.nextNumber = 1
      } else {
        typeOverrides.nextNumber = num
      }
    } else if (field === 'prefix') {
      if (value === undefined || value === null) {
        delete typeOverrides.prefix
      } else {
        // Store even empty string — user explicitly wants no prefix
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

  const handleAddCustomField = (typeKey) => {
    const current = documentTypeConfig || {}
    const typeOverrides = { ...(current[typeKey] || {}) }
    const existing = typeOverrides.customFields || []
    const id = `cf_${Date.now()}`
    typeOverrides.customFields = [...existing, { id, label: '', type: 'text', zone: 'header-meta', defaultValue: '', required: false, showOnPdf: true }]
    onChange({ ...current, [typeKey]: typeOverrides })
  }

  const handleUpdateCustomField = (typeKey, fieldId, key, value) => {
    const current = documentTypeConfig || {}
    const typeOverrides = { ...(current[typeKey] || {}) }
    const fields = (typeOverrides.customFields || []).map(f =>
      f.id === fieldId ? { ...f, [key]: value } : f
    )
    typeOverrides.customFields = fields
    onChange({ ...current, [typeKey]: typeOverrides })
  }

  const handleRemoveCustomField = (typeKey, fieldId) => {
    const current = documentTypeConfig || {}
    const typeOverrides = { ...(current[typeKey] || {}) }
    typeOverrides.customFields = (typeOverrides.customFields || []).filter(f => f.id !== fieldId)
    if (typeOverrides.customFields.length === 0) delete typeOverrides.customFields
    const updated = { ...current, [typeKey]: typeOverrides }
    if (Object.keys(updated[typeKey] || {}).length === 0) delete updated[typeKey]
    onChange(updated)
  }

  const getOverride = (typeKey, labelKey) => {
    return documentTypeConfig?.[typeKey]?.labels?.[labelKey] || ''
  }

  const getField = (typeKey, field) => {
    const val = documentTypeConfig?.[typeKey]?.[field]
    return val !== undefined && val !== null ? String(val) : undefined
  }

  // For the legacy 'invoice' type, fall back to business-level defaults if no per-type override exists
  const getFieldWithLegacy = (typeKey, field) => {
    const perType = getField(typeKey, field)
    if (perType !== undefined) return perType
    if (typeKey === 'invoice' && legacyDefaults) {
      if (field === 'prefix' && legacyDefaults.invoicePrefix != null) return legacyDefaults.invoicePrefix
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
      <div className="px-3 py-2 md:px-5 md:py-2.5 border-b border-border flex items-center gap-2.5 md:gap-3">
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
          const explicitPrefix = getField(type.key, 'prefix')
          const previewPrefix = explicitPrefix !== undefined
            ? explicitPrefix
            : (getFieldWithLegacy(type.key, 'prefix') || type.defaults.prefix)
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
                          value={explicitPrefix !== undefined
                            ? explicitPrefix
                            : (getFieldWithLegacy(type.key, 'prefix') || type.defaults.prefix || '')}
                          onChange={(e) => handleFieldChange(type.key, 'prefix', e.target.value)}
                          placeholder={type.defaults.prefix || 'INV-'}
                          maxLength={10}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Next Number <span className="text-red-400">*</span></label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={getFieldWithLegacy(type.key, 'nextNumber') || '1'}
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
                        onClick={() => history.push('/settings?section=plans')}
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

                  {/* Custom Fields */}
                  <div>
                    <p className={sectionTitleClass}>Custom Fields</p>
                    <p className="text-[10px] text-textSecondary mb-2">Add extra fields that appear on the invoice form and PDF. E.g. "Period of Service", "Project Name".</p>
                    <div className="space-y-2.5">
                      {(documentTypeConfig?.[type.key]?.customFields || []).map((cf) => (
                        <div key={cf.id} className="bg-white border border-border rounded-lg p-3 space-y-2">
                          <div className="flex items-start gap-2">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                              <div>
                                <label className={labelClass}>Field Label <span className="text-red-400">*</span></label>
                                <input
                                  type="text"
                                  value={cf.label || ''}
                                  onChange={(e) => handleUpdateCustomField(type.key, cf.id, 'label', e.target.value)}
                                  placeholder="e.g. Period of Service"
                                  className={inputClass}
                                />
                              </div>
                              <div>
                                <label className={labelClass}>Type</label>
                                <select
                                  value={cf.type || 'text'}
                                  onChange={(e) => handleUpdateCustomField(type.key, cf.id, 'type', e.target.value)}
                                  className={inputClass}
                                >
                                  <option value="text">Text</option>
                                  <option value="date">Date</option>
                                  <option value="textarea">Multiline Text</option>
                                </select>
                              </div>
                              <div>
                                <label className={labelClass}>Placement</label>
                                <select
                                  value={cf.zone || 'header-meta'}
                                  onChange={(e) => handleUpdateCustomField(type.key, cf.id, 'zone', e.target.value)}
                                  className={inputClass}
                                >
                                  <option value="header-meta">Header (beside Invoice #)</option>
                                  <option value="before-line-items">Before Line Items</option>
                                  <option value="after-line-items">After Line Items</option>
                                  <option value="footer">Footer (below totals)</option>
                                </select>
                              </div>
                              <div>
                                <label className={labelClass}>Default Value</label>
                                <input
                                  type="text"
                                  value={cf.defaultValue || ''}
                                  onChange={(e) => handleUpdateCustomField(type.key, cf.id, 'defaultValue', e.target.value)}
                                  placeholder="Optional default"
                                  className={inputClass}
                                />
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveCustomField(type.key, cf.id)}
                              className="mt-5 p-1.5 rounded-md text-red-400 active:text-red-600 md:hover:text-red-600 active:bg-red-50 md:hover:bg-red-50 transition-colors shrink-0"
                              title="Remove field"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-4 pt-1 border-t border-border/50">
                            <label className="flex items-center gap-1.5 text-[11px] text-textSecondary cursor-pointer">
                              <input
                                type="checkbox"
                                checked={cf.showOnPdf !== false}
                                onChange={(e) => handleUpdateCustomField(type.key, cf.id, 'showOnPdf', e.target.checked)}
                                className="rounded border-border text-primary focus:ring-primary/20 w-3.5 h-3.5"
                              />
                              Show on PDF
                            </label>
                            <label className="flex items-center gap-1.5 text-[11px] text-textSecondary cursor-pointer">
                              <input
                                type="checkbox"
                                checked={cf.required === true}
                                onChange={(e) => handleUpdateCustomField(type.key, cf.id, 'required', e.target.checked)}
                                className="rounded border-border text-primary focus:ring-primary/20 w-3.5 h-3.5"
                              />
                              Required
                            </label>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => handleAddCustomField(type.key)}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-primary bg-primary/5 border border-dashed border-primary/30 rounded-lg active:bg-primary/10 md:hover:bg-primary/10 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Custom Field
                      </button>
                    </div>
                  </div>
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
      <div className="px-3 py-2 md:px-5 md:py-2.5 border-b border-border flex items-center gap-2.5 md:gap-3">
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
      <div className="px-3 py-2 md:px-5 md:py-2.5 border-b border-border flex items-center justify-between">
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
      <div className="px-3 py-2 md:px-5 md:py-2.5 border-b border-border flex items-center gap-2.5 md:gap-3">
        <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-cyan-50 flex items-center justify-center shrink-0">
          <ImageIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-cyan-600" />
        </div>
        <div>
          <h3 className="text-xs md:text-sm font-semibold text-textPrimary">Business Logo</h3>
          <p className="text-[11px] md:text-xs text-textSecondary">Your logo will appear on invoices</p>
        </div>
      </div>
      <div className="p-3 md:p-4">
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
      <div className="px-3 py-2 md:px-5 md:py-2.5 border-b border-border flex items-center gap-2.5 md:gap-3">
        <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
          <PenLine className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-600" />
        </div>
        <div>
          <h3 className="text-xs md:text-sm font-semibold text-textPrimary">Signature</h3>
          <p className="text-[11px] md:text-xs text-textSecondary">Your signature will appear on invoices</p>
        </div>
      </div>
      <div className="p-3 md:p-4 space-y-4">
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

export function AccountSection({ onLogout }) {
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
        <div className="px-3 py-2 md:px-5 md:py-2.5 border-b border-border flex items-center justify-between">
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
        <div className="p-3 md:p-4">
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
        <div className="px-3 py-2 md:px-5 md:py-2.5 border-b border-border flex items-center gap-2.5 md:gap-3">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
            <Phone className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-600" />
          </div>
          <div>
            <h3 className="text-xs md:text-sm font-semibold text-textPrimary">Phone Number</h3>
            <p className="text-[11px] md:text-xs text-textSecondary">Used for login and verification</p>
          </div>
        </div>
        <div className="p-3 md:p-4">
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
        <div className="px-3 py-2 md:px-5 md:py-2.5 border-b border-border flex items-center gap-2.5 md:gap-3">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
            <Shield className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600" />
          </div>
          <div>
            <h3 className="text-xs md:text-sm font-semibold text-textPrimary">Account</h3>
            <p className="text-[11px] md:text-xs text-textSecondary">Account created {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'} · v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0'}</p>
          </div>
        </div>
        <div className="p-3 md:p-4 flex flex-wrap gap-3">
          <button
            onClick={() => history.push('/settings?section=plans')}
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
        <div className="px-3 py-2 md:px-5 md:py-2.5 border-b border-red-100 flex items-center gap-2.5 md:gap-3">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-500" />
          </div>
          <div>
            <h3 className="text-xs md:text-sm font-semibold text-red-700">Danger Zone</h3>
            <p className="text-[11px] md:text-xs text-red-500">Irreversible actions</p>
          </div>
        </div>
        <div className="p-3 md:p-4">
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

// ── Plans & Billing (inlined from PlansPage) ────────────────────────────

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) { resolve(true); return }
    const script = document.createElement('script')
    script.id = 'razorpay-script'
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

const PLAN_CONFIG = {
  free: { icon: Shield, gradient: 'from-gray-50 to-slate-50', border: 'border-gray-200', iconBg: 'bg-gray-100 text-gray-600', features: ['10 invoices/month', '20 customers', '20 products', '1 template'] },
  starter: { icon: Zap, gradient: 'from-blue-50 to-indigo-50', border: 'border-blue-200', iconBg: 'bg-blue-100 text-blue-600', features: ['200 invoices/month', '500 customers', '200 products', '3 templates'] },
  pro: { icon: Crown, gradient: 'from-amber-50 to-orange-50', border: 'border-amber-200', iconBg: 'bg-amber-100 text-amber-600', features: ['Unlimited invoices', 'Unlimited customers', 'Unlimited products', '10 templates'], popular: true },
}

const BILLING_STATUS_COLORS = {
  PAID: 'text-green-600 bg-green-50 border-green-200',
  PENDING: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  FAILED: 'text-red-600 bg-red-50 border-red-200',
  REFUNDED: 'text-gray-600 bg-gray-50 border-gray-200',
  CANCELLED: 'text-gray-500 bg-gray-50 border-gray-200',
}

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '₹0.00'
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
}

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function BillingInvoiceDetail({ invoice, onBack }) {
  const [pdfUrl, setPdfUrl] = useState(null)
  const [pdfBlob, setPdfBlob] = useState(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  useEffect(() => {
    let cancelled = false
    const generate = async () => {
      if (!invoice) return
      setIsGeneratingPdf(true)
      try {
        const blob = await pdf(<SubscriptionInvoicePdf invoice={invoice} />).toBlob()
        if (cancelled) return
        setPdfBlob(blob)
        setPdfUrl(URL.createObjectURL(blob))
      } catch (err) { console.error('Subscription invoice PDF generation failed:', err) }
      finally { if (!cancelled) setIsGeneratingPdf(false) }
    }
    generate()
    return () => { cancelled = true; if (pdfUrl) URL.revokeObjectURL(pdfUrl) }
  }, [invoice])

  const handleDownload = useCallback(async () => { if (pdfBlob && invoice) try { await downloadPDF(pdfBlob, `Subscription-Invoice-${invoice.invoiceNumber}.pdf`) } catch {} }, [pdfBlob, invoice])
  const handlePrint = useCallback(async () => { if (pdfBlob && invoice) try { await printPDF(pdfBlob, `Subscription-Invoice-${invoice.invoiceNumber}.pdf`) } catch {} }, [pdfBlob, invoice])
  const handleShare = useCallback(async () => { if (pdfBlob && invoice) try { await sharePDF(pdfBlob, `Subscription-Invoice-${invoice.invoiceNumber}.pdf`, { title: `Invoice ${invoice.invoiceNumber}`, text: `Subscription Invoice ${invoice.invoiceNumber}\nAmount: ₹${Number(invoice.total).toLocaleString('en-IN')}` }) } catch {} }, [pdfBlob, invoice])

  return (
    <div className="h-full flex flex-col -mx-3 md:-mx-4 -my-2 md:-my-2.5">
      <div className="px-3 md:px-4 py-1.5 border-b border-border bg-white shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-lg active:bg-bgPrimary md:hover:bg-bgPrimary text-textSecondary shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs font-bold text-textPrimary truncate">{invoice.invoiceNumber}</h1>
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-full shrink-0 ${BILLING_STATUS_COLORS[invoice.status] || BILLING_STATUS_COLORS.PENDING}`}>
                  {invoice.status}
                </span>
              </div>
              <span className="text-[10px] text-textSecondary">{formatDate(invoice.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={handleDownload} disabled={!pdfBlob} className="px-2 py-1 text-[10px] font-medium text-textSecondary hover:bg-bgPrimary rounded-md border border-border flex items-center gap-1 disabled:opacity-40"><Download className="w-3 h-3" />Download</button>
            <button onClick={handlePrint} disabled={!pdfBlob} className="px-2 py-1 text-[10px] font-medium text-textSecondary hover:bg-bgPrimary rounded-md border border-border flex items-center gap-1 disabled:opacity-40 hidden md:flex"><Printer className="w-3 h-3" />Print</button>
            <button onClick={handleShare} disabled={!pdfBlob} className="px-2 py-1 text-[10px] font-medium text-textSecondary hover:bg-bgPrimary rounded-md border border-border flex items-center gap-1 disabled:opacity-40"><Share2 className="w-3 h-3" />Share</button>
          </div>
        </div>
      </div>
      <div className="flex-1 bg-gray-100">
        {isGeneratingPdf ? (
          <div className="flex flex-col items-center justify-center h-full gap-3"><Loader2 className="w-6 h-6 text-primary animate-spin" /><p className="text-xs text-textSecondary">Generating PDF...</p></div>
        ) : pdfBlob ? (
          <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>}>
            <PdfViewer blob={pdfBlob} className="w-full h-full" />
          </Suspense>
        ) : (
          <div className="flex items-center justify-center h-full"><p className="text-xs text-textSecondary">PDF preview unavailable</p></div>
        )}
      </div>
    </div>
  )
}

function BillingHistoryTab() {
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['plans', 'billing-history'],
    queryFn: async () => { const res = await plansApi.getBillingHistory(); return res.data.data || res.data || [] }
  })

  if (selectedInvoice) return <BillingInvoiceDetail invoice={selectedInvoice} onBack={() => setSelectedInvoice(null)} />

  return (
    <div className="space-y-2">
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>
      ) : invoices.length === 0 ? (
        <div className="bg-white rounded-lg border border-border p-6 text-center">
          <Receipt className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-xs font-medium text-textPrimary">No billing history</p>
          <p className="text-[10px] text-textSecondary mt-0.5">Invoices appear here after subscribing.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <div className="px-3 py-1.5 border-b border-border flex items-center gap-2">
            <Receipt className="w-3.5 h-3.5 text-textSecondary" />
            <span className="text-[11px] font-semibold text-textPrimary">{invoices.length} Invoice{invoices.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="divide-y divide-border">
            {invoices.map(inv => (
              <button key={inv.id} onClick={() => setSelectedInvoice(inv)} className="w-full flex items-center justify-between px-3 py-2 active:bg-gray-50 md:hover:bg-gray-50 transition-colors text-left">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-mono font-semibold text-textPrimary">{inv.invoiceNumber}</span>
                    <span className={`text-[9px] font-semibold px-1 py-0.5 rounded-full border ${BILLING_STATUS_COLORS[inv.status] || BILLING_STATUS_COLORS.PENDING}`}>{inv.status}</span>
                  </div>
                  <p className="text-[10px] text-textSecondary">{formatDate(inv.createdAt)} · <span className="capitalize">{inv.billingPeriod || '—'}</span></p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-textPrimary">{formatCurrency(inv.total)}</span>
                  <Eye className="w-3.5 h-3.5 text-gray-300" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PlansTab() {
  const queryClient = useQueryClient()
  const [processingPlan, setProcessingPlan] = useState(null)
  const [billingPeriod, setBillingPeriod] = useState('yearly')
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const { data: planUsage, isLoading: usageLoading } = useQuery({
    queryKey: ['plans', 'usage'],
    queryFn: async () => { const r = await plansApi.getUsage(); return r.data.data || r.data }
  })
  const { data: availablePlans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['plans', 'list'],
    queryFn: async () => { const r = await plansApi.list(); return r.data.data || r.data || [] }
  })

  const subscribeMutation = useMutation({
    mutationFn: async ({ planId, period }) => {
      const orderRes = await plansApi.createOrder({ planId, billingPeriod: period })
      return { order: orderRes.data.data || orderRes.data, planId }
    },
    onSuccess: async ({ order, planId }) => {
      const loaded = await loadRazorpayScript()
      if (!loaded) { alert('Failed to load payment gateway.'); setProcessingPlan(null); return }
      const selectedPlan = availablePlans.find(p => p.id === planId)
      const options = {
        key: order.razorpayKeyId, amount: order.amount, currency: order.currency,
        name: 'Invoice Baba', description: `${selectedPlan?.displayName || 'Plan'} - ${order.billingPeriod === 'yearly' ? 'Yearly' : 'Monthly'}`,
        order_id: order.razorpayOrderId,
        handler: async (response) => {
          try {
            await plansApi.verifyPayment({ razorpayOrderId: response.razorpay_order_id, razorpayPaymentId: response.razorpay_payment_id, razorpaySignature: response.razorpay_signature, planId })
            queryClient.invalidateQueries(['plans']); setProcessingPlan(null)
          } catch { alert('Payment verification failed.'); setProcessingPlan(null) }
        },
        modal: { ondismiss: () => setProcessingPlan(null) },
        theme: { color: '#3B82F6' }
      }
      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', () => { alert('Payment failed.'); setProcessingPlan(null) })
      rzp.open()
    },
    onError: (err) => { alert(err?.response?.data?.error?.message || 'Failed to create order.'); setProcessingPlan(null) }
  })

  const cancelMutation = useMutation({
    mutationFn: async () => { const res = await plansApi.cancelSubscription({ reason: 'user_requested' }); return res.data.data || res.data },
    onSuccess: () => { queryClient.invalidateQueries(['plans']); setShowCancelConfirm(false) },
    onError: (err) => { alert(err?.response?.data?.error?.message || 'Failed to cancel.') }
  })

  const webBaseUrl = import.meta.env.VITE_WEB_URL || 'https://invoicebaba.com'
  const handleSubscribe = (planId) => {
    if (isNative()) { openExternalUrl(`${webBaseUrl}/plans`); return }
    setProcessingPlan(planId); subscribeMutation.mutate({ planId, period: billingPeriod })
  }

  const currentPlanId = planUsage?.plan?.id
  const currentPlanName = planUsage?.plan?.name || 'Free'
  const subscription = planUsage?.subscription
  const usage = planUsage?.usage
  const limit = planUsage?.plan?.monthlyInvoiceLimit || 10
  const used = usage?.invoicesIssued || 0
  const isUnlimited = limit >= 999999
  const displayLimit = isUnlimited ? '∞' : limit
  const percentage = isUnlimited ? 0 : (limit > 0 ? used / limit : 0)
  const isNearLimit = !isUnlimited && percentage >= 0.8
  const isAtLimit = !isUnlimited && percentage >= 1
  const barColor = isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-primary'
  const isLoading = usageLoading || plansLoading
  const sortedPlans = [...availablePlans].sort((a, b) => { const o = { free: 0, starter: 1, pro: 2 }; return (o[a.name] ?? 99) - (o[b.name] ?? 99) })

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>

  return (
    <div className="space-y-2">
      {/* Current Usage */}
      <div className="bg-white rounded-lg border border-border p-3">
        <div className="flex items-start justify-between mb-2 gap-2">
          <div className="min-w-0">
            <h2 className="text-xs font-semibold text-textPrimary">Current: {currentPlanName}</h2>
            {subscription?.status === 'ACTIVE' && !subscription?.cancelledAt && (
              <p className="text-[10px] text-green-600 mt-0.5 flex items-center gap-1 flex-wrap">
                <CheckCircle2 className="w-3 h-3 shrink-0" /> Active
                {subscription?.billingPeriod && <span className="text-textSecondary capitalize">· {subscription.billingPeriod}</span>}
                {subscription?.renewAt && <span className="text-textSecondary">· Renews {formatDate(subscription.renewAt)}</span>}
              </p>
            )}
            {subscription?.status === 'ACTIVE' && subscription?.cancelledAt && (
              <p className="text-[10px] text-amber-600 mt-0.5 flex items-center gap-1"><CalendarClock className="w-3 h-3 shrink-0" /> Cancelling{subscription?.renewAt && <span className="text-textSecondary">· until {formatDate(subscription.renewAt)}</span>}</p>
            )}
          </div>
          {isAtLimit && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-red-50 border border-red-200 rounded shrink-0">
              <AlertTriangle className="w-3 h-3 text-red-500" />
              <span className="text-[10px] font-medium text-red-600">Limit reached</span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gray-50 rounded-md p-2">
            <p className="text-[10px] text-textSecondary mb-0.5">Used</p>
            <p className="text-sm font-bold text-textPrimary">{used} <span className="text-[10px] font-normal text-textSecondary">/ {displayLimit}</span></p>
            {!isUnlimited && <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden mt-1"><div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(percentage * 100, 100)}%` }} /></div>}
          </div>
          <div className="bg-gray-50 rounded-md p-2">
            <p className="text-[10px] text-textSecondary mb-0.5">Remaining</p>
            <p className="text-sm font-bold text-textPrimary">{isUnlimited ? '∞' : Math.max(0, limit - used)}</p>
          </div>
          <div className="bg-gray-50 rounded-md p-2">
            <p className="text-[10px] text-textSecondary mb-0.5">Period</p>
            <p className="text-[10px] font-medium text-textPrimary">
              {usage?.periodStart ? new Date(usage.periodStart).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : '—'}
              {' — '}
              {usage?.periodEnd ? new Date(usage.periodEnd).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Subscription Management */}
      {subscription?.status === 'ACTIVE' && subscription?.amount > 0 && (
        <div className="bg-white rounded-lg border border-border p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <CreditCard className="w-3.5 h-3.5 text-textSecondary" />
            <h3 className="text-[11px] font-semibold text-textPrimary">Subscription</h3>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-2">
            <div className="bg-gray-50 rounded-md p-2"><p className="text-[9px] text-textSecondary">Billing</p><p className="text-[10px] font-semibold text-textPrimary capitalize">{subscription.billingPeriod || '—'}</p></div>
            <div className="bg-gray-50 rounded-md p-2"><p className="text-[9px] text-textSecondary">Amount</p><p className="text-[10px] font-semibold text-textPrimary">₹{Number(subscription.amount || 0).toLocaleString('en-IN')}</p></div>
            <div className="bg-gray-50 rounded-md p-2"><p className="text-[9px] text-textSecondary">Started</p><p className="text-[10px] font-semibold text-textPrimary">{subscription.startDate ? formatDate(subscription.startDate) : '—'}</p></div>
            <div className="bg-gray-50 rounded-md p-2"><p className="text-[9px] text-textSecondary">{subscription.cancelledAt ? 'Expires' : 'Renews'}</p><p className="text-[10px] font-semibold text-textPrimary">{subscription.renewAt ? formatDate(subscription.renewAt) : '—'}</p></div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {!subscription.cancelledAt ? (
              isNative() ? (
                <button onClick={() => openExternalUrl(`${webBaseUrl}/plans`)} className="px-2 py-1 text-[10px] font-medium text-primary active:bg-blue-50 rounded border border-blue-200 flex items-center gap-1"><CreditCard className="w-3 h-3" />Manage on Web</button>
              ) : (
                <>
                  <button onClick={() => handleSubscribe(currentPlanId)} disabled={!!processingPlan} className="px-2 py-1 text-[10px] font-medium text-primary active:bg-blue-50 rounded border border-blue-200 flex items-center gap-1 disabled:opacity-50"><RefreshCw className="w-3 h-3" />Renew</button>
                  <button onClick={() => setShowCancelConfirm(true)} className="px-2 py-1 text-[10px] font-medium text-red-600 active:bg-red-50 rounded border border-red-200 flex items-center gap-1"><XCircle className="w-3 h-3" />Cancel</button>
                </>
              )
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 border border-amber-200 rounded">
                <CalendarClock className="w-3 h-3 text-amber-600 shrink-0" />
                <p className="text-[10px] text-amber-700">Active until <span className="font-semibold">{subscription.renewAt ? formatDate(subscription.renewAt) : 'end of period'}</span></p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Plan Cards */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[10px] font-semibold text-textSecondary uppercase tracking-wider">Choose Plan</h3>
          <div className="flex items-center bg-gray-100 rounded-md p-0.5">
            <button onClick={() => setBillingPeriod('monthly')} className={`px-2 py-1 text-[10px] font-semibold rounded transition-all ${billingPeriod === 'monthly' ? 'bg-white text-textPrimary shadow-sm' : 'text-textSecondary'}`}>Monthly</button>
            <button onClick={() => setBillingPeriod('yearly')} className={`px-2 py-1 text-[10px] font-semibold rounded transition-all ${billingPeriod === 'yearly' ? 'bg-white text-textPrimary shadow-sm' : 'text-textSecondary'}`}>Yearly <span className="text-green-600 ml-0.5">-33%</span></button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {sortedPlans.filter(p => p.active !== false).map((plan) => {
            const planKey = plan.name?.toLowerCase() || 'free'
            const cfg = PLAN_CONFIG[planKey] || PLAN_CONFIG.free
            const isCurrent = plan.id === currentPlanId || (!currentPlanId && planKey === 'free')
            const isProcessing = processingPlan === plan.id
            const monthlyPrice = Number(plan.priceMonthly) || 0
            const yearlyPrice = Number(plan.priceYearly) || 0
            const yearlyMonthly = yearlyPrice > 0 ? Math.round(yearlyPrice / 12) : 0
            const isPaid = monthlyPrice > 0
            const IconComp = cfg.icon
            return (
              <div key={plan.id} className={`relative bg-gradient-to-br ${cfg.gradient} rounded-lg border-2 ${isCurrent ? 'border-primary ring-1 ring-primary/20' : cfg.border} overflow-hidden flex flex-col`}>
                {cfg.popular && !isCurrent && <div className="absolute top-0 right-0"><span className="px-2 py-0.5 text-[9px] font-bold text-white bg-amber-500 rounded-bl-md uppercase">Best</span></div>}
                {isCurrent && <div className="absolute top-0 right-0"><span className="px-2 py-0.5 text-[9px] font-bold text-white bg-primary rounded-bl-md uppercase">Current</span></div>}
                <div className="p-3 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center ${cfg.iconBg} shrink-0`}><IconComp className="w-3.5 h-3.5" /></div>
                      <div>
                        <h4 className="text-xs font-bold text-textPrimary">{plan.displayName || plan.name}</h4>
                        <p className="text-[9px] text-textSecondary leading-tight">{plan.description || ''}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {isPaid ? (
                        billingPeriod === 'yearly' ? (
                          <><p className="text-sm font-bold text-textPrimary">₹{yearlyMonthly}<span className="text-[9px] font-normal text-textSecondary">/mo</span></p><p className="text-[9px] text-green-600">₹{yearlyPrice}/yr</p></>
                        ) : <p className="text-sm font-bold text-textPrimary">₹{monthlyPrice}<span className="text-[9px] font-normal text-textSecondary">/mo</span></p>
                      ) : <p className="text-sm font-bold text-textPrimary">Free</p>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-2.5 gap-y-1 mb-2 flex-1">
                    {cfg.features.map((feat, i) => (
                      <div key={i} className="flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5 text-green-500 shrink-0" /><span className="text-[10px] text-textPrimary">{feat}</span></div>
                    ))}
                  </div>
                  {isCurrent ? (
                    <button disabled className="w-full py-1.5 rounded-md font-semibold text-[10px] bg-gray-100 text-gray-400 cursor-default">Current Plan</button>
                  ) : isPaid ? (
                    <button onClick={() => handleSubscribe(plan.id)} disabled={isProcessing} className="w-full py-1.5 rounded-md font-semibold text-[10px] bg-primary active:bg-primaryHover md:hover:bg-primaryHover text-white flex items-center justify-center gap-1 disabled:opacity-60">
                      {isProcessing ? <><Loader2 className="w-3 h-3 animate-spin" />Processing...</> : <><Zap className="w-3 h-3" />{billingPeriod === 'yearly' ? `Subscribe — ₹${yearlyPrice}/yr` : `Subscribe — ₹${monthlyPrice}/mo`}</>}
                    </button>
                  ) : (
                    <button disabled className="w-full py-1.5 rounded-md font-semibold text-[10px] bg-gray-100 text-gray-400 cursor-default">Free Forever</button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-lg border border-border p-3">
        <h3 className="text-[10px] font-semibold text-textPrimary mb-1.5">FAQ</h3>
        <div className="space-y-1.5">
          {[
            ['How does billing work?', 'Pay via Razorpay. Plan stays active for the billing period.'],
            ['What at limit?', "You can't issue new invoices until next month or upgrade."],
            ['Can I upgrade anytime?', 'Yes! New plan takes effect immediately.'],
            ['How to cancel?', 'Cancel above. Plan stays active until end of period.'],
          ].map(([q, a], i) => (
            <div key={i}><p className="text-[10px] font-medium text-textPrimary">{q}</p><p className="text-[9px] text-textSecondary">{a}</p></div>
          ))}
        </div>
      </div>

      {/* Cancel Confirmation */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowCancelConfirm(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0"><AlertTriangle className="w-4 h-4 text-red-600" /></div>
              <div><h3 className="text-xs font-bold text-textPrimary">Cancel Subscription?</h3><p className="text-[10px] text-textSecondary">Cannot be undone</p></div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-md p-2 mb-3">
              <p className="text-[10px] text-amber-800">{currentPlanName} plan active until <span className="font-semibold">{subscription?.renewAt ? formatDate(subscription.renewAt) : 'end of period'}</span>.</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowCancelConfirm(false)} className="flex-1 py-2 text-[10px] font-semibold text-textPrimary bg-gray-100 active:bg-gray-200 rounded-md">Keep</button>
              <button onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending} className="flex-1 py-2 text-[10px] font-semibold text-white bg-red-600 active:bg-red-700 rounded-md flex items-center justify-center gap-1 disabled:opacity-60">
                {cancelMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}Cancel
              </button>
            </div>
          </div>
        </div>
      )}
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
    : activeTab === 'doctypes' ? invoiceMutation.isPending
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
    gstEnabled: 'business', gstin: 'business', stateCode: 'business', defaultTaxRate: 'gst',
    bankName: 'bank', accountNumber: 'bank', ifscCode: 'bank', upiId: 'bank', signatureUrl: 'bank', signatureName: 'bank',
    enableStatusWorkflow: 'invoice', enablePoNumber: 'invoice', invoicePrefix: 'doctypes', nextInvoiceNumber: 'doctypes',
    defaultNotes: 'doctypes', defaultTerms: 'doctypes', enabledInvoiceTypes: 'doctypes',
    documentTypeConfig: 'doctypes', defaultDocType: 'doctypes',
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    const tab = fieldTabMap[field] || activeTab
    setDirtyTabs(prev => ({ ...prev, [tab]: true }))
  }

  const handleSave = () => {
    if (activeTab === 'business') {
      const { name, phone, email, website, address, logoUrl, gstEnabled, gstin, stateCode } = formData
      businessInfoMutation.mutate({ name, phone, email, website, address, logoUrl, gstEnabled, gstin, stateCode })
    } else if (activeTab === 'gst') {
      const { gstEnabled, gstin, stateCode, defaultTaxRate } = formData
      gstMutation.mutate({ gstEnabled, gstin, stateCode, defaultTaxRate })
    } else if (activeTab === 'bank') {
      const { bankName, accountNumber, ifscCode, upiId, signatureUrl, signatureName } = formData
      bankMutation.mutate({ bankName, accountNumber, ifscCode, upiId, signatureUrl, signatureName })
    } else if (activeTab === 'invoice') {
      const { enableStatusWorkflow, enablePoNumber } = formData
      invoiceMutation.mutate({ enableStatusWorkflow, enablePoNumber })
    } else if (activeTab === 'doctypes') {
      const { invoicePrefix, nextInvoiceNumber, defaultNotes, defaultTerms, enabledInvoiceTypes, documentTypeConfig, defaultDocType } = formData
      invoiceMutation.mutate({ invoicePrefix, nextInvoiceNumber, defaultNotes, defaultTerms, enabledInvoiceTypes, documentTypeConfig, defaultDocType })
    }
  }

  const handleLogout = () => {
    queryClient.clear()
    logout()
    history.replace('/auth/phone')
  }

  // Inject sidebar content for desktop
  const sidebarContent = useMemo(() => (
    <SettingsNavSidebar
      tabs={SETTINGS_TABS}
      groups={SETTINGS_GROUPS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      isDirty={isActiveTabDirty}
      onSave={handleSave}
      isSaving={isSaving}
    />
  ), [activeTab, isActiveTabDirty, isSaving])

  useSetSidebarContent(sidebarContent)

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

      {/* Mobile Header */}
      <div className="md:hidden px-3 pt-1.5 pb-1 border-b border-border bg-white shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-xs font-bold text-textPrimary">Settings</h1>
          {isActiveTabDirty && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-2 py-0.5 bg-primary active:bg-primaryHover text-white rounded-md font-semibold text-[10px] flex items-center gap-1 disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Save
            </button>
          )}
        </div>
      </div>
      {/* Mobile Tabs — grouped style */}
      <div className="md:hidden flex items-center gap-1 px-3 py-1 border-b border-border bg-white overflow-x-auto no-scrollbar shrink-0">
        {SETTINGS_TABS.map((tab) => {
          const active = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-2.5 py-1 text-[10px] font-medium rounded-md flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors ${
                active
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-textSecondary bg-gray-50 active:text-textPrimary active:bg-gray-100'
              }`}
            >
              <tab.icon className={`w-3 h-3 ${active ? 'text-white' : 'text-gray-400'}`} />
              {tab.mobileLabel}
            </button>
          )
        })}
      </div>

      {/* Desktop Header — simplified, tabs moved to sidebar */}
      <div className="hidden md:block">
        <PageToolbar
          title="Settings"
          actions={
            <>
              {isActiveTabDirty && (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-3 py-1 bg-primary md:hover:bg-primaryHover text-white rounded-md transition-all font-semibold text-[11px] shadow-sm flex items-center gap-1.5 disabled:opacity-60"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Changes
                </button>
              )}
            </>
          }
        />
      </div>

      {/* Content Area */}
      <div className="flex-1 px-3 md:px-4 py-1.5 md:py-2 pb-mobile-nav overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-1.5 md:space-y-2">

          {/* Business Information Tab */}
          {activeTab === 'business' && (
            <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
              <div className="px-3 py-1.5 md:px-4 md:py-2 border-b border-border flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
                  <Building2 className="w-3 h-3 text-primary" />
                </div>
                <div>
                  <h3 className="text-[11px] md:text-xs font-semibold text-textPrimary">Business Information</h3>
                  <p className="text-[10px] text-textSecondary">Company details on invoices</p>
                </div>
              </div>
              <div className="p-2.5 md:p-3">
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
              <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
                <div className="px-3 py-1.5 md:px-4 md:py-2 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-orange-50 flex items-center justify-center shrink-0">
                      <Percent className="w-3 h-3 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-[11px] md:text-xs font-semibold text-textPrimary">Tax Rates & Groups</h3>
                      <p className="text-[10px] text-textSecondary hidden sm:block">Taxes for products and invoices</p>
                    </div>
                  </div>
                  {!showTaxForm && (
                    <button
                      onClick={openAddForm}
                      className="px-2 py-1 text-[10px] font-semibold text-primary bg-blue-50 active:bg-blue-100 md:hover:bg-blue-100 rounded-md transition-colors flex items-center gap-1 border border-blue-100"
                    >
                      <Plus className="w-3 h-3" />
                      Add
                    </button>
                  )}
                </div>
                <div className="p-2.5 md:p-3 space-y-2">

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
            <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
              <div className="px-3 py-1.5 md:px-4 md:py-2 border-b border-border flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-orange-50 flex items-center justify-center shrink-0">
                  <CreditCard className="w-3 h-3 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-[11px] md:text-xs font-semibold text-textPrimary">Bank & Payment Details</h3>
                  <p className="text-[10px] text-textSecondary">Payment info on invoices</p>
                </div>
              </div>
              <div className="p-2.5 md:p-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 md:gap-3">
                  <FieldInput label="Bank Name" value={formData.bankName} onChange={(v) => handleChange('bankName', v)} placeholder="Bank name" />
                  <FieldInput label="Account Number" value={formData.accountNumber} onChange={(v) => handleChange('accountNumber', v)} placeholder="Account number" />
                  <FieldInput label="IFSC Code" value={formData.ifscCode} onChange={(v) => handleChange('ifscCode', v?.toUpperCase())} placeholder="IFSC code" maxLength={11} />
                  <FieldInput label="UPI ID" value={formData.upiId} onChange={(v) => handleChange('upiId', v)} placeholder="yourname@upi" />
                </div>
              </div>
            </div>
          )}

          {/* Invoice Settings Tab — Logo, Signature, Workflow toggles */}
          {activeTab === 'invoice' && (
            <>
              <LogoUploadSection
                logoUrl={formData.logoUrl}
                onUploaded={(url) => handleChange('logoUrl', url)}
                onRemove={() => handleChange('logoUrl', null)}
              />
              <SignatureSettingsSection
                signatureUrl={formData.signatureUrl}
                signatureName={formData.signatureName}
                businessName={formData.name}
                onSignatureUrlChange={(url) => handleChange('signatureUrl', url)}
                onSignatureNameChange={(name) => handleChange('signatureName', name)}
              />

              {/* Invoice Status Workflow — condensed */}
              <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
                <div className="p-3">
                  <FieldToggle
                    label="Status Workflow"
                    description="Draft → Issued → Paid flow. Off = saved as Paid directly."
                    checked={formData.enableStatusWorkflow || false}
                    onChange={(v) => handleChange('enableStatusWorkflow', v)}
                  />
                </div>
              </div>

              {/* PO Number — condensed */}
              <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
                <div className="p-3">
                  <FieldToggle
                    label="PO Number on Customers"
                    description="Add PO numbers to customers, auto-fills on new invoices."
                    checked={formData.enablePoNumber || false}
                    onChange={(v) => handleChange('enablePoNumber', v)}
                  />
                </div>
              </div>
            </>
          )}

          {/* Document Types Tab — separate from Invoice Settings */}
          {activeTab === 'doctypes' && (
            <>
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
              {formData.planId ? (
                <InvoiceTypesSection
                  enabledTypes={formData.enabledInvoiceTypes || DEFAULT_ENABLED_TYPES}
                  onChange={(types) => handleChange('enabledInvoiceTypes', types)}
                  defaultDocType={formData.defaultDocType || 'invoice'}
                  onDefaultChange={(docType) => handleChange('defaultDocType', docType)}
                />
              ) : (
                <div className="bg-white rounded-lg border border-border shadow-sm p-3 text-center">
                  <Lock className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs font-medium text-textPrimary mb-0.5">More Document Types</p>
                  <p className="text-[10px] text-textSecondary mb-2">Unlock 12 types with a paid plan.</p>
                  <button onClick={() => setActiveTab('plans')} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold text-white bg-primary active:bg-primaryHover md:hover:bg-primaryHover rounded-md">View Plans</button>
                </div>
              )}
            </>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && <TemplateSection />}

          {/* Plans & Pricing Tab */}
          {activeTab === 'plans' && <PlansTab />}

          {/* Billing History Tab */}
          {activeTab === 'billing' && <BillingHistoryTab />}

          
        </div>
      </div>


    </div>
  )
}
