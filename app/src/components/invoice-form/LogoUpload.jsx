import { Image } from 'lucide-react'

/**
 * LogoUpload — Dashed upload area for business logo.
 */
export default function LogoUpload({ onClick }) {
  return (
    <div
      onClick={onClick}
      className="h-32 bg-yellow-50/50 border-2 border-dashed border-yellow-200 hover:border-yellow-400 rounded-xl flex flex-col items-center justify-center cursor-pointer group transition-all relative overflow-hidden"
    >
      <div className="text-center z-10">
        <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
          <Image className="w-5 h-5 text-textPrimary" />
        </div>
        <span className="text-xs font-medium text-textSecondary group-hover:text-textPrimary transition-colors">
          Select Logo
        </span>
      </div>
      <div className="absolute inset-0 bg-yellow-100/20 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  )
}
