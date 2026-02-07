import { useHistory } from 'react-router-dom'
import { BRANDING } from '../../config/branding'
import './LandingHeader.css'

function LandingHeader() {
  const history = useHistory()

  return (
    <header className="landing-header">
      <div className="landing-toolbar">
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
          
          <div className="landing-nav-actions">
            <button 
              onClick={() => history.push('/auth/phone')}
              className="nav-btn-secondary"
            >
              Login
            </button>
            <button 
              onClick={() => history.push('/demo')}
              className="nav-btn-primary"
            >
              Create Invoice
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default LandingHeader
