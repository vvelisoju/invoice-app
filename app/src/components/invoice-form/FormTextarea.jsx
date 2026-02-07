/**
 * FormTextarea — Themed textarea with focus/hover states matching the HTML design.
 */
export default function FormTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  className = ''
}) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className={`w-full p-4 bg-bgPrimary/30 hover:bg-bgPrimary/50 focus:bg-white border border-transparent hover:border-border focus:border-primary rounded-lg text-textPrimary placeholder-textSecondary/40 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all resize-none text-sm leading-relaxed ${className}`}
    />
  )
}
