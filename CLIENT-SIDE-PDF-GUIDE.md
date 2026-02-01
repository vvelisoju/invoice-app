# Client-Side PDF Generation Guide

## Overview
This document explains how to implement **client-side PDF generation** for the Invoice App, where PDFs are generated on-demand in the browser/mobile app instead of being stored on the server.

## Architecture Decision

### Why Client-Side PDF Generation?
- ✅ **No storage costs**: No need for object storage (S3, etc.)
- ✅ **Always fresh**: PDF reflects latest template rendering logic
- ✅ **Offline capable**: Generate PDFs after sync without server connection
- ✅ **Faster iteration**: Update templates without server deployments
- ✅ **Privacy**: Invoice data never leaves user's device as PDF file

### Trade-offs
- ⚠️ **Consistency**: Must ensure rendering is consistent across devices/browsers
- ⚠️ **Performance**: PDF generation happens on user's device (battery/CPU)
- ⚠️ **Complexity**: Template system must be robust and well-tested

## Schema Changes

### Invoice Model
**Removed:**
- `pdfUrl` (no server storage)
- `pdfGeneratedAt` (not needed)

**Kept:**
- `templateBaseId` - references which template to use
- `templateConfigSnapshot` - frozen config at issuance time
- `templateVersion` - for tracking template evolution
- `issuedAt` - marks when invoice became immutable

### BaseTemplate Model
**Changed:**
- `templateData` → `renderConfig`
  - Now contains React component metadata, styles, layout rules
  - Designed for client-side rendering

**Added:**
- `previewImageUrl` - optional thumbnail for template selection UI

## Implementation Approach

### 1. Template System Architecture

#### Template Registry (Frontend)
Create a registry of React components that can render invoices:

```javascript
// app/src/templates/registry.js
import CleanTemplate from './CleanTemplate'
import ModernTemplate from './ModernTemplate'

export const templateRegistry = {
  'clean-template-v1': CleanTemplate,
  'modern-template-v1': ModernTemplate
}
```

#### Template Component Structure
Each template is a React component that receives invoice data and config:

```javascript
// app/src/templates/CleanTemplate.jsx
export default function CleanTemplate({ invoice, business, customer, config }) {
  return (
    <div className="invoice-template" style={{ 
      '--primary-color': config.primaryColor,
      '--accent-color': config.accentColor 
    }}>
      {/* Header */}
      {config.showLogo && business.logoUrl && (
        <img src={business.logoUrl} alt="Logo" />
      )}
      
      {/* Business Info */}
      <div className="business-info">
        <h1>{business.name}</h1>
        {config.showBusinessGSTIN && business.gstin && (
          <p>GSTIN: {business.gstin}</p>
        )}
      </div>

      {/* Customer Info */}
      <div className="customer-info">
        <h2>Bill To:</h2>
        <p>{customer.name}</p>
        {config.showCustomerGSTIN && customer.gstin && (
          <p>GSTIN: {customer.gstin}</p>
        )}
      </div>

      {/* Invoice Details */}
      <div className="invoice-meta">
        <p>Invoice #: {invoice.invoiceNumber}</p>
        <p>Date: {formatDate(invoice.date)}</p>
        {config.showDueDate && invoice.dueDate && (
          <p>Due: {formatDate(invoice.dueDate)}</p>
        )}
      </div>

      {/* Line Items Table */}
      <table className="line-items">
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lineItems.map(item => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.quantity}</td>
              <td>{formatCurrency(item.rate)}</td>
              <td>{formatCurrency(item.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="totals">
        <div>Subtotal: {formatCurrency(invoice.subtotal)}</div>
        {invoice.discountTotal > 0 && (
          <div>Discount: -{formatCurrency(invoice.discountTotal)}</div>
        )}
        
        {/* GST Breakup */}
        {invoice.taxMode === 'CGST_SGST' && (
          <>
            <div>CGST ({invoice.taxBreakup.cgst}%): {formatCurrency(invoice.taxBreakup.cgstAmount)}</div>
            <div>SGST ({invoice.taxBreakup.sgst}%): {formatCurrency(invoice.taxBreakup.sgstAmount)}</div>
          </>
        )}
        {invoice.taxMode === 'IGST' && (
          <div>IGST ({invoice.taxBreakup.igst}%): {formatCurrency(invoice.taxBreakup.igstAmount)}</div>
        )}
        
        <div className="total">Total: {formatCurrency(invoice.total)}</div>
      </div>

      {/* Footer */}
      {config.showNotes && invoice.notes && (
        <div className="notes">
          <h3>Notes</h3>
          <p>{invoice.notes}</p>
        </div>
      )}
      
      {config.showTerms && invoice.terms && (
        <div className="terms">
          <h3>Terms & Conditions</h3>
          <p>{invoice.terms}</p>
        </div>
      )}
      
      {config.footerMessage && (
        <div className="footer">{config.footerMessage}</div>
      )}
    </div>
  )
}
```

### 2. PDF Generation Methods

#### Option A: Browser Print API (Recommended for V1)
Simplest approach - uses browser's native print-to-PDF:

```javascript
// app/src/features/invoices/generatePDF.js
export async function generatePDFViaPrint(invoice, template, config) {
  // 1. Render template in hidden container
  const container = document.createElement('div')
  container.style.position = 'absolute'
  container.style.left = '-9999px'
  document.body.appendChild(container)
  
  const root = createRoot(container)
  root.render(
    <TemplateRenderer 
      invoice={invoice} 
      template={template} 
      config={config} 
    />
  )
  
  // 2. Wait for render
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // 3. Trigger print dialog
  window.print()
  
  // 4. Cleanup
  root.unmount()
  document.body.removeChild(container)
}
```

**Pros:**
- Simple, no dependencies
- Native OS print dialog
- Works on mobile (Capacitor)

**Cons:**
- User must manually save as PDF
- No programmatic file access

#### Option B: react-pdf (Recommended for Production)
Generate actual PDF files programmatically:

```javascript
// app/src/features/invoices/generatePDF.js
import { pdf } from '@react-pdf/renderer'
import InvoicePDFDocument from './InvoicePDFDocument'

export async function generatePDF(invoice, business, customer, config) {
  const blob = await pdf(
    <InvoicePDFDocument 
      invoice={invoice}
      business={business}
      customer={customer}
      config={config}
    />
  ).toBlob()
  
  return blob
}

// Usage
const pdfBlob = await generatePDF(invoice, business, customer, config)

// Download
const url = URL.createObjectURL(pdfBlob)
const a = document.createElement('a')
a.href = url
a.download = `Invoice-${invoice.invoiceNumber}.pdf`
a.click()
URL.revokeObjectURL(url)

// Share (Capacitor)
import { Share } from '@capacitor/share'
await Share.share({
  title: `Invoice ${invoice.invoiceNumber}`,
  files: [pdfBlob],
  dialogTitle: 'Share Invoice'
})
```

**Pros:**
- Full control over PDF output
- Programmatic file access
- Works with Capacitor Share API

**Cons:**
- Larger bundle size
- More complex template syntax

#### Option C: jsPDF + html2canvas (Alternative)
Convert HTML to PDF via canvas:

```javascript
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export async function generatePDFFromHTML(elementId) {
  const element = document.getElementById(elementId)
  const canvas = await html2canvas(element)
  const imgData = canvas.toDataURL('image/png')
  
  const pdf = new jsPDF('p', 'mm', 'a4')
  const imgWidth = 210
  const imgHeight = (canvas.height * imgWidth) / canvas.width
  
  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
  return pdf.output('blob')
}
```

**Pros:**
- Works with existing HTML/CSS
- Good for complex layouts

**Cons:**
- Quality depends on screen resolution
- Larger file sizes (images)

### 3. Recommended Implementation Flow

#### Invoice Issuance
```javascript
// app/src/features/invoices/useIssueInvoice.js
export function useIssueInvoice() {
  const issueInvoice = async (invoiceId) => {
    // 1. Get invoice data from local DB
    const invoice = await db.invoices.get(invoiceId)
    
    // 2. Get active template config
    const templateConfig = await db.templateConfigs
      .where({ businessId: invoice.businessId, isActive: true })
      .first()
    
    // 3. Call server to issue (enforces plan limits, snapshots template)
    const response = await api.post(`/invoices/${invoiceId}/issue`, {
      templateBaseId: templateConfig.baseTemplateId,
      templateConfigSnapshot: templateConfig.config,
      templateVersion: templateConfig.version
    })
    
    // 4. Update local invoice status
    await db.invoices.update(invoiceId, {
      status: 'ISSUED',
      issuedAt: response.issuedAt,
      templateBaseId: response.templateBaseId,
      templateConfigSnapshot: response.templateConfigSnapshot,
      templateVersion: response.templateVersion
    })
    
    return response
  }
  
  return { issueInvoice }
}
```

#### PDF Generation (On-Demand)
```javascript
// app/src/features/invoices/useGeneratePDF.js
export function useGeneratePDF() {
  const generatePDF = async (invoiceId) => {
    // 1. Get invoice with snapshot
    const invoice = await db.invoices.get(invoiceId)
    const business = await db.businessSettings.get(invoice.businessId)
    const customer = await db.customers.get(invoice.customerId)
    const lineItems = await db.invoiceLineItems
      .where({ invoiceId })
      .toArray()
    
    // 2. Get template component
    const baseTemplate = await api.get(`/templates/base/${invoice.templateBaseId}`)
    const TemplateComponent = templateRegistry[baseTemplate.renderConfig.componentId]
    
    // 3. Generate PDF using snapshotted config
    const pdfBlob = await generatePDF(
      { ...invoice, lineItems },
      business,
      customer,
      invoice.templateConfigSnapshot // Use snapshot, not current config
    )
    
    return pdfBlob
  }
  
  return { generatePDF }
}
```

#### WhatsApp Share
```javascript
// app/src/features/invoices/useShareInvoice.js
import { Share } from '@capacitor/share'
import { Filesystem, Directory } from '@capacitor/filesystem'

export function useShareInvoice() {
  const shareViaWhatsApp = async (invoiceId) => {
    // 1. Generate PDF
    const pdfBlob = await generatePDF(invoiceId)
    
    // 2. Save to filesystem (Capacitor)
    const base64Data = await blobToBase64(pdfBlob)
    const fileName = `Invoice-${invoice.invoiceNumber}.pdf`
    
    const result = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Cache
    })
    
    // 3. Share
    await Share.share({
      title: `Invoice ${invoice.invoiceNumber}`,
      text: `Please find attached invoice ${invoice.invoiceNumber}`,
      url: result.uri,
      dialogTitle: 'Share Invoice'
    })
  }
  
  return { shareViaWhatsApp }
}
```

### 4. Template Customization UI

```javascript
// app/src/features/templates/TemplateEditor.jsx
export function TemplateEditor() {
  const [config, setConfig] = useState(initialConfig)
  const [previewInvoice, setPreviewInvoice] = useState(sampleInvoice)
  
  return (
    <div className="template-editor">
      {/* Controls */}
      <div className="controls">
        <ColorPicker 
          label="Primary Color"
          value={config.primaryColor}
          onChange={(color) => setConfig({ ...config, primaryColor: color })}
        />
        
        <Toggle
          label="Show Business GSTIN"
          checked={config.showBusinessGSTIN}
          onChange={(checked) => setConfig({ ...config, showBusinessGSTIN: checked })}
        />
        
        {/* ... more controls */}
      </div>
      
      {/* Live Preview */}
      <div className="preview">
        <TemplateRenderer 
          invoice={previewInvoice}
          config={config}
        />
      </div>
      
      {/* Actions */}
      <button onClick={() => saveConfig(config)}>Save Template</button>
      <button onClick={() => generatePreviewPDF(previewInvoice, config)}>
        Preview PDF
      </button>
    </div>
  )
}
```

## Database Schema Summary

### What Changed
- ❌ Removed `Invoice.pdfUrl`
- ❌ Removed `Invoice.pdfGeneratedAt`
- ✅ Kept `Invoice.templateConfigSnapshot` (critical for consistency)
- ✅ Changed `BaseTemplate.templateData` → `renderConfig`
- ✅ Added `BaseTemplate.previewImageUrl`

### What Stayed
- ✅ Template snapshotting on issuance
- ✅ Plan enforcement on issue
- ✅ Invoice immutability after issuance
- ✅ Offline sync support

## Benefits of This Approach

1. **Cost Savings**: No object storage needed
2. **Flexibility**: Update templates without migrating old PDFs
3. **Offline**: Generate PDFs from synced data without server
4. **Privacy**: PDFs never stored on server
5. **Simplicity**: No PDF storage/retrieval infrastructure

## Recommended Tech Stack

### For V1 (Simple)
- Browser Print API + CSS print styles
- Capacitor Share plugin for WhatsApp

### For Production
- `@react-pdf/renderer` for programmatic PDF generation
- Capacitor Filesystem + Share for mobile
- Template registry pattern for maintainability

## Next Steps

1. ✅ Schema updated (completed)
2. ⏳ Implement template registry system
3. ⏳ Build 1-2 base templates with React
4. ⏳ Implement PDF generation service (choose method)
5. ⏳ Add template customization UI
6. ⏳ Test across devices/browsers for consistency
7. ⏳ Add print CSS for browser print method
8. ⏳ Integrate Capacitor Share for mobile
