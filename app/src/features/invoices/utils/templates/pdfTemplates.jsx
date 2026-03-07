import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { DOCUMENT_TYPE_DEFAULTS } from '../../../../config/documentTypeDefaults'
import BaseInvoiceDocument from './themes/BaseInvoiceDocument'
import { ALL_THEMES, THEME_IDS, resolveTheme, LEGACY_MAP } from './themes/index'

// ============================================================================
// Shared Helpers
// ============================================================================

// Resolve document type labels, heading, and field visibility for PDF rendering.
// Falls back to invoice defaults if no config is attached.
const getDocLabels = (invoice) => {
  const cfg = invoice.docTypeConfig || DOCUMENT_TYPE_DEFAULTS[invoice.documentType] || DOCUMENT_TYPE_DEFAULTS.invoice
  return {
    heading: cfg.heading || 'INVOICE',
    fromLabel: cfg.labels?.fromSection || 'From',
    toLabel: cfg.labels?.toSection || 'Bill To',
    numberLabel: cfg.labels?.numberField || 'Invoice #',
    dateLabel: cfg.labels?.dateField || 'Invoice Date',
    // Line-item column labels
    descriptionCol: cfg.labels?.descriptionCol || 'Description',
    unitPriceCol: cfg.labels?.unitPriceCol || 'Unit Price',
    qtyCol: cfg.labels?.qtyCol || 'Qty',
    amountCol: cfg.labels?.amountCol || 'Amount',
    taxCol: cfg.labels?.taxCol || 'Tax',
    showShipTo: cfg.fields?.showShipTo !== false,
    showDueDate: cfg.fields?.showDueDate !== false,
    showPoNumber: cfg.fields?.showPoNumber !== false,
    showLogo: cfg.fields?.showLogo !== false,
    showTerms: cfg.fields?.showTerms !== false,
    showSignature: cfg.fields?.showSignature !== false,
    showNotes: cfg.fields?.showNotes !== false,
    showTax: cfg.fields?.showTax !== false,
    showQty: cfg.fields?.showQty !== false,
    showUnitPrice: cfg.fields?.showUnitPrice !== false,
    lineItemsLayout: cfg.fields?.lineItemsLayout || 'full',
  }
}

const formatCurrency = (amount) => {
  const num = Number(amount) || 0
  const formatted = num.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
  return `Rs. ${formatted}`
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

// Resolve logo/signature: prefer invoice-level snapshot, fallback to business profile
// Format per-line-item tax label for display in the table
const formatItemTax = (item) => {
  if (!item.taxRate) return ''
  const rate = Number(item.taxRate)
  if (rate) return `${rate}%`
  return ''
}

// Check if any line item has per-item tax data
const hasLineItemTax = (lineItems) => lineItems?.some(item => item.taxRate || item.taxRateName)

// Compute per-rate tax breakdown from line items
// Returns { entries: [{name, rate, amount}], totalTax: number }
function computeTaxBreakdown(lineItems) {
  const breakdown = {}
  ;(lineItems || []).forEach((item) => {
    if (item.taxRate && Number(item.taxRate) > 0) {
      const lineTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0)
      const comps = item.taxComponents && Array.isArray(item.taxComponents) && item.taxComponents.length >= 2
        ? item.taxComponents : null
      if (comps) {
        comps.forEach((c) => {
          const key = `${c.name}_${c.rate}`
          const amt = (lineTotal * Number(c.rate)) / 100
          if (!breakdown[key]) breakdown[key] = { name: c.name, rate: Number(c.rate), amount: 0, isComponent: true }
          breakdown[key].amount += amt
        })
      } else {
        const rate = Number(item.taxRate)
        const key = String(rate)
        const amt = (lineTotal * rate) / 100
        if (!breakdown[key]) breakdown[key] = { name: 'Tax', rate, amount: 0 }
        breakdown[key].amount += amt
      }
    }
  })
  const entries = Object.values(breakdown).sort((a, b) => a.rate - b.rate)
  const totalTax = entries.reduce((sum, e) => sum + e.amount, 0)
  return { entries, totalTax }
}

// Compute the correct invoice total, accounting for per-item taxes
// This ensures the PDF shows the right total even for invoices saved before the server fix
function computeInvoiceTotal(invoice) {
  const subtotal = parseFloat(invoice.subtotal) || 0
  const discount = parseFloat(invoice.discountTotal) || 0
  const { totalTax } = computeTaxBreakdown(invoice.lineItems)
  // Use per-item tax if available, otherwise fall back to invoice-level taxTotal
  const tax = totalTax > 0 ? totalTax : (parseFloat(invoice.taxTotal) || 0)
  return subtotal - discount + tax
}

// Shared tax breakdown rows for totals section
// Expands tax group components (e.g. CGST + SGST) into individual lines
function TaxBreakdownRows({ invoice, doc, labelStyle, valueStyle, rowStyle }) {
  if (!doc.showTax) return null
  const { entries } = computeTaxBreakdown(invoice.lineItems)
  if (entries.length > 0) {
    return entries.map((entry, i) => (
      <View key={i} style={rowStyle}>
        <Text style={labelStyle}>{entry.isComponent ? entry.name : 'Tax'} ({entry.rate}%)</Text>
        <Text style={valueStyle}>{formatCurrency(entry.amount)}</Text>
      </View>
    ))
  }
  // Fallback: invoice-level tax
  if (invoice.taxTotal > 0) {
    return (
      <View style={rowStyle}>
        <Text style={labelStyle}>Tax{invoice.taxRate ? ` (${invoice.taxRate}%)` : ''}</Text>
        <Text style={valueStyle}>{formatCurrency(invoice.taxTotal)}</Text>
      </View>
    )
  }
  return null
}

const getLogoUrl = (invoice) => invoice.logoUrl || invoice.business?.logoUrl
const getSignatureUrl = (invoice) => invoice.signatureUrl || invoice.business?.signatureUrl

// Resolve address fields: prefer invoice-level snapshots, fallback to relations
// Returns { lines: string[] } for rendering multi-line text blocks
const getFromAddress = (invoice) => {
  if (invoice.fromAddress) return invoice.fromAddress.split('\n').filter(Boolean)
  const parts = []
  if (invoice.business?.name) parts.push(invoice.business.name)
  if (invoice.business?.address) parts.push(invoice.business.address)
  if (invoice.business?.gstin) parts.push(`GSTIN: ${invoice.business.gstin}`)
  return parts
}

const getBillTo = (invoice) => {
  if (invoice.billTo) return invoice.billTo.split('\n').filter(Boolean)
  const parts = []
  if (invoice.customer?.name) parts.push(invoice.customer.name)
  if (invoice.customer?.address) parts.push(invoice.customer.address)
  if (invoice.customer?.phone) parts.push(invoice.customer.phone)
  if (invoice.customer?.email) parts.push(invoice.customer.email)
  if (invoice.customer?.gstin) parts.push(`GSTIN: ${invoice.customer.gstin}`)
  return parts
}

const getShipTo = (invoice) => {
  if (!invoice.shipTo) return []
  // Hide ship-to if it's identical to bill-to (auto-populated incorrectly)
  const shipNorm = invoice.shipTo.trim()
  const billNorm = (invoice.billTo || '').trim()
  if (shipNorm === billNorm) return []
  return shipNorm.split('\n').filter(Boolean)
}

// Render multi-line address block for PDF
function AddressBlock({ lines, nameStyle, detailStyle }) {
  if (!lines || lines.length === 0) return null
  return (
    <>
      {lines.map((line, i) => (
        <Text key={i} style={i === 0 ? nameStyle : detailStyle}>{line}</Text>
      ))}
    </>
  )
}

// Shared branded footer — configurable per plan (showBranding flag)
function BrandedFooter({ showBranding = true }) {
  if (!showBranding) return null
  return (
    <View style={{ position: 'absolute', bottom: 20, left: 0, right: 0, alignItems: 'center' }} fixed>
      <Text style={{ fontSize: 8, color: '#9CA3AF' }}>Invoice by InvoiceBaba.com</Text>
    </View>
  )
}

// ============================================================================
// 1. CLASSIC CLEAN — The default minimal template
// ============================================================================

const cleanStyles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  invoiceInfo: { textAlign: 'right' },
  invoiceNumber: { fontSize: 10, fontWeight: 'bold', marginBottom: 2 },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 9, fontWeight: 'bold', marginBottom: 4, color: '#666', textTransform: 'uppercase' },
  table: { marginTop: 5 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f5f5f5', paddingVertical: 5, paddingHorizontal: 6, fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: '#eee' },
  colName: { flex: 3 }, colQty: { flex: 1, textAlign: 'center' }, colRate: { flex: 1, textAlign: 'right' }, colTax: { flex: 1, textAlign: 'center' }, colTotal: { flex: 1, textAlign: 'right' },
  totalsSection: { marginTop: 10, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#ddd' },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 2 },
  totalLabel: { width: 90, textAlign: 'right', marginRight: 15, color: '#666', fontSize: 8 },
  totalValue: { width: 75, textAlign: 'right', fontSize: 8 },
  grandTotal: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4, paddingTop: 4, borderTopWidth: 2, borderTopColor: '#333' },
  grandTotalLabel: { width: 90, textAlign: 'right', marginRight: 15, fontSize: 12, fontWeight: 'bold' },
  grandTotalValue: { width: 75, textAlign: 'right', fontSize: 12, fontWeight: 'bold' },
  notes: { marginTop: 12, padding: 8, backgroundColor: '#f9f9f9' },
  notesTitle: { fontSize: 8, fontWeight: 'bold', marginBottom: 2 },
  notesText: { fontSize: 8, color: '#666' },
  footer: { position: 'absolute', bottom: 30, left: 30, right: 30 },
  footerText: { fontSize: 9, color: '#999', textAlign: 'center' },
})

export function CleanTemplate({ invoice }) {
  const doc = getDocLabels(invoice)
  const isBasic = doc.lineItemsLayout === 'basic' || doc.lineItemsLayout === 'simple'
  const showTaxCol = !isBasic && doc.showTax && hasLineItemTax(invoice.lineItems)
  return (
    <Document>
      <Page size="A4" style={cleanStyles.page}>
        <View style={cleanStyles.header}>
          <View>
            {doc.showLogo && getLogoUrl(invoice) && (
              <Image src={getLogoUrl(invoice)} style={{ width: 56, height: 56, objectFit: 'contain', marginBottom: 3 }} />
            )}
            <Text style={cleanStyles.title}>{doc.heading}</Text>
            <AddressBlock
              lines={getFromAddress(invoice)}
              nameStyle={{ marginTop: 4, fontSize: 10 }}
              detailStyle={{ color: '#666', marginTop: 1, fontSize: 8 }}
            />
          </View>
          <View style={cleanStyles.invoiceInfo}>
            <Text style={cleanStyles.invoiceNumber}>#{invoice.invoiceNumber}</Text>
            <Text>{doc.dateLabel}: {formatDate(invoice.date)}</Text>
            {doc.showDueDate && invoice.dueDate && <Text>Due: {formatDate(invoice.dueDate)}</Text>}
            {doc.showPoNumber && invoice.poNumber && <Text>P.O.#: {invoice.poNumber}</Text>}
          </View>
        </View>
        <View style={cleanStyles.section}>
          <Text style={cleanStyles.sectionTitle}>{doc.toLabel}</Text>
          <AddressBlock
            lines={getBillTo(invoice)}
            nameStyle={{ fontSize: 10, fontWeight: 'bold' }}
            detailStyle={{ color: '#666', marginTop: 1, fontSize: 8 }}
          />
        </View>
        <View style={cleanStyles.table}>
          <View style={cleanStyles.tableHeader}>
            <Text style={isBasic ? { flex: 4 } : cleanStyles.colName}>{doc.descriptionCol}</Text>
            {!isBasic && <Text style={cleanStyles.colQty}>{doc.qtyCol}</Text>}
            {!isBasic && <Text style={cleanStyles.colRate}>{doc.unitPriceCol}</Text>}
            {showTaxCol && <Text style={cleanStyles.colTax}>{doc.taxCol}</Text>}
            <Text style={cleanStyles.colTotal}>{doc.amountCol}</Text>
          </View>
          {invoice.lineItems?.map((item, i) => (
            <View key={i} style={cleanStyles.tableRow}>
              <View style={isBasic ? { flex: 4 } : cleanStyles.colName}><Text>{item.name}</Text>{item.hsnCode && <Text style={{ fontSize: 6, color: '#888888', marginTop: 1 }}>HSN: {item.hsnCode}</Text>}</View>
              {!isBasic && <Text style={cleanStyles.colQty}>{item.quantity}</Text>}
              {!isBasic && <Text style={cleanStyles.colRate}>{formatCurrency(item.rate)}</Text>}
              {showTaxCol && <Text style={[cleanStyles.colTax, { fontSize: 8 }]}>{formatItemTax(item)}</Text>}
              <Text style={cleanStyles.colTotal}>{formatCurrency(item.lineTotal || item.rate)}</Text>
            </View>
          ))}
        </View>
        <View style={cleanStyles.totalsSection}>
          <View style={cleanStyles.totalRow}>
            <Text style={cleanStyles.totalLabel}>Subtotal</Text>
            <Text style={cleanStyles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
          </View>
          {invoice.discountTotal > 0 && (
            <View style={cleanStyles.totalRow}>
              <Text style={cleanStyles.totalLabel}>Discount</Text>
              <Text style={cleanStyles.totalValue}>-{formatCurrency(invoice.discountTotal)}</Text>
            </View>
          )}
          <TaxBreakdownRows invoice={invoice} doc={doc} rowStyle={cleanStyles.totalRow} labelStyle={cleanStyles.totalLabel} valueStyle={cleanStyles.totalValue} />
          <View style={cleanStyles.grandTotal}>
            <Text style={cleanStyles.grandTotalLabel}>Total</Text>
            <Text style={cleanStyles.grandTotalValue}>{formatCurrency(computeInvoiceTotal(invoice))}</Text>
          </View>
        </View>
        {doc.showNotes && invoice.notes && (
          <View style={cleanStyles.notes}>
            <Text style={cleanStyles.notesTitle}>Notes</Text>
            <Text style={cleanStyles.notesText}>{invoice.notes}</Text>
          </View>
        )}
        {doc.showTerms && invoice.terms && (
          <View style={[cleanStyles.notes, { marginTop: 10 }]}>
            <Text style={cleanStyles.notesTitle}>Terms & Conditions</Text>
            <Text style={cleanStyles.notesText}>{invoice.terms}</Text>
          </View>
        )}
        {doc.showSignature && <BankAndSignature invoice={invoice} color="#333" />}
        <BrandedFooter showBranding={invoice.showBranding !== false} />
      </Page>
    </Document>
  )
}

// ============================================================================
// Shared: Bank Details + Signature block (reused across templates)
// ============================================================================

function BankAndSignature({ invoice, color = '#333' }) {
  const hasBankDetails = invoice.business?.bankName || invoice.business?.upiId
  return (
    <View style={{ flexDirection: 'row', marginTop: 16, justifyContent: 'space-between' }}>
      {hasBankDetails && (
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 8, fontWeight: 'bold', marginBottom: 4, color, textTransform: 'uppercase' }}>Payment Details</Text>
          {invoice.business?.bankName && <Text style={{ fontSize: 8, marginBottom: 1 }}>Bank: {invoice.business.bankName}</Text>}
          {invoice.business?.accountNumber && <Text style={{ fontSize: 8, marginBottom: 1 }}>A/C: {invoice.business.accountNumber}</Text>}
          {invoice.business?.ifscCode && <Text style={{ fontSize: 8, marginBottom: 1 }}>IFSC: {invoice.business.ifscCode}</Text>}
          {invoice.business?.upiId && <Text style={{ fontSize: 8, marginTop: 2 }}>UPI: {invoice.business.upiId}</Text>}
        </View>
      )}
      <View style={{ width: 160, textAlign: 'right', alignItems: 'flex-end' }}>
        <Text style={{ fontSize: 8, fontWeight: 'bold', marginBottom: 4, color, textTransform: 'uppercase' }}>Authorized Signatory</Text>
        {getSignatureUrl(invoice) ? (
          <Image src={getSignatureUrl(invoice)} style={{ width: 80, height: 32, objectFit: 'contain', marginTop: 2 }} />
        ) : invoice.business?.signatureName ? (
          <View style={{ marginTop: 2, paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 3, backgroundColor: '#FEFCE8', width: '100%', alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontFamily: 'Times-Italic', color: '#1F2937' }}>{invoice.business.signatureName}</Text>
            <Text style={{ fontSize: 6, color: '#9CA3AF', marginTop: 1, textTransform: 'uppercase' }}>Authorized Signatory</Text>
          </View>
        ) : (
          <View style={{ height: 30, borderBottomWidth: 1, borderBottomColor: '#999', marginTop: 12, width: '100%' }} />
        )}
        {invoice.business?.signatureName && !getSignatureUrl(invoice) ? null : (
          invoice.business?.signatureName && <Text style={{ fontSize: 8, marginTop: 2 }}>{invoice.business.signatureName}</Text>
        )}
        {invoice.business?.name && <Text style={{ fontSize: 8, color: '#666' }}>For {invoice.business.name}</Text>}
      </View>
    </View>
  )
}

// ============================================================================
// 2. MODERN RED — Bold red sidebar accent
// ============================================================================

const modernRedStyles = StyleSheet.create({
  page: { padding: 0, fontSize: 10, fontFamily: 'Helvetica' },
  sidebar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, backgroundColor: '#DC2626' },
  content: { paddingTop: 30, paddingBottom: 30, paddingLeft: 36, paddingRight: 30 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#DC2626' },
  invoiceMetaBox: { backgroundColor: '#FEF2F2', padding: 8, borderRadius: 3, minWidth: 140 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  metaLabel: { fontSize: 7, color: '#991B1B', textTransform: 'uppercase', fontWeight: 'bold' },
  metaValue: { fontSize: 9, color: '#1F2937', fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#DC2626', marginBottom: 10, opacity: 0.3 },
  addressRow: { flexDirection: 'row', gap: 20, marginBottom: 12 },
  addressBlock: { flex: 1 },
  addressLabel: { fontSize: 7, fontWeight: 'bold', color: '#DC2626', textTransform: 'uppercase', marginBottom: 3 },
  addressName: { fontSize: 9, fontWeight: 'bold', color: '#1F2937', marginBottom: 1 },
  addressDetail: { fontSize: 8, color: '#6B7280', marginBottom: 1 },
  table: { marginTop: 3 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#DC2626', paddingVertical: 5, paddingHorizontal: 6 },
  tableHeaderText: { color: '#FFFFFF', fontSize: 7.5, fontWeight: 'bold', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  tableRowAlt: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#FAFAFA' },
  colName: { flex: 3 }, colQty: { flex: 1, textAlign: 'center' }, colRate: { flex: 1, textAlign: 'right' }, colTax: { flex: 1, textAlign: 'center' }, colTotal: { flex: 1, textAlign: 'right' },
  totalsBox: { marginTop: 8, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', width: 190, justifyContent: 'space-between', paddingVertical: 2 },
  totalLabel: { fontSize: 8, color: '#6B7280' },
  totalValue: { fontSize: 8, fontWeight: 'bold', color: '#1F2937' },
  grandTotalRow: { flexDirection: 'row', width: 190, justifyContent: 'space-between', paddingVertical: 4, borderTopWidth: 2, borderTopColor: '#DC2626', marginTop: 3 },
  grandTotalLabel: { fontSize: 11, fontWeight: 'bold', color: '#DC2626' },
  grandTotalValue: { fontSize: 11, fontWeight: 'bold', color: '#DC2626' },
})

export function ModernRedTemplate({ invoice }) {
  const doc = getDocLabels(invoice)
  const isBasic = doc.lineItemsLayout === 'basic' || doc.lineItemsLayout === 'simple'
  const showTaxCol = !isBasic && doc.showTax && hasLineItemTax(invoice.lineItems)
  return (
    <Document>
      <Page size="A4" style={modernRedStyles.page}>
        <View style={modernRedStyles.sidebar} />
        <View style={modernRedStyles.content}>
          <View style={modernRedStyles.headerRow}>
            <View>
              {doc.showLogo && getLogoUrl(invoice) && (
                <Image src={getLogoUrl(invoice)} style={{ width: 56, height: 56, objectFit: 'contain', marginBottom: 3 }} />
              )}
              <Text style={modernRedStyles.title}>{doc.heading}</Text>
              <AddressBlock
                lines={getFromAddress(invoice)}
                nameStyle={{ fontSize: 10, color: '#374151', marginTop: 3 }}
                detailStyle={{ fontSize: 8, color: '#6B7280', marginTop: 1 }}
              />
            </View>
            <View style={modernRedStyles.invoiceMetaBox}>
              <View style={modernRedStyles.metaRow}>
                <Text style={modernRedStyles.metaLabel}>{doc.numberLabel}</Text>
                <Text style={modernRedStyles.metaValue}>{invoice.invoiceNumber}</Text>
              </View>
              <View style={modernRedStyles.metaRow}>
                <Text style={modernRedStyles.metaLabel}>{doc.dateLabel}</Text>
                <Text style={modernRedStyles.metaValue}>{formatDate(invoice.date)}</Text>
              </View>
              {doc.showDueDate && invoice.dueDate && (
                <View style={modernRedStyles.metaRow}>
                  <Text style={modernRedStyles.metaLabel}>Due Date</Text>
                  <Text style={modernRedStyles.metaValue}>{formatDate(invoice.dueDate)}</Text>
                </View>
              )}
              {doc.showPoNumber && invoice.poNumber && (
                <View style={modernRedStyles.metaRow}>
                  <Text style={modernRedStyles.metaLabel}>P.O.#</Text>
                  <Text style={modernRedStyles.metaValue}>{invoice.poNumber}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={modernRedStyles.divider} />
          <View style={modernRedStyles.addressRow}>
            <View style={modernRedStyles.addressBlock}>
              <Text style={modernRedStyles.addressLabel}>{doc.toLabel}</Text>
              <AddressBlock
                lines={getBillTo(invoice)}
                nameStyle={modernRedStyles.addressName}
                detailStyle={modernRedStyles.addressDetail}
              />
            </View>
            {doc.showShipTo && getShipTo(invoice).length > 0 && (
              <View style={modernRedStyles.addressBlock}>
                <Text style={modernRedStyles.addressLabel}>Ship To</Text>
                <AddressBlock
                  lines={getShipTo(invoice)}
                  nameStyle={modernRedStyles.addressName}
                  detailStyle={modernRedStyles.addressDetail}
                />
              </View>
            )}
          </View>
          <View style={modernRedStyles.table}>
            <View style={modernRedStyles.tableHeader}>
              <Text style={[modernRedStyles.tableHeaderText, isBasic ? { flex: 4 } : modernRedStyles.colName]}>{doc.descriptionCol}</Text>
              {!isBasic && <Text style={[modernRedStyles.tableHeaderText, modernRedStyles.colQty]}>{doc.qtyCol}</Text>}
              {!isBasic && <Text style={[modernRedStyles.tableHeaderText, modernRedStyles.colRate]}>{doc.unitPriceCol}</Text>}
              {showTaxCol && <Text style={[modernRedStyles.tableHeaderText, modernRedStyles.colTax]}>{doc.taxCol}</Text>}
              <Text style={[modernRedStyles.tableHeaderText, modernRedStyles.colTotal]}>{doc.amountCol}</Text>
            </View>
            {invoice.lineItems?.map((item, i) => (
              <View key={i} style={i % 2 === 1 ? modernRedStyles.tableRowAlt : modernRedStyles.tableRow}>
                <View style={isBasic ? { flex: 4 } : modernRedStyles.colName}><Text>{item.name}</Text>{item.hsnCode && <Text style={{ fontSize: 6, color: '#888888', marginTop: 1 }}>HSN: {item.hsnCode}</Text>}</View>
                {!isBasic && <Text style={modernRedStyles.colQty}>{item.quantity}</Text>}
                {!isBasic && <Text style={modernRedStyles.colRate}>{formatCurrency(item.rate)}</Text>}
                {showTaxCol && <Text style={[modernRedStyles.colTax, { fontSize: 8 }]}>{formatItemTax(item)}</Text>}
                <Text style={modernRedStyles.colTotal}>{formatCurrency(item.lineTotal || item.rate)}</Text>
              </View>
            ))}
          </View>
          <View style={modernRedStyles.totalsBox}>
            <View style={modernRedStyles.totalRow}>
              <Text style={modernRedStyles.totalLabel}>Subtotal</Text>
              <Text style={modernRedStyles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
            </View>
            {invoice.discountTotal > 0 && (
              <View style={modernRedStyles.totalRow}>
                <Text style={modernRedStyles.totalLabel}>Discount</Text>
                <Text style={modernRedStyles.totalValue}>-{formatCurrency(invoice.discountTotal)}</Text>
              </View>
            )}
            <TaxBreakdownRows invoice={invoice} doc={doc} rowStyle={modernRedStyles.totalRow} labelStyle={modernRedStyles.totalLabel} valueStyle={modernRedStyles.totalValue} />
            <View style={modernRedStyles.grandTotalRow}>
              <Text style={modernRedStyles.grandTotalLabel}>Total</Text>
              <Text style={modernRedStyles.grandTotalValue}>{formatCurrency(computeInvoiceTotal(invoice))}</Text>
            </View>
          </View>
          {doc.showTerms && invoice.terms && (
            <View style={{ marginTop: 10 }}>
              <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#DC2626', marginBottom: 2 }}>Terms & Conditions</Text>
              <Text style={{ fontSize: 7.5, color: '#6B7280' }}>{invoice.terms}</Text>
            </View>
          )}
          {doc.showNotes && invoice.notes && (
            <View style={{ marginTop: 6 }}>
              <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#DC2626', marginBottom: 2 }}>Notes</Text>
              <Text style={{ fontSize: 8, color: '#6B7280' }}>{invoice.notes}</Text>
            </View>
          )}
          {doc.showSignature && <BankAndSignature invoice={invoice} color="#DC2626" />}
        </View>
        <BrandedFooter showBranding={invoice.showBranding !== false} />
      </Page>
    </Document>
  )
}

// ============================================================================
// 3. CLASSIC RED — Traditional header stripe
// ============================================================================

const classicRedStyles = StyleSheet.create({
  page: { padding: 0, fontSize: 10, fontFamily: 'Helvetica' },
  headerBar: { backgroundColor: '#047857', height: 6 },
  content: { padding: 30 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  businessName: { fontSize: 11, fontWeight: 'bold', color: '#047857' },
  invoiceTitle: { fontSize: 16, fontWeight: 'bold', color: '#047857', textAlign: 'right' },
  metaRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 1 },
  metaLabel: { fontSize: 8, color: '#6B7280', marginRight: 8, width: 60, textAlign: 'right' },
  metaValue: { fontSize: 9, fontWeight: 'bold', color: '#1F2937', width: 75 },
  addressRow: { flexDirection: 'row', gap: 20, marginBottom: 12, marginTop: 8 },
  addressBlock: { flex: 1 },
  addressLabel: { fontSize: 7, fontWeight: 'bold', color: '#047857', marginBottom: 3, textTransform: 'uppercase' },
  table: { marginTop: 3 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: '#047857', paddingBottom: 4, paddingHorizontal: 4 },
  tableHeaderText: { fontSize: 7.5, fontWeight: 'bold', color: '#047857', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  colSno: { width: 25 }, colName: { flex: 3 }, colQty: { flex: 1, textAlign: 'center' }, colRate: { flex: 1, textAlign: 'right' }, colTax: { flex: 1, textAlign: 'center' }, colTotal: { flex: 1, textAlign: 'right' },
  totalsBox: { marginTop: 8, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', width: 190, justifyContent: 'space-between', paddingVertical: 2 },
  grandTotalRow: { flexDirection: 'row', width: 190, justifyContent: 'space-between', paddingVertical: 4, borderTopWidth: 2, borderTopColor: '#047857', marginTop: 3 },
})

export function ClassicRedTemplate({ invoice }) {
  const doc = getDocLabels(invoice)
  const isBasic = doc.lineItemsLayout === 'basic' || doc.lineItemsLayout === 'simple'
  const showTaxCol = !isBasic && doc.showTax && hasLineItemTax(invoice.lineItems)
  return (
    <Document>
      <Page size="A4" style={classicRedStyles.page}>
        <View style={classicRedStyles.headerBar} />
        <View style={classicRedStyles.content}>
          <View style={classicRedStyles.headerRow}>
            <View style={{ flex: 1 }}>
              {doc.showLogo && getLogoUrl(invoice) && (
                <Image src={getLogoUrl(invoice)} style={{ width: 56, height: 56, objectFit: 'contain', marginBottom: 3 }} />
              )}
              <AddressBlock
                lines={getFromAddress(invoice)}
                nameStyle={classicRedStyles.businessName}
                detailStyle={{ fontSize: 8, color: '#6B7280', marginTop: 1 }}
              />
            </View>
            <View>
              <Text style={classicRedStyles.invoiceTitle}>{doc.heading}</Text>
              <View style={classicRedStyles.metaRow}>
                <Text style={classicRedStyles.metaLabel}>{doc.numberLabel}</Text>
                <Text style={classicRedStyles.metaValue}>{invoice.invoiceNumber}</Text>
              </View>
              <View style={classicRedStyles.metaRow}>
                <Text style={classicRedStyles.metaLabel}>{doc.dateLabel}</Text>
                <Text style={classicRedStyles.metaValue}>{formatDate(invoice.date)}</Text>
              </View>
              {doc.showDueDate && invoice.dueDate && (
                <View style={classicRedStyles.metaRow}>
                  <Text style={classicRedStyles.metaLabel}>Due Date</Text>
                  <Text style={classicRedStyles.metaValue}>{formatDate(invoice.dueDate)}</Text>
                </View>
              )}
              {doc.showPoNumber && invoice.poNumber && (
                <View style={classicRedStyles.metaRow}>
                  <Text style={classicRedStyles.metaLabel}>P.O.#</Text>
                  <Text style={classicRedStyles.metaValue}>{invoice.poNumber}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={classicRedStyles.addressRow}>
            <View style={classicRedStyles.addressBlock}>
              <Text style={classicRedStyles.addressLabel}>{doc.toLabel}</Text>
              <AddressBlock
                lines={getBillTo(invoice)}
                nameStyle={{ fontSize: 9, fontWeight: 'bold', marginBottom: 1 }}
                detailStyle={{ fontSize: 8, color: '#6B7280' }}
              />
            </View>
            {doc.showShipTo && getShipTo(invoice).length > 0 && (
              <View style={classicRedStyles.addressBlock}>
                <Text style={classicRedStyles.addressLabel}>Ship To</Text>
                <AddressBlock
                  lines={getShipTo(invoice)}
                  nameStyle={{ fontSize: 9, fontWeight: 'bold', marginBottom: 1 }}
                  detailStyle={{ fontSize: 8, color: '#6B7280' }}
                />
              </View>
            )}
          </View>
          <View style={classicRedStyles.table}>
            <View style={classicRedStyles.tableHeader}>
              <Text style={[classicRedStyles.tableHeaderText, classicRedStyles.colSno]}>#</Text>
              <Text style={[classicRedStyles.tableHeaderText, isBasic ? { flex: 4 } : classicRedStyles.colName]}>{doc.descriptionCol}</Text>
              {!isBasic && <Text style={[classicRedStyles.tableHeaderText, classicRedStyles.colQty]}>{doc.qtyCol}</Text>}
              {!isBasic && <Text style={[classicRedStyles.tableHeaderText, classicRedStyles.colRate]}>{doc.unitPriceCol}</Text>}
              {showTaxCol && <Text style={[classicRedStyles.tableHeaderText, classicRedStyles.colTax]}>{doc.taxCol}</Text>}
              <Text style={[classicRedStyles.tableHeaderText, classicRedStyles.colTotal]}>{doc.amountCol}</Text>
            </View>
            {invoice.lineItems?.map((item, i) => (
              <View key={i} style={classicRedStyles.tableRow}>
                <Text style={classicRedStyles.colSno}>{i + 1}</Text>
                <View style={isBasic ? { flex: 4 } : classicRedStyles.colName}><Text>{item.name}</Text>{item.hsnCode && <Text style={{ fontSize: 6, color: '#888888', marginTop: 1 }}>HSN: {item.hsnCode}</Text>}</View>
                {!isBasic && <Text style={classicRedStyles.colQty}>{item.quantity}</Text>}
                {!isBasic && <Text style={classicRedStyles.colRate}>{formatCurrency(item.rate)}</Text>}
                {showTaxCol && <Text style={[classicRedStyles.colTax, { fontSize: 8 }]}>{formatItemTax(item)}</Text>}
                <Text style={classicRedStyles.colTotal}>{formatCurrency(item.lineTotal || item.rate)}</Text>
              </View>
            ))}
          </View>
          <View style={classicRedStyles.totalsBox}>
            <View style={classicRedStyles.totalRow}>
              <Text style={{ fontSize: 8, color: '#6B7280' }}>Subtotal</Text>
              <Text style={{ fontSize: 8, fontWeight: 'bold' }}>{formatCurrency(invoice.subtotal)}</Text>
            </View>
            {invoice.discountTotal > 0 && (
              <View style={classicRedStyles.totalRow}>
                <Text style={{ fontSize: 8, color: '#6B7280' }}>Discount</Text>
                <Text style={{ fontSize: 8, fontWeight: 'bold' }}>-{formatCurrency(invoice.discountTotal)}</Text>
              </View>
            )}
            <TaxBreakdownRows invoice={invoice} doc={doc} rowStyle={classicRedStyles.totalRow} labelStyle={{ fontSize: 8, color: '#6B7280' }} valueStyle={{ fontSize: 8, fontWeight: 'bold' }} />
            <View style={classicRedStyles.grandTotalRow}>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#047857' }}>TOTAL</Text>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#047857' }}>{formatCurrency(computeInvoiceTotal(invoice))}</Text>
            </View>
          </View>
          {doc.showTerms && invoice.terms && (
            <View style={{ marginTop: 10 }}>
              <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#047857', marginBottom: 2 }}>Terms & Conditions</Text>
              <Text style={{ fontSize: 8, color: '#6B7280' }}>{invoice.terms}</Text>
            </View>
          )}
          {doc.showSignature && <BankAndSignature invoice={invoice} color="#047857" />}
        </View>
        <BrandedFooter showBranding={invoice.showBranding !== false} />
      </Page>
    </Document>
  )
}

// ============================================================================
// 4. WEXLER — Bold typography, colored accent band at top
// ============================================================================

const wexlerStyles = StyleSheet.create({
  page: { padding: 0, fontSize: 10, fontFamily: 'Helvetica' },
  accentBar: { height: 60, backgroundColor: '#1E3A5F', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 30 },
  accentTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', letterSpacing: 2 },
  accentMeta: { textAlign: 'right' },
  accentMetaText: { fontSize: 8, color: '#93C5FD', marginBottom: 1 },
  accentMetaValue: { fontSize: 10, color: '#FFFFFF', fontWeight: 'bold' },
  content: { padding: 30 },
  addressRow: { flexDirection: 'row', gap: 20, marginBottom: 12 },
  addressBlock: { flex: 1 },
  addressLabel: { fontSize: 7, fontWeight: 'bold', color: '#1E3A5F', textTransform: 'uppercase', marginBottom: 3, letterSpacing: 0.5 },
  table: { marginTop: 3 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#EFF6FF', paddingVertical: 5, paddingHorizontal: 6, borderBottomWidth: 2, borderBottomColor: '#1E3A5F' },
  tableHeaderText: { fontSize: 7.5, fontWeight: 'bold', color: '#1E3A5F', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  colSno: { width: 25 }, colName: { flex: 3 }, colQty: { flex: 1, textAlign: 'center' }, colRate: { flex: 1, textAlign: 'right' }, colTax: { flex: 1, textAlign: 'center' }, colTotal: { flex: 1, textAlign: 'right' },
  totalsBox: { marginTop: 8, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', width: 190, justifyContent: 'space-between', paddingVertical: 2 },
  grandTotalRow: { flexDirection: 'row', width: 190, justifyContent: 'space-between', paddingVertical: 5, backgroundColor: '#1E3A5F', paddingHorizontal: 8, marginTop: 4 },
})

export function WexlerTemplate({ invoice }) {
  const doc = getDocLabels(invoice)
  const isBasic = doc.lineItemsLayout === 'basic' || doc.lineItemsLayout === 'simple'
  const showTaxCol = !isBasic && doc.showTax && hasLineItemTax(invoice.lineItems)
  return (
    <Document>
      <Page size="A4" style={wexlerStyles.page}>
        <View style={wexlerStyles.accentBar}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {doc.showLogo && getLogoUrl(invoice) && (
              <Image src={getLogoUrl(invoice)} style={{ width: 40, height: 40, objectFit: 'contain' }} />
            )}
            <Text style={wexlerStyles.accentTitle}>{doc.heading}</Text>
          </View>
          <View style={wexlerStyles.accentMeta}>
            <Text style={wexlerStyles.accentMetaText}>{doc.numberLabel} {invoice.invoiceNumber}</Text>
            <Text style={wexlerStyles.accentMetaValue}>{formatDate(invoice.date)}</Text>
            {doc.showDueDate && invoice.dueDate && <Text style={wexlerStyles.accentMetaText}>Due: {formatDate(invoice.dueDate)}</Text>}
            {doc.showPoNumber && invoice.poNumber && <Text style={wexlerStyles.accentMetaText}>P.O.#: {invoice.poNumber}</Text>}
          </View>
        </View>
        <View style={wexlerStyles.content}>
          <View style={wexlerStyles.addressRow}>
            <View style={wexlerStyles.addressBlock}>
              <Text style={wexlerStyles.addressLabel}>{doc.fromLabel}</Text>
              <AddressBlock
                lines={getFromAddress(invoice)}
                nameStyle={{ fontSize: 9, fontWeight: 'bold', marginBottom: 1 }}
                detailStyle={{ fontSize: 8, color: '#6B7280' }}
              />
            </View>
            <View style={wexlerStyles.addressBlock}>
              <Text style={wexlerStyles.addressLabel}>{doc.toLabel}</Text>
              <AddressBlock
                lines={getBillTo(invoice)}
                nameStyle={{ fontSize: 9, fontWeight: 'bold', marginBottom: 1 }}
                detailStyle={{ fontSize: 8, color: '#6B7280' }}
              />
            </View>
            {doc.showShipTo && getShipTo(invoice).length > 0 && (
              <View style={wexlerStyles.addressBlock}>
                <Text style={wexlerStyles.addressLabel}>Ship To</Text>
                <AddressBlock
                  lines={getShipTo(invoice)}
                  nameStyle={{ fontSize: 9, fontWeight: 'bold', marginBottom: 1 }}
                  detailStyle={{ fontSize: 8, color: '#6B7280' }}
                />
              </View>
            )}
          </View>
          <View style={wexlerStyles.table}>
            <View style={wexlerStyles.tableHeader}>
              <Text style={[wexlerStyles.tableHeaderText, wexlerStyles.colSno]}>#</Text>
              <Text style={[wexlerStyles.tableHeaderText, isBasic ? { flex: 4 } : wexlerStyles.colName]}>{doc.descriptionCol}</Text>
              {!isBasic && <Text style={[wexlerStyles.tableHeaderText, wexlerStyles.colQty]}>{doc.qtyCol}</Text>}
              {!isBasic && <Text style={[wexlerStyles.tableHeaderText, wexlerStyles.colRate]}>{doc.unitPriceCol}</Text>}
              {showTaxCol && <Text style={[wexlerStyles.tableHeaderText, wexlerStyles.colTax]}>{doc.taxCol}</Text>}
              <Text style={[wexlerStyles.tableHeaderText, wexlerStyles.colTotal]}>{doc.amountCol}</Text>
            </View>
            {invoice.lineItems?.map((item, i) => (
              <View key={i} style={wexlerStyles.tableRow}>
                <Text style={wexlerStyles.colSno}>{i + 1}</Text>
                <View style={isBasic ? { flex: 4 } : wexlerStyles.colName}><Text>{item.name}</Text>{item.hsnCode && <Text style={{ fontSize: 6, color: '#888888', marginTop: 1 }}>HSN: {item.hsnCode}</Text>}</View>
                {!isBasic && <Text style={wexlerStyles.colQty}>{item.quantity}</Text>}
                {!isBasic && <Text style={wexlerStyles.colRate}>{formatCurrency(item.rate)}</Text>}
                {showTaxCol && <Text style={[wexlerStyles.colTax, { fontSize: 8 }]}>{formatItemTax(item)}</Text>}
                <Text style={wexlerStyles.colTotal}>{formatCurrency(item.lineTotal || item.rate)}</Text>
              </View>
            ))}
          </View>
          <View style={wexlerStyles.totalsBox}>
            <View style={wexlerStyles.totalRow}>
              <Text style={{ fontSize: 8, color: '#6B7280' }}>Subtotal</Text>
              <Text style={{ fontSize: 8, fontWeight: 'bold' }}>{formatCurrency(invoice.subtotal)}</Text>
            </View>
            {invoice.discountTotal > 0 && (
              <View style={wexlerStyles.totalRow}>
                <Text style={{ fontSize: 8, color: '#6B7280' }}>Discount</Text>
                <Text style={{ fontSize: 8, fontWeight: 'bold' }}>-{formatCurrency(invoice.discountTotal)}</Text>
              </View>
            )}
            <TaxBreakdownRows invoice={invoice} doc={doc} rowStyle={wexlerStyles.totalRow} labelStyle={{ fontSize: 8, color: '#6B7280' }} valueStyle={{ fontSize: 8, fontWeight: 'bold' }} />
            <View style={wexlerStyles.grandTotalRow}>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#FFFFFF' }}>TOTAL</Text>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#FFFFFF' }}>{formatCurrency(computeInvoiceTotal(invoice))}</Text>
            </View>
          </View>
          {doc.showTerms && invoice.terms && (
            <View style={{ marginTop: 10 }}>
              <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#1E3A5F', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>Terms & Conditions</Text>
              <Text style={{ fontSize: 8, color: '#6B7280' }}>{invoice.terms}</Text>
            </View>
          )}
          {doc.showSignature && <BankAndSignature invoice={invoice} color="#1E3A5F" />}
        </View>
        <BrandedFooter showBranding={invoice.showBranding !== false} />
      </Page>
    </Document>
  )
}

// ============================================================================
// 5. PLEXER — Professional two-tone, clean grid
// ============================================================================

const plexerStyles = StyleSheet.create({
  page: { padding: 0, fontSize: 10, fontFamily: 'Helvetica' },
  topBar: { height: 4, backgroundColor: '#374151' },
  content: { padding: 30 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#111827', letterSpacing: 1.5 },
  businessDetail: { fontSize: 8, color: '#6B7280', marginTop: 1 },
  metaBox: { borderLeftWidth: 2, borderLeftColor: '#374151', paddingLeft: 8 },
  metaRow: { marginBottom: 2 },
  metaLabel: { fontSize: 7, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 },
  metaValue: { fontSize: 9, color: '#111827', fontWeight: 'bold' },
  separator: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 8 },
  addressRow: { flexDirection: 'row', gap: 20, marginBottom: 12 },
  addressBlock: { flex: 1 },
  addressLabel: { fontSize: 7, fontWeight: 'bold', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 3, letterSpacing: 0.5 },
  table: { marginTop: 3 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#374151', paddingBottom: 4, paddingHorizontal: 4 },
  tableHeaderText: { fontSize: 7, fontWeight: 'bold', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  colSno: { width: 25 }, colName: { flex: 3 }, colQty: { flex: 1, textAlign: 'center' }, colRate: { flex: 1, textAlign: 'right' }, colTax: { flex: 1, textAlign: 'center' }, colTotal: { flex: 1, textAlign: 'right' },
  totalsBox: { marginTop: 8, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', width: 190, justifyContent: 'space-between', paddingVertical: 2 },
  grandTotalRow: { flexDirection: 'row', width: 190, justifyContent: 'space-between', paddingVertical: 4, borderTopWidth: 2, borderTopColor: '#374151', marginTop: 3 },
})

export function PlexerTemplate({ invoice }) {
  const doc = getDocLabels(invoice)
  const isBasic = doc.lineItemsLayout === 'basic' || doc.lineItemsLayout === 'simple'
  const showTaxCol = !isBasic && doc.showTax && hasLineItemTax(invoice.lineItems)
  return (
    <Document>
      <Page size="A4" style={plexerStyles.page}>
        <View style={plexerStyles.topBar} />
        <View style={plexerStyles.content}>
          <View style={plexerStyles.headerRow}>
            <View>
              {doc.showLogo && getLogoUrl(invoice) && (
                <Image src={getLogoUrl(invoice)} style={{ width: 56, height: 56, objectFit: 'contain', marginBottom: 3 }} />
              )}
              <Text style={plexerStyles.title}>{doc.heading}</Text>
              <AddressBlock
                lines={getFromAddress(invoice)}
                nameStyle={{ fontSize: 10, color: '#374151', marginTop: 3 }}
                detailStyle={plexerStyles.businessDetail}
              />
            </View>
            <View style={plexerStyles.metaBox}>
              <View style={plexerStyles.metaRow}>
                <Text style={plexerStyles.metaLabel}>{doc.numberLabel}</Text>
                <Text style={plexerStyles.metaValue}>{invoice.invoiceNumber}</Text>
              </View>
              <View style={plexerStyles.metaRow}>
                <Text style={plexerStyles.metaLabel}>{doc.dateLabel}</Text>
                <Text style={plexerStyles.metaValue}>{formatDate(invoice.date)}</Text>
              </View>
              {doc.showDueDate && invoice.dueDate && (
                <View style={plexerStyles.metaRow}>
                  <Text style={plexerStyles.metaLabel}>Due Date</Text>
                  <Text style={plexerStyles.metaValue}>{formatDate(invoice.dueDate)}</Text>
                </View>
              )}
              {doc.showPoNumber && invoice.poNumber && (
                <View style={plexerStyles.metaRow}>
                  <Text style={plexerStyles.metaLabel}>P.O.#</Text>
                  <Text style={plexerStyles.metaValue}>{invoice.poNumber}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={plexerStyles.separator} />
          <View style={plexerStyles.addressRow}>
            <View style={plexerStyles.addressBlock}>
              <Text style={plexerStyles.addressLabel}>{doc.toLabel}</Text>
              <AddressBlock
                lines={getBillTo(invoice)}
                nameStyle={{ fontSize: 9, fontWeight: 'bold', marginBottom: 1 }}
                detailStyle={{ fontSize: 8, color: '#6B7280' }}
              />
            </View>
            {doc.showShipTo && getShipTo(invoice).length > 0 && (
              <View style={plexerStyles.addressBlock}>
                <Text style={plexerStyles.addressLabel}>Ship To</Text>
                <AddressBlock
                  lines={getShipTo(invoice)}
                  nameStyle={{ fontSize: 9, fontWeight: 'bold', marginBottom: 1 }}
                  detailStyle={{ fontSize: 8, color: '#6B7280' }}
                />
              </View>
            )}
          </View>
          <View style={plexerStyles.table}>
            <View style={plexerStyles.tableHeader}>
              <Text style={[plexerStyles.tableHeaderText, plexerStyles.colSno]}>#</Text>
              <Text style={[plexerStyles.tableHeaderText, isBasic ? { flex: 4 } : plexerStyles.colName]}>{doc.descriptionCol}</Text>
              {!isBasic && <Text style={[plexerStyles.tableHeaderText, plexerStyles.colQty]}>{doc.qtyCol}</Text>}
              {!isBasic && <Text style={[plexerStyles.tableHeaderText, plexerStyles.colRate]}>{doc.unitPriceCol}</Text>}
              {showTaxCol && <Text style={[plexerStyles.tableHeaderText, plexerStyles.colTax]}>{doc.taxCol}</Text>}
              <Text style={[plexerStyles.tableHeaderText, plexerStyles.colTotal]}>{doc.amountCol}</Text>
            </View>
            {invoice.lineItems?.map((item, i) => (
              <View key={i} style={plexerStyles.tableRow}>
                <Text style={plexerStyles.colSno}>{i + 1}</Text>
                <View style={isBasic ? { flex: 4 } : plexerStyles.colName}><Text>{item.name}</Text>{item.hsnCode && <Text style={{ fontSize: 6, color: '#888888', marginTop: 1 }}>HSN: {item.hsnCode}</Text>}</View>
                {!isBasic && <Text style={plexerStyles.colQty}>{item.quantity}</Text>}
                {!isBasic && <Text style={plexerStyles.colRate}>{formatCurrency(item.rate)}</Text>}
                {showTaxCol && <Text style={[plexerStyles.colTax, { fontSize: 8 }]}>{formatItemTax(item)}</Text>}
                <Text style={plexerStyles.colTotal}>{formatCurrency(item.lineTotal || item.rate)}</Text>
              </View>
            ))}
          </View>
          <View style={plexerStyles.totalsBox}>
            <View style={plexerStyles.totalRow}>
              <Text style={{ fontSize: 8, color: '#6B7280' }}>Subtotal</Text>
              <Text style={{ fontSize: 8, fontWeight: 'bold' }}>{formatCurrency(invoice.subtotal)}</Text>
            </View>
            {invoice.discountTotal > 0 && (
              <View style={plexerStyles.totalRow}>
                <Text style={{ fontSize: 8, color: '#6B7280' }}>Discount</Text>
                <Text style={{ fontSize: 8, fontWeight: 'bold' }}>-{formatCurrency(invoice.discountTotal)}</Text>
              </View>
            )}
            <TaxBreakdownRows invoice={invoice} doc={doc} rowStyle={plexerStyles.totalRow} labelStyle={{ fontSize: 8, color: '#6B7280' }} valueStyle={{ fontSize: 8, fontWeight: 'bold' }} />
            <View style={plexerStyles.grandTotalRow}>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#111827' }}>TOTAL</Text>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#111827' }}>{formatCurrency(computeInvoiceTotal(invoice))}</Text>
            </View>
          </View>
          {doc.showTerms && invoice.terms && (
            <View style={{ marginTop: 10 }}>
              <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Terms & Conditions</Text>
              <Text style={{ fontSize: 8, color: '#6B7280' }}>{invoice.terms}</Text>
            </View>
          )}
          {doc.showSignature && <BankAndSignature invoice={invoice} color="#374151" />}
        </View>
        <BrandedFooter showBranding={invoice.showBranding !== false} />
      </Page>
    </Document>
  )
}

// ============================================================================
// 6. CONTEMPORARY — Gradient-style colored header with spacious layout
// ============================================================================

const contemporaryStyles = StyleSheet.create({
  page: { padding: 0, fontSize: 10, fontFamily: 'Helvetica' },
  headerBg: { backgroundColor: '#E11D48', paddingVertical: 16, paddingHorizontal: 30 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  businessInfo: { fontSize: 8, color: '#FECDD3', marginTop: 2 },
  metaRight: { textAlign: 'right' },
  metaLabel: { fontSize: 7, color: '#FECDD3', textTransform: 'uppercase' },
  metaValue: { fontSize: 10, color: '#FFFFFF', fontWeight: 'bold', marginBottom: 2 },
  totalBadge: { backgroundColor: '#FFFFFF', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 3, marginTop: 6 },
  totalBadgeLabel: { fontSize: 6, color: '#E11D48', textTransform: 'uppercase', fontWeight: 'bold' },
  totalBadgeValue: { fontSize: 14, color: '#E11D48', fontWeight: 'bold' },
  content: { padding: 30 },
  addressRow: { flexDirection: 'row', gap: 20, marginBottom: 12 },
  addressBlock: { flex: 1 },
  addressLabel: { fontSize: 7, fontWeight: 'bold', color: '#E11D48', textTransform: 'uppercase', marginBottom: 3 },
  table: { marginTop: 3 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#FFF1F2', paddingVertical: 5, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: '#E11D48' },
  tableHeaderText: { fontSize: 7.5, fontWeight: 'bold', color: '#E11D48', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  colName: { flex: 3 }, colQty: { flex: 1, textAlign: 'center' }, colRate: { flex: 1, textAlign: 'right' }, colTax: { flex: 1, textAlign: 'center' }, colTotal: { flex: 1, textAlign: 'right' },
  totalsBox: { marginTop: 8, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', width: 190, justifyContent: 'space-between', paddingVertical: 2 },
  grandTotalRow: { flexDirection: 'row', width: 190, justifyContent: 'space-between', paddingVertical: 5, backgroundColor: '#E11D48', paddingHorizontal: 8, marginTop: 4 },
})

export function ContemporaryTemplate({ invoice }) {
  const doc = getDocLabels(invoice)
  const isBasic = doc.lineItemsLayout === 'basic' || doc.lineItemsLayout === 'simple'
  const showTaxCol = !isBasic && doc.showTax && hasLineItemTax(invoice.lineItems)
  return (
    <Document>
      <Page size="A4" style={contemporaryStyles.page}>
        <View style={contemporaryStyles.headerBg}>
          <View style={contemporaryStyles.headerRow}>
            <View>
              {doc.showLogo && getLogoUrl(invoice) && (
                <Image src={getLogoUrl(invoice)} style={{ width: 50, height: 50, objectFit: 'contain', marginBottom: 4 }} />
              )}
              <Text style={contemporaryStyles.title}>{doc.heading}</Text>
              <AddressBlock
                lines={getFromAddress(invoice)}
                nameStyle={contemporaryStyles.businessInfo}
                detailStyle={contemporaryStyles.businessInfo}
              />
            </View>
            <View style={contemporaryStyles.metaRight}>
              <Text style={contemporaryStyles.metaLabel}>{doc.numberLabel}</Text>
              <Text style={contemporaryStyles.metaValue}>{invoice.invoiceNumber}</Text>
              <Text style={contemporaryStyles.metaLabel}>{doc.dateLabel}</Text>
              <Text style={contemporaryStyles.metaValue}>{formatDate(invoice.date)}</Text>
              {doc.showDueDate && invoice.dueDate && (
                <>
                  <Text style={contemporaryStyles.metaLabel}>Due Date</Text>
                  <Text style={contemporaryStyles.metaValue}>{formatDate(invoice.dueDate)}</Text>
                </>
              )}
              {doc.showPoNumber && invoice.poNumber && (
                <>
                  <Text style={contemporaryStyles.metaLabel}>P.O.#</Text>
                  <Text style={contemporaryStyles.metaValue}>{invoice.poNumber}</Text>
                </>
              )}
              <View style={contemporaryStyles.totalBadge}>
                <Text style={contemporaryStyles.totalBadgeLabel}>{doc.heading} Total</Text>
                <Text style={contemporaryStyles.totalBadgeValue}>{formatCurrency(computeInvoiceTotal(invoice))}</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={contemporaryStyles.content}>
          <View style={contemporaryStyles.addressRow}>
            <View style={contemporaryStyles.addressBlock}>
              <Text style={contemporaryStyles.addressLabel}>{doc.toLabel}</Text>
              <AddressBlock
                lines={getBillTo(invoice)}
                nameStyle={{ fontSize: 9, fontWeight: 'bold', marginBottom: 1 }}
                detailStyle={{ fontSize: 8, color: '#6B7280' }}
              />
            </View>
            {doc.showShipTo && getShipTo(invoice).length > 0 && (
              <View style={contemporaryStyles.addressBlock}>
                <Text style={contemporaryStyles.addressLabel}>Ship To</Text>
                <AddressBlock
                  lines={getShipTo(invoice)}
                  nameStyle={{ fontSize: 9, fontWeight: 'bold', marginBottom: 1 }}
                  detailStyle={{ fontSize: 8, color: '#6B7280' }}
                />
              </View>
            )}
          </View>
          <View style={contemporaryStyles.table}>
            <View style={contemporaryStyles.tableHeader}>
              <Text style={[contemporaryStyles.tableHeaderText, isBasic ? { flex: 4 } : contemporaryStyles.colName]}>{doc.descriptionCol}</Text>
              {!isBasic && <Text style={[contemporaryStyles.tableHeaderText, contemporaryStyles.colQty]}>{doc.qtyCol}</Text>}
              {!isBasic && <Text style={[contemporaryStyles.tableHeaderText, contemporaryStyles.colRate]}>{doc.unitPriceCol}</Text>}
              {showTaxCol && <Text style={[contemporaryStyles.tableHeaderText, contemporaryStyles.colTax]}>{doc.taxCol}</Text>}
              <Text style={[contemporaryStyles.tableHeaderText, contemporaryStyles.colTotal]}>{doc.amountCol}</Text>
            </View>
            {invoice.lineItems?.map((item, i) => (
              <View key={i} style={contemporaryStyles.tableRow}>
                <View style={isBasic ? { flex: 4 } : contemporaryStyles.colName}><Text>{item.name}</Text>{item.hsnCode && <Text style={{ fontSize: 6, color: '#888888', marginTop: 1 }}>HSN: {item.hsnCode}</Text>}</View>
                {!isBasic && <Text style={contemporaryStyles.colQty}>{item.quantity}</Text>}
                {!isBasic && <Text style={contemporaryStyles.colRate}>{formatCurrency(item.rate)}</Text>}
                {showTaxCol && <Text style={[contemporaryStyles.colTax, { fontSize: 8 }]}>{formatItemTax(item)}</Text>}
                <Text style={contemporaryStyles.colTotal}>{formatCurrency(item.lineTotal || item.rate)}</Text>
              </View>
            ))}
          </View>
          <View style={contemporaryStyles.totalsBox}>
            <View style={contemporaryStyles.totalRow}>
              <Text style={{ fontSize: 8, color: '#6B7280' }}>Subtotal</Text>
              <Text style={{ fontSize: 8, fontWeight: 'bold' }}>{formatCurrency(invoice.subtotal)}</Text>
            </View>
            {invoice.discountTotal > 0 && (
              <View style={contemporaryStyles.totalRow}>
                <Text style={{ fontSize: 8, color: '#6B7280' }}>Discount</Text>
                <Text style={{ fontSize: 8, fontWeight: 'bold' }}>-{formatCurrency(invoice.discountTotal)}</Text>
              </View>
            )}
            <TaxBreakdownRows invoice={invoice} doc={doc} rowStyle={contemporaryStyles.totalRow} labelStyle={{ fontSize: 8, color: '#6B7280' }} valueStyle={{ fontSize: 8, fontWeight: 'bold' }} />
            <View style={contemporaryStyles.grandTotalRow}>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#FFFFFF' }}>TOTAL</Text>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#FFFFFF' }}>{formatCurrency(computeInvoiceTotal(invoice))}</Text>
            </View>
          </View>
          {doc.showTerms && invoice.terms && (
            <View style={{ marginTop: 10 }}>
              <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#E11D48', marginBottom: 2 }}>Terms & Conditions</Text>
              <Text style={{ fontSize: 8, color: '#6B7280' }}>{invoice.terms}</Text>
            </View>
          )}
          {doc.showSignature && <BankAndSignature invoice={invoice} color="#E11D48" />}
        </View>
        <BrandedFooter showBranding={invoice.showBranding !== false} />
      </Page>
    </Document>
  )
}

// ============================================================================
// Theme-based Template System — 100 templates from 20 layouts × 5 palettes
// ============================================================================

// Generic themed template wrapper — resolves theme and renders BaseInvoiceDocument
function ThemedTemplate({ invoice, themeId }) {
  const theme = resolveTheme(themeId)
  if (!theme) return null
  return <BaseInvoiceDocument invoice={invoice} theme={theme} />
}

// Factory: create a component for a specific theme ID
function createThemedComponent(themeId) {
  const Component = ({ invoice }) => <ThemedTemplate invoice={invoice} themeId={themeId} />
  Component.displayName = `Theme_${themeId}`
  return Component
}

// ============================================================================
// Template Map — used by pdfGenerator to dispatch
// ============================================================================

// Start with legacy templates (exact original rendering for backward compat)
const LEGACY_COMPONENTS = {
  clean: CleanTemplate,
  'modern-red': ModernRedTemplate,
  'classic-red': ClassicRedTemplate,
  wexler: WexlerTemplate,
  plexer: PlexerTemplate,
  contemporary: ContemporaryTemplate,
}

// Build the full map: 100 themed templates + legacy overrides
const themedComponents = {}
for (const themeId of THEME_IDS) {
  themedComponents[themeId] = createThemedComponent(themeId)
}

// Merge: legacy IDs point to original components, everything else uses themed
export const TEMPLATE_COMPONENTS = {
  ...themedComponents,
  ...LEGACY_COMPONENTS,
}
