import LandingHeader from '../components/landing/LandingHeader'
import HeroSection from '../components/landing/HeroSection'
import FeaturesSection from '../components/landing/FeaturesSection'
import PricingSection from '../components/landing/PricingSection'
import FAQSection from '../components/landing/FAQSection'
import LandingFooter from '../components/landing/LandingFooter'
import './LandingPage.css'

function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <LandingHeader />
      <main className="flex-1 landing-content">
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
        <FAQSection />
        <LandingFooter />
      </main>
    </div>
  )
}

export default LandingPage
