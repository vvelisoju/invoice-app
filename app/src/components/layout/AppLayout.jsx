import AppHeader from './AppHeader'
import AppSidebar from './AppSidebar'

/**
 * AppLayout — The main authenticated layout shell.
 * Renders: fixed Header (top) + Sidebar (left) + scrollable Content (right).
 */
export default function AppLayout({ children }) {
  return (
    <div className="bg-bgPrimary font-sans text-textPrimary antialiased h-screen overflow-hidden flex flex-col">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto bg-bgPrimary p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
