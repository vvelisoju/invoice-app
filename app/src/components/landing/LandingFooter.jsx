import { useHistory } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { BRANDING } from '../../config/branding'

function LandingFooter() {
  const history = useHistory()
  const currentYear = new Date().getFullYear()

  return (
    <footer>
      {/* CTA Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djJIMjR2LTJoMTJ6TTM2IDI0djJIMjR2LTJoMTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-4">
            Ready to create your first invoice?
          </h2>
          <p className="text-base sm:text-lg text-blue-100 mb-8 max-w-xl mx-auto">
            Join thousands of Indian businesses using Invoice Baba for fast, GST-compliant invoicing
          </p>
          <button
            onClick={() => history.push('/auth/phone')}
            className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold text-sm sm:text-base px-8 py-3.5 rounded-xl hover:bg-blue-50 transition-all shadow-lg shadow-black/10"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-blue-200 text-xs sm:text-sm mt-4">No credit card required</p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <img
                  src="/assets/brand/icon-transparent.png"
                  alt="Invoice Baba"
                  className="w-7 h-7"
                />
                <span className="text-base font-bold text-white">{BRANDING.name}</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">{BRANDING.tagline}</p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Product</h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'Features', href: '#features' },
                  { label: 'How it works', href: '#how-it-works' },
                  { label: 'Templates', href: '#templates' },
                  { label: 'Pricing', href: '#pricing' },
                ].map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Company</h4>
              <ul className="space-y-2.5">
                {['About', 'Contact', 'Blog'].map((label) => (
                  <li key={label}>
                    <a href={`/${label.toLowerCase()}`} className="text-sm text-gray-400 hover:text-white transition-colors">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Legal</h4>
              <ul className="space-y-2.5">
                <li><a href="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <p className="text-center text-xs sm:text-sm text-gray-500">
              © {currentYear} {BRANDING.name}. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default LandingFooter
