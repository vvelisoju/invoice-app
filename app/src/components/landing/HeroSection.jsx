import { IonButton } from '@ionic/react'
import { useHistory } from 'react-router-dom'
import { BRANDING } from '../../config/branding'
import './HeroSection.css'

function HeroSection() {
  const history = useHistory()

  return (
    <section className="hero-section">
      <div className="hero-container">
        <div className="hero-content">
          <h1 className="hero-title">
            Create professional invoices in minutes
          </h1>
          <p className="hero-subtitle">
            Fast, reliable invoicing for businesses of all sizes. Create invoices on web or mobile. 
            Download PDF, print, or share instantly. Works offline with automatic sync.
          </p>
          <div className="hero-actions">
            <IonButton 
              size="large" 
              className="hero-btn-primary"
              onClick={() => history.push('/demo')}
            >
              Create Invoice Free
            </IonButton>
            <IonButton 
              size="large" 
              fill="outline" 
              className="hero-btn-secondary"
              onClick={() => {
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              See how it works
            </IonButton>
          </div>
          <div className="hero-badges">
            <span className="badge">✓ GST Ready</span>
            <span className="badge">✓ Offline Drafts</span>
            <span className="badge">✓ PDF Download</span>
            <span className="badge">✓ WhatsApp Share</span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-mockup">
            <div className="mockup-header">
              <div className="mockup-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="mockup-title">New Invoice</div>
            </div>
            <div className="mockup-content">
              <div className="mockup-form">
                <div className="form-field">
                  <div className="field-label">Customer</div>
                  <div className="field-input">Acme Corp</div>
                </div>
                <div className="form-field">
                  <div className="field-label">Invoice Date</div>
                  <div className="field-input">Feb 1, 2026</div>
                </div>
                <div className="form-section">
                  <div className="section-title">Line Items</div>
                  <div className="line-item">
                    <span>Web Design</span>
                    <span>₹50,000</span>
                  </div>
                  <div className="line-item">
                    <span>Logo Design</span>
                    <span>₹10,000</span>
                  </div>
                </div>
                <div className="form-totals">
                  <div className="total-row">
                    <span>Subtotal</span>
                    <span>₹60,000</span>
                  </div>
                  <div className="total-row">
                    <span>Tax (18%)</span>
                    <span>₹10,800</span>
                  </div>
                  <div className="total-row total-final">
                    <span>Total</span>
                    <span>₹70,800</span>
                  </div>
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
