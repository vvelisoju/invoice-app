import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null)

  const faqs = [
    {
      question: 'Do I need to register to create an invoice?',
      answer: 'Yes, we use phone OTP authentication for security. Registration takes less than 30 seconds — just enter your phone number and verify the OTP.',
    },
    {
      question: 'Can I generate GST invoices?',
      answer: 'Yes! Our app automatically calculates GST based on your business and customer location. It supports both IGST (interstate) and CGST+SGST (intrastate) with proper tax breakup in PDFs.',
    },
    {
      question: 'Can I use it offline?',
      answer: 'Absolutely. You can create and edit invoice drafts completely offline. They will automatically sync to the server when you\'re back online.',
    },
    {
      question: 'Can I share invoices on WhatsApp?',
      answer: 'Yes! On mobile, you can share PDF invoices directly via WhatsApp with one tap. On desktop, you can download the PDF and share it manually.',
    },
    {
      question: 'Can I customize invoice templates?',
      answer: 'Yes. You can customize colors, add your logo, choose which fields to show/hide, and personalize the layout to match your brand.',
    },
    {
      question: 'Does it work on mobile?',
      answer: 'Yes! We have native Android and iOS apps built with Capacitor. The same features work seamlessly on web, Android, and iOS.',
    },
    {
      question: 'What happens when I reach the free plan limit?',
      answer: 'On the free plan, you can issue up to 10 invoices per month. You can still create unlimited drafts and view/share previously issued invoices. Upgrade to Pro for unlimited invoices.',
    },
    {
      question: 'Can I export my data?',
      answer: 'Pro users can export invoice data to CSV for accounting software integration. All users can download individual invoice PDFs anytime.',
    },
  ]

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="faq" className="py-16 sm:py-20 lg:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            FAQ
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about Simple Invoice
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index
            return (
              <div
                key={index}
                className={`bg-white rounded-xl border transition-all duration-200 ${
                  isOpen ? 'border-blue-200 shadow-md shadow-blue-500/5' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5 text-left"
                >
                  <span className={`text-sm sm:text-base font-semibold transition-colors ${
                    isOpen ? 'text-blue-700' : 'text-gray-900'
                  }`}>
                    {faq.question}
                  </span>
                  <ChevronDown className={`w-5 h-5 flex-shrink-0 transition-all duration-200 ${
                    isOpen ? 'rotate-180 text-blue-500' : 'text-gray-400'
                  }`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 sm:px-6 sm:pb-5 -mt-1">
                    <p className="text-sm sm:text-[0.9375rem] text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default FAQSection
