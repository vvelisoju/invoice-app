import { useHistory } from 'react-router-dom'
import './PricingSection.css'

function PricingSection() {
  const history = useHistory()
  
  const plans = [
    {
      name: 'Free',
      price: '₹0',
      period: 'forever',
      description: 'Perfect for getting started',
      features: [
        '10 invoices per month',
        'Unlimited customers',
        'Unlimited products',
        'Basic templates',
        'PDF download',
        'WhatsApp sharing',
        'Offline drafts'
      ],
      cta: 'Get Started Free',
      primary: false
    },
    {
      name: 'Pro',
      price: '₹299',
      period: 'per month',
      description: 'For growing businesses',
      features: [
        'Unlimited invoices',
        'Unlimited customers',
        'Unlimited products',
        'All premium templates',
        'Template customization',
        'Priority support',
        'Advanced reports',
        'Export to CSV'
      ],
      cta: 'Start Free Trial',
      primary: true,
      badge: 'Most Popular'
    }
  ]

  return (
    <section id="pricing" className="landing-section landing-section-dark">
      <h2 className="section-title">Simple, transparent pricing</h2>
      <p className="section-subtitle">
        Start free, upgrade when you need more
      </p>
      
      <div className="pricing-grid">
        {plans.map((plan) => (
          <div key={plan.name} className={`pricing-card ${plan.primary ? 'pricing-card-primary' : ''}`}>
            {plan.badge && <div className="pricing-badge">{plan.badge}</div>}
            <div className="pricing-header">
              <h3 className="pricing-name">{plan.name}</h3>
              <div className="pricing-price">
                <span className="price-amount">{plan.price}</span>
                <span className="price-period">/{plan.period}</span>
              </div>
              <p className="pricing-description">{plan.description}</p>
            </div>
            <ul className="pricing-features">
              {plan.features.map((feature, index) => (
                <li key={index} className="pricing-feature">
                  <span className="feature-check">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            <button 
              className={plan.primary ? 'pricing-btn-primary' : 'pricing-btn-secondary'}
              onClick={() => history.push('/demo')}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}

export default PricingSection
