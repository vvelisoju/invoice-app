import { BRANDING } from './branding'

const { seo } = BRANDING
const SITE = seo.siteUrl

/**
 * Per-page SEO configuration.
 * Each key maps to a route path. Used by SEOHead in each page.
 */
export const SEO_PAGES = {
  home: {
    title: null, // uses defaultTitle
    description: seo.defaultDescription,
    path: '/',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Invoice Baba — Free GST Invoice Generator',
      description: seo.defaultDescription,
      url: `${SITE}/`,
      isPartOf: { '@type': 'WebSite', url: SITE },
      about: {
        '@type': 'SoftwareApplication',
        name: 'Invoice Baba',
        applicationCategory: 'BusinessApplication',
      },
    },
  },

  demo: {
    title: 'Free Invoice Generator — Create GST Invoice Online Instantly',
    description:
      'Try Invoice Baba free invoice generator. Create a professional GST-compliant invoice online in under 2 minutes — no signup required. Download PDF, share via WhatsApp.',
    path: '/demo',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Free Invoice Generator Demo — Invoice Baba',
      description:
        'Try creating a professional GST invoice online for free with Invoice Baba. No signup needed.',
      url: `${SITE}/demo`,
      isPartOf: { '@type': 'WebSite', url: SITE },
    },
  },

  contact: {
    title: 'Contact Us — Invoice Baba Support',
    description:
      'Get in touch with Invoice Baba support team. We help with billing inquiries, technical support, and feature requests for our free GST invoice generator.',
    path: '/contact',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'Contact Invoice Baba',
      description: 'Contact the Invoice Baba support team for help.',
      url: `${SITE}/contact`,
      mainEntity: {
        '@type': 'Organization',
        name: 'Invoice Baba',
        email: BRANDING.email,
        contactPoint: {
          '@type': 'ContactPoint',
          email: BRANDING.email,
          contactType: 'customer service',
          availableLanguage: ['English', 'Hindi'],
        },
      },
    },
  },

  terms: {
    title: 'Terms of Service — Invoice Baba',
    description:
      'Read the Terms of Service for Invoice Baba, the free GST invoice generator for Indian businesses. Operated by CodeVel Technologies, Hyderabad.',
    path: '/terms',
  },

  privacy: {
    title: 'Privacy Policy — Invoice Baba',
    description:
      'Learn how Invoice Baba collects, uses, and protects your data. We are committed to safeguarding your privacy. Read our full privacy policy.',
    path: '/privacy',
  },

  refundPolicy: {
    title: 'Refund & Cancellation Policy — Invoice Baba',
    description:
      'Invoice Baba refund and cancellation policy for paid subscription plans. Learn about eligible refunds, cancellation process, and processing timelines.',
    path: '/refund-policy',
  },

  authPhone: {
    title: 'Sign Up Free — Create GST Invoices in 30 Seconds',
    description:
      'Sign up for Invoice Baba in 30 seconds with phone OTP. Start creating free GST-compliant invoices for your business instantly. No credit card required.',
    path: '/auth/phone',
  },
}

/**
 * FAQ structured data for the landing page.
 * Google shows these as rich results (FAQ accordion in SERPs).
 */
export const FAQ_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Do I need to register to create an invoice?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, we use phone OTP authentication for security. Registration takes less than 30 seconds — just enter your phone number and verify the OTP.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I generate GST invoices with Invoice Baba?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! Invoice Baba automatically calculates GST based on your business and customer location. It supports both IGST (interstate) and CGST+SGST (intrastate) with proper tax breakup in PDFs.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I use Invoice Baba offline?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Absolutely. You can create and edit invoice drafts completely offline. They will automatically sync to the server when you're back online.",
      },
    },
    {
      '@type': 'Question',
      name: 'Can I share invoices on WhatsApp?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! On mobile, you can share PDF invoices directly via WhatsApp with one tap. On desktop, you can download the PDF and share it manually.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I customize invoice templates in Invoice Baba?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. You can customize colors, add your logo, choose which fields to show/hide, and personalize the layout to match your brand. Over 100 templates available.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does Invoice Baba work on mobile?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! Invoice Baba has native Android and iOS apps. The same features work seamlessly on web, Android, and iOS.',
      },
    },
    {
      '@type': 'Question',
      name: 'What happens when I reach the free plan limit?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'On the free plan, you can issue up to 10 invoices per month. You can still create unlimited drafts and view/share previously issued invoices. Upgrade to Pro for unlimited invoices.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is Invoice Baba really free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! Invoice Baba offers a free forever plan with 10 invoices/month, PDF downloads, WhatsApp sharing, and offline drafts. No credit card required to start.',
      },
    },
  ],
}
