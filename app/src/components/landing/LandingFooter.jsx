import { useHistory } from 'react-router-dom'
import { BRANDING } from '../../config/branding'
import './LandingFooter.css'

function LandingFooter() {
  const history = useHistory()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="landing-footer">
      <div className="footer-cta-section">
        <div className="footer-cta-content">
          <h2 className="footer-cta-title">Create your first invoice in under 2 minutes</h2>
          <p className="footer-cta-subtitle">
            Join thousands of businesses using Simple Invoice for fast, reliable invoicing
          </p>
          <button 
            className="footer-cta-btn"
            onClick={() => history.push('/demo')}
          >
            Get Started Free
          </button>
        </div>
      </div>
      
      <div className="footer-main">
        <div className="footer-container">
          <div className="footer-column footer-brand">
            <div className="footer-logo">{BRANDING.name}</div>
            <p className="footer-tagline">{BRANDING.tagline}</p>
          </div>
          
          <div className="footer-column">
            <h4 className="footer-heading">Product</h4>
            <ul className="footer-links">
              <li><a href="#how-it-works">How it works</a></li>
              <li><a href="#templates">Templates</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
          </div>
          
          <div className="footer-column">
            <h4 className="footer-heading">Company</h4>
            <ul className="footer-links">
              <li><a href="/about">About</a></li>
              <li><a href="/contact">Contact</a></li>
              <li><a href="/blog">Blog</a></li>
            </ul>
          </div>
          
          <div className="footer-column">
            <h4 className="footer-heading">Legal</h4>
            <ul className="footer-links">
              <li><a href="/privacy">Privacy Policy</a></li>
              <li><a href="/terms">Terms of Service</a></li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <div className="footer-container">
          <p className="footer-copyright">
            © {currentYear} {BRANDING.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default LandingFooter
