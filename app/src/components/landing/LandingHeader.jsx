import { IonHeader, IonToolbar, IonButtons, IonButton, IonMenuButton } from '@ionic/react'
import { useHistory } from 'react-router-dom'
import { BRANDING } from '../../config/branding'
import './LandingHeader.css'

function LandingHeader() {
  const history = useHistory()

  return (
    <IonHeader className="landing-header">
      <IonToolbar className="landing-toolbar">
        <div className="landing-nav-container">
          <div className="landing-brand" onClick={() => history.push('/')}>
            {BRANDING.name}
          </div>
          
          <nav className="landing-nav-links">
            <a href="#how-it-works" className="nav-link">How it works</a>
            <a href="#templates" className="nav-link">Templates</a>
            <a href="#pricing" className="nav-link">Pricing</a>
            <a href="#faq" className="nav-link">FAQ</a>
          </nav>
          
          <IonButtons className="landing-nav-actions">
            <IonButton 
              fill="clear" 
              onClick={() => history.push('/auth/phone')}
              className="nav-btn-secondary"
            >
              Login
            </IonButton>
            <IonButton 
              fill="solid" 
              onClick={() => history.push('/demo')}
              className="nav-btn-primary"
            >
              Create Invoice
            </IonButton>
          </IonButtons>
          
          <IonMenuButton className="mobile-menu-btn" />
        </div>
      </IonToolbar>
    </IonHeader>
  )
}

export default LandingHeader
