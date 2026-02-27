import { useHistory } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

function TemplatesSection() {
  const history = useHistory()

  const templates = [
    { id: 1, name: 'Classic', accent: '#2563eb', bg: '#ffffff', tag: 'Popular' },
    { id: 2, name: 'Modern', accent: '#10b981', bg: '#f0fdf4', tag: null },
    { id: 3, name: 'Minimal', accent: '#64748b', bg: '#ffffff', tag: null },
    { id: 4, name: 'Bold', accent: '#f59e0b', bg: '#fffbeb', tag: null },
    { id: 5, name: 'Professional', accent: '#3b82f6', bg: '#eff6ff', tag: 'New' },
    { id: 6, name: 'Elegant', accent: '#a855f7', bg: '#faf5ff', tag: null },
  ]

  return (
    <section id="templates" aria-label="Professional invoice templates for Indian businesses" className="py-16 sm:py-20 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            Templates
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4">
            Beautiful templates for every business
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Professional invoice designs with customizable branding, colors, and layouts
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 max-w-5xl mx-auto">
          {templates.map((template) => (
            <div
              key={template.id}
              className="group cursor-pointer"
              onClick={() => history.push('/auth/phone')}
            >
              <div className="relative rounded-xl border-2 border-gray-100 group-hover:border-gray-300 overflow-hidden transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1">
                {template.tag && (
                  <div
                    className="absolute top-2 right-2 text-[9px] sm:text-[10px] font-bold text-white px-2 py-0.5 rounded-full z-10"
                    style={{ background: template.accent }}
                  >
                    {template.tag}
                  </div>
                )}

                {/* Mini invoice preview */}
                <div className="aspect-[3/4] p-3 sm:p-4" style={{ background: template.bg }}>
                  {/* Header bar */}
                  <div className="h-2 rounded-full mb-2.5 w-3/4" style={{ background: template.accent }} />
                  <div className="h-1 rounded-full mb-1.5 w-1/2 bg-gray-200" />
                  <div className="h-1 rounded-full mb-3 w-2/3 bg-gray-200" />

                  {/* Separator */}
                  <div className="h-px mb-3" style={{ background: template.accent, opacity: 0.3 }} />

                  {/* Lines */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex gap-1">
                      <div className="h-1 rounded-full flex-1 bg-gray-200" />
                      <div className="h-1 rounded-full w-1/4" style={{ background: template.accent, opacity: 0.3 }} />
                    </div>
                    <div className="flex gap-1">
                      <div className="h-1 rounded-full flex-1 bg-gray-200" />
                      <div className="h-1 rounded-full w-1/4" style={{ background: template.accent, opacity: 0.3 }} />
                    </div>
                  </div>

                  {/* Total */}
                  <div className="h-px mb-2" style={{ background: template.accent, opacity: 0.2 }} />
                  <div className="flex justify-end">
                    <div className="h-1.5 rounded-full w-1/3" style={{ background: template.accent, opacity: 0.5 }} />
                  </div>
                </div>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-700 text-center mt-2.5 group-hover:text-gray-900 transition-colors">
                {template.name}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10 sm:mt-12">
          <button
            onClick={() => history.push('/auth/phone')}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm sm:text-base transition-colors"
          >
            Explore All Templates
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  )
}

export default TemplatesSection
