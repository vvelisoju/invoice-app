import { createPortal } from 'react-dom'

/**
 * Portal — Renders children into document.body via React Portal.
 * Use this to escape overflow-hidden containers (e.g., modals rendered inside <main>).
 */
export default function Portal({ children }) {
  return createPortal(children, document.body)
}
