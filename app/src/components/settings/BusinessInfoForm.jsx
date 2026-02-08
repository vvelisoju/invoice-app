/**
 * BusinessInfoForm — Reusable business info fields.
 * Used in both SettingsPage (Business Info tab) and BusinessSettingsModal.
 */
export function FieldInput({ label, type = 'text', value, onChange, placeholder, maxLength, description }) {
  return (
    <div>
      <label className="block text-xs font-medium text-textSecondary mb-1 md:mb-1.5 ml-0.5">{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full px-3 py-2 md:px-3.5 md:py-2.5 bg-white border border-border rounded-lg text-sm text-textPrimary placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
      />
      {description && <p className="text-[11px] text-textSecondary mt-1 ml-0.5">{description}</p>}
    </div>
  )
}

export function FieldTextarea({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <div>
      <label className="block text-xs font-medium text-textSecondary mb-1 md:mb-1.5 ml-0.5">{label}</label>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 md:px-3.5 md:py-2.5 bg-white border border-border rounded-lg text-sm text-textPrimary placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none"
      />
    </div>
  )
}

export function FieldToggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-2.5 px-3 md:py-3 md:px-4 bg-gray-50 rounded-lg border border-border">
      <div className="min-w-0 mr-3">
        <span className="text-sm font-medium text-textPrimary">{label}</span>
        {description && <p className="text-xs text-textSecondary mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-gray-300'}`}
      >
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  )
}

export default function BusinessInfoForm({ formData, onChange, compact = false }) {
  const handleChange = (field, value) => {
    onChange({ ...formData, [field]: value })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 md:gap-5">
      <div className="md:col-span-2">
        <FieldInput label="Business Name" value={formData.name} onChange={(v) => handleChange('name', v)} placeholder="Your business name" />
      </div>
      <FieldInput label="Phone" type="tel" value={formData.phone} onChange={(v) => handleChange('phone', v)} placeholder="Business phone number" />
      <FieldInput label="Email" type="email" value={formData.email} onChange={(v) => handleChange('email', v)} placeholder="Business email" />
      {!compact && (
        <FieldInput label="Website" value={formData.website} onChange={(v) => handleChange('website', v)} placeholder="https://yourbusiness.com" />
      )}
      <div className="md:col-span-2">
        <FieldTextarea label="Address" value={formData.address} onChange={(v) => handleChange('address', v)} placeholder="Business address" />
      </div>
      <div className="md:col-span-2">
        <FieldToggle
          label="Enable GST"
          description="Show GST fields on invoices"
          checked={formData.gstEnabled || false}
          onChange={(v) => handleChange('gstEnabled', v)}
        />
      </div>
      {formData.gstEnabled && (
        <>
          <FieldInput label="GSTIN" value={formData.gstin} onChange={(v) => handleChange('gstin', v?.toUpperCase())} placeholder="15-digit GSTIN" maxLength={15} />
          {!compact && (
            <FieldInput label="State Code" value={formData.stateCode} onChange={(v) => handleChange('stateCode', v)} placeholder="e.g., 36" maxLength={2} />
          )}
        </>
      )}
    </div>
  )
}
