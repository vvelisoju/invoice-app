import LandingHeader from '../components/landing/LandingHeader'
import LandingFooter from '../components/landing/LandingFooter'
import { BRANDING } from '../config/branding'

function PrivacyPolicyPage() {
  const currentYear = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <LandingHeader />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-10">Last updated: January 1, {currentYear}</p>

          <div className="prose prose-gray max-w-none space-y-8 text-gray-700 text-[15px] leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">1. Introduction</h2>
              <p>
                CodeVel Technologies ("Company", "we", "us") operates {BRANDING.name} ("Service").
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information
                when you use our Service. Please read this policy carefully.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">2. Information We Collect</h2>
              <h3 className="text-base font-semibold text-gray-800 mb-2">2.1 Personal Information</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Phone Number:</strong> Used for account registration and OTP-based authentication.</li>
                <li><strong>Business Information:</strong> Business name, address, GSTIN, PAN, bank details — provided by you for invoice generation.</li>
                <li><strong>Customer Data:</strong> Names, addresses, phone numbers, email addresses, and GSTIN of your customers — entered by you for invoicing purposes.</li>
              </ul>

              <h3 className="text-base font-semibold text-gray-800 mb-2 mt-4">2.2 Financial Information</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Invoice data, line items, amounts, and tax calculations created through the Service.</li>
                <li>Payment information is processed securely through Razorpay. We do not store your card details.</li>
              </ul>

              <h3 className="text-base font-semibold text-gray-800 mb-2 mt-4">2.3 Automatically Collected Information</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Device information (type, operating system, browser).</li>
                <li>Usage data (pages visited, features used, time spent).</li>
                <li>IP address and approximate location.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">3. How We Use Your Information</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>To provide, maintain, and improve the Service.</li>
                <li>To authenticate your identity via OTP verification.</li>
                <li>To generate invoices, receipts, and other financial documents on your behalf.</li>
                <li>To process subscription payments through Razorpay.</li>
                <li>To send transactional notifications (e.g., OTP codes, payment confirmations).</li>
                <li>To respond to your inquiries and provide customer support.</li>
                <li>To detect, prevent, and address technical issues and fraud.</li>
                <li>To comply with legal obligations.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">4. Data Sharing & Disclosure</h2>
              <p>We do not sell your personal information. We may share your data with:</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li><strong>Razorpay:</strong> For processing subscription payments securely.</li>
                <li><strong>SpringEdge:</strong> For sending OTP SMS messages for authentication.</li>
                <li><strong>Google Cloud Platform:</strong> For secure data storage and hosting.</li>
                <li><strong>Legal Authorities:</strong> When required by law, regulation, or legal process.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">5. Data Storage & Security</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Your data is stored on secure servers hosted on Google Cloud Platform.</li>
                <li>We use industry-standard encryption (TLS/SSL) for data in transit.</li>
                <li>Database access is restricted and protected with authentication.</li>
                <li>We implement regular security audits and monitoring.</li>
                <li>Despite our efforts, no method of electronic storage is 100% secure.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">6. Data Retention</h2>
              <p>
                We retain your personal data for as long as your account is active or as needed to provide the Service.
                Upon account deletion, we will delete your data within 90 days, except where retention is required by law
                (e.g., financial records under Indian tax regulations).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">7. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data.</li>
                <li><strong>Deletion:</strong> Request deletion of your account and associated data.</li>
                <li><strong>Export:</strong> Download your invoices and business data.</li>
                <li><strong>Withdraw Consent:</strong> Opt out of non-essential communications.</li>
              </ul>
              <p className="mt-2">
                To exercise these rights, contact us at{' '}
                <a href={`mailto:${BRANDING.email}`} className="text-blue-600 hover:underline">{BRANDING.email}</a>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">8. Cookies & Tracking</h2>
              <p>
                We use essential cookies and local storage for authentication and session management.
                We do not use third-party advertising cookies. Analytics data, if collected, is anonymized
                and used solely to improve the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">9. Children's Privacy</h2>
              <p>
                The Service is not intended for use by individuals under the age of 18. We do not knowingly
                collect personal information from children. If we become aware that we have collected data
                from a child, we will take steps to delete it promptly.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">10. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of material changes
                by posting the new policy on this page and updating the "Last updated" date. Your continued
                use of the Service after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">11. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at:
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

export default PrivacyPolicyPage
