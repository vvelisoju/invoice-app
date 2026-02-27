import { useHistory } from 'react-router-dom'
import { ClipboardEdit, Paintbrush, Download, ArrowRight } from 'lucide-react'

function HowItWorksSection() {
  const history = useHistory()

  const steps = [
    {
      number: '01',
      icon: ClipboardEdit,
      title: 'Enter Invoice Details',
      description: 'Fill in customer info, add line items, and set tax rates. Drafts auto-save as you type — even offline.',
      color: 'blue',
    },
    {
      number: '02',
      icon: Paintbrush,
      title: 'Pick a Template',
      description: 'Choose from professional templates. Customize colors, add your logo, and toggle fields to match your brand.',
      color: 'indigo',
    },
    {
      number: '03',
      icon: Download,
      title: 'Download & Share',
      description: 'Generate a polished PDF instantly. Download, print, email, or share directly via WhatsApp in one tap.',
      color: 'violet',
    },
  ]

  const colorMap = {
    blue: { bg: 'bg-blue-600', light: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-100' },
    indigo: { bg: 'bg-indigo-600', light: 'bg-indigo-50', text: 'text-indigo-600', ring: 'ring-indigo-100' },
    violet: { bg: 'bg-violet-600', light: 'bg-violet-50', text: 'text-violet-600', ring: 'ring-violet-100' },
  }

  return (
    <section id="how-it-works" aria-label="How to create GST invoices with Invoice Baba" className="py-16 sm:py-20 lg:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            How It Works
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4">
            Create invoices in 3 simple steps
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            From data entry to PDF delivery — it takes less than 2 minutes
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 max-w-5xl mx-auto">
          {steps.map((step, index) => {
            const colors = colorMap[step.color]
            const Icon = step.icon
            return (
              <div key={step.number} className="relative text-center">
                {/* Connector line (desktop only) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-px bg-gradient-to-r from-gray-300 to-gray-200" />
                )}

                <div className="relative inline-flex flex-col items-center">
                  {/* Step number badge */}
                  <div className={`w-20 h-20 ${colors.light} rounded-2xl flex items-center justify-center mb-5 ring-4 ${colors.ring}`}>
                    <Icon className={`w-9 h-9 ${colors.text}`} />
                  </div>
                  <div className={`absolute -top-2 -right-2 w-7 h-7 ${colors.bg} rounded-full flex items-center justify-center`}>
                    <span className="text-white text-xs font-bold">{step.number}</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm sm:text-[0.9375rem] text-gray-600 leading-relaxed max-w-xs mx-auto">{step.description}</p>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-12 sm:mt-14">
          <button
            onClick={() => history.push('/auth/phone')}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm sm:text-base px-7 py-3 rounded-xl transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40"
          >
            Try It Now — It's Free
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  )
}

export default HowItWorksSection
