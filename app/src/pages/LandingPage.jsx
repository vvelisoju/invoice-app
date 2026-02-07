import { IonPage, IonContent } from '@ionic/react'
import LandingHeader from '../components/landing/LandingHeader'
import HeroSection from '../components/landing/HeroSection'
import FeaturesSection from '../components/landing/FeaturesSection'
import PricingSection from '../components/landing/PricingSection'
import FAQSection from '../components/landing/FAQSection'
import LandingFooter from '../components/landing/LandingFooter'
import './LandingPage.css'

function LandingPage() {
  return (
    <IonPage>
      <LandingHeader />
      <IonContent className="landing-content">
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
        <FAQSection />
        <LandingFooter />
      </IonContent>
    </IonPage>
  )
}

export default LandingPage
