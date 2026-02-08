import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../lib/api'
import {
  CreditCard, Check, X, Plus, Pencil, Trash2, Loader2,
  AlertTriangle, ToggleLeft, ToggleRight, Users, FileText, Package
} from 'lucide-react'

// ── Default entitlement keys the form exposes ──────────────────────
const ENTITLEMENT_FIELDS = [
  { key: 'monthlyInvoicesLimit', label: 'Invoices / month', icon: FileText, placeholder: 'e.g. 50 (blank = unlimited)' },
  { key: 'customersLimit', label: 'Customers', icon: Users, placeholder: 'e.g. 100 (blank = unlimited)' },
  { key: 'productsLimit', label: 'Products', icon: Package, placeholder: 'e.g. 50 (blank = unlimited)' },
  { key: 'templatesLimit', label: 'Templates', icon: CreditCard, placeholder: 'e.g. 3 (blank = unlimited)' },
]

const FEATURE_FLAGS = [
  { key: 'gstEnabled', label: 'GST Support' },
  { key: 'multipleTemplates', label: 'Multiple Templates' },
  { key: 'customBranding', label: 'Custom Branding' },
  { key: 'reportExport', label: 'Report Export' },
  { key: 'whatsappShare', label: 'WhatsApp Share' },
  { key: 'bulkExport', label: 'Bulk Export' },
  { key: 'prioritySupport', label: 'Priority Support' },
]

const EMPTY_FORM = {
  name: '',
  displayName: '',
  description: '',
  priceMonthly: '',
  priceYearly: '',
  entitlements: {},
  features: {},
  active: true,
}

function planToForm(plan) {
  const ent = plan.entitlements || {}
  const features = {}
  FEATURE_FLAGS.forEach(f => {
    features[f.key] = !!ent[f.key]
  })
  const entitlements = {}
  ENTITLEMENT_FIELDS.forEach(f => {
    entitlements[f.key] = ent[f.key] != null ? String(ent[f.key]) : ''
  })
  return {
    name: plan.name || '',
    displayName: plan.displayName || '',
    description: plan.description || '',
    priceMonthly: plan.priceMonthly != null ? String(plan.priceMonthly) : '',
    priceYearly: plan.priceYearly != null ? String(plan.priceYearly) : '',
    entitlements,
    features,
    active: plan.active !== false,
  }
}

function formToPayload(form) {
  const entitlements = {}
  ENTITLEMENT_FIELDS.forEach(f => {
    const v = form.entitlements[f.key]
    if (v !== '' && v != null) entitlements[f.key] = Number(v)
  })
  FEATURE_FLAGS.forEach(f => {
    entitlements[f.key] = !!form.features[f.key]
  })
  return {
    name: form.name.trim().toLowerCase().replace(/\s+/g, '_'),
    displayName: form.displayName.trim(),
    description: form.description.trim(),
    priceMonthly: form.priceMonthly ? parseFloat(form.priceMonthly) : null,
    priceYearly: form.priceYearly ? parseFloat(form.priceYearly) : null,
    entitlements,
    active: form.active,
  }
}

// ── Plan Form Modal ────────────────────────────────────────────────
function PlanFormModal({ isOpen, onClose, plan, onSaved }) {
  const queryClient = useQueryClient()
  const isEdit = !!plan
  const [form, setForm] = useState(() => isEdit ? planToForm(plan) : { ...EMPTY_FORM, entitlements: {}, features: {} })
  const [errors, setErrors] = useState({})

  const mutation = useMutation({
    mutationFn: (payload) => isEdit
      ? adminApi.updatePlan(plan.id, payload)
      : adminApi.createPlan(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] })
      onSaved?.()
      onClose()
    }
  })

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const updateEntitlement = (key, value) => {
    setForm(prev => ({ ...prev, entitlements: { ...prev.entitlements, [key]: value } }))
  }

  const toggleFeature = (key) => {
    setForm(prev => ({ ...prev, features: { ...prev.features, [key]: !prev.features[key] } }))
  }

  const validate = () => {
    const e = {}
    if (!form.displayName.trim()) e.displayName = 'Display name is required'
    if (!form.name.trim()) e.name = 'Slug is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    mutation.mutate(formToPayload(form))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Plan' : 'Create New Plan'}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{isEdit ? 'Update plan details and entitlements' : 'Define a new subscription plan'}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {mutation.isError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {mutation.error?.response?.data?.error?.message || mutation.error?.message || 'Failed to save plan'}
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Basic Info</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Display Name *</label>
                <input
                  value={form.displayName}
                  onChange={e => updateField('displayName', e.target.value)}
                  placeholder="e.g. Professional"
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${errors.displayName ? 'border-red-300' : 'border-gray-200'}`}
                />
                {errors.displayName && <p className="text-xs text-red-500 mt-0.5">{errors.displayName}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Slug (unique) *</label>
                <input
                  value={form.name}
                  onChange={e => updateField('name', e.target.value)}
                  placeholder="e.g. professional"
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${errors.name ? 'border-red-300' : 'border-gray-200'}`}
                />
                {errors.name && <p className="text-xs text-red-500 mt-0.5">{errors.name}</p>}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <input
                value={form.description}
                onChange={e => updateField('description', e.target.value)}
                placeholder="Short description of this plan"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Pricing (₹)</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Monthly Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.priceMonthly}
                  onChange={e => updateField('priceMonthly', e.target.value)}
                  placeholder="0 = Free"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Yearly Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.priceYearly}
                  onChange={e => updateField('priceYearly', e.target.value)}
                  placeholder="0 = Free"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Entitlements / Limits */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Limits</h3>
            <div className="grid grid-cols-2 gap-3">
              {ENTITLEMENT_FIELDS.map(f => {
                const Icon = f.icon
                return (
                  <div key={f.key}>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-1">
                      <Icon className="w-3.5 h-3.5 text-gray-400" />
                      {f.label}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.entitlements[f.key] || ''}
                      onChange={e => updateEntitlement(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Feature Flags */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Features</h3>
            <div className="grid grid-cols-2 gap-2">
              {FEATURE_FLAGS.map(f => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => toggleFeature(f.key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                    form.features[f.key]
                      ? 'border-green-200 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {form.features[f.key] ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-700">Active</p>
              <p className="text-xs text-gray-500">Inactive plans won't be shown to users</p>
            </div>
            <button
              type="button"
              onClick={() => updateField('active', !form.active)}
              className={`p-1 rounded-lg transition-colors ${form.active ? 'text-green-600' : 'text-gray-400'}`}
            >
              {form.active ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create Plan'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Delete Confirmation Modal ──────────────────────────────────────
function DeletePlanModal({ isOpen, onClose, plan }) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => adminApi.deletePlan(plan.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] })
      onClose()
    }
  })

  if (!isOpen || !plan) return null

  const businessCount = plan._count?.businesses || 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
          {businessCount > 0 ? 'Deactivate Plan' : 'Delete Plan'}
        </h3>
        <p className="text-sm text-gray-500 text-center mb-1">
          <span className="font-semibold text-gray-700">{plan.displayName || plan.name}</span>
        </p>
        {businessCount > 0 ? (
          <p className="text-sm text-amber-600 text-center mb-4">
            {businessCount} business(es) are using this plan. It will be deactivated (hidden from new users) but existing subscribers keep access.
          </p>
        ) : (
          <p className="text-sm text-gray-500 text-center mb-4">
            This plan will be deactivated and hidden from users.
          </p>
        )}
        {mutation.isError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 mb-4">
            {mutation.error?.response?.data?.error?.message || 'Failed to delete plan'}
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {businessCount > 0 ? 'Deactivate' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────
export default function AdminPlanListPage() {
  const [showForm, setShowForm] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [deletingPlan, setDeletingPlan] = useState(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'plans'],
    queryFn: () => adminApi.listPlans().then(r => r.data.data)
  })

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-32" />
          <div className="grid md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-60 bg-gray-200 rounded-xl" />)}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
          Failed to load plans: {error.message}
        </div>
      </div>
    )
  }

  const plans = Array.isArray(data) ? data : data?.plans || []

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Plans</h1>
          <p className="text-sm text-gray-500 mt-1">Manage subscription plans &middot; {plans.length} plan{plans.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setEditingPlan(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Plan
        </button>
      </div>

      {/* Plan Cards */}
      {plans.length === 0 ? (
        <div className="text-center py-16">
          <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No plans yet. Create your first plan to get started.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const ent = plan.entitlements || {}
            const businessCount = plan._count?.businesses || 0
            const isInactive = plan.active === false

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-xl border p-5 flex flex-col transition-shadow hover:shadow-md ${
                  isInactive ? 'border-gray-200 opacity-60' : 'border-gray-200'
                }`}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 truncate">{plan.displayName || plan.name}</h3>
                      {isInactive && (
                        <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-500 rounded">Inactive</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 font-mono">{plan.name}</p>
                    {plan.description && <p className="text-xs text-gray-500 mt-1">{plan.description}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      onClick={() => { setEditingPlan(plan); setShowForm(true) }}
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit plan"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingPlan(plan)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Pricing */}
                <div className="flex gap-3 mb-3">
                  <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-[10px] text-gray-400 uppercase font-medium">Monthly</p>
                    <p className="text-sm font-bold text-gray-900">
                      {plan.priceMonthly ? `₹${Number(plan.priceMonthly).toLocaleString('en-IN')}` : 'Free'}
                    </p>
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-[10px] text-gray-400 uppercase font-medium">Yearly</p>
                    <p className="text-sm font-bold text-gray-900">
                      {plan.priceYearly ? `₹${Number(plan.priceYearly).toLocaleString('en-IN')}` : 'Free'}
                    </p>
                  </div>
                </div>

                {/* Limits */}
                <div className="border-t border-gray-100 pt-3 mb-3">
                  <p className="text-[10px] text-gray-400 uppercase font-medium mb-2">Limits</p>
                  <div className="space-y-1.5">
                    {ENTITLEMENT_FIELDS.map(f => {
                      const Icon = f.icon
                      const val = ent[f.key]
                      return (
                        <div key={f.key} className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 text-gray-500">
                            <Icon className="w-3.5 h-3.5 text-gray-400" />
                            {f.label}
                          </span>
                          <span className="font-semibold text-gray-700">{val != null ? val.toLocaleString() : '∞'}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Features */}
                <div className="border-t border-gray-100 pt-3 mb-3">
                  <p className="text-[10px] text-gray-400 uppercase font-medium mb-2">Features</p>
                  <div className="flex flex-wrap gap-1.5">
                    {FEATURE_FLAGS.map(f => {
                      const enabled = ent[f.key]
                      return (
                        <span
                          key={f.key}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            enabled
                              ? 'bg-green-50 text-green-700'
                              : 'bg-gray-50 text-gray-400'
                          }`}
                        >
                          {enabled ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                          {f.label}
                        </span>
                      )
                    })}
                  </div>
                </div>

                {/* Footer Stats */}
                <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {businessCount} business{businessCount !== 1 ? 'es' : ''}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    plan.active !== false ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {plan.active !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modals */}
      <PlanFormModal
        key={editingPlan?.id || 'new'}
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingPlan(null) }}
        plan={editingPlan}
        onSaved={() => setEditingPlan(null)}
      />
      <DeletePlanModal
        isOpen={!!deletingPlan}
        onClose={() => setDeletingPlan(null)}
        plan={deletingPlan}
      />
    </div>
  )
}
