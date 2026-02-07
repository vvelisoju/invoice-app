/**
 * FormSection — A labeled section with an icon, title, and optional action button.
 * Used for "From", "Bill To", "Terms & Conditions", etc.
 */
export default function FormSection({
  icon: Icon,
  label,
  labelColorClass = 'text-primary',
  iconColorClass = 'text-primary/70',
  action,
  children
}) {
  return (
    <div className="group relative transition-all">
      <div className="flex justify-between items-center mb-2">
        <label className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wide ${labelColorClass}`}>
          {Icon && <Icon className={`w-3.5 h-3.5 ${iconColorClass}`} />}
          {label}
        </label>
        {action && action}
      </div>
      {children}
    </div>
  )
}
