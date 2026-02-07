import { useHistory } from 'react-router-dom'
import { BRANDING } from '../../config/branding'
import './HeroSection.css'

function HeroSection() {
  const history = useHistory()

  return (
    <section className="hero-section">
      <div className="hero-container">
        <div className="hero-header-full">
          <h1 className="hero-title">
            Free Invoice Templates | Print & Email Invoices
          </h1>
        </div>

        <div className="hero-main-content">
          <div className="hero-left-content">
            <button 
              className="hero-btn-primary"
              onClick={() => history.push('/demo')}
            >
              Create Invoice Now!
            </button>
          </div>
          <div className="hero-invoice-preview">
            <div className="invoice-mockup">
              <div className="invoice-header">
                <div className="invoice-logo">🏢 Acme Corp</div>
                <div className="invoice-details-header">
                  <div className="invoice-number">INV-2024-001</div>
                  <div className="invoice-date">Jan 15, 2024</div>
                </div>
              </div>
              <div className="invoice-addresses">
                <div className="invoice-from">
                  <div className="address-label">FROM:</div>
                  <div className="address-text">
                    <div>Acme Corporation</div>
                    <div>123 Business St</div>
                    <div>City, State 12345</div>
                  </div>
                </div>
                <div className="invoice-to">
                  <div className="address-label">TO:</div>
                  <div className="address-text">
                    <div>Client Company</div>
                    <div>456 Customer Ave</div>
                    <div>Town, State 67890</div>
                  </div>
                </div>
              </div>
              <div className="invoice-table">
                <div className="table-header">
                  <div className="header-desc">Description</div>
                  <div className="header-qty">Qty</div>
                  <div className="header-price">Price</div>
                  <div className="header-total">Total</div>
                </div>
                <div className="table-row">
                  <div className="row-desc">Web Design Services</div>
                  <div className="row-qty">10</div>
                  <div className="row-price">$100.00</div>
                  <div className="row-total">$1,000.00</div>
                </div>
                <div className="table-row">
                  <div className="row-desc">SEO Optimization</div>
                  <div className="row-qty">5</div>
                  <div className="row-price">$200.00</div>
                  <div className="row-total">$1,000.00</div>
                </div>
              </div>
              <div className="invoice-summary">
                <div className="summary-row">
                  <span className="summary-label">Subtotal:</span>
                  <span className="summary-value">$2,000.00</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Tax (10%):</span>
                  <span className="summary-value">$200.00</span>
                </div>
                <div className="summary-row total">
                  <span className="summary-label">TOTAL:</span>
                  <span className="summary-value">$2,200.00</span>
                </div>
              </div>
              <div className="invoice-footer">
                <div className="payment-terms">Payment due within 30 days</div>
                <div className="thank-you">Thank you for your business!</div>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-steps-row">
          <div className="step-item">
            <div className="step-icon">
              <span className="icon-emoji">✏️</span>
            </div>
            <div className="step-content">
              <h3 className="step-title">Create an Invoice</h3>
              <p className="step-desc">Choose from templates and various logos</p>
            </div>
          </div>
          <div className="step-item">
            <div className="step-icon">
              <span className="icon-emoji">�</span>
            </div>
            <div className="step-content">
              <h3 className="step-title">Send as a PDF</h3>
              <p className="step-desc">Email or print your invoice to send to your clients</p>
            </div>
          </div>
          <div className="step-item">
            <div className="step-icon">
              <span className="icon-emoji">💰</span>
            </div>
            <div className="step-content">
              <h3 className="step-title">Get Paid</h3>
              <p className="step-desc">Receive payments in seconds by card or PayPal</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
