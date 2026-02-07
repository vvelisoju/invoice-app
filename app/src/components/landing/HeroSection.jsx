import { IonButton } from '@ionic/react'
import { useHistory } from 'react-router-dom'
import { BRANDING } from '../../config/branding'
import './HeroSection.css'

function HeroSection() {
  const history = useHistory()

  return (
    <section className="hero-section">
      <div className="hero-container">
        <div className="hero-main-content">
          <div className="hero-left">
            <div className="hero-header">
              <h1 className="hero-title">
                Free Invoice Templates | Print & Email Invoices
              </h1>
              <IonButton 
                size="large" 
                className="hero-btn-primary"
                onClick={() => history.push('/demo')}
              >
                Create Invoice Now!
              </IonButton>
            </div>

            <div className="hero-steps">
              <div className="step-card">
                <div className="step-icon">
                  <div className="icon-circle">
                    <span className="icon-emoji">✏️</span>
                  </div>
                </div>
                <h3 className="step-title">Create an Invoice</h3>
                <p className="step-desc">Choose from templates and various logos</p>
              </div>
              <div className="step-card">
                <div className="step-icon">
                  <div className="icon-circle">
                    <span className="icon-emoji">📧</span>
                  </div>
                </div>
                <h3 className="step-title">Send as a PDF</h3>
                <p className="step-desc">Email or print your invoice to send to your clients</p>
              </div>
              <div className="step-card">
                <div className="step-icon">
                  <div className="icon-circle">
                    <span className="icon-emoji">💰</span>
                  </div>
                </div>
                <h3 className="step-title">Get Paid</h3>
                <p className="step-desc">Receive payments in seconds by card or PayPal</p>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-templates-grid">
              <div className="template-card">
                <div className="template-icon">📄</div>
              </div>
              <div className="template-card">
                <div className="template-icon">📄</div>
              </div>
              <div className="template-card">
                <div className="template-icon">📄</div>
              </div>
              <div className="template-card active">
                <div className="template-icon">📄</div>
              </div>
              <div className="template-card">
                <div className="template-icon">📄</div>
              </div>
              <div className="template-card">
                <div className="template-icon">📄</div>
              </div>
            </div>
            <div className="hero-device">
              <div className="device-frame">
                <div className="device-content">
                  <div className="device-app-icon">🟦</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
