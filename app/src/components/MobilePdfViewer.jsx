import { useState, useEffect, useRef, useCallback } from 'react'
import { Loader2, ZoomIn, ZoomOut } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'

// Use the bundled worker from pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

/**
 * Mobile PDF Viewer — renders PDF blob pages onto <canvas> elements using pdf.js.
 * Replaces <iframe> on mobile browsers that can't render blob: PDF URLs inline.
 *
 * Props:
 *  - blob: PDF Blob object (required)
 *  - className: optional wrapper className
 *  - style: optional wrapper style
 */
export default function MobilePdfViewer({ blob, className = '', style = {} }) {
  const [pdfDoc, setPdfDoc] = useState(null)
  const [pages, setPages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [scale, setScale] = useState(1)
  const containerRef = useRef(null)
  const canvasRefs = useRef([])

  // Load the PDF document from blob
  useEffect(() => {
    if (!blob) return
    let cancelled = false

    const loadPdf = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const arrayBuffer = await blob.arrayBuffer()
        const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        if (cancelled) return
        setPdfDoc(doc)
        setPages(Array.from({ length: doc.numPages }, (_, i) => i + 1))
      } catch (err) {
        if (!cancelled) {
          console.error('PDF.js load error:', err)
          setError('Failed to load PDF preview')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadPdf()
    return () => { cancelled = true }
  }, [blob])

  // Render all pages when doc or scale changes
  const renderPages = useCallback(async () => {
    if (!pdfDoc || !containerRef.current) return

    const containerWidth = containerRef.current.clientWidth - 16 // 8px padding each side

    for (let i = 0; i < pdfDoc.numPages; i++) {
      const canvas = canvasRefs.current[i]
      if (!canvas) continue

      try {
        const page = await pdfDoc.getPage(i + 1)
        const unscaledViewport = page.getViewport({ scale: 1 })
        // Fit to container width, then apply user zoom
        const fitScale = containerWidth / unscaledViewport.width
        const finalScale = fitScale * scale
        const viewport = page.getViewport({ scale: finalScale })

        // Use devicePixelRatio for sharp rendering
        const dpr = window.devicePixelRatio || 1
        canvas.width = viewport.width * dpr
        canvas.height = viewport.height * dpr
        canvas.style.width = `${viewport.width}px`
        canvas.style.height = `${viewport.height}px`

        const ctx = canvas.getContext('2d')
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

        await page.render({ canvasContext: ctx, viewport }).promise
      } catch (err) {
        console.error(`Failed to render page ${i + 1}:`, err)
      }
    }
  }, [pdfDoc, scale])

  useEffect(() => {
    renderPages()
  }, [renderPages])

  // Re-render on window resize
  useEffect(() => {
    let timeout
    const handleResize = () => {
      clearTimeout(timeout)
      timeout = setTimeout(renderPages, 200)
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timeout)
    }
  }, [renderPages])

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center py-20 gap-3 ${className}`} style={style}>
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <p className="text-xs text-textSecondary">Loading preview...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center py-20 gap-2 ${className}`} style={style}>
        <p className="text-xs text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} style={style}>
      {/* Zoom controls */}
      {pdfDoc && pdfDoc.numPages > 0 && (
        <div className="sticky top-2 z-10 flex justify-end px-3 pb-1">
          <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 px-1.5 py-1">
            <button
              onClick={() => setScale(s => Math.max(0.5, s - 0.25))}
              disabled={scale <= 0.5}
              className="p-1.5 rounded text-gray-500 active:bg-gray-100 disabled:opacity-30"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-medium text-gray-500 min-w-[32px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale(s => Math.min(3, s + 0.25))}
              disabled={scale >= 3}
              className="p-1.5 rounded text-gray-500 active:bg-gray-100 disabled:opacity-30"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Canvas pages */}
      <div ref={containerRef} className="overflow-auto px-2 pb-4">
        <div className="flex flex-col items-center gap-3">
          {pages.map((pageNum, idx) => (
            <canvas
              key={pageNum}
              ref={el => { canvasRefs.current[idx] = el }}
              className="shadow-md bg-white rounded"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
