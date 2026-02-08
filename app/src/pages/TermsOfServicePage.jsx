import LandingHeader from '../components/landing/LandingHeader'
import LandingFooter from '../components/landing/LandingFooter'
import { BRANDING } from '../config/branding'

function TermsOfServicePage() {
  const currentYear = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <LandingHeader />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-500 mb-10">Last updated: January 1, {currentYear}</p>

          <div className="prose prose-gray max-w-none space-y-8 text-gray-700 text-[15px] leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing or using {BRANDING.name} ("Service"), operated by CodeVel Technologies ("Company", "we", "us"),
                you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">2. Description of Service</h2>
              <p>
                {BRANDING.name} is a cloud-based invoicing and billing platform designed for Indian businesses.
                The Service allows users to create, manage, and send GST-compliant invoices, receipts, quotes, and other financial documents.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">3. User Accounts</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>You must provide accurate and complete information when creating an account.</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                <li>You must be at least 18 years old to use the Service.</li>
                <li>One person or legal entity may maintain no more than one account.</li>
                <li>You are responsible for all activities that occur under your account.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">4. Subscription & Payments</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>The Service offers both free and paid subscription plans.</li>
                <li>Paid plans are billed in advance on a monthly or annual basis through Razorpay.</li>
                <li>All fees are exclusive of applicable taxes (GST) unless stated otherwise.</li>
                <li>Prices are subject to change with 30 days' prior notice.</li>
                <li>You authorize us to charge your selected payment method for the subscription fees.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">5. Free Trial</h2>
              <p>
                We may offer a free trial period for paid plans. At the end of the trial, your account will be
                downgraded to the free plan unless you subscribe to a paid plan. We reserve the right to modify
                or discontinue free trials at any time.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">6. User Data & Content</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>You retain all rights to the data and content you upload to the Service.</li>
                <li>You grant us a limited license to store, process, and display your content solely to provide the Service.</li>
                <li>You are responsible for ensuring the accuracy of your invoices and financial documents.</li>
                <li>We do not verify the correctness of tax calculations or compliance with tax regulations.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">7. Prohibited Uses</h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>Use the Service for any unlawful purpose or to generate fraudulent invoices.</li>
                <li>Attempt to gain unauthorized access to the Service or its related systems.</li>
                <li>Interfere with or disrupt the integrity or performance of the Service.</li>
                <li>Reproduce, duplicate, copy, sell, or resell any portion of the Service.</li>
                <li>Use the Service to transmit any malware, viruses, or harmful code.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">8. Intellectual Property</h2>
              <p>
                The Service, including its original content, features, and functionality, is owned by CodeVel Technologies
                and is protected by international copyright, trademark, and other intellectual property laws.
                The {BRANDING.name} name, logo, and all related marks are trademarks of CodeVel Technologies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">9. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, {BRANDING.name} and its affiliates shall not be liable for any
                indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or
                business opportunities, arising out of or related to your use of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">10. Disclaimer of Warranties</h2>
              <p>
                The Service is provided on an "as is" and "as available" basis without warranties of any kind,
                either express or implied. We do not warrant that the Service will be uninterrupted, error-free,
                or secure. {BRANDING.name} is not a substitute for professional accounting or tax advice.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">11. Termination</h2>
              <p>
                We may terminate or suspend your account at any time, with or without cause, with or without notice.
                Upon termination, your right to use the Service will immediately cease. You may export your data
                before termination. We may retain certain data as required by law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">12. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of India.
                Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts
                in Hyderabad, Telangana, India.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">13. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. We will notify users of material changes
                via email or through the Service. Your continued use of the Service after changes constitutes
                acceptance of the updated Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">14. Contact Us</h2>
              <p>
                If you have any questions about these Terms of Service, please contact us at:
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

export default TermsOfServicePage
