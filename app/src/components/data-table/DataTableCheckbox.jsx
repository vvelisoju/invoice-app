import { Check } from 'lucide-react'

export default function DataTableCheckbox({ checked, onChange, size = 'md' }) {
  const sizeClasses = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'
  const iconSize = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5'

  return (
    <label className={`relative ${sizeClasses} cursor-pointer`} onClick={(e) => e.stopPropagation()}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        className="peer absolute w-full h-full opacity-0 cursor-pointer"
      />
      <div className={`${sizeClasses} border rounded transition-all flex items-center justify-center hover:border-primary peer-checked:bg-primary peer-checked:border-primary ${checked ? 'bg-primary border-primary' : 'border-gray-300 bg-white'}`}>
        {checked && <Check className={`${iconSize} text-white`} />}
      </div>
    </label>
  )
}
