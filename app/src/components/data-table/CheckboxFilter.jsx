import DataTableCheckbox from './DataTableCheckbox'

/**
 * Reusable secondary filter bar with checkboxes.
 *
 * Props:
 * - label: string — e.g. "Document Type:"
 * - options: Array<{ key, label, checked }>
 * - onChange: (key, checked) => void
 */
export default function CheckboxFilter({ label, options, onChange }) {
  return (
    <div className="bg-white border-b border-borderLight px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center gap-6 text-xs">
        <span className="text-textSecondary font-medium">{label}</span>
        {options.map((opt) => (
          <label key={opt.key} className="flex items-center gap-2 cursor-pointer select-none">
            <DataTableCheckbox
              size="sm"
              checked={opt.checked}
              onChange={(val) => onChange(opt.key, val)}
            />
            <span className="text-textPrimary">{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
