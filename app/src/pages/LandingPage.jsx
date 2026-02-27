import LandingHeader from '../components/landing/LandingHeader'
import HeroSection from '../components/landing/HeroSection'
import FeaturesSection from '../components/landing/FeaturesSection'
import HowItWorksSection from '../components/landing/HowItWorksSection'
import TemplatesSection from '../components/landing/TemplatesSection'
import PricingSection from '../components/landing/PricingSection'
import FAQSection from '../components/landing/FAQSection'
import LandingFooter from '../components/landing/LandingFooter'
import SEOHead from '../components/SEOHead'
import { SEO_PAGES, FAQ_JSONLD } from '../config/seoPages'

function LandingPage() {
  const pageSeo = SEO_PAGES.home

  // Merge WebPage + FAQPage structured data
  const combinedJsonLd = [pageSeo.jsonLd, FAQ_JSONLD]

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SEOHead
        title={pageSeo.title}
        description={pageSeo.description}
        path={pageSeo.path}
        jsonLd={combinedJsonLd}
      />
      <LandingHeader />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TemplatesSection />
        <PricingSection />
        <FAQSection />
        <LandingFooter />
      </main>
    </div>
  )
}

export default LandingPage
