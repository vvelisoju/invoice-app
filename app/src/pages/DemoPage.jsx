import { useState } from 'react'
import { useHistory } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import BasicInvoiceForm from '../components/invoice/BasicInvoiceForm'
import AdvancedInvoiceForm from '../components/invoice/AdvancedInvoiceForm'
import RegistrationModal from '../components/demo/RegistrationModal'
import './DemoPage.css'

function DemoPage() {
  const history = useHistory()
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  
  const initialBasicData = {
    from: 'Venkatesh',
    billTo: 'Venkatesh',
    invoiceNumber: '100',
    invoiceDate: '01/02/2026',
    lineItems: [
      { description: 'Description', amount: '0.0', tax: '' },
      { description: 'Description', amount: '0.0', tax: '' }
    ],
    terms: 'Payment is due within 15 days'
  }

  const initialAdvancedData = {
    from: 'Venkatesh',
    billTo: 'Venkatesh',
    shipTo: '',
    invoiceNumber: '100',
    invoiceDate: '01/02/2026',
    poNumber: '',
    dueDate: '15/02/2026',
    lineItems: [
      { qty: '1.0', description: 'Description', unitPrice: '0.0', amount: '0.0', tax: '' },
      { qty: '1.0', description: 'Description', unitPrice: '0.0', amount: '0.0', tax: '' }
    ],
    terms: 'Payment is due within 15 days'
  }

  const handleSave = (formData) => {
    setShowModal(true)
  }

  const templates = [
    { id: 1, name: 'Classic', selected: true },
    { id: 2, name: 'Modern', selected: false },
    { id: 3, name: 'Minimal', selected: false },
    { id: 4, name: 'Bold', selected: false },
    { id: 5, name: 'Professional', selected: false },
    { id: 6, name: 'Elegant', selected: false }
  ]

  return (
    <div className="min-h-screen bg-bgPrimary flex flex-col">
      <header className="bg-bgSecondary border-b border-border px-6 py-3 flex items-center justify-between shrink-0">
        <h1 className="text-lg font-semibold text-textPrimary">Live Invoice Demo</h1>
        <button onClick={() => history.push('/')} className="flex items-center gap-1 text-sm text-primary hover:underline font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
      </header>
      <main className="flex-1 overflow-y-auto demo-content">
        <div className="demo-container">
          <div className="demo-document-types">
            <button className="doc-type-btn">+ New:</button>
            <button className="doc-type-btn active">Invoice</button>
            <button className="doc-type-btn">Tax Invoice</button>
            <button className="doc-type-btn">Proforma Invoice</button>
            <button className="doc-type-btn">Receipt</button>
            <button className="doc-type-btn">Sales Receipt</button>
            <button className="doc-type-btn">Cash Receipt</button>
          </div>

          <div className="demo-form-card">
            <div className="invoice-form-tabs">
              <button 
                className={`invoice-tab-btn ${activeTab === 'basic' ? 'active' : ''}`}
                onClick={() => setActiveTab('basic')}
              >
                Basic Form
              </button>
              <button 
                className={`invoice-tab-btn ${activeTab === 'advanced' ? 'active' : ''}`}
                onClick={() => setActiveTab('advanced')}
              >
                Advanced Form - Due Date, Ship To, Qty
              </button>
            </div>

            {activeTab === 'basic' ? (
              <BasicInvoiceForm 
                initialData={initialBasicData}
                onSave={handleSave}
                showSaveButton={true}
              />
            ) : (
              <AdvancedInvoiceForm 
                initialData={initialAdvancedData}
                onSave={handleSave}
                showSaveButton={true}
              />
            )}
          </div>

          <div className="templates-section">
            <h2 className="templates-title">Select a Template</h2>
            <p className="templates-subtitle">More templates inside!</p>
            <div className="templates-grid-demo">
              {templates.map((template) => (
                <div key={template.id} className={`template-thumb ${template.selected ? 'selected' : ''}`}>
                  <div className="template-preview-mini">
                    <div className="template-mini-header"></div>
                    <div className="template-mini-content">
                      <div className="mini-line"></div>
                      <div className="mini-line"></div>
                      <div className="mini-line short"></div>
                    </div>
                  </div>
                  {template.selected && <div className="selected-badge">✓</div>}
                  <div className="template-thumb-name">{template.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <RegistrationModal isOpen={showModal} onClose={() => setShowModal(false)} />
      </main>
    </div>
  )
}

export default DemoPage
