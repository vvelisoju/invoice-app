import { useState } from 'react'
import TaxModal from './TaxModal'
import './InvoiceFormStyles.css'

function AdvancedInvoiceForm({ initialData = {}, onSave, showSaveButton = true }) {
  const [showTaxModal, setShowTaxModal] = useState(false)
  const [selectedItemIndex, setSelectedItemIndex] = useState(null)
  const [formData, setFormData] = useState({
    from: initialData.from || '',
    billTo: initialData.billTo || '',
    shipTo: initialData.shipTo || '',
    invoiceNumber: initialData.invoiceNumber || '',
    invoiceDate: initialData.invoiceDate || new Date().toLocaleDateString('en-GB'),
    poNumber: initialData.poNumber || '',
    dueDate: initialData.dueDate || '',
    lineItems: initialData.lineItems || [
      { qty: '1.0', description: '', unitPrice: '0.0', amount: '0.0', tax: '' }
    ],
    terms: initialData.terms || 'Payment is due within 15 days'
  })

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value })
  }

  const addLineItem = () => {
    setFormData({
      ...formData,
      lineItems: [...formData.lineItems, { qty: '1.0', description: '', unitPrice: '0.0', amount: '0.0', tax: '' }]
    })
  }

  const removeLineItem = (index) => {
    if (formData.lineItems.length > 1) {
      const newItems = formData.lineItems.filter((_, i) => i !== index)
      setFormData({ ...formData, lineItems: newItems })
    }
  }

  const updateLineItem = (index, field, value) => {
    const newItems = [...formData.lineItems]
    newItems[index][field] = value
    
    // Auto-calculate amount when qty or unitPrice changes
    if (field === 'qty' || field === 'unitPrice') {
      const qty = parseFloat(field === 'qty' ? value : newItems[index].qty) || 0
      const unitPrice = parseFloat(field === 'unitPrice' ? value : newItems[index].unitPrice) || 0
      newItems[index].amount = (qty * unitPrice).toFixed(2)
    }
    
    setFormData({ ...formData, lineItems: newItems })
  }

  const openTaxModal = (index) => {
    setSelectedItemIndex(index)
    setShowTaxModal(true)
  }

  const handleAddTax = (taxRate, taxName) => {
    if (selectedItemIndex !== null) {
      const newItems = [...formData.lineItems]
      newItems[selectedItemIndex].tax = taxRate.toString()
      newItems[selectedItemIndex].taxName = taxName || `Tax ${taxRate}%`
      setFormData({ ...formData, lineItems: newItems })
    }
  }

  const handleEditTax = (index) => {
    setSelectedItemIndex(index)
    setShowTaxModal(true)
  }

  const handleDeleteTax = (index) => {
    const newItems = [...formData.lineItems]
    newItems[index].tax = ''
    newItems[index].taxName = ''
    setFormData({ ...formData, lineItems: newItems })
  }

  const calculateSubtotal = () => {
    return formData.lineItems.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0)
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const taxAmount = formData.lineItems.reduce((sum, item) => {
      const amount = parseFloat(item.amount || 0)
      const taxRate = parseFloat(item.tax || 0)
      return sum + (amount * taxRate / 100)
    }, 0)
    return subtotal + taxAmount
  }

  const handleSave = () => {
    if (onSave) {
      onSave(formData)
    }
  }

  return (
    <div className="invoice-form-wrapper">
      <div className="invoice-form-content">
        <div className="invoice-form-row">
          <div className="invoice-form-group">
            <label className="invoice-form-label">
              <span>👤</span> From
            </label>
            <textarea
              value={formData.from}
              onChange={(e) => updateField('from', e.target.value)}
              rows={3}
              className="invoice-form-textarea"
              placeholder="Your business name and address"
            />
          </div>
          <div className="invoice-right-column">
            <div className="invoice-logo-section">
              <div className="invoice-logo-icon">🖼️</div>
              <div className="invoice-logo-text">Select Logo</div>
              <button className="invoice-logo-btn">Logo Gallery</button>
            </div>
          </div>
        </div>

        <div className="invoice-form-row">
          <div className="invoice-form-group">
            <label className="invoice-form-label">
              <span>👥</span> Bill To
            </label>
            <textarea
              value={formData.billTo}
              onChange={(e) => updateField('billTo', e.target.value)}
              rows={4}
              className="invoice-form-textarea"
              placeholder="Customer name and address"
            />
          </div>
          <div className="invoice-right-column">
            <div className="invoice-form-group">
              <label className="invoice-form-label">
                <span>🔢</span> Invoice #
              </label>
              <input
                type="text"
                value={formData.invoiceNumber}
                onChange={(e) => updateField('invoiceNumber', e.target.value)}
                className="invoice-form-input"
                placeholder="100"
              />
            </div>
            <div className="invoice-form-group">
              <label className="invoice-form-label">
                <span>📅</span> Invoice Date
              </label>
              <input
                type="text"
                value={formData.invoiceDate}
                onChange={(e) => updateField('invoiceDate', e.target.value)}
                className="invoice-form-input"
                placeholder="01/02/2026"
              />
            </div>
          </div>
        </div>

        <div className="invoice-form-row">
          <div className="invoice-form-group">
            <label className="invoice-form-label">
              <span>📦</span> Ship To
            </label>
            <textarea
              value={formData.shipTo}
              onChange={(e) => updateField('shipTo', e.target.value)}
              rows={3}
              className="invoice-form-textarea"
              placeholder="Your customer's shipping address (optional)"
            />
          </div>
          <div className="invoice-right-column">
            <div className="invoice-form-group">
              <label className="invoice-form-label">
                <span>📋</span> P.O.#
              </label>
              <input
                type="text"
                value={formData.poNumber}
                onChange={(e) => updateField('poNumber', e.target.value)}
                className="invoice-form-input"
                placeholder="Purchase Order (optional)"
              />
            </div>
            <div className="invoice-form-group">
              <label className="invoice-form-label">
                <span>📆</span> Due Date
              </label>
              <input
                type="text"
                value={formData.dueDate}
                onChange={(e) => updateField('dueDate', e.target.value)}
                className="invoice-form-input"
                placeholder="15/02/2026"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="invoice-line-items-section">
        <table className="invoice-line-items-table">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>Qty</th>
              <th>Description</th>
              <th style={{ width: '120px' }}>Unit Price</th>
              <th style={{ width: '120px' }}>Amount</th>
              <th style={{ width: '150px' }}>Tax</th>
              <th style={{ width: '40px' }}></th>
            </tr>
          </thead>
          <tbody>
            {formData.lineItems.map((item, index) => (
              <tr key={index}>
                <td>
                  <input
                    type="number"
                    value={item.qty}
                    onChange={(e) => updateLineItem(index, 'qty', e.target.value)}
                    placeholder="1.0"
                    step="0.01"
                  />
                </td>
                <td>
                  <textarea
                    value={item.description}
                    onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                    placeholder="Description"
                    rows={2}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => updateLineItem(index, 'unitPrice', e.target.value)}
                    placeholder="0.0"
                    step="0.01"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={item.amount}
                    onChange={(e) => updateLineItem(index, 'amount', e.target.value)}
                    placeholder="0.0"
                    step="0.01"
                  />
                </td>
                <td className="invoice-tax-cell">
                  {item.tax ? (
                    <div className="invoice-tax-badge">
                      <span className="invoice-tax-badge-text">
                        {item.taxName || `Tax ${item.tax}%`}
                      </span>
                      <div className="invoice-tax-badge-actions">
                        <button 
                          className="invoice-tax-edit-btn"
                          onClick={() => handleEditTax(index)}
                          title="Edit tax"
                        >
                          🔄
                        </button>
                        <button 
                          className="invoice-tax-delete-btn"
                          onClick={() => handleDeleteTax(index)}
                          title="Remove tax"
                        >
                          ❌
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      className="invoice-add-tax-btn"
                      onClick={() => openTaxModal(index)}
                    >
                      Add a Tax
                    </button>
                  )}
                </td>
                <td>
                  <button
                    className="invoice-remove-btn"
                    onClick={() => removeLineItem(index)}
                    disabled={formData.lineItems.length === 1}
                  >
                    ❌
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="invoice-add-item-btn" onClick={addLineItem}>
          Add New Item
        </button>
      </div>

      <div className="invoice-totals-section">
        <div className="invoice-totals-row">
          <span>Subtotal</span>
          <span>₹ {calculateSubtotal().toFixed(2)}</span>
        </div>
        <div className="invoice-totals-row total-final">
          <div>
            <div>TOTAL INR</div>
            <span className="edit-link">Edit</span>
          </div>
          <span>₹ {calculateTotal().toFixed(2)}</span>
        </div>
      </div>

      <div className="invoice-terms-section">
        <div className="invoice-terms-row">
          <div className="invoice-form-group">
            <label className="invoice-form-label">
              <span>📝</span> Terms & Conditions <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Edit</span>
            </label>
            <textarea
              value={formData.terms}
              onChange={(e) => updateField('terms', e.target.value)}
              rows={4}
              className="invoice-form-textarea"
              placeholder="Payment terms and conditions"
            />
          </div>
          <div className="invoice-signature-section">
            <div className="invoice-signature-icon">✍️</div>
            <div className="invoice-signature-text">Add Your Signature</div>
          </div>
        </div>
      </div>

      {showSaveButton && (
        <div className="invoice-action-bar">
          <button className="invoice-action-btn" onClick={handleSave}>
            <span>💾</span>
            Save Invoice, Print or Send via Email
          </button>
        </div>
      )}

      <TaxModal 
        isOpen={showTaxModal}
        onClose={() => setShowTaxModal(false)}
        onAddTax={handleAddTax}
      />
    </div>
  )
}

export default AdvancedInvoiceForm
