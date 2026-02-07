import { Receipt, WifiOff, MessageCircle, Palette, ArrowRightLeft, BarChart3 } from 'lucide-react'

function FeaturesSection() {
  const features = [
    {
      icon: Receipt,
      title: 'GST-Ready Invoices',
      description: 'Automatic IGST / CGST+SGST calculation based on place of supply. Fully compliant with Indian tax rules.',
      color: 'blue',
    },
    {
      icon: WifiOff,
      title: 'Works Offline',
      description: 'Create and edit invoice drafts without internet. Everything auto-syncs when you\'re back online.',
      color: 'emerald',
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp Sharing',
      description: 'Send PDF invoices directly to customers via WhatsApp in one tap from your mobile device.',
      color: 'green',
    },
    {
      icon: Palette,
      title: 'Custom Templates',
      description: 'Personalize with your logo, brand colors, and choose exactly which fields to show or hide.',
      color: 'violet',
    },
    {
      icon: ArrowRightLeft,
      title: 'Invoice Lifecycle',
      description: 'Track every invoice from Draft to Issued to Paid with complete status history and timestamps.',
      color: 'amber',
    },
    {
      icon: BarChart3,
      title: 'Reports & Analytics',
      description: 'Revenue summaries, GST breakup, and monthly trends — all the insights you need at a glance.',
      color: 'rose',
    },
  ]

  const colorMap = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600' },
    green: { bg: 'bg-green-50', icon: 'text-green-600' },
    violet: { bg: 'bg-violet-50', icon: 'text-violet-600' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600' },
    rose: { bg: 'bg-rose-50', icon: 'text-rose-600' },
  }

  return (
    <section id="features" className="py-16 sm:py-20 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            Features
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4">
            Everything you need to invoice professionally
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Powerful features designed for speed, reliability, and GST compliance
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, index) => {
            const colors = colorMap[feature.color]
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="group relative bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 hover:shadow-xl hover:shadow-gray-900/5 hover:border-gray-200 transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center mb-5`}>
                  <Icon className={`w-6 h-6 ${colors.icon}`} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm sm:text-[0.9375rem] text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default FeaturesSection
