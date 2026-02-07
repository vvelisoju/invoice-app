import { useState } from 'react'
import { useHistory } from 'react-router-dom'
import { FileText, Menu, X } from 'lucide-react'
import { BRANDING } from '../../config/branding'

function LandingHeader() {
  const history = useHistory()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Templates', href: '#templates' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ]

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div
            className="flex items-center gap-2.5 cursor-pointer select-none"
            onClick={() => history.push('/')}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <FileText className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">{BRANDING.name}</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => history.push('/auth/phone')}
              className="text-sm font-medium text-gray-700 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-all"
            >
              Log in
            </button>
            <button
              onClick={() => history.push('/auth/phone')}
              className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-lg transition-all shadow-sm shadow-blue-600/25"
            >
              Get Started Free
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 -mr-2 text-gray-600 active:bg-gray-100 rounded-lg"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 mt-2 border-t border-gray-100 space-y-2">
              <button
                onClick={() => { setMobileOpen(false); history.push('/auth/phone') }}
                className="w-full text-sm font-medium text-gray-700 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-left transition-colors"
              >
                Log in
              </button>
              <button
                onClick={() => { setMobileOpen(false); history.push('/auth/phone') }}
                className="w-full text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-2.5 rounded-lg transition-all text-center"
              >
                Get Started Free
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default LandingHeader
