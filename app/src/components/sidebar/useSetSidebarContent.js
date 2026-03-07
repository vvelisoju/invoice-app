import { useEffect, useRef } from 'react'
import { useSidebarContent } from '../layout/AppSidebar'

/**
 * useSetSidebarContent — Hook for pages to inject sidebar content.
 * Automatically clears sidebar content on unmount.
 * Uses a ref to avoid the cleanup-then-set flicker on content updates.
 *
 * @param {React.ReactNode} content — The sidebar JSX to render
 */
export default function useSetSidebarContent(content) {
  const { setContent } = useSidebarContent()
  const mountedRef = useRef(true)

  // Update content on every render (content is expected to be memoized by caller)
  useEffect(() => {
    setContent(content)
  }, [content, setContent])

  // Cleanup only on unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      setContent(null)
    }
  }, [setContent])
}
