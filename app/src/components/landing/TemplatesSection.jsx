import { useHistory } from 'react-router-dom'
import './TemplatesSection.css'

function TemplatesSection() {
  const history = useHistory()
  
  const templates = [
    { id: 1, name: 'Classic', color: '#ffffff', accent: '#2563eb' },
    { id: 2, name: 'Modern', color: '#f9fafb', accent: '#10b981' },
    { id: 3, name: 'Minimal', color: '#ffffff', accent: '#6b7280' },
    { id: 4, name: 'Bold', color: '#fef3c7', accent: '#f59e0b' },
    { id: 5, name: 'Professional', color: '#dbeafe', accent: '#3b82f6' },
    { id: 6, name: 'Elegant', color: '#f3e8ff', accent: '#a855f7' }
  ]

  return (
    <section id="templates" className="landing-section">
      <h2 className="section-title">Choose a template that suits your business</h2>
      <p className="section-subtitle">
        Professional invoice templates with customizable branding, colors, and layouts
      </p>
      
      <div className="templates-grid">
        {templates.map((template) => (
          <div key={template.id} className="template-card">
            <div className="template-preview" style={{ background: template.color }}>
              <div className="template-header" style={{ borderBottom: `3px solid ${template.accent}` }}>
                <div className="template-logo" style={{ background: template.accent }}></div>
                <div className="template-title" style={{ color: template.accent }}>INVOICE</div>
              </div>
              <div className="template-content">
                <div className="template-line" style={{ background: template.accent, opacity: 0.3 }}></div>
                <div className="template-line" style={{ background: template.accent, opacity: 0.2 }}></div>
                <div className="template-line short" style={{ background: template.accent, opacity: 0.2 }}></div>
                <div className="template-items">
                  <div className="template-item" style={{ background: template.accent, opacity: 0.1 }}></div>
                  <div className="template-item" style={{ background: template.accent, opacity: 0.1 }}></div>
                </div>
                <div className="template-total" style={{ background: template.accent, opacity: 0.2 }}></div>
              </div>
            </div>
            <div className="template-name">{template.name}</div>
          </div>
        ))}
      </div>
      
      <div className="templates-cta">
        <button 
          className="templates-cta-btn"
          onClick={() => history.push('/demo')}
        >
          Try Templates Now
        </button>
      </div>
    </section>
  )
}

export default TemplatesSection
