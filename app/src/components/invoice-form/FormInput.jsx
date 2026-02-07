/**
 * FormInput — Themed input field with label, optional trailing icon.
 */
export default function FormInput({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  trailingIcon: TrailingIcon,
  className = ''
}) {
  return (
    <div className="mb-4 last:mb-0">
      {label && (
        <label className="text-[11px] font-bold text-textSecondary uppercase tracking-wider mb-1.5 block">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full px-3 py-2.5 md:py-2 bg-white border border-border rounded-md text-sm font-semibold text-textPrimary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all ${className}`}
        />
        {TrailingIcon && (
          <TrailingIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-textSecondary/30" />
        )}
      </div>
    </div>
  )
}
