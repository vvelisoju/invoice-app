import LandingHeader from '../components/landing/LandingHeader'
import LandingFooter from '../components/landing/LandingFooter'
import { BRANDING } from '../config/branding'
import SEOHead from '../components/SEOHead'
import { SEO_PAGES } from '../config/seoPages'

function RefundPolicyPage() {
  const currentYear = new Date().getFullYear()
  const pageSeo = SEO_PAGES.refundPolicy

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SEOHead
        title={pageSeo.title}
        description={pageSeo.description}
        path={pageSeo.path}
      />
      <LandingHeader />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">Refund & Cancellation Policy</h1>
          <p className="text-sm text-gray-500 mb-10">Last updated: January 1, {currentYear}</p>

          <div className="prose prose-gray max-w-none space-y-8 text-gray-700 text-[15px] leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">1. Overview</h2>
              <p>
                This Refund & Cancellation Policy applies to all paid subscription plans purchased on {BRANDING.name},
                operated by CodeVel Technologies ("Company", "we", "us"). All payments are processed securely
                through Razorpay.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">2. Subscription Plans</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>{BRANDING.name} offers free and paid subscription plans (monthly and annual).</li>
                <li>Paid plans provide access to premium features such as unlimited invoices, custom templates, and priority support.</li>
                <li>Subscriptions are billed in advance for the chosen billing period.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">3. Cancellation Policy</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>You may cancel your subscription at any time from the Settings page within the app.</li>
                <li>Upon cancellation, your paid plan will remain active until the end of the current billing period.</li>
                <li>After the billing period ends, your account will be downgraded to the free plan.</li>
                <li>You will not be charged for subsequent billing periods after cancellation.</li>
                <li>No partial refunds will be issued for the remaining days of the current billing period.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">4. Refund Policy</h2>
              <h3 className="text-base font-semibold text-gray-800 mb-2">4.1 Eligible Refunds</h3>
              <p>Refunds may be issued in the following cases:</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li><strong>Duplicate Payment:</strong> If you were charged more than once for the same subscription period.</li>
                <li><strong>Technical Error:</strong> If a payment was processed due to a technical error on our end.</li>
                <li><strong>Service Unavailability:</strong> If the Service was significantly unavailable for an extended period during your billing cycle.</li>
              </ul>

              <h3 className="text-base font-semibold text-gray-800 mb-2 mt-4">4.2 Non-Refundable Cases</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Change of mind after purchase.</li>
                <li>Failure to use the Service during the subscription period.</li>
                <li>Downgrade from a higher plan to a lower plan mid-cycle.</li>
                <li>Violation of our Terms of Service leading to account suspension.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">5. How to Request a Refund</h2>
              <p>To request a refund, please follow these steps:</p>
              <ol className="list-decimal pl-5 space-y-2 mt-2">
                <li>
                  Send an email to{' '}
                  <a href={`mailto:${BRANDING.email}`} className="text-blue-600 hover:underline">{BRANDING.email}</a>{' '}
                  with the subject line "Refund Request".
                </li>
                <li>Include your registered phone number and the transaction/payment ID.</li>
                <li>Describe the reason for the refund request.</li>
                <li>Our team will review your request within 3–5 business days.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">6. Refund Processing</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Approved refunds will be processed within 5–10 business days.</li>
                <li>Refunds will be credited to the original payment method used during purchase.</li>
                <li>Refund processing time may vary depending on your bank or payment provider.</li>
                <li>All refunds are processed through Razorpay's refund mechanism.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">7. Free Plan</h2>
              <p>
                The free plan does not involve any payment and therefore is not subject to this refund policy.
                Users on the free plan can use the Service with limited features at no cost.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">8. Changes to This Policy</h2>
              <p>
                We reserve the right to modify this Refund & Cancellation Policy at any time. Changes will be
                posted on this page with an updated "Last updated" date. Your continued use of the Service
                after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">9. Contact Us</h2>
              <p>
                If you have any questions about this Refund & Cancellation Policy, please contact us at:
              </p>
              <p className="mt-2">
                <strong>Email:</strong>{' '}
                <a href={`mailto:${BRANDING.email}`} className="text-blue-600 hover:underline">{BRANDING.email}</a>
              </p>
              <p className="mt-1">
                <strong>Company:</strong> CodeVel Technologies
              </p>
            </section>
          </div>
        </div>
        <LandingFooter />
      </main>
    </div>
  )
}

export default RefundPolicyPage
