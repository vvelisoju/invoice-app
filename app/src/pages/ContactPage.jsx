import LandingHeader from '../components/landing/LandingHeader'
import LandingFooter from '../components/landing/LandingFooter'
import { BRANDING } from '../config/branding'
import { Mail, MapPin, Clock } from 'lucide-react'
import SEOHead from '../components/SEOHead'
import { SEO_PAGES } from '../config/seoPages'

function ContactPage() {
  const pageSeo = SEO_PAGES.contact

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SEOHead
        title={pageSeo.title}
        description={pageSeo.description}
        path={pageSeo.path}
        jsonLd={pageSeo.jsonLd}
      />
      <LandingHeader />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">Contact Us</h1>
          <p className="text-gray-500 mb-10">We'd love to hear from you. Reach out to us anytime.</p>

          <div className="grid sm:grid-cols-2 gap-8">
            {/* Email */}
            <div className="flex gap-4 p-6 bg-gray-50 rounded-xl border border-gray-100">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                <a href={`mailto:${BRANDING.email}`} className="text-sm text-blue-600 hover:underline">
                  {BRANDING.email}
                </a>
                <p className="text-xs text-gray-500 mt-1">We typically respond within 24 hours</p>
              </div>
            </div>

            {/* Location */}
            <div className="flex gap-4 p-6 bg-gray-50 rounded-xl border border-gray-100">
              <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Location</h3>
                <p className="text-sm text-gray-600">Hyderabad, Telangana, India</p>
                <p className="text-xs text-gray-500 mt-1">CodeVel Technologies</p>
              </div>
            </div>

            {/* Business Hours */}
            <div className="flex gap-4 p-6 bg-gray-50 rounded-xl border border-gray-100 sm:col-span-2">
              <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Business Hours</h3>
                <p className="text-sm text-gray-600">Monday – Saturday: 10:00 AM – 7:00 PM IST</p>
                <p className="text-xs text-gray-500 mt-1">Closed on Sundays and public holidays</p>
              </div>
            </div>
          </div>

          <div className="mt-12 p-6 bg-blue-50 rounded-xl border border-blue-100">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Need Help?</h2>
            <p className="text-sm text-gray-600 mb-4">
              For billing inquiries, refund requests, or technical support, please email us with the following details:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-gray-600">
              <li>Your registered phone number</li>
              <li>A brief description of your issue</li>
              <li>Screenshots (if applicable)</li>
              <li>Transaction ID (for payment-related queries)</li>
            </ul>
          </div>
        </div>
        <LandingFooter />
      </main>
    </div>
  )
}

export default ContactPage
