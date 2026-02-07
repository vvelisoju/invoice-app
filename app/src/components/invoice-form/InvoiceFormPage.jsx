import { useState } from 'react'
import { Building2, User, PenTool, Hash, Check } from 'lucide-react'
import {
  InvoiceNavbar,
  InvoiceSidebar,
  InvoiceToolbar,
  FormSection,
  FormTextarea,
  FormInput,
  LogoUpload,
  LineItemsSection,
  InvoiceTotals,
  SignatureBox,
  InvoiceTaxModal,
  InvoiceFooter
} from './index'

/**
 * InvoiceFormPage — The fully composed invoice creation page.
 * Combines Navbar, Sidebar, Toolbar, form sections, line items, totals, and footer.
 */
export default function InvoiceFormPage({ initialData = {}, onSave }) {
  const [activeTab, setActiveTab] = useState('basic')
  const [showTaxModal, setShowTaxModal] = useState(false)
  const [selectedItemIndex, setSelectedItemIndex] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    from: initialData.from || 'Secure Studio',
    billTo: initialData.billTo || '',
    invoiceNumber: initialData.invoiceNumber || '103',
    invoiceDate: initialData.invoiceDate || '2026-02-07',
    lineItems: initialData.lineItems || [
      { description: '', amount: '', tax: '', taxName: '' },
      { description: '', amount: '', tax: '', taxName: '' }
    ],
    terms: initialData.terms || 'Payment is due within 15 days'
  })

  // --- Field Updaters ---
  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const updateLineItem = (index, field, value) => {
    setFormData((prev) => {
      const newItems = [...prev.lineItems]
      newItems[index] = { ...newItems[index], [field]: value }
      return { ...prev, lineItems: newItems }
    })
  }

  const addLineItem = () => {
    setFormData((prev) => ({
      ...prev,
      lineItems: [...prev.lineItems, { description: '', amount: '', tax: '', taxName: '' }]
    }))
  }

  const removeLineItem = (index) => {
    if (formData.lineItems.length > 1) {
      setFormData((prev) => ({
        ...prev,
        lineItems: prev.lineItems.filter((_, i) => i !== index)
      }))
    }
  }

  // --- Tax ---
  const openTaxModal = (index) => {
    setSelectedItemIndex(index)
    setShowTaxModal(true)
  }

  const handleAddTax = (taxRate, taxName) => {
    if (selectedItemIndex !== null) {
      setFormData((prev) => {
        const newItems = [...prev.lineItems]
        newItems[selectedItemIndex] = {
          ...newItems[selectedItemIndex],
          tax: taxRate.toString(),
          taxName: taxName
        }
        return { ...prev, lineItems: newItems }
      })
    }
  }

  // --- Calculations ---
  const calculateSubtotal = () =>
    formData.lineItems.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0)

  const calculateTaxRows = () => {
    const taxMap = {}
    formData.lineItems.forEach((item) => {
      const rate = parseFloat(item.tax || 0)
      if (rate > 0) {
        const label = item.taxName || `Tax ${rate}%`
        const amount = parseFloat(item.amount || 0) * rate / 100
        if (taxMap[label]) {
          taxMap[label] += amount
        } else {
          taxMap[label] = amount
        }
      }
    })
    return Object.entries(taxMap).map(([label, amount]) => ({ label, amount }))
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const taxTotal = calculateTaxRows().reduce((sum, row) => sum + row.amount, 0)
    return subtotal + taxTotal
  }

  // --- Save ---
  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave?.(formData)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-bgPrimary font-sans text-textPrimary antialiased h-screen overflow-hidden flex flex-col">
      {/* Top Navigation */}
      <InvoiceNavbar />

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <InvoiceSidebar />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-bgPrimary p-4 md:p-8 relative">
          {/* Document Container */}
          <div className="max-w-4xl mx-auto bg-bgSecondary rounded-xl shadow-card min-h-[800px] flex flex-col relative">
            {/* Toolbar */}
            <InvoiceToolbar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onPreview={() => {}}
              onSave={handleSave}
              isSaving={isSaving}
            />

            {/* Form Content */}
            <div className="p-8 md:p-12 flex-1">
              {/* Top Section: Header Info */}
              <div className="flex flex-col md:flex-row gap-12 mb-12">
                {/* Left Column: From & Bill To */}
                <div className="flex-1 space-y-8">
                  <FormSection
                    icon={Building2}
                    label="From"
                    labelColorClass="text-primary"
                    iconColorClass="text-primary/70"
                  >
                    <div className="relative">
                      <FormTextarea
                        value={formData.from}
                        onChange={(e) => updateField('from', e.target.value)}
                        placeholder="Your Business Name & Address"
                        rows={3}
                      />
                      {/* Validation indicator */}
                      {formData.from && (
                        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-600">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        </div>
                      )}
                    </div>
                  </FormSection>

                  <FormSection
                    icon={User}
                    label="Bill To"
                    labelColorClass="text-orange-600"
                    iconColorClass="text-orange-500/70"
                  >
                    <FormTextarea
                      value={formData.billTo}
                      onChange={(e) => updateField('billTo', e.target.value)}
                      placeholder="Customer's billing address"
                      rows={3}
                    />
                  </FormSection>
                </div>

                {/* Right Column: Logo & Metadata */}
                <div className="w-full md:w-72 flex flex-col gap-6">
                  <LogoUpload onClick={() => {}} />

                  <div className="bg-bgPrimary/30 rounded-xl p-5 border border-transparent hover:border-border transition-all">
                    <FormInput
                      label="Invoice #"
                      type="text"
                      value={formData.invoiceNumber}
                      onChange={(e) => updateField('invoiceNumber', e.target.value)}
                      trailingIcon={Hash}
                    />
                    <FormInput
                      label="Date"
                      type="date"
                      value={formData.invoiceDate}
                      onChange={(e) => updateField('invoiceDate', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <LineItemsSection
                lineItems={formData.lineItems}
                onUpdateItem={updateLineItem}
                onRemoveItem={removeLineItem}
                onAddItem={addLineItem}
                onTaxClick={openTaxModal}
                onAddSavedItems={() => {}}
              />

              {/* Footer / Totals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-border">
                {/* Terms */}
                <div className="space-y-8">
                  <FormSection
                    icon={PenTool}
                    label="Terms & Conditions"
                    labelColorClass="text-textSecondary"
                    iconColorClass="text-textSecondary/70"
                    action={
                      <button className="text-[10px] text-primary hover:underline">
                        Edit Default
                      </button>
                    }
                  >
                    <FormTextarea
                      value={formData.terms}
                      onChange={(e) => updateField('terms', e.target.value)}
                      placeholder="Payment is due within 15 days..."
                      rows={4}
                    />
                  </FormSection>
                </div>

                {/* Totals + Signature */}
                <div>
                  <InvoiceTotals
                    subtotal={calculateSubtotal()}
                    taxRows={calculateTaxRows()}
                    total={calculateTotal()}
                  />
                  <SignatureBox onClick={() => {}} />
                </div>
              </div>
            </div>

            {/* Bottom Action Bar */}
            <InvoiceFooter onSave={handleSave} />
          </div>

          {/* Copyright */}
          <div className="text-center mt-8 mb-4">
            <p className="text-xs text-textSecondary">
              &copy; 2026 InvoiceApp. All rights reserved.
            </p>
          </div>
        </main>
      </div>

      {/* Tax Modal */}
      <InvoiceTaxModal
        isOpen={showTaxModal}
        onClose={() => setShowTaxModal(false)}
        onAddTax={handleAddTax}
      />
    </div>
  )
}
