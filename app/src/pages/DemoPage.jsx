import { useHistory } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import NewInvoicePage from '../features/invoices/NewInvoicePage'
import SEOHead from '../components/SEOHead'
import { SEO_PAGES } from '../config/seoPages'

function DemoPage() {
  const history = useHistory()
  const pageSeo = SEO_PAGES.demo

  return (
    <div className="min-h-screen bg-bgPrimary flex flex-col">
      <SEOHead
        title={pageSeo.title}
        description={pageSeo.description}
        path={pageSeo.path}
        jsonLd={pageSeo.jsonLd}
      />
      <header className="bg-bgSecondary border-b border-border px-4 md:px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <img
            src="/assets/brand/logo-full-transparent.png"
            alt="Invoice Baba"
            className="h-8"
          />
          <span className="text-sm font-medium text-textSecondary hidden sm:inline">Live Demo</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => history.push('/auth/phone')}
            className="px-3 py-1.5 text-xs font-medium text-primary border border-primary/30 rounded-lg active:bg-primary/5 md:hover:bg-primary/5 tap-target-auto"
          >
            Sign Up / Login
          </button>
          <button
            onClick={() => history.push('/')}
            className="flex items-center gap-1 text-xs text-textSecondary active:text-textPrimary md:hover:text-textPrimary font-medium tap-target-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Home
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto">
        <NewInvoicePage demoMode />
      </main>
    </div>
  )
}

export default DemoPage
