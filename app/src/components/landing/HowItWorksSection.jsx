import './HowItWorksSection.css'

function HowItWorksSection() {
  const steps = [
    {
      number: '1',
      title: 'Enter the data',
      description: 'Fill in customer details and add line items. Drafts auto-save as you type.',
      icon: '📝'
    },
    {
      number: '2',
      title: 'Choose the template',
      description: 'Select a professional template and customize colors, logo, and layout.',
      icon: '🎨'
    },
    {
      number: '3',
      title: 'Download the PDF',
      description: 'Generate PDF instantly. Download, print, or share via WhatsApp.',
      icon: '📄'
    }
  ]

  return (
    <section id="how-it-works" className="landing-section landing-section-alt">
      <h2 className="section-title">How to create invoices in 3 steps</h2>
      <p className="section-subtitle">
        Simple, fast, and reliable invoicing workflow
      </p>
      
      <div className="steps-grid">
        {steps.map((step) => (
          <div key={step.number} className="step-card">
            <div className="step-icon">{step.icon}</div>
            <div className="step-number">{step.number}</div>
            <h3 className="step-title">{step.title}</h3>
            <p className="step-description">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default HowItWorksSection
