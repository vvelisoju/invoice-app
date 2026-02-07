import { PenLine } from 'lucide-react'

/**
 * SignatureBox — Dashed box prompting user to add their signature.
 */
export default function SignatureBox({ onClick }) {
  return (
    <div
      onClick={onClick}
      className="mt-8 bg-yellow-50/50 border border-yellow-100 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-yellow-50 transition-colors group h-32"
    >
      <span className="text-sm font-medium text-yellow-800 mb-1 group-hover:scale-105 transition-transform">
        Add Your Signature
      </span>
      <PenLine className="w-7 h-7 text-yellow-600/50 group-hover:text-yellow-600 transition-colors" />
    </div>
  )
}
