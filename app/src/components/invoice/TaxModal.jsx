import { useState } from 'react'
import './TaxModal.css'

function TaxModal({ isOpen, onClose, onAddTax }) {
  const [taxRate, setTaxRate] = useState('')
  const [taxName, setTaxName] = useState('')

  const handleSubmit = () => {
    if (taxRate && parseFloat(taxRate) > 0) {
      onAddTax(parseFloat(taxRate), taxName || `Tax ${taxRate}%`)
      setTaxRate('')
      setTaxName('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="tax-modal-overlay" onClick={onClose}>
      <div className="tax-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="tax-modal-header">
          <h3>Add Tax</h3>
          <button className="tax-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="tax-modal-body">
          <div className="tax-modal-field">
            <label>Tax Name (Optional)</label>
            <input
              type="text"
              value={taxName}
              onChange={(e) => setTaxName(e.target.value)}
              placeholder="e.g., GST, VAT"
            />
          </div>
          <div className="tax-modal-field">
            <label>Tax Rate (%)</label>
            <input
              type="number"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              placeholder="e.g., 18"
              step="0.01"
              autoFocus
            />
          </div>
        </div>
        <div className="tax-modal-footer">
          <button className="tax-modal-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="tax-modal-btn-add" onClick={handleSubmit}>Add Tax</button>
        </div>
      </div>
    </div>
  )
}

export default TaxModal
