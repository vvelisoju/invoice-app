import { useState, useEffect, useRef, useCallback } from 'react'
import { Loader2, ZoomIn, ZoomOut } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'

// Use the bundled worker from pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

/**
 * Universal PDF Viewer — renders PDF blob pages onto <canvas> elements using pdf.js.
 * Works consistently across all browsers (desktop & mobile).
 *
 * Props:
 *  - blob: PDF Blob object (required)
 *  - className: optional wrapper className
 *  - style: optional wrapper style
 */
export default function PdfViewer({ blob, className = '', style = {} }) {
  const [pdfDoc, setPdfDoc] = useState(null)
  const [pages, setPages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [scale, setScale] = useState(1)
  const containerRef = useRef(null)
  const canvasRefs = useRef([])
  const renderTasksRef = useRef([])

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

    // Cancel any in-progress render tasks
    renderTasksRef.current.forEach(task => { try { task.cancel() } catch {} })
    renderTasksRef.current = []

    const containerWidth = containerRef.current.clientWidth - 32 // 16px padding each side

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

        // Use devicePixelRatio for sharp rendering (capped at 2 for performance)
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        canvas.width = viewport.width * dpr
        canvas.height = viewport.height * dpr
        canvas.style.width = `${viewport.width}px`
        canvas.style.height = `${viewport.height}px`

        const ctx = canvas.getContext('2d')
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

        const renderTask = page.render({ canvasContext: ctx, viewport })
        renderTasksRef.current.push(renderTask)
        await renderTask.promise
      } catch (err) {
        if (err?.name !== 'RenderingCancelled') {
          console.error(`Failed to render page ${i + 1}:`, err)
        }
      }
    }
  }, [pdfDoc, scale])

  useEffect(() => {
    renderPages()
  }, [renderPages])

  // Re-render on window resize (debounced)
  useEffect(() => {
    let timeout
    const handleResize = () => {
      clearTimeout(timeout)
      timeout = setTimeout(renderPages, 250)
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timeout)
    }
  }, [renderPages])

  // Keyboard shortcuts: Ctrl/Cmd + / - for zoom
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return
      if (e.key === '=' || e.key === '+') {
        e.preventDefault()
        setScale(s => Math.min(3, +(s + 0.25).toFixed(2)))
      } else if (e.key === '-') {
        e.preventDefault()
        setScale(s => Math.max(0.5, +(s - 0.25).toFixed(2)))
      } else if (e.key === '0') {
        e.preventDefault()
        setScale(1)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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

  const totalPages = pdfDoc?.numPages || 0

  return (
    <div className={`relative flex flex-col ${className}`} style={style}>
      {/* Toolbar */}
      {totalPages > 0 && (
        <div className="sticky top-0 z-10 flex items-center justify-between px-3 py-1.5 bg-gray-50/95 backdrop-blur-sm border-b border-gray-200">
          {/* Page count */}
          <span className="text-[11px] font-medium text-gray-500">
            {totalPages} {totalPages === 1 ? 'page' : 'pages'}
          </span>

          {/* Zoom controls */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setScale(s => Math.max(0.5, +(s - 0.25).toFixed(2)))}
              disabled={scale <= 0.5}
              className="p-1.5 rounded text-gray-500 active:bg-gray-200 md:hover:bg-gray-200 disabled:opacity-30 transition-colors"
              title="Zoom out (Ctrl −)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setScale(1)}
              className="px-1.5 py-0.5 rounded text-[11px] font-medium text-gray-600 active:bg-gray-200 md:hover:bg-gray-200 min-w-[40px] text-center transition-colors"
              title="Reset zoom (Ctrl 0)"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              onClick={() => setScale(s => Math.min(3, +(s + 0.25).toFixed(2)))}
              disabled={scale >= 3}
              className="p-1.5 rounded text-gray-500 active:bg-gray-200 md:hover:bg-gray-200 disabled:opacity-30 transition-colors"
              title="Zoom in (Ctrl +)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Canvas pages */}
      <div ref={containerRef} className="flex-1 overflow-auto bg-gray-100 px-4 py-4">
        <div className="flex flex-col items-center gap-4">
          {pages.map((pageNum, idx) => (
            <canvas
              key={pageNum}
              ref={el => { canvasRefs.current[idx] = el }}
              className="shadow-lg bg-white"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
