import { useHistory } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Star, Zap, Shield, Smartphone } from 'lucide-react'
import { BRANDING } from '../../config/branding'

function HeroSection() {
  const history = useHistory()

  const trustPoints = [
    'GST-compliant invoices',
    'Works offline',
    'Free forever plan',
  ]

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/60">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-100/80 text-blue-700 text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
              <Zap className="w-3.5 h-3.5" />
              Trusted by 10,000+ Indian businesses
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-[3.25rem] font-extrabold text-gray-900 leading-tight tracking-tight mb-5">
              Create Professional
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> GST Invoices </span>
              in Under 2 Minutes
            </h1>

            <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
              The simplest invoicing app for freelancers and small businesses. Create, customize, and share beautiful PDF invoices — even offline.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-8">
              <button
                onClick={() => history.push('/auth/phone')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0"
              >
                Start Invoicing Free
                <ArrowRight className="w-4.5 h-4.5" />
              </button>
              <button
                onClick={() => {
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-gray-700 font-medium text-base px-6 py-3.5 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-white transition-all"
              >
                See How It Works
              </button>
            </div>

            {/* Trust points */}
            <div className="flex flex-col sm:flex-row items-center lg:items-start gap-3 sm:gap-5">
              {trustPoints.map((point) => (
                <div key={point} className="flex items-center gap-1.5 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {point}
                </div>
              ))}
            </div>
          </div>

          {/* Right - Invoice mockup */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-sm">
              {/* Glow behind card */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-3xl blur-2xl scale-105" />

              {/* Invoice card */}
              <div className="relative bg-white rounded-2xl shadow-2xl shadow-gray-900/10 border border-gray-100 overflow-hidden">
                {/* Invoice header bar */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 sm:px-6 sm:py-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-white/70 text-[10px] sm:text-xs font-medium uppercase tracking-wider">Invoice</div>
                      <div className="text-white font-bold text-sm sm:text-base mt-0.5">INV-2024-001</div>
                    </div>
                    <div className="text-right">
                      <div className="text-white/70 text-[10px] sm:text-xs">Date</div>
                      <div className="text-white text-xs sm:text-sm font-medium mt-0.5">15 Jan 2024</div>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-4 sm:px-6 sm:py-5 space-y-4">
                  {/* Addresses */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">From</div>
                      <div className="text-xs sm:text-sm font-medium text-gray-900">Acme Corp</div>
                      <div className="text-[10px] sm:text-xs text-gray-500">Mumbai, MH</div>
                    </div>
                    <div>
                      <div className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">To</div>
                      <div className="text-xs sm:text-sm font-medium text-gray-900">Client Co.</div>
                      <div className="text-[10px] sm:text-xs text-gray-500">Delhi, DL</div>
                    </div>
                  </div>

                  {/* Line items */}
                  <div className="border border-gray-100 rounded-lg overflow-hidden">
                    <div className="grid grid-cols-12 gap-1 bg-gray-50 px-3 py-2 text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <div className="col-span-5">Item</div>
                      <div className="col-span-2 text-center">Qty</div>
                      <div className="col-span-2 text-right">Rate</div>
                      <div className="col-span-3 text-right">Amount</div>
                    </div>
                    <div className="grid grid-cols-12 gap-1 px-3 py-2.5 text-xs sm:text-sm border-b border-gray-50">
                      <div className="col-span-5 font-medium text-gray-800 truncate">Web Design</div>
                      <div className="col-span-2 text-center text-gray-600">10</div>
                      <div className="col-span-2 text-right text-gray-600">1,000</div>
                      <div className="col-span-3 text-right font-medium text-gray-800">10,000</div>
                    </div>
                    <div className="grid grid-cols-12 gap-1 px-3 py-2.5 text-xs sm:text-sm">
                      <div className="col-span-5 font-medium text-gray-800 truncate">SEO Package</div>
                      <div className="col-span-2 text-center text-gray-600">1</div>
                      <div className="col-span-2 text-right text-gray-600">5,000</div>
                      <div className="col-span-3 text-right font-medium text-gray-800">5,000</div>
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs sm:text-sm text-gray-500">
                      <span>Subtotal</span>
                      <span>15,000.00</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm text-gray-500">
                      <span>IGST (18%)</span>
                      <span>2,700.00</span>
                    </div>
                    <div className="flex justify-between text-sm sm:text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                      <span>Total</span>
                      <span>17,700.00</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 bg-white rounded-xl shadow-lg shadow-gray-900/10 border border-gray-100 px-3 py-2 flex items-center gap-2">
                <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5 text-green-600" />
                </div>
                <div>
                  <div className="text-[10px] sm:text-xs font-bold text-gray-900">GST Ready</div>
                  <div className="text-[9px] sm:text-[10px] text-gray-500">Auto tax calc</div>
                </div>
              </div>

              <div className="absolute -bottom-3 -left-3 sm:-bottom-4 sm:-left-4 bg-white rounded-xl shadow-lg shadow-gray-900/10 border border-gray-100 px-3 py-2 flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                  <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div>
                  <div className="text-[10px] sm:text-xs font-bold text-gray-900">Mobile App</div>
                  <div className="text-[9px] sm:text-[10px] text-gray-500">iOS & Android</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-16 sm:mt-20 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 max-w-3xl mx-auto">
          {[
            { value: '10K+', label: 'Businesses' },
            { value: '50K+', label: 'Invoices Created' },
            { value: '4.8', label: 'App Rating', icon: true },
            { value: '99.9%', label: 'Uptime' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center justify-center gap-1">
                {stat.value}
                {stat.icon && <Star className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 fill-amber-400" />}
              </div>
              <div className="text-xs sm:text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HeroSection
