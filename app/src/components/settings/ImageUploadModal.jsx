import { useState, useRef } from 'react'
import { X, Upload, Loader2, ImageIcon, Trash2 } from 'lucide-react'
import Portal from '../Portal'

/**
 * ImageUploadModal — Reusable modal for uploading images (logo, signature, etc.)
 * Props:
 *   isOpen, onClose, title, subtitle, currentUrl, onUploaded, onRemove, uploadFn
 */
export default function ImageUploadModal({ isOpen, onClose, title, subtitle, currentUrl, onUploaded, onRemove, uploadFn }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a JPEG, PNG, GIF, WebP, or SVG image')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be under 5MB')
      return
    }

    setError(null)
    setUploading(true)
    try {
      const url = await uploadFn(file)
      if (url) {
        onUploaded(url)
        onClose()
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to upload image')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemove = () => {
    onRemove?.()
    onClose()
  }

  if (!isOpen) return null

  return (
    <Portal>
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-cyan-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-textPrimary">{title || 'Upload Image'}</h2>
              {subtitle && <p className="text-[11px] text-textSecondary">{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-lg active:bg-gray-100 md:hover:bg-gray-100 flex items-center justify-center text-textSecondary active:text-textPrimary md:hover:text-textPrimary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {/* Current image preview */}
          <div className="w-full h-32 rounded-xl border-2 border-dashed border-border bg-gray-50 flex items-center justify-center overflow-hidden mb-4">
            {currentUrl ? (
              <img src={currentUrl} alt="Current" className="max-h-28 max-w-full object-contain p-2" />
            ) : (
              <div className="text-center">
                <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-1" />
                <span className="text-xs text-textSecondary">No image uploaded</span>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
            onChange={handleFileSelect}
            className="hidden"
          />

          {error && (
            <p className="text-xs text-red-600 mb-3">{error}</p>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-primary bg-blue-50 active:bg-blue-100 md:hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-2 border border-blue-100 disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {currentUrl ? 'Change Image' : 'Upload Image'}
            </button>
            {currentUrl && onRemove && (
              <button
                onClick={handleRemove}
                className="px-4 py-2.5 text-sm font-medium text-red-600 active:bg-red-50 md:hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Remove
              </button>
            )}
          </div>

          <p className="text-[11px] text-textSecondary mt-3">
            Recommended: Square image, at least 200×200px. Max 5MB. JPEG, PNG, WebP, or SVG.
          </p>
        </div>
      </div>
    </div>
    </Portal>
  )
}
