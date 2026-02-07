import { Save } from 'lucide-react'

/**
 * InvoiceFooter — Bottom action bar (save button) at the bottom of the document card.
 */
export default function InvoiceFooter({ onSave, label = 'Save Invoice' }) {
  return (
    <div
      onClick={onSave}
      className="bg-primary text-white p-4 rounded-b-xl flex justify-center items-center shadow-lg hover:bg-primaryHover transition-colors cursor-pointer mt-auto"
    >
      <button className="font-semibold text-sm flex items-center gap-2">
        <Save className="w-4 h-4" />
        {label}
      </button>
    </div>
  )
}
