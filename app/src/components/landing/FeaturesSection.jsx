import './FeaturesSection.css'

function FeaturesSection() {
  const features = [
    {
      icon: '📊',
      title: 'GST-ready invoices',
      description: 'Automatic IGST / CGST+SGST calculation based on place of supply'
    },
    {
      icon: '📴',
      title: 'Offline drafts',
      description: 'Create invoices without internet. Auto-sync when you\'re back online'
    },
    {
      icon: '💬',
      title: 'WhatsApp sharing',
      description: 'Send PDF invoices directly to customers via WhatsApp in one tap'
    },
    {
      icon: '🎨',
      title: 'Template customization',
      description: 'Personalize with your logo, colors, and choose what fields to show'
    },
    {
      icon: '🔄',
      title: 'Invoice lifecycle',
      description: 'Track status from Draft → Issued → Paid with complete history'
    },
    {
      icon: '📈',
      title: 'Reports & analytics',
      description: 'Revenue summaries, GST breakup, and monthly trends at a glance'
    }
  ]

  return (
    <section className="landing-section landing-section-alt">
      <h2 className="section-title">Everything you need to invoice professionally</h2>
      <p className="section-subtitle">
        Powerful features designed for speed, reliability, and compliance
      </p>
      
      <div className="features-grid">
        {features.map((feature, index) => (
          <div key={index} className="feature-card">
            <div className="feature-icon">{feature.icon}</div>
            <h3 className="feature-title">{feature.title}</h3>
            <p className="feature-description">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default FeaturesSection
